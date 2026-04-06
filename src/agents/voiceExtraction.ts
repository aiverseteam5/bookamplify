import { createServiceClient } from '@/lib/supabase'
import { generateContent } from '@/lib/anthropic'
import { createEmbedding } from '@/lib/openai'

export interface VoiceProfile {
  tone_descriptors: string[]
  vocabulary_level: 'academic' | 'conversational' | 'mixed'
  sentence_rhythm: 'short/punchy' | 'long/flowing' | 'varied'
  characteristic_phrases: string[]
  avoids: string[]
  example_voice_sentence: string
}

export const extractVoiceProfile = async (authorId: string, manuscriptText: string) => {
  const supabase = createServiceClient()
  
  try {
    // Log agent run start
    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .insert({
        author_id: authorId,
        agent_name: 'voiceExtraction',
        status: 'running',
      })
      .select()
      .single()

    if (runError) {
      console.error('Failed to log agent run:', runError)
    }

    // Take first 8000 words for analysis
    const manuscriptExcerpt = manuscriptText.split(/\s+/).slice(0, 8000).join(' ')

    // Extract voice profile using Claude
    const prompt = `You are analyzing an author's manuscript to extract their unique writing voice.

MANUSCRIPT EXCERPT (first 8000 words):
${manuscriptExcerpt}

Extract and return a JSON object with these fields:
{
  "tone_descriptors": ["string", ...],        // 3-5 adjectives describing the writing tone
  "vocabulary_level": "string",               // academic / conversational / mixed
  "sentence_rhythm": "string",               // short/punchy / long/flowing / varied
  "characteristic_phrases": ["string", ...],  // 3-5 phrases that feel distinctly theirs
  "avoids": ["string", ...],                 // patterns or words they never use
  "example_voice_sentence": "string"         // one sentence written in their voice
}

Return only valid JSON, no explanation.`

    const response = await generateContent(prompt)
    let voiceProfile: VoiceProfile
    
    try {
      voiceProfile = JSON.parse(response)
    } catch (parseError) {
      console.error('Failed to parse voice profile:', parseError)
      throw new Error('Failed to parse voice profile from AI response')
    }

    // Update author with voice profile
    const { error: updateError } = await supabase
      .from('authors')
      .update({ 
        voice_profile: voiceProfile as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', authorId)

    if (updateError) {
      console.error('Failed to update author profile:', updateError)
    }

    // Split text into chunks and create embeddings
    const chunkSize = 512
    const overlap = 50
    const words = manuscriptText.split(/\s+/)
    const chunks: { content: string; index: number }[] = []

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ')
      chunks.push({
        content: chunk,
        index: Math.floor(i / (chunkSize - overlap))
      })
    }

    // Process chunks in batches to avoid rate limits
    const bookChunks = []
    const batchSize = 5
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      
      for (const chunk of batch) {
        try {
          const embedding = await createEmbedding(chunk.content)
          bookChunks.push({
            author_id: authorId,
            content: chunk.content,
            embedding,
            chunk_index: chunk.index,
          })
        } catch (embeddingError) {
          console.error('Failed to create embedding for chunk:', embeddingError)
          // Continue with other chunks
        }
      }
      
      // Small delay between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Insert all chunks
    if (bookChunks.length > 0) {
      const { error: insertError } = await supabase
        .from('book_chunks')
        .insert(bookChunks as any)

      if (insertError) {
        console.error('Failed to insert book chunks:', insertError)
      }
    }

    // Update agent run as completed
    if (run) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output_summary: `Extracted voice profile and processed ${bookChunks.length} text chunks`,
          items_created: bookChunks.length,
        } as any)
        .eq('id', run.id)
    }

    return voiceProfile
  } catch (error) {
    console.error('Voice extraction error:', error)
    
    // Update agent run as failed
    await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        output_summary: error instanceof Error ? error.message : 'Unknown error',
      } as any)
      .eq('author_id', authorId)
      .eq('agent_name', 'voiceExtraction')

    throw error
  }
}
