import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { decrypt } from '@/lib/encryption'
import { resolveAuth } from '@/lib/auth'

// POST /api/secrets/fetch
// The AWS GetSecretValue equivalent.
// Caller provides { project_id, key_name } + Authorization: Bearer <jwt | api_key>
// Returns { key_name, value (plaintext), project_id, secret_id, fetched_at }
//
// Security properties:
// - Encrypted bytes never leave this server
// - GCM auth tag verification detects DB tampering
// - RLS ensures users can only access their own secrets
// - Every successful fetch is logged in access_logs
export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, supabase } = auth

  let body: { project_id?: string; key_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { project_id, key_name } = body
  if (!project_id || !key_name) {
    return NextResponse.json(
      { error: 'project_id and key_name are required' },
      { status: 400 }
    )
  }

  // Fetch the secret
  let query = supabase
    .from('secrets')
    .select('id, key_name, encrypted_value, iv, auth_tag, project_id')
    .eq('project_id', project_id)
    .eq('key_name', key_name.toUpperCase())
  if (auth.requiresUserFilter) query = query.eq('user_id', userId)
  const { data: secret, error: dbError } = await query.single()

  if (dbError || !secret) {
    return NextResponse.json({ error: 'Secret not found' }, { status: 404 })
  }

  // Server-side decryption — plaintext never stored, only computed here
  let plaintext: string
  try {
    plaintext = decrypt({
      encrypted_value: secret.encrypted_value,
      iv: secret.iv,
      auth_tag: secret.auth_tag,
    })
  } catch (err) {
    // auth_tag mismatch means the DB row was tampered with
    console.error('Decryption failed for secret:', secret.id, err)
    return NextResponse.json({ error: 'Failed to decrypt secret' }, { status: 500 })
  }

  // Audit log via service client (bypasses RLS on access_logs insert)
  const serviceClient = createServiceClient()
  await serviceClient.from('access_logs').insert({
    secret_id: secret.id,
    user_id: userId,
    project_id: secret.project_id,
    key_name: secret.key_name,
    action: 'READ',
    ip_address:
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown',
  })

  return NextResponse.json({
    key_name: secret.key_name,
    value: plaintext,
    project_id: secret.project_id,
    secret_id: secret.id,
    fetched_at: new Date().toISOString(),
  })
}
