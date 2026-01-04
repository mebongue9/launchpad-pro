// Test vector search with embedding parsing fix
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function handler(event) {
  try {
    // Test query
    const testQuery = "coaching strategies";

    // Create embedding
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testQuery
    });

    const queryVector = embedding.data[0].embedding;

    // Fetch one chunk to test
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding')
      .limit(5);

    if (!chunks || chunks.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No chunks found' })
      };
    }

    // Test parsing and similarity calculation
    const testResults = chunks.map((chunk, i) => {
      try {
        // Parse embedding
        const embeddingArray = JSON.parse(chunk.embedding);

        // Calculate similarity
        const similarity = cosineSimilarity(queryVector, embeddingArray);

        return {
          chunkId: chunk.id,
          embeddingType: typeof chunk.embedding,
          parsedType: typeof embeddingArray,
          isArray: Array.isArray(embeddingArray),
          dimensions: embeddingArray.length,
          similarity: similarity,
          contentPreview: chunk.content.substring(0, 100),
          status: 'SUCCESS'
        };
      } catch (err) {
        return {
          chunkId: chunk.id,
          status: 'PARSE_ERROR',
          error: err.message
        };
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testQuery,
        queryVectorDimensions: queryVector.length,
        chunksFound: chunks.length,
        results: testResults,
        summary: {
          allParsedSuccessfully: testResults.every(r => r.status === 'SUCCESS'),
          allHaveCorrectDimensions: testResults.every(r => r.dimensions === 1536),
          allHaveValidSimilarity: testResults.every(r => r.similarity >= 0 && r.similarity <= 1)
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}
