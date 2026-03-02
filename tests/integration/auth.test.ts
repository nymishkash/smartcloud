import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

import { POST as signup } from '@/app/api/auth/signup/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as changePassword } from '@/app/api/auth/change-password/route'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function makeRequest(url: string, body: object): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 if email is missing', async () => {
    const res = await signup(makeRequest('http://localhost/api/auth/signup', { password: 'pass1234' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if password is missing', async () => {
    const res = await signup(makeRequest('http://localhost/api/auth/signup', { email: 'a@b.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 201 on successful signup', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'a@b.com' } },
          error: null,
        }),
      },
    })

    const res = await signup(makeRequest('http://localhost/api/auth/signup', {
      email: 'a@b.com',
      password: 'password123',
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.user.email).toBe('a@b.com')
  })

  it('returns 400 if Supabase returns an error', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User already registered' },
        }),
      },
    })

    const res = await signup(makeRequest('http://localhost/api/auth/signup', {
      email: 'existing@b.com',
      password: 'password123',
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 for wrong credentials', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        }),
      },
    })

    const res = await login(makeRequest('http://localhost/api/auth/login', {
      email: 'a@b.com',
      password: 'wrong-password',
    }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid email or password')
  })

  it('returns 400 if fields are missing', async () => {
    const res = await login(makeRequest('http://localhost/api/auth/login', { email: 'a@b.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with user and session on success', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1', email: 'a@b.com' },
            session: { access_token: 'jwt-token' },
          },
          error: null,
        }),
      },
    })

    const res = await login(makeRequest('http://localhost/api/auth/login', {
      email: 'a@b.com',
      password: 'correct-password',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.session.access_token).toBe('jwt-token')
  })
})

describe('POST /api/auth/change-password', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 if not authenticated', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    })

    const res = await changePassword(makeRequest('http://localhost/api/auth/change-password', {
      password: 'newpassword123',
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 if password is too short', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    })

    const res = await changePassword(makeRequest('http://localhost/api/auth/change-password', {
      password: 'short',
    }))
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful password change', async () => {
    ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    })

    const res = await changePassword(makeRequest('http://localhost/api/auth/change-password', {
      password: 'newpassword123',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toContain('updated')
  })
})
