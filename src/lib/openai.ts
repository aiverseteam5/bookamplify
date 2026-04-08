import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is missing')
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

export const createEmbedding = async (text: string): Promise<number[]> => {
  const response = await getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  const item = response.data[0]
  if (!item) throw new Error('No embedding returned from OpenAI')
  return item.embedding
}

export { getClient as openai }
