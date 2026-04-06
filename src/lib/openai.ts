import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export const createEmbedding = async (text: string) => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error creating embedding:', error)
    throw error
  }
}

export { openai }
