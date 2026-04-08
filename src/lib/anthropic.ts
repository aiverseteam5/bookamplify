import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is missing')
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export const generateContent = async (prompt: string): Promise<string> => {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (!block) throw new Error('No content returned from Claude')
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

export { getClient as anthropic }
