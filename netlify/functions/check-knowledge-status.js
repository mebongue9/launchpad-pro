// Quick diagnostic to check knowledge base status
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  try {
    // Check if knowledge_chunks table exists and has data
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding')
      .limit(5);

    if (error) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'error',
          error: error.message,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY
        })
      };
    }

    const hasEmbeddings = chunks && chunks.length > 0 && chunks.some(c => c.embedding && c.embedding.length > 0);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ok',
        totalChunks: chunks?.length || 0,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasEmbeddings,
        sampleChunk: chunks && chunks.length > 0 ? {
          id: chunks[0].id,
          contentPreview: chunks[0].content?.substring(0, 100) + '...',
          hasEmbedding: !!chunks[0].embedding
        } : null
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', error: err.message })
    };
  }
}
