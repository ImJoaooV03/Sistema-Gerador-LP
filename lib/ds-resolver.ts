import JSZip from 'jszip'

const ASSET_SIZE_LIMIT = 500 * 1024 // 500KB — used only in buildResolvedHtml (full embed)
const SVG_INLINE_LIMIT  = 5   * 1024 // 5KB  — SVGs smaller than this are inlined for Claude icon analysis

const MIME: Record<string, string> = {
  png:   'image/png',
  jpg:   'image/jpeg',
  jpeg:  'image/jpeg',
  gif:   'image/gif',
  svg:   'image/svg+xml',
  webp:  'image/webp',
  ico:   'image/x-icon',
  woff:  'font/woff',
  woff2: 'font/woff2',
  ttf:   'font/ttf',
  otf:   'font/otf',
  eot:   'application/vnd.ms-fontobject',
}

function getMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return MIME[ext] ?? 'application/octet-stream'
}

function toBase64DataUri(bytes: Uint8Array, mime: string): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return `data:${mime};base64,${btoa(binary)}`
}

function placeholderSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="100%" height="100%" fill="#1a1a2e"/></svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

async function assetToDataUri(zipPath: string, zip: JSZip): Promise<string | null> {
  const file = zip.file(zipPath)
  if (!file) return null
  const bytes = await file.async('uint8array')
  const mime = getMime(zipPath)
  if (bytes.length > ASSET_SIZE_LIMIT) return placeholderSvg()
  return toBase64DataUri(bytes, mime)
}

export function normalizeZipPath(href: string): string {
  return href.replace(/^\//, '').split('?')[0].split('#')[0]
}

/** Replace <link href="*.css"> with inline <style> blocks */
export async function resolveCssLinks(html: string, zip: JSZip): Promise<string> {
  const linkRe = /<link[^>]+href="([^"]+\.css)"[^>]*>/gi
  const matches = [...html.matchAll(linkRe)]
  let result = html
  for (const match of matches) {
    const zipPath = normalizeZipPath(match[1])
    const file = zip.file(zipPath)
    if (!file) continue
    const content = await file.async('string')
    result = result.replace(match[0], `<style>${content}</style>`)
  }
  return result
}

/** Replace <script src="..."> with inline <script> blocks */
export async function resolveScriptLinks(html: string, zip: JSZip): Promise<string> {
  const scriptRe = /<script[^>]+src="([^"]+)"[^>]*><\/script>/gi
  const matches = [...html.matchAll(scriptRe)]
  let result = html
  for (const match of matches) {
    const zipPath = normalizeZipPath(match[1])
    const file = zip.file(zipPath)
    if (!file) continue
    const content = await file.async('string')
    result = result.replace(match[0], `<script>${content}</script>`)
  }
  return result
}

/** Replace src="", href="", and url() asset references with base64 data URIs */
export async function resolveAssetUrls(html: string, zip: JSZip): Promise<string> {
  const assetRe = /(?:src|href)="([^"]+)"|url\((['"]?)([^'")\s]+)\2\)/gi
  const paths = new Set<string>()
  for (const m of html.matchAll(assetRe)) {
    const ref = m[1] || m[3]
    if (!ref) continue
    if (ref.startsWith('http') || ref.startsWith('data:') || ref.startsWith('#') || ref.startsWith('mailto:')) continue
    const zipPath = normalizeZipPath(ref)
    const ext = zipPath.split('.').pop()?.toLowerCase() ?? ''
    if (MIME[ext]) paths.add(ref)
  }

  let result = html
  for (const ref of paths) {
    const zipPath = normalizeZipPath(ref)
    const dataUri = await assetToDataUri(zipPath, zip)
    if (!dataUri) continue
    const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result
      .replace(new RegExp(`src="${escaped}"`, 'g'), `src="${dataUri}"`)
      .replace(new RegExp(`href="${escaped}"`, 'g'), `href="${dataUri}"`)
      .replace(new RegExp(`url\\((['"]?)${escaped}\\1\\)`, 'g'), `url(${dataUri})`)
  }
  return result
}

/**
 * Inline small SVG files (<= 5KB) referenced via src="*.svg".
 * Larger SVGs and all other assets are left as-is.
 * Used in analysis mode so Claude can see icon shapes without blowing the context budget.
 */
export async function resolveSmallSvgs(html: string, zip: JSZip): Promise<string> {
  const srcRe = /src="([^"]+\.svg)"/gi
  const matches = [...html.matchAll(srcRe)]
  let result = html
  for (const match of matches) {
    const ref = match[1]
    if (ref.startsWith('http') || ref.startsWith('data:')) continue
    const zipPath = normalizeZipPath(ref)
    const file = zip.file(zipPath)
    if (!file) continue
    const bytes = await file.async('uint8array')
    if (bytes.length > SVG_INLINE_LIMIT) continue
    const dataUri = toBase64DataUri(bytes, 'image/svg+xml')
    const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`src="${escaped}"`, 'g'), `src="${dataUri}"`)
  }
  return result
}

