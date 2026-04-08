import { createAdminClient } from '@/lib/supabase/admin'
import { generateContent } from '@/lib/anthropic'
import { createEmbedding } from '@/lib/openai'
import type { VoiceProfile } from '@/types/supabase'

export { type VoiceProfile }

export const extractVoiceProfile = async (authorId: string, manuscriptText: string): Promise<VoiceProfile> => {
  const supabase = createAdminClient()

  // Log agent run start
  const { data: run } = await supabase
    .from('agent_runs')
    .insert({
      author_id: authorId,
      agent_name: 'voiceExtraction',
      status: 'running',
    })
    .select()
    .single()

  try {
    // Take first 8000 words for analysis
    const manuscriptExcerpt = manuscriptText.split(/\s+/).slice(0, 8000).join(' ')

    const prompt = `You are analyzing an author's manuscript to extract their unique writing voice.

MANUSCRIPT EXCERPT (first 8000 words):
${manuscriptExcerpt}

Extract and return a JSON object with these fields:
{
  "tone_descriptors": ["string"],
  "vocabulary_level": "academic | conversational | mixed",
  "sentence_rhythm": "short/punchy | long/flowing | varied",
  "characteristic_phrases": ["string"],
  "avoids": ["string"],
  "example_voice_sentence": "string"
}

Return only valid JSON, no explanation.`

    const response = await generateContent(prompt)

    let voiceProfile: VoiceProfile
    try {
      voiceProfile = JSON.parse(response) as VoiceProfile
    } catch {
      throw new Error('Failed to parse voice profile from AI response')
    }

    // Update author with voice profile
    await supabase
      .from('authors')
      .update({
        voice_profile: voiceProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authorId)

    // Split text into 512-token chunks with 50-token overlap
    const chunkSize = 512
    const overlap = 50
    const words = manuscriptText.split(/\s+/)

    type BookChunkInsert = {
      author_id: string
      content: string
      embedding: number[]
      chunk_index: number
    }

    const bookChunks: BookChunkInsert[] = []

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ')
      const chunkIndex = Math.floor(i / (chunkSize - overlap))

      try {
        const embedding = await createEmbedding(chunk)
        bookChunks.push({
          author_id: authorId,
          content: chunk,
          embedding,
          chunk_index: chunkIndex,
        })
      } catch (err) {
        console.error(`Failed to embed chunk ${chunkIndex}:`, err)
      }

      // Small delay every 5 chunks to avoid rate limits
      if (chunkIndex > 0 && chunkIndex % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    if (bookChunks.length > 0) {
      await supabase.from('book_chunks').insert(bookChunks)
    }

    if (run) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output_summary: `Extracted voice profile and processed ${bookChunks.length} text chunks`,
          items_created: bookChunks.length,
        })
        .eq('id', run.id)
    }

    return voiceProfile
  } catch (error) {
    if (run) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          output_summary: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', run.id)
    }
    throw error
  }
}
