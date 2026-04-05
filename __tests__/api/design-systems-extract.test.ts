import { describe, it, expect, vi, beforeEach } from 'vitest'
import JSZip from 'jszip'

// ── helpers ────────────────────────────────────────────────────────────────────
async function makeZipBlob(files: Record<string, string>): Promise<Blob> {
  const zip = new JSZip()
  for (const [p, c] of Object.entries(files)) zip.file(p, c)
  const buf = await zip.generateAsync({ type: 'uint8array' })
  return new Blob([buf], { type: 'application/zip' })
}

// ── mocks ─────────────────────────────────────────────────────────────────────
const { mockUpdateDs, mockSelectDs, mockStorageDownload, mockFinalMessage } = vi.hoisted(() => ({
  mockUpdateDs: vi.fn(),
  mockSelectDs: vi.fn(),
  mockStorageDownload: vi.fn(),
  mockFinalMessage: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSelectDs,
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: mockUpdateDs,
      }),
    }),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        download: mockStorageDownload,
      }),
    },
  }),
}))

vi.mock('@/lib/get-configuracoes', () => ({
  getConfiguracoes: vi.fn().mockResolvedValue({
    anthropic_key: 'test-key',
    modelo_ds: 'claude-haiku-4-5-20251001',
    prompt_ds: 'Analyze this: ',
  }),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      messages: {
        stream: vi.fn().mockReturnValue({
          finalMessage: mockFinalMessage,
        }),
      },
    }
  }),
}))

import { POST } from '@/app/api/design-systems/[id]/extract/route'
import { NextRequest } from 'next/server'

function makeReq(id: string) {
  return new NextRequest(`http://localhost/api/design-systems/${id}/extract`, { method: 'POST' })
}

describe('POST /api/design-systems/[id]/extract', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const zipBlob = await makeZipBlob({
      'index.html': '<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>',
      'style.css': 'body { color: #ff0000; }',
    })
    mockSelectDs.mockResolvedValue({
      data: { id: 'ds-123', nome: 'Test DS', storage_path: 'ds-123.zip', status: 'pending' },
      error: null,
    })
    mockStorageDownload.mockResolvedValue({ data: zipBlob, error: null })
    mockUpdateDs.mockResolvedValue({ error: null })
    mockFinalMessage.mockResolvedValue({
      content: [{ type: 'text', text: '<!DOCTYPE html><html><body>DS Content</body></html>' }],
      stop_reason: 'end_turn',
    })
  })

  it('returns 404 when DS record not found', async () => {
    mockSelectDs.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const res = await POST(makeReq('ds-123'), { params: Promise.resolve({ id: 'ds-123' }) })
    expect(res.status).toBe(404)
  })

  it('returns ds_html and status done on success', async () => {
    const res = await POST(makeReq('ds-123'), { params: Promise.resolve({ id: 'ds-123' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('done')
    expect(json.ds_html).toContain('<!DOCTYPE html>')
  })

  it('returns 500 when storage download fails', async () => {
    mockStorageDownload.mockResolvedValueOnce({ data: null, error: { message: 'download failed' } })
    const res = await POST(makeReq('ds-123'), { params: Promise.resolve({ id: 'ds-123' }) })
    expect(res.status).toBe(500)
  })

  it('strips markdown fences from Claude output', async () => {
    mockFinalMessage.mockResolvedValueOnce({
      content: [{ type: 'text', text: '```html\n<!DOCTYPE html><html><body>DS</body></html>\n```' }],
      stop_reason: 'end_turn',
    })
    const res = await POST(makeReq('ds-123'), { params: Promise.resolve({ id: 'ds-123' }) })
    const json = await res.json()
    expect(json.ds_html).not.toContain('```')
    expect(json.ds_html).toContain('<!DOCTYPE html>')
  })
})
