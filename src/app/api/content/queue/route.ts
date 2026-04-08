import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
  const status = searchParams.get('status')
  const platform = searchParams.get('platform')

  let query = supabase
    .from('content_items')
    .select('*')
    .eq('author_id', author.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (platform) {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [], page, limit })
}
