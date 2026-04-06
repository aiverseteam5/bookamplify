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

    // Get author ID
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
    }

    const { platform, accessToken, refreshToken, expiresAt, userId: platformUserId, username } = await request.json()

    if (!platform || !accessToken) {
      return NextResponse.json({ 
        error: 'Missing required parameters: platform, accessToken' 
      }, { status: 400 })
    }

    const validPlatforms = ['instagram', 'twitter', 'linkedin', 'youtube']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ 
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` 
      }, { status: 400 })
    }

    // Check if connection already exists
    const { data: existingConnection, error: existingError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('author_id', author.id)
      .eq('platform', platform)
      .maybeSingle()

    if (existingConnection && !existingError) {
      return NextResponse.json({ 
        error: `${platform} is already connected` 
      }, { status: 409 })
    }

    // Create new social connection
    const connectionData: any = {
      author_id: author.id,
      platform,
      access_token: accessToken,
      connected_at: new Date().toISOString()
    }

    if (refreshToken) {
      connectionData.refresh_token = refreshToken
    }

    if (expiresAt) {
      connectionData.expires_at = expiresAt
    }

    if (platformUserId) {
      connectionData.platform_user_id = platformUserId
    }

    if (username) {
      connectionData.username = username
    }

    const { data, error } = await supabase
      .from('social_connections')
      .insert(connectionData)
      .select()
      .single()

    if (error) {
      console.error('Failed to create social connection:', error)
      return NextResponse.json({ error: 'Failed to connect social account' }, { status: 500 })
    }

    return NextResponse.json({ 
      connection: data,
      message: `${platform} connected successfully`
    })

  } catch (error: any) {
    console.error('Social connect API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect social account' },
      { status: 500 }
    )
  }
}

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

    // Get all social connections
    const { data, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('author_id', author.id)
      .order('connected_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch social connections:', error)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    // Don't expose sensitive tokens
    const safeConnections = (data || []).map(conn => ({
      id: conn.id,
      platform: conn.platform,
      platform_user_id: conn.platform_user_id,
      username: conn.username,
      connected_at: conn.connected_at,
      expires_at: conn.expires_at,
      status: conn.status
    }))

    return NextResponse.json({ connections: safeConnections })

  } catch (error: any) {
    console.error('Social connections GET API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('id')
    const platform = searchParams.get('platform')

    if (!connectionId && !platform) {
      return NextResponse.json({ 
        error: 'Missing required parameter: id or platform' 
      }, { status: 400 })
    }

    let query = supabase
      .from('social_connections')
      .delete()
      .eq('author_id', author.id)

    if (connectionId) {
      query = query.eq('id', connectionId)
    } else if (platform) {
      query = query.eq('platform', platform)
    }

    const { error } = await query

    if (error) {
      console.error('Failed to delete social connection:', error)
      return NextResponse.json({ error: 'Failed to disconnect social account' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Social account disconnected successfully'
    })

  } catch (error: any) {
    console.error('Social disconnect API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect social account' },
      { status: 500 }
    )
  }
}
