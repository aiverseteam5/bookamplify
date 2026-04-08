import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ConnectSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'linkedin', 'youtube']),
  platform_user_id: z.string().optional(),
  platform_username: z.string().optional(),
  // access_token_secret stores the Supabase Vault secret name, not the raw token
  access_token_secret: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (authorError || !author) {
    return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
  }

  const body: unknown = await request.json()
  const parsed = ConnectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { platform, platform_user_id, platform_username, access_token_secret } = parsed.data

  const { data: existing } = await supabase
    .from('social_connections')
    .select('id')
    .eq('author_id', author.id)
    .eq('platform', platform)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `${platform} is already connected` }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('social_connections')
    .insert({
      author_id: author.id,
      platform,
      platform_user_id: platform_user_id ?? null,
      platform_username: platform_username ?? null,
      access_token_secret: access_token_secret ?? null,
    })
    .select('id, platform, platform_user_id, platform_username, connected_at, is_active')
    .single()

  if (error) {
    console.error('Failed to create social connection:', error)
    return NextResponse.json({ error: 'Failed to connect social account' }, { status: 500 })
  }

  return NextResponse.json({ connection: data })
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (authorError || !author) {
    return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('social_connections')
    .select('id, platform, platform_user_id, platform_username, connected_at, is_active')
    .eq('author_id', author.id)
    .order('connected_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }

  return NextResponse.json({ connections: data ?? [] })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (authorError || !author) {
    return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')

  if (!platform) {
    return NextResponse.json({ error: 'Missing platform parameter' }, { status: 400 })
  }

  const { error } = await supabase
    .from('social_connections')
    .delete()
    .eq('author_id', author.id)
    .eq('platform', platform)

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect social account' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Social account disconnected successfully' })
}
