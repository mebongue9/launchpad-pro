// /netlify/functions/vector-search.js
// Semantic search against knowledge_chunks vector database
// Uses OpenAI embeddings to find relevant content
// RELEVANT FILES: src/hooks/useVectorSearch.jsx, netlify/functions/generate-funnel.js

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { query, limit = 10, threshold = 0.7 } = JSON.parse(event.body)

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query is required' })
      }
    }

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // Fetch all chunks with embeddings (for smaller datasets)
    // For larger datasets, we'd use pgvector's similarity operators
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, metadata, embedding')

    if (error) throw error

    // Calculate similarity for each chunk
    const results = chunks
      .map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
      }))
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        results,
        query,
        total: results.length
      })
    }
  } catch (error) {
    console.error('Vector search error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Vector search failed' })
    }
  }
}
