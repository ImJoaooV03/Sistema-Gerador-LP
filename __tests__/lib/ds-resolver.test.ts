import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import {
  resolveCssLinks,
  resolveScriptLinks,
  resolveAssetUrls,
  stripMarkdown,
} from '@/lib/ds-resolver'

async function makeZip(files: Record<string, string | Uint8Array>): Promise<JSZip> {
  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content)
  }
  return zip
}

describe('resolveCssLinks', () => {
  it('replaces <link> css tags with inline <style> blocks', async () => {
    const zip = await makeZip({ 'styles/main.css': 'body { color: red; }' })
    const html = '<html><head><link rel="stylesheet" href="styles/main.css"></head><body></body></html>'
    const result = await resolveCssLinks(html, zip)
    expect(result).toContain('<style>body { color: red; }</style>')
    expect(result).not.toContain('<link rel="stylesheet" href="styles/main.css">')
  })

  it('leaves <link> tags unchanged when the file is not in the zip', async () => {
    const zip = await makeZip({})
    const html = '<html><head><link rel="stylesheet" href="missing.css"></head><body></body></html>'
    const result = await resolveCssLinks(html, zip)
    expect(result).toContain('<link rel="stylesheet" href="missing.css">')
  })

  it('handles leading slash in href', async () => {
    const zip = await makeZip({ 'styles/app.css': '.btn { padding: 8px; }' })
    const html = '<link href="/styles/app.css" rel="stylesheet">'
    const result = await resolveCssLinks(html, zip)
    expect(result).toContain('.btn { padding: 8px; }')
  })
})

describe('resolveScriptLinks', () => {
  it('replaces <script src> with inline <script> blocks', async () => {
    const zip = await makeZip({ 'js/app.js': 'console.log("hello")' })
    const html = '<html><body><script src="js/app.js"></script></body></html>'
    const result = await resolveScriptLinks(html, zip)
    expect(result).toContain('<script>console.log("hello")</script>')
    expect(result).not.toContain('src="js/app.js"')
  })

  it('leaves <script src> unchanged when file is not in the zip', async () => {
    const zip = await makeZip({})
    const html = '<script src="missing.js"></script>'
    const result = await resolveScriptLinks(html, zip)
    expect(result).toContain('src="missing.js"')
  })
})

describe('resolveAssetUrls', () => {
  it('converts small image src to base64 data URI', async () => {
    // 1x1 white PNG (67 bytes, well under 500KB)
    const pngBytes = new Uint8Array([
      137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,
      0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,248,207,192,0,0,
      0,2,0,1,226,33,188,51,0,0,0,0,73,69,78,68,174,66,96,130
    ])
    const zip = await makeZip({ 'images/logo.png': pngBytes })
    const html = '<img src="images/logo.png">'
    const result = await resolveAssetUrls(html, zip)
    expect(result).toMatch(/src="data:image\/png;base64,/)
  })

  it('replaces oversized images with a placeholder SVG', async () => {
    const bigBuffer = new Uint8Array(520 * 1024).fill(0)
    const zip = await makeZip({ 'images/hero-bg.jpg': bigBuffer })
    const html = '<img src="images/hero-bg.jpg" width="1200" height="600">'
    const result = await resolveAssetUrls(html, zip)
    expect(result).toContain('data:image/svg+xml')
    expect(result).not.toContain('images/hero-bg.jpg')
  })

  it('converts url() in inline styles', async () => {
    const pngBytes = new Uint8Array(100).fill(1)
    const zip = await makeZip({ 'bg.png': pngBytes })
    const html = '<div style="background: url(bg.png)"></div>'
    const result = await resolveAssetUrls(html, zip)
    expect(result).toMatch(/url\(data:image\/png;base64,/)
  })

  it('leaves external http URLs unchanged', async () => {
    const zip = await makeZip({})
    const html = '<img src="https://example.com/logo.png">'
    const result = await resolveAssetUrls(html, zip)
    expect(result).toContain('src="https://example.com/logo.png"')
  })
})

describe('stripMarkdown', () => {
  it('removes opening ```html fence', () => {
    const input = '```html\n<!DOCTYPE html><html></html>'
    expect(stripMarkdown(input)).toBe('<!DOCTYPE html><html></html>')
  })

  it('removes closing ``` fence', () => {
    const input = '<!DOCTYPE html><html></html>\n```'
    expect(stripMarkdown(input)).toBe('<!DOCTYPE html><html></html>')
  })

  it('removes both fences', () => {
    const input = '```html\n<!DOCTYPE html><html></html>\n```'
    expect(stripMarkdown(input)).toBe('<!DOCTYPE html><html></html>')
  })

  it('extracts <!DOCTYPE block when prefixed with prose', () => {
    const input = 'Here is the design system:\n<!DOCTYPE html><html><body>content</body></html>'
    expect(stripMarkdown(input)).toBe('<!DOCTYPE html><html><body>content</body></html>')
  })

  it('leaves clean HTML unchanged', () => {
    const input = '<!DOCTYPE html><html></html>'
    expect(stripMarkdown(input)).toBe('<!DOCTYPE html><html></html>')
  })
})
