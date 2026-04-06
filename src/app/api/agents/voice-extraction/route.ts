import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { extractVoiceProfile } from '@/agents/voiceExtraction'

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { authorId, fileName } = await request.json()

    if (!authorId || !fileName) {
      return NextResponse.json({ 
        error: 'Missing required parameters: authorId, fileName' 
      }, { status: 400 })
    }

    // Download the manuscript from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('manuscripts')
      .download(fileName)

    if (downloadError) {
      console.error('Failed to download manuscript:', downloadError)
      return NextResponse.json({ 
        error: 'Failed to download manuscript' 
      }, { status: 500 })
    }

    // Convert file to text (simplified - in production, you'd use PDF parsing)
    const manuscriptText = await fileData.text()

    // Extract voice profile
    const voiceProfile = await extractVoiceProfile(authorId, manuscriptText)

    return NextResponse.json({ 
      status: 'completed',
      voiceProfile,
      message: 'Voice extraction completed successfully'
    })

  } catch (error: any) {
    console.error('Voice extraction API error:', error)
    return NextResponse.json(
      { error: error.message || 'Voice extraction failed' },
      { status: 500 }
    )
  }
}
