import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ projects: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name: name.trim(), description: description ?? null, user_id: user.id })
    .select('id, name, description, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ project: data }, { status: 201 })
}
