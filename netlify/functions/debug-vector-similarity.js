// Debug endpoint to check vector similarity scores
// Tests the exact same logic as generate-funnel.js searchKnowledge function
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function handler(event) {
  try {
    const body = event.httpMethod === 'POST' ? JSON.parse(event.body) : {};
    const testQuery = body.query || 'coaching coaches getting clients pricing offers funnel products digital';

    // Create embedding for query
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testQuery
    });
    const queryVector = embedding.data[0].embedding;

    // Fetch chunks (same as generate-funnel.js)
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding');

    if (error) throw error;

    // Calculate scores (same as generate-funnel.js)
    const allScored = chunks.map(c => ({
      id: c.id,
      content: c.content.substring(0, 100),
      score: cosineSimilarity(queryVector, JSON.parse(c.embedding))
    }));

    // Sort by score
    allScored.sort((a, b) => b.score - a.score);

    // Get stats
    const top10 = allScored.slice(0, 10);
    const passThreshold = allScored.filter(r => r.score > 0.6);
    const positiveScores = allScored.filter(r => r.score > 0);
    const negativeScores = allScored.filter(r => r.score < 0);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testQuery,
        queryVectorDimensions: queryVector.length,
        totalChunks: chunks.length,
        stats: {
          chunksAbove0_6: passThreshold.length,
          chunksWithPositiveScore: positiveScores.length,
          chunksWithNegativeScore: negativeScores.length,
          bestScore: allScored[0]?.score,
          worstScore: allScored[allScored.length - 1]?.score
        },
        top10Results: top10.map(r => ({
          id: r.id,
          score: r.score.toFixed(4),
          content: r.content + '...'
        })),
        verdict: passThreshold.length > 0
          ? 'WORKING - Knowledge chunks will be used'
          : 'BROKEN - No chunks pass 0.6 threshold, Claude gets no knowledge context'
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
