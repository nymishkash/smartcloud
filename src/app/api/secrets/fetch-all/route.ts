import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { decrypt } from '@/lib/encryption'
import { resolveAuth } from '@/lib/auth'

// POST /api/secrets/fetch-all
// Batch fetch all secrets for a project. Returns decrypted key-value pairs.
// Caller provides { project_id } + Authorization: Bearer <jwt | api_key>
// Returns { secrets: [{ key_name, value }], project_id, fetched_at }
export async function POST(request: NextRequest) {
  const auth = await resolveAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, supabase } = auth

  let body: { project_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { project_id } = body
  if (!project_id) {
    return NextResponse.json(
      { error: 'project_id is required' },
      { status: 400 }
    )
  }

  // Fetch all secrets for the project
  let query = supabase
    .from('secrets')
    .select('id, key_name, encrypted_value, iv, auth_tag, project_id')
    .eq('project_id', project_id)
  if (auth.requiresUserFilter) query = query.eq('user_id', userId)
  const { data: rows, error: dbError } = await query.order('key_name', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const serviceClient = createServiceClient()
  const ipAddress =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const secrets: { key_name: string; value: string }[] = []

  for (const row of rows ?? []) {
    try {
      const plaintext = decrypt({
        encrypted_value: row.encrypted_value,
        iv: row.iv,
        auth_tag: row.auth_tag,
      })

      secrets.push({ key_name: row.key_name, value: plaintext })

      // Audit log via service client (bypasses RLS on access_logs insert)
      await serviceClient.from('access_logs').insert({
        secret_id: row.id,
        user_id: userId,
        project_id: row.project_id,
        key_name: row.key_name,
        action: 'READ',
        ip_address: ipAddress,
      })
    } catch (err) {
      // Skip secrets that fail decryption (tampered data) rather than failing the whole batch
      console.error('Decryption failed for secret:', row.id, err)
    }
  }

  return NextResponse.json({
    secrets,
    project_id,
    fetched_at: new Date().toISOString(),
  })
}
