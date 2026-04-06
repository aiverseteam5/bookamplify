import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      book_title,
      book_description,
      genre,
      sub_genre,
      target_reader,
      purchase_url,
      author_bio,
      tone_preference = 'scholarly but accessible',
      launch_date
    } = body

    // Update author profile
    const { data, error } = await supabase
      .from('authors')
      .update({
        name,
        book_title,
        book_description,
        genre,
        sub_genre,
        target_reader,
        purchase_url,
        author_bio,
        tone_preference,
        launch_date: launch_date ? new Date(launch_date).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ author: data })
  } catch (error: any) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
