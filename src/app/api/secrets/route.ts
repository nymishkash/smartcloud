import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { encrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, key_name, value, description } = await request.json()

  if (!project_id || !key_name?.trim() || !value) {
    return NextResponse.json(
      { error: 'project_id, key_name, and value are required' },
      { status: 400 }
    )
  }

  // Verify user owns the project (RLS also enforces this, but explicit check = clear 404 vs 403)
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { encrypted_value, iv, auth_tag } = encrypt(value)

  const { data, error } = await supabase
    .from('secrets')
    .insert({
      project_id,
      user_id: user.id,
      key_name: key_name.trim().toUpperCase(),
      encrypted_value,
      iv,
      auth_tag,
      description: description ?? null,
    })
    .select('id, project_id, key_name, description, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A secret with this key name already exists in this project' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log CREATE action via service client (bypasses RLS on access_logs)
  const serviceClient = createServiceClient()
  await serviceClient.from('access_logs').insert({
    secret_id: data.id,
    user_id: user.id,
    project_id,
    key_name: data.key_name,
    action: 'CREATE',
    ip_address: request.headers.get('x-forwarded-for') ?? 'unknown',
  })

  // Return metadata only — never return plaintext or encrypted fields
  return NextResponse.json({ secret: data }, { status: 201 })
}
