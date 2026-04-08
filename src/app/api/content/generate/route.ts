import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContentGenerateSchema } from '@/lib/schemas'
import { generateContent } from '@/lib/anthropic'
import { createEmbedding } from '@/lib/openai'
import { genreSkills } from '@/lib/genreSkills'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = ContentGenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { platform, topic, tone, skills } = parsed.data

  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('id, voice_profile, book_title, genre, tone_preference')
    .eq('user_id', user.id)
    .single()

  if (authorError || !author) {
    return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
  }

  // Check active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('author_id', author.id)
    .single()

  const isActive = subscription?.status === 'active' &&
    (subscription.trial_ends_at === null || new Date(subscription.trial_ends_at) > new Date())

  if (!subscription || !isActive) {
    return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
  }

  // Log agent run
  const { data: run } = await supabase
    .from('agent_runs')
    .insert({ author_id: author.id, agent_name: 'contentGeneration', status: 'running' })
    .select()
    .single()

  try {
    // Semantic search for relevant book chunks (RAG)
    let ragContext = ''
    try {
      const topicEmbedding = await createEmbedding(topic)
      const { data: chunks } = await supabase.rpc('match_book_chunks', {
        query_embedding: topicEmbedding,
        match_count: 3,
        author_id_filter: author.id,
      })
      if (chunks && Array.isArray(chunks)) {
        ragContext = (chunks as { content: string }[]).map(c => c.content).join('\n\n')
      }
    } catch {
      // RAG is best-effort — continue without it
    }

    const genreKey = (author.genre ?? 'fiction') as keyof typeof genreSkills
    const genreSkillLayer = genreSkills[genreKey] ?? genreSkills.fiction

    const prompt = `SYSTEM:
You are an expert social media content creator for book authors.
You deeply understand the author's genre, their readers' psychology, and what drives book sales through authentic social content.

AUTHOR VOICE PROFILE:
${author.voice_profile ? JSON.stringify(author.voice_profile, null, 2) : 'No voice profile yet — write in a professional, engaging tone.'}

BOOK: ${author.book_title ?? 'Untitled'}
GENRE: ${author.genre ?? 'General'}
TONE PREFERENCE: ${author.tone_preference}
${ragContext ? `RELEVANT BOOK EXCERPTS:\n${ragContext}` : ''}

GENRE-SPECIFIC INSTRUCTION:
${genreSkillLayer}

USER:
Create a ${platform} post about the following topic:
${topic}

Tone: ${tone}
${skills.length > 0 ? `Apply these skills: ${skills.join(', ')}` : ''}

Format it perfectly for ${platform} including appropriate length${platform === 'instagram' || platform === 'twitter' ? ', hashtags' : ''}.
Return only the final post content — no meta-commentary.`

    const contentText = await generateContent(prompt)

    const { data: contentItem, error: insertError } = await supabase
      .from('content_items')
      .insert({
        author_id: author.id,
        platform,
        content_text: contentText,
        status: 'draft',
        created_by_agent: 'contentGeneration',
      })
      .select()
      .single()

    if (insertError || !contentItem) {
      throw new Error(insertError?.message ?? 'Failed to save content item')
    }

    if (run) {
      await supabase
        .from('agent_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), items_created: 1 })
        .eq('id', run.id)
    }

    return NextResponse.json({ id: contentItem.id, content_text: contentText, platform, status: 'draft' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Content generation failed'
    if (run) {
      await supabase
        .from('agent_runs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), output_summary: message })
        .eq('id', run.id)
    }
    console.error('Content generation error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
