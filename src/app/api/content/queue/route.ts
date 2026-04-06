import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    // Get author ID
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
    }

    // Get content items with pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')

    let query = supabase
      .from('content_items')
      .select('*')
      .eq('author_id', author.id)
      .order('generated_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch content queue:', error)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    return NextResponse.json({ 
      items: data || [],
      page,
      limit,
      total: data?.length || 0
    })

  } catch (error: any) {
    console.error('Content queue API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch content queue' },
      { status: 500 }
    )
  }
}

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

    // Get author ID
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
    }

    const { contentId, action, scheduledFor } = await request.json()

    if (!contentId || !action) {
      return NextResponse.json({ 
        error: 'Missing required parameters: contentId, action' 
      }, { status: 400 })
    }

    if (!['approve', 'reject', 'schedule'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be approve, reject, or schedule' 
      }, { status: 400 })
    }

    // Verify content belongs to this author
    const { data: content, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentId)
      .eq('author_id', author.id)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Update content based on action
    const updateData: any = {
      reviewed_at: new Date().toISOString()
    }

    switch (action) {
      case 'approve':
        updateData.status = 'approved'
        updateData.approved_at = new Date().toISOString()
        break
      case 'reject':
        updateData.status = 'rejected'
        updateData.rejected_at = new Date().toISOString()
        break
      case 'schedule':
        if (!scheduledFor) {
          return NextResponse.json({ 
            error: 'scheduledFor is required for schedule action' 
          }, { status: 400 })
        }
        updateData.status = 'scheduled'
        updateData.scheduled_for = scheduledFor
        break
    }

    const { data: updatedContent, error: updateError } = await supabase
      .from('content_items')
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update content:', updateError)
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    return NextResponse.json({ 
      content: updatedContent,
      message: `Content ${action}d successfully`
    })

  } catch (error: any) {
    console.error('Content queue POST API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update content' },
      { status: 500 }
    )
  }
}
