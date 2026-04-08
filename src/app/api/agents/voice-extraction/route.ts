import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractVoiceProfile } from '@/agents/voiceExtraction'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const body = await request.json() as { authorId?: string; fileName?: string }
    const { authorId, fileName } = body

    if (!authorId || !fileName) {
      return NextResponse.json({ error: 'Missing required parameters: authorId, fileName' }, { status: 400 })
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('manuscripts')
      .download(fileName)

    if (downloadError || !fileData) {
      console.error('Failed to download manuscript:', downloadError)
      return NextResponse.json({ error: 'Failed to download manuscript' }, { status: 500 })
    }

    const manuscriptText = await fileData.text()
    const voiceProfile = await extractVoiceProfile(authorId, manuscriptText)

    return NextResponse.json({ status: 'completed', voiceProfile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Voice extraction failed'
    console.error('Voice extraction API error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
