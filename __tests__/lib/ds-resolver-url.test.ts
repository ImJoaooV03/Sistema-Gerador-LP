import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildAnalysisHtmlFromUrl } from '@/lib/ds-resolver'

function mockFetch(responses: Record<string, { status: number; text: string }>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    const match = responses[url]
    if (!match) throw new Error(`Unexpected fetch: ${url}`)
    return {
      ok: match.status >= 200 && match.status < 300,
      status: match.status,
      text: async () => match.text,
    } as Response
  })
}

describe('buildAnalysisHtmlFromUrl', () => {
  afterEach(() => vi.restoreAllMocks())

  it('inlines linked CSS as <style> blocks', async () => {
    mockFetch({
      'https://example.com/': {
        status: 200,
        text: '<html><head><link rel="stylesheet" href="/styles.css"></head><body><h1>Hello</h1></body></html>',
      },
      'https://example.com/styles.css': {
        status: 200,
        text: 'body { color: #ff0000; }',
      },
    })
    const result = await buildAnalysisHtmlFromUrl('https://example.com/')
    expect(result).toContain('<style>body { color: #ff0000; }</style>')
    expect(result).not.toContain('<link rel="stylesheet"')
  })

  it('resolves relative CSS hrefs against page origin', async () => {
    mockFetch({
      'https://acme.com/landing': {
        status: 200,
        text: '<html><head><link rel="stylesheet" href="/css/app.css"></head><body></body></html>',
      },
      'https://acme.com/css/app.css': {
        status: 200,
        text: '.btn { background: #000; }',
      },
    })
    const result = await buildAnalysisHtmlFromUrl('https://acme.com/landing')
    expect(result).toContain('.btn { background: #000; }')
  })

  it('keeps existing inline <style> blocks', async () => {
    mockFetch({
      'https://example.com/': {
        status: 200,
        text: '<html><head><style>h1 { font-size: 2rem; }</style></head><body></body></html>',
      },
    })
    const result = await buildAnalysisHtmlFromUrl('https://example.com/')
    expect(result).toContain('h1 { font-size: 2rem; }')
  })

  it('removes external <script src> tags', async () => {
    mockFetch({
      'https://example.com/': {
        status: 200,
        text: '<html><body><script src="/app.js"></script></body></html>',
      },
    })
    const result = await buildAnalysisHtmlFromUrl('https://example.com/')
    expect(result).not.toContain('src="/app.js"')
  })

  it('leaves link tag unchanged when CSS fetch fails', async () => {
    mockFetch({
      'https://example.com/': {
        status: 200,
        text: '<html><head><link rel="stylesheet" href="/missing.css"></head><body></body></html>',
      },
      'https://example.com/missing.css': { status: 404, text: 'Not Found' },
    })
    const result = await buildAnalysisHtmlFromUrl('https://example.com/')
    expect(result).toContain('href="/missing.css"')
  })

  it('throws when the page itself returns non-2xx', async () => {
    mockFetch({ 'https://example.com/blocked': { status: 403, text: 'Forbidden' } })
    await expect(buildAnalysisHtmlFromUrl('https://example.com/blocked')).rejects.toThrow('403')
  })
})
