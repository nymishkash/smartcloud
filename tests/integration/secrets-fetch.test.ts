import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { encrypt } from '@/lib/encryption'

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

import { POST } from '@/app/api/secrets/fetch/route'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function makeRequest(body: object, token?: string): NextRequest {
  return new NextRequest('http://localhost/api/secrets/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

function mockServiceClient() {
  ;(createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  })
}

describe('POST /api/secrets/fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServiceClient()
  })

  it('returns 401 when user is not authenticated', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        setSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No session') }),
      },
    })

    const res = await POST(makeRequest({ project_id: 'proj-1', key_name: 'API_KEY' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when project_id is missing', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        setSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    })

    const res = await POST(makeRequest({ key_name: 'API_KEY' }, 'valid-token'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('project_id')
  })

  it('returns 400 when key_name is missing', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        setSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    })

    const res = await POST(makeRequest({ project_id: 'proj-1' }, 'valid-token'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when secret key_name is not found', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        setSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest({ project_id: 'proj-1', key_name: 'NONEXISTENT' }, 'token'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Secret not found')
  })

  it('decrypts and returns plaintext on valid request', async () => {
    const plaintext = 'super-secret-db-password'
    const encrypted = encrypt(plaintext)

    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        setSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'secret-uuid',
                  key_name: 'DB_PASSWORD',
                  encrypted_value: encrypted.encrypted_value,
                  iv: encrypted.iv,
                  auth_tag: encrypted.auth_tag,
                  project_id: 'proj-1',
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest({ project_id: 'proj-1', key_name: 'DB_PASSWORD' }, 'token'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.value).toBe(plaintext)
    expect(body.key_name).toBe('DB_PASSWORD')
    expect(body.project_id).toBe('proj-1')
    expect(body.secret_id).toBe('secret-uuid')
    expect(body.fetched_at).toBeTruthy()
  })

  it('returns 500 if encrypted data is tampered (auth tag mismatch)', async () => {
    const encrypted = encrypt('original-value')

    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        setSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'secret-uuid',
                  key_name: 'DB_PASSWORD',
                  encrypted_value: encrypted.encrypted_value,
                  iv: encrypted.iv,
                  auth_tag: Buffer.alloc(16, 0).toString('base64'), // tampered tag
                  project_id: 'proj-1',
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest({ project_id: 'proj-1', key_name: 'DB_PASSWORD' }, 'token'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Failed to decrypt secret')
  })

  it('never returns encrypted_value, iv, or auth_tag in response', async () => {
    const plaintext = 'my-secret'
    const encrypted = encrypt(plaintext)

    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        setSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'secret-uuid',
                  key_name: 'MY_SECRET',
                  encrypted_value: encrypted.encrypted_value,
                  iv: encrypted.iv,
                  auth_tag: encrypted.auth_tag,
                  project_id: 'proj-1',
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest({ project_id: 'proj-1', key_name: 'MY_SECRET' }, 'token'))
    const body = await res.json()

    expect(body.encrypted_value).toBeUndefined()
    expect(body.iv).toBeUndefined()
    expect(body.auth_tag).toBeUndefined()
    expect(body.value).toBe(plaintext)
  })
})
