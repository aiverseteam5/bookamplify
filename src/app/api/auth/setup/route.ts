// Called immediately after signUp() to create author + subscription rows
// Uses admin client with JWT verification — safe to call from client
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabase = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Check if author already exists (idempotent)
  const { data: existing } = await supabase
    .from('authors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, authorId: existing.id })
  }

  // Create author profile
  const { data: author, error: authorError } = await supabase
    .from('authors')
    .insert({
      user_id: user.id,
      name: '',
      email: user.email ?? '',
    })
    .select('id')
    .single()

  if (authorError || !author) {
    console.error('Failed to create author:', authorError)
    return NextResponse.json({ error: 'Failed to create author profile' }, { status: 500 })
  }

  // Create trial subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      author_id: author.id,
      plan: 'trial',
      status: 'active',
    })

  if (subError) {
    console.error('Failed to create subscription:', subError)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }

  return NextResponse.json({ success: true, authorId: author.id })
}
