import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthorProfileSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = AuthorProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { launch_date, ...rest } = parsed.data

  const { data, error } = await supabase
    .from('authors')
    .update({
      ...rest,
      launch_date: launch_date ? launch_date : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ author: data })
}
