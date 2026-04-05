import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInsert, mockUpdate, mockCreateSignedUploadUrl } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreateSignedUploadUrl: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockInsert,
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: mockUpdate,
      }),
    }),
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
      }),
    },
  }),
}))

import { POST } from '@/app/api/design-systems/init/route'
import { NextRequest } from 'next/server'

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/design-systems/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/design-systems/init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ data: { id: 'ds-123' }, error: null })
    mockUpdate.mockResolvedValue({ error: null })
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://supabase.example/signed', token: 'tok', path: 'ds-123.zip' },
      error: null,
    })
  })

  it('returns 400 when nome is missing', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/nome/)
  })

  it('returns 400 when nome is empty string', async () => {
    const res = await POST(makeReq({ nome: '   ' }))
    expect(res.status).toBe(400)
  })

  it('returns id, uploadUrl, path on success', async () => {
    const res = await POST(makeReq({ nome: 'Acme DS' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('ds-123')
    expect(json.uploadUrl).toBe('https://supabase.example/signed')
    expect(json.path).toBe('ds-123.zip')
  })

  it('returns 500 when DB insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'db error' } })
    const res = await POST(makeReq({ nome: 'Acme DS' }))
    expect(res.status).toBe(500)
  })

  it('returns 500 when signed URL creation fails', async () => {
    mockCreateSignedUploadUrl.mockResolvedValueOnce({ data: null, error: { message: 'storage error' } })
    const res = await POST(makeReq({ nome: 'Acme DS' }))
    expect(res.status).toBe(500)
  })
})
