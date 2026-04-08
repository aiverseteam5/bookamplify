import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractVoiceProfile } from '@/agents/voiceExtraction'

/**
 * POST /api/agents/voice-extraction
 * Called internally by /api/upload/manuscript after a successful upload.
 * Body: { authorId: string, filePath: string }
 * Uses service-role client — only reachable from server-to-server requests.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal call via shared secret header
    const secret = request.headers.get('x-internal-secret')
    if (secret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { authorId?: string; filePath?: string }
    const { authorId, filePath } = body

    if (!authorId || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields: authorId, filePath' },
        { status: 400 }
      )
    }

    // Validate author exists via admin client
    const supabase = createAdminClient()
    const { data: author, error: authorErr } = await supabase
      .from('authors')
      .select('id')
      .eq('id', authorId)
      .single()

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // Run extraction (logs its own agent_runs row)
    const voiceProfile = await extractVoiceProfile(authorId, filePath)

    return NextResponse.json({ status: 'completed', voiceProfile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Voice extraction failed'
    console.error('[voice-extraction] error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
