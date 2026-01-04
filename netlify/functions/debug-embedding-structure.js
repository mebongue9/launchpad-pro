// Debug embedding structure
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  try {
    const { data } = await supabase
      .from('knowledge_chunks')
      .select('id, embedding')
      .limit(1)
      .single();

    if (!data || !data.embedding) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No embedding found' })
      };
    }

    const emb = data.embedding;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunkId: data.id,
        embeddingType: typeof emb,
        isArray: Array.isArray(emb),
        length: emb?.length || 0,
        first5Values: Array.isArray(emb) ? emb.slice(0, 5) : 'Not an array',
        last5Values: Array.isArray(emb) ? emb.slice(-5) : 'Not an array'
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
