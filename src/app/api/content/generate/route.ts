import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContentGenerateSchema } from '@/lib/schemas'
import { generateContent } from '@/lib/anthropic'
import { createEmbedding } from '@/lib/openai'
import { genreSkills } from '@/lib/genreSkills'
import type { VoiceProfile } from '@/types/supabase'

// Platform-specific constraints injected into the prompt
const PLATFORM_CONSTRAINTS: Record<string, string> = {
  twitter:     'Max 280 characters. One punchy hook. End with a question or CTA. Hashtags: 1–2 max.',
  instagram:   'Caption 100–300 words. Strong opening hook. Paragraph breaks. Hashtags: 15–20 at bottom.',
  linkedin:    'Thought-leadership post 200–400 words. Lead with a bold insight. Paragraph breaks. No hashtag spam.',
  youtube:     'Video description 150–300 words. Hook in first 2 lines. Use timestamps if relevant. 5–10 hashtags.',
  newsletter:  'Email section 200–400 words. Conversational, first-person. Paragraph breaks. No hashtags.',
}

/**
 * Build the layered system + user prompt for content generation.
 *
 * Layer 1 — System: who Claude is
 * Layer 2 — Voice: author's extracted voice profile
 * Layer 3 — RAG: relevant book passages retrieved by cosine similarity
 * Layer 4 — Genre: genre-specific content strategy
 * Layer 5 — Platform: platform-specific formatting constraints
 * Layer 6 — User: the actual request
 */
function buildPrompt(params: {
  platform: string
  topic: string
  tone: string
  skills: string[]
  bookTitle: string
  genre: string
  tonePreference: string
  voiceProfile: VoiceProfile | null
  ragContext: string
}): string {
  const { platform, topic, tone, skills, bookTitle, genre, tonePreference, voiceProfile, ragContext } = params
  const genreKey = (genre?.toLowerCase().replace(/ /g, '-') ?? 'fiction') as keyof typeof genreSkills
  const genreLayer = genreSkills[genreKey] ?? genreSkills.fiction
  const platformLayer = PLATFORM_CONSTRAINTS[platform] ?? 'Adapt length to platform norms.'

  const voiceBlock = voiceProfile
    ? `AUTHOR VOICE PROFILE:
- Tone descriptors: ${(voiceProfile.tone_descriptors ?? []).join(', ')}
- Vocabulary level: ${voiceProfile.vocabulary_level ?? 'conversational'}
- Sentence rhythm: ${voiceProfile.sentence_rhythm ?? 'varied'}
- Characteristic phrases: ${(voiceProfile.characteristic_phrases ?? []).join(', ')}
- Avoids: ${(voiceProfile.avoids ?? []).join(', ')}
- Example voice sentence: "${voiceProfile.example_voice_sentence ?? ''}"`
    : 'AUTHOR VOICE PROFILE: Not yet extracted — use a professional, engaging tone.'

  const ragBlock = ragContext
    ? `RELEVANT BOOK PASSAGES (retrieved by semantic similarity):
${ragContext}

Use these passages as source material. Quote or paraphrase naturally; never copy verbatim.`
    : ''

  return `SYSTEM:
You are an expert social media ghostwriter for book authors. Your job is to write authentic, platform-native content that sounds exactly like the author — not like AI.

BOOK: "${bookTitle}"
GENRE: ${genre}
AUTHOR TONE PREFERENCE: ${tonePreference}

${voiceBlock}

${ragBlock ? ragBlock + '\n\n' : ''}GENRE STRATEGY:
${genreLayer}

PLATFORM REQUIREMENTS (${platform.toUpperCase()}):
${platformLayer}

WRITING RULES:
- Mirror the author's voice exactly as described above
- Draw naturally from book passages when provided
- Never mention AI, algorithms, or that content was generated
- Never use clichés or generic marketing language
- ${tone === 'conversational' ? 'Be warm, direct, and relatable' : tone === 'academic' ? 'Be precise and authoritative' : tone === 'storytelling' ? 'Lead with narrative and emotion' : 'Balance depth with accessibility'}
${skills.length > 0 ? `- Apply: ${skills.join(', ')}` : ''}

USER REQUEST:
Write a ${platform} post about: ${topic}

Return ONLY the final post — no preamble, no meta-commentary, no "Here is your post:".`
}

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

  // Load author profile with voice data
  const { data: author, error: authorError } = await supabase
    .from('authors')
    .select('id, voice_profile, book_title, genre, tone_preference')
    .eq('user_id', user.id)
    .single()

  if (authorError || !author) {
    return NextResponse.json({ error: 'Author profile not found. Complete onboarding first.' }, { status: 404 })
  }

  // Check active subscription (trial or paid)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('author_id', author.id)
    .single()

  const isActive =
    subscription?.status === 'active' &&
    (subscription.trial_ends_at === null || new Date(subscription.trial_ends_at) > new Date())

  if (!subscription || !isActive) {
    return NextResponse.json({ error: 'An active subscription is required to generate content.' }, { status: 403 })
  }

  // Record agent run start
  const { data: run } = await supabase
    .from('agent_runs')
    .insert({ author_id: author.id, agent_name: 'contentGeneration', status: 'running' })
    .select()
    .single()

  try {
    // ── RAG: embed topic → cosine similarity search ───────────────────────
    let ragContext = ''
    try {
      const topicEmbedding = await createEmbedding(topic)
      const { data: chunks } = await supabase.rpc('match_book_chunks', {
        query_embedding: topicEmbedding,
        match_count: 4,
        author_id_filter: author.id,
      })
      if (chunks && Array.isArray(chunks) && chunks.length > 0) {
        ragContext = (chunks as { content: string; similarity: number }[])
          .filter(c => c.similarity > 0.6)    // only high-quality matches
          .slice(0, 3)
          .map(c => c.content)
          .join('\n\n---\n\n')
      }
    } catch {
      // RAG is best-effort — content gen continues without it
    }

    // ── Build layered prompt ──────────────────────────────────────────────
    const prompt = buildPrompt({
      platform,
      topic,
      tone,
      skills,
      bookTitle:       author.book_title ?? 'Untitled',
      genre:           author.genre ?? 'fiction',
      tonePreference:  author.tone_preference ?? 'conversational',
      voiceProfile:    author.voice_profile as VoiceProfile | null,
      ragContext,
    })

    // ── Generate with Claude ──────────────────────────────────────────────
    const contentText = await generateContent(prompt)

    // ── Save to DB (status = pending for queue review) ────────────────────
    const { data: contentItem, error: insertError } = await supabase
      .from('content_items')
      .insert({
        author_id:        author.id,
        platform,
        content_text:     contentText,
        status:           'pending',           // goes straight to review queue
        created_by_agent: 'contentGeneration',
      })
      .select()
      .single()

    if (insertError || !contentItem) {
      throw new Error(insertError?.message ?? 'Failed to save content item')
    }

    // Mark run complete
    if (run) {
      await supabase.from('agent_runs').update({
        status:        'completed',
        completed_at:  new Date().toISOString(),
        items_created: 1,
        output_summary: `Generated ${platform} post: ${contentText.slice(0, 80)}…`,
      }).eq('id', run.id)
    }

    return NextResponse.json({
      id:           contentItem.id,
      content_text: contentText,
      platform,
      status:       'pending',
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Content generation failed'
    if (run) {
      await supabase.from('agent_runs').update({
        status:         'failed',
        completed_at:   new Date().toISOString(),
        output_summary: message,
      }).eq('id', run.id)
    }
    console.error('[content/generate] error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
