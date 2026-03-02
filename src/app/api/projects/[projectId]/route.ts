import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ projectId: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, created_at, updated_at')
    .eq('id', projectId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ project: data })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await request.json()
  const updates: Record<string, string | null> = {}
  if (name !== undefined) updates.name = name.trim()
  if (description !== undefined) updates.description = description

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select('id, name, description, created_at, updated_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ project: data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
