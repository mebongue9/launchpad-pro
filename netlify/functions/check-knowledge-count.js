// Check TOTAL knowledge base size
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  try {
    // Get TOTAL count
    const { count, error } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }

    // Get sample chunks to verify content
    const { data: samples } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding')
      .limit(10);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalChunks: count,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        samples: samples?.map(s => ({
          id: s.id,
          contentPreview: s.content?.substring(0, 150),
          hasEmbedding: !!s.embedding,
          embeddingDimensions: s.embedding?.length || 0
        }))
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
