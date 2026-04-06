import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const generateContent = async (prompt: string) => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }
    throw new Error('Unexpected response format')
  } catch (error) {
    console.error('Error generating content:', error)
    throw error
  }
}

export { anthropic }