/** Strip markdown code fences from Claude output and extract the <!DOCTYPE block */
export function stripMarkdown(output: string): string {
  let s = output
    .replace(/^```[\w]*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
  if (!s.toLowerCase().startsWith('<!doctype')) {
    const match = s.match(/<!DOCTYPE[\s\S]*/i)
    if (match) s = match[0].trim()
  }
  return s
}

/**
 * Build analysis HTML for Claude input:
 * - CSS files embedded inline → Claude sees real colors, typography, animations
 * - JS files embedded inline  → Claude sees keyframes/animation classes
 * - Small SVGs (<5KB) inlined → Claude sees icon shapes for the icons section
 * - Images and fonts left as-is → prevents base64 bloat from eating the context budget
 *
 * This is intentionally different from buildResolvedHtml.
 * A 200KB image becomes 267k chars as base64 — one image would exceed the entire budget.
 * Claude reads CSS for design tokens, not image pixels.
 */
export async function buildAnalysisHtml(zip: JSZip): Promise<string> {
  const indexFile = zip.file('index.html')
  if (!indexFile) throw new Error('ZIP deve conter index.html na raiz')
  let html = await indexFile.async('string')
  html = await resolveCssLinks(html, zip)
  html = await resolveScriptLinks(html, zip)
  html = await resolveSmallSvgs(html, zip)
  return html
}

/**
 * Build analysis HTML from a public URL for Claude input.
 * - Fetches the page with browser-like headers
 * - Inlines all linked CSS files as <style> blocks
 * - Removes external <script src> tags (not needed for design analysis)
 * - Keeps inline <style> blocks and Google Fonts <link> tags unchanged
 * - Throws if the page returns a non-2xx status
 */
export async function buildAnalysisHtmlFromUrl(url: string): Promise<string> {
  const origin = new URL(url).origin

  const pageRes = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!pageRes.ok) {
    throw new Error(`Página retornou ${pageRes.status}. Verifique se a URL está correta e acessível.`)
  }

  let html = await pageRes.text()

  // Inline linked CSS files — cap each file at 40k chars to avoid bloating Claude's context
  // (Tailwind/framework utilities can be 500KB+; design tokens are always near the top)
  const CSS_PER_FILE_LIMIT = 15_000
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi
  const matches = [...html.matchAll(linkRe)]
  for (const match of matches) {
    const href = match[1] || match[2]
    if (!href) continue
    try {
      const cssUrl = href.startsWith('http') ? href : `${origin}${href.startsWith('/') ? '' : '/'}${href}`
      const cssRes = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (cssRes.ok) {
        let cssContent = await cssRes.text()
        if (cssContent.length > CSS_PER_FILE_LIMIT) {
          cssContent = cssContent.slice(0, CSS_PER_FILE_LIMIT) + '\n/* [truncado — arquivo muito grande] */'
        }
        html = html.replace(match[0], `<style>${cssContent}</style>`)
      }
    } catch {
      // leave the original link tag — non-fatal
    }
  }

  // Remove external <script src> tags — not needed for design analysis
  html = html.replace(/<script[^>]+src=["'][^"']+["'][^>]*><\/script>/gi, '')

  return html
}

/** Build a fully resolved, self-contained HTML (for bundle download — not for Claude input) */
export async function buildResolvedHtml(zip: JSZip): Promise<string> {
  const indexFile = zip.file('index.html')
  if (!indexFile) throw new Error('ZIP deve conter index.html na raiz')
  let html = await indexFile.async('string')
  html = await resolveCssLinks(html, zip)
  html = await resolveScriptLinks(html, zip)
  html = await resolveAssetUrls(html, zip)
  return html
}
