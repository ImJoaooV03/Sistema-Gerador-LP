import JSZip from 'jszip'

const ASSET_SIZE_LIMIT = 500 * 1024 // 500KB

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

function normalizeZipPath(href: string): string {
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

/** Build a fully resolved, self-contained HTML string from a ZIP */
export async function buildResolvedHtml(zip: JSZip): Promise<string> {
  const indexFile = zip.file('index.html')
  if (!indexFile) throw new Error('ZIP deve conter index.html na raiz')
  let html = await indexFile.async('string')
  html = await resolveCssLinks(html, zip)
  html = await resolveScriptLinks(html, zip)
  html = await resolveAssetUrls(html, zip)
  return html
}
