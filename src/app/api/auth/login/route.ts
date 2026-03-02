import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  return NextResponse.json({ user: data.user, session: data.session })
}
