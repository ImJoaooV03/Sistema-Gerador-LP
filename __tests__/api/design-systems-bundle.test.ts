import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { injectDsHtml } from '@/app/api/design-systems/[id]/bundle/route'

describe('injectDsHtml', () => {
  it('adds design-system.html to the zip', async () => {
    const zip = new JSZip()
    zip.file('index.html', '<html><body>Original</body></html>')
    zip.file('assets/logo.png', new Uint8Array([1, 2, 3]))

    const result = await injectDsHtml(zip, '<html><body>Design System</body></html>')

    const outZip = await JSZip.loadAsync(result)
    expect(outZip.file('design-system.html')).not.toBeNull()
    const dsContent = await outZip.file('design-system.html')!.async('string')
    expect(dsContent).toBe('<html><body>Design System</body></html>')
  })

  it('preserves original files in the zip', async () => {
    const zip = new JSZip()
    zip.file('index.html', '<html><body>Original</body></html>')
    zip.file('assets/logo.png', new Uint8Array([1, 2, 3]))

    const result = await injectDsHtml(zip, '<html><body>DS</body></html>')

    const outZip = await JSZip.loadAsync(result)
    expect(outZip.file('index.html')).not.toBeNull()
    expect(outZip.file('assets/logo.png')).not.toBeNull()
    const indexContent = await outZip.file('index.html')!.async('string')
    expect(indexContent).toBe('<html><body>Original</body></html>')
  })

  it('overwrites design-system.html if it already exists', async () => {
    const zip = new JSZip()
    zip.file('index.html', '<html></html>')
    zip.file('design-system.html', '<html>Old DS</html>')

    const result = await injectDsHtml(zip, '<html>New DS</html>')

    const outZip = await JSZip.loadAsync(result)
    const content = await outZip.file('design-system.html')!.async('string')
    expect(content).toBe('<html>New DS</html>')
  })

  it('returns a non-empty Uint8Array', async () => {
    const zip = new JSZip()
    zip.file('index.html', '<html></html>')
    const result = await injectDsHtml(zip, '<html>DS</html>')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })
})
