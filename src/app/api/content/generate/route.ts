import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/anthropic'
import { genreSkills } from '@/lib/genreSkills'

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

    // Get author profile
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 })
    }

    const { platform, topic, contentType, tone } = await request.json()

    if (!platform || !topic) {
      return NextResponse.json({ 
        error: 'Missing required parameters: platform, topic' 
      }, { status: 400 })
    }

    // Log agent run start
    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .insert({
        author_id: author.id,
        agent_name: 'contentGeneration',
        status: 'running',
      })
      .select()
      .single()

    if (runError) {
      console.error('Failed to log agent run:', runError)
    }

    try {
      // Get genre-specific skills
      const skills = genreSkills[author.genre as keyof typeof genreSkills] || genreSkills.fiction

      // Build the layered prompt
      const voiceProfile = author.voice_profile
      const prompt = buildLayeredPrompt({
        voiceProfile,
        topic,
        platform,
        contentType,
        tone: tone || author.tone_preference,
        bookTitle: author.book_title,
        bookDescription: author.book_description,
        targetReader: author.target_reader,
        skills: skills.split('\n'),
        author
      })

      // Generate content using Claude
      const response = await generateContent(prompt)
      
      // Parse the response to extract content items
      const contentItems = parseContentResponse(response, platform, contentType)

      // Save content items to database
      const savedItems = []
      for (const item of contentItems) {
        const { data, error } = await supabase
          .from('content_items')
          .insert({
            author_id: author.id,
            platform,
            content_type: contentType,
            content: item.content,
            status: 'pending',
            voice_profile_used: voiceProfile,
            topic,
            generated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.error('Failed to save content item:', error)
        } else {
          savedItems.push(data)
        }
      }

      // Update agent run as completed
      if (run) {
        await supabase
          .from('agent_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            output_summary: `Generated ${savedItems.length} content items for ${platform}`,
            items_created: savedItems.length,
          } as any)
          .eq('id', run.id)
      }

      return NextResponse.json({
        status: 'success',
        items: savedItems,
        message: `Generated ${savedItems.length} content items for ${platform}`
      })

    } catch (generationError) {
      console.error('Content generation error:', generationError)
      
      // Update agent run as failed
      if (run) {
        await supabase
          .from('agent_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            output_summary: generationError instanceof Error ? generationError.message : 'Unknown error',
          } as any)
          .eq('id', run.id)
      }

      throw generationError
    }

  } catch (error: any) {
    console.error('Content generation API error:', error)
    return NextResponse.json(
      { error: error.message || 'Content generation failed' },
      { status: 500 }
    )
  }
}

function buildLayeredPrompt(params: {
  voiceProfile: any
  topic: string
  platform: string
  contentType: string
  tone: string
  bookTitle: string
  bookDescription: string
  targetReader: string
  skills: string[]
  author: any
}): string {
  const {
    voiceProfile,
    topic,
    platform,
    contentType,
    tone,
    bookTitle,
    bookDescription,
    targetReader,
    skills,
    author
  } = params

  return `You are a content creation AI for authors, generating social media content that sounds exactly like the author.

BOOK CONTEXT:
Title: ${bookTitle}
Description: ${bookDescription}
Target Reader: ${targetReader}
Genre: ${author.genre || 'Unknown'}

AUTHOR VOICE PROFILE:
Tone Descriptors: ${voiceProfile?.tone_descriptors?.join(', ') || 'professional, engaging'}
Vocabulary Level: ${voiceProfile?.vocabulary_level || 'mixed'}
Sentence Rhythm: ${voiceProfile?.sentence_rhythm || 'varied'}
Characteristic Phrases: ${voiceProfile?.characteristic_phrases?.join(', ') || 'none specified'}
Avoids: ${voiceProfile?.avoids?.join(', ') || 'none specified'}
Example Voice: "${voiceProfile?.example_voice_sentence || 'Write in a professional yet approachable tone'}"

CONTENT REQUIREMENTS:
Platform: ${platform}
Topic: ${topic}
Content Type: ${contentType}
Desired Tone: ${tone}

GENRE-SPECIFIC SKILLS:
${skills.join('\n')}

INSTRUCTIONS:
1. Write 3-5 content variations that sound exactly like this author
2. Each variation should be platform-appropriate (${platform})
3. Content should relate to the topic: ${topic}
4. Use the author's voice profile and genre-specific skills
5. Include relevant hashtags if appropriate for the platform
6. Format each variation as "VARIATION X: [content]"

Return only the content variations, no explanations.`
}

function parseContentResponse(response: string, platform: string, contentType: string): Array<{content: string}> {
  const lines = response.split('\n')
  const items = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('VARIATION') && trimmed.includes(':')) {
      const content = trimmed.split(':')[1].trim()
      if (content) {
        items.push({ content })
      }
    }
  }
  
  // If no variations found, treat the whole response as one item
  if (items.length === 0 && response.trim()) {
    items.push({ content: response.trim() })
  }
  
  return items
}
