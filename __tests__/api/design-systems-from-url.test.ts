import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInsert, mockUpdate, mockFinalMessage } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockFinalMessage: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockInsert }) }),
      update: vi.fn().mockReturnValue({ eq: mockUpdate }),
    }),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: mockUpdate }) }),
  }),
}))

vi.mock('@/lib/get-configuracoes', () => ({
  getConfiguracoes: vi.fn().mockResolvedValue({
    anthropic_key: 'test-key',
    modelo_ds: 'claude-haiku-4-5-20251001',
    prompt_ds: 'Analyze: ',
  }),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      messages: { stream: vi.fn().mockReturnValue({ finalMessage: mockFinalMessage }) },
    }
  }),
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: vi.fn() }
})

vi.mock('@/lib/ds-resolver', () => ({
  buildAnalysisHtmlFromUrl: vi.fn().mockResolvedValue('<html><body>Page HTML</body></html>'),
  stripMarkdown: vi.fn().mockImplementation((s: string) => s),
}))

import { POST } from '@/app/api/design-systems/from-url/route'
import { NextRequest } from 'next/server'

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/design-systems/from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/design-systems/from-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ data: { id: 'ds-456' }, error: null })
    mockUpdate.mockResolvedValue({ error: null })
    mockFinalMessage.mockResolvedValue({
      content: [{ type: 'text', text: '<!DOCTYPE html><html></html>' }],
      stop_reason: 'end_turn',
    })
  })

  it('returns 400 when nome is missing', async () => {
    const res = await POST(makeReq({ url: 'https://example.com' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/nome/)
  })

  it('returns 400 when url is missing', async () => {
    const res = await POST(makeReq({ nome: 'Test DS' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/url/)
  })

  it('returns 400 when url is not http/https', async () => {
    const res = await POST(makeReq({ nome: 'Test DS', url: 'ftp://example.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 202 with id and processing status on success', async () => {
    const res = await POST(makeReq({ nome: 'Test DS', url: 'https://example.com' }))
    expect(res.status).toBe(202)
    const json = await res.json()
    expect(json.id).toBe('ds-456')
    expect(json.status).toBe('processing')
  })

  it('returns 500 when DB insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'db error' } })
    const res = await POST(makeReq({ nome: 'Test DS', url: 'https://example.com' }))
    expect(res.status).toBe(500)
  })
})
