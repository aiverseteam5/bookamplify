import { createAdminClient } from '@/lib/supabase/admin'
import { generateContent } from '@/lib/anthropic'
import { createEmbedding } from '@/lib/openai'
import type { VoiceProfile } from '@/types/supabase'

export { type VoiceProfile }

// Chunk size in words; 50-word overlap keeps context across boundaries
const CHUNK_SIZE = 512
const CHUNK_OVERLAP = 50

/**
 * Extract plain text from a PDF buffer using pdf-parse.
 * Falls back to raw text decoding if the buffer isn't a valid PDF.
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  // Dynamic import keeps pdf-parse in Node.js server bundle only
  const { PDFParse } = await import('pdf-parse')
  // PDFParse constructor takes LoadParameters; `data` holds the raw bytes
  const uint8 = new Uint8Array(buffer)
  const parser = new PDFParse({ data: uint8 })
  const result = await parser.getText()
  // TextResult.text is the full concatenated document text
  return (result as { text?: string }).text ?? ''
}

/** Split text into overlapping word-windows */
function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    chunks.push(words.slice(i, i + CHUNK_SIZE).join(' '))
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

/**
 * Main entry point — called by the voice-extraction API route.
 * 1. Download the manuscript from Supabase Storage.
 * 2. Parse PDF → plain text.
 * 3. Ask Claude to extract the author's voice profile.
 * 4. Embed each chunk with OpenAI and store in book_chunks.
 * 5. Update the author record with the voice_profile JSON.
 */
export async function extractVoiceProfile(authorId: string, manuscriptPath: string): Promise<VoiceProfile> {
  const supabase = createAdminClient()

  // Record agent run start
  const { data: run } = await supabase
    .from('agent_runs')
    .insert({ author_id: authorId, agent_name: 'voiceExtraction', status: 'running' })
    .select()
    .single()

  try {
    // ── 1. Download from Storage ──────────────────────────────────────────
    const { data: fileData, error: dlErr } = await supabase.storage
      .from('manuscripts')
      .download(manuscriptPath)

    if (dlErr || !fileData) {
      throw new Error(`Storage download failed: ${dlErr?.message ?? 'no file'}`)
    }

    // ── 2. PDF → text ──────────────────────────────────────────────────────
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let fullText: string
    try {
      fullText = await parsePdf(buffer)
    } catch {
      // Fallback: treat as plain-text
      fullText = buffer.toString('utf-8')
    }

    if (!fullText.trim()) {
      throw new Error('Could not extract text from manuscript — check the PDF is text-based, not scanned.')
    }

    // ── 3. Voice profile extraction ────────────────────────────────────────
    // Use first 8 000 words so the prompt stays within context limits
    const excerpt = fullText.split(/\s+/).slice(0, 8000).join(' ')

    const voicePrompt = `You are a literary analyst. Study this manuscript excerpt and extract the author's unique writing voice.

MANUSCRIPT EXCERPT:
${excerpt}

Return ONLY a JSON object matching this schema — no markdown, no explanation:
{
  "tone_descriptors": ["string"],
  "vocabulary_level": "academic | conversational | mixed",
  "sentence_rhythm": "short/punchy | long/flowing | varied",
  "characteristic_phrases": ["string"],
  "avoids": ["string"],
  "example_voice_sentence": "string"
}`

    const aiResponse = await generateContent(voicePrompt)

    // Strip any accidental markdown fences
    const cleaned = aiResponse.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    let voiceProfile: VoiceProfile
    try {
      voiceProfile = JSON.parse(cleaned) as VoiceProfile
    } catch {
      throw new Error(`Failed to parse voice profile JSON. Raw AI response: ${aiResponse.slice(0, 200)}`)
    }

    // ── 4. Chunk + embed ───────────────────────────────────────────────────
    const chunks = chunkText(fullText)
    let embeddedCount = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (!chunk) continue

      try {
        const embedding = await createEmbedding(chunk)
        await supabase.from('book_chunks').insert({
          author_id:   authorId,
          content:     chunk,
          embedding,
          chunk_index: i,
        })
        embeddedCount++
      } catch (err) {
        console.error(`Embedding chunk ${i} failed:`, err)
      }

      // Throttle: 1 s pause every 10 chunks to stay within rate limits
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // ── 5. Persist voice profile to author record ──────────────────────────
    await supabase
      .from('authors')
      .update({ voice_profile: voiceProfile, updated_at: new Date().toISOString() })
      .eq('id', authorId)

    // Mark run complete
    if (run) {
      await supabase.from('agent_runs').update({
        status:         'completed',
        completed_at:   new Date().toISOString(),
        output_summary: `Voice profile extracted. ${embeddedCount} chunks embedded.`,
        items_created:  embeddedCount,
      }).eq('id', run.id)
    }

    return voiceProfile

  } catch (error) {
    if (run) {
      await supabase.from('agent_runs').update({
        status:       'failed',
        completed_at: new Date().toISOString(),
        output_summary: error instanceof Error ? error.message : 'Unknown error',
      }).eq('id', run.id)
    }
    throw error
  }
}
