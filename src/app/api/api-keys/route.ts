import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateApiKey, hashApiKey } from '@/lib/auth'

// GET /api/api-keys — list all API keys for the authenticated user
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ api_keys: data })
}

// POST /api/api-keys — generate a new API key
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Generate the key and hash it
  const plaintext = generateApiKey()
  const keyHash = hashApiKey(plaintext)
  const keyPrefix = plaintext.substring(0, 16) // "sc_live_" + 8 chars

  // Insert via service client to bypass any RLS issues on insert
  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('api_keys')
    .insert({
      user_id: user.id,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id, name, key_prefix, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the plaintext key — this is the ONLY time it's shown
  return NextResponse.json({
    api_key: {
      ...data,
      key: plaintext,
    },
  }, { status: 201 })
}
