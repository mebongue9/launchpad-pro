// /netlify/functions/lib/knowledge-search.js
// Shared utility for knowledge base (vector database) search with metrics
// Used for RAG (Retrieval Augmented Generation) across all generation functions
// Logs all operations to rag_retrieval_logs table

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Note: cosineSimilarity removed - now using pgvector server-side search

/**
 * Search knowledge base with comprehensive metrics collection
 * @param {string} query - The search query for embedding
 * @param {Object} options - Options for the search
 * @param {number} options.limit - Max chunks to return (default: 5)
 * @param {number} options.threshold - Similarity threshold (default: 0.6)
 * @param {string} options.sourceFunction - Which function is calling (for logging)
 * @returns {Object} Result object with context string and metrics
 */
export async function searchKnowledgeWithMetrics(query, options = {}) {
  const {
    limit = 20,
    threshold = 0.3,
    sourceFunction = 'unknown'
  } = options;

  const startTime = Date.now();
  const LOG_TAG = '[KNOWLEDGE-SEARCH][' + sourceFunction + ']';

  // Initialize metrics object
  const metrics = {
    query,
    sourceFunction,
    totalChunksInDb: 4349,
    chunksRetrieved: 0,
    similarityThreshold: threshold,
    modelUsed: 'text-embedding-3-small',
    queryVectorLength: 1536,
    top5Scores: [],
    chunksUsed: [],
    knowledgeContextLength: 0,
    knowledgeContextPassed: false,
    embeddingTimeMs: 0,
    retrievalTimeMs: 0,
    totalTimeMs: 0,
    error: null
  };

  // Return empty if no API key
  if (!process.env.OPENAI_API_KEY) {
    console.log(LOG_TAG + ' Skipping - OPENAI_API_KEY not configured');
    metrics.error = 'OPENAI_API_KEY not configured';
    metrics.totalTimeMs = Date.now() - startTime;
    return { context: '', metrics };
  }

  try {
    // Step 1: Create embedding
    const embeddingStart = Date.now();
    console.log(LOG_TAG + ' Creating embedding for query (' + query.length + ' chars)...');

    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    const queryVector = embedding.data[0].embedding;

    metrics.embeddingTimeMs = Date.now() - embeddingStart;
    metrics.queryVectorLength = queryVector.length;
    console.log(LOG_TAG + ' Embedding created in ' + metrics.embeddingTimeMs + 'ms, vector length: ' + queryVector.length);

    // Step 2: Use pgvector RPC for efficient server-side similarity search
    const retrievalStart = Date.now();
    console.log(LOG_TAG + ' Searching ALL 4349 chunks via pgvector RPC...');

    const { data: chunks, error: searchError } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryVector,
      match_count: limit,
      min_similarity: threshold
    });

    metrics.retrievalTimeMs = Date.now() - retrievalStart;

    if (searchError) {
      throw new Error('pgvector search error: ' + searchError.message);
    }

    if (!chunks || chunks.length === 0) {
      console.log(LOG_TAG + ' No chunks matched with similarity > ' + threshold);
      metrics.totalTimeMs = Date.now() - startTime;
      return { context: '', metrics };
    }

    metrics.chunksRetrieved = chunks.length;
    console.log(LOG_TAG + ' pgvector returned ' + chunks.length + ' matching chunks in ' + metrics.retrievalTimeMs + 'ms');

    // Step 3: Capture top 5 scores for logging (already sorted by pgvector)
    metrics.top5Scores = chunks.slice(0, 5).map((r, i) => ({
      rank: i + 1,
      chunkId: r.id,
      score: parseFloat(r.similarity.toFixed(4)),
      preview: r.content.substring(0, 100).replace(/\n/g, ' ') + '...'
    }));

    // Log top 5 scores
    console.log(LOG_TAG + ' TOP 5 SIMILARITY SCORES:');
    metrics.top5Scores.forEach(r => {
      console.log('  [' + r.rank + '] score=' + r.score.toFixed(4) + ', id=' + r.chunkId + ', preview="' + r.preview.substring(0, 60) + '..."');
    });

    // Step 4: Build context string and capture chunks used
    metrics.chunksUsed = chunks.map(r => ({
      chunkId: r.id,
      score: parseFloat(r.similarity.toFixed(4)),
      preview: r.content.substring(0, 100).replace(/\n/g, ' ') + '...'
    }));

    const context = '\n\n=== CREATOR\'S KNOWLEDGE & TEACHING STYLE ===\n' +
      chunks.map((r, i) => '[' + (i + 1) + '] ' + r.content).join('\n\n') +
      '\n=== END KNOWLEDGE ===\n\nUse the above to match the creator\'s voice, terminology, and proven strategies.';

    metrics.knowledgeContextLength = context.length;
    metrics.knowledgeContextPassed = true;
    metrics.totalTimeMs = Date.now() - startTime;

    console.log(LOG_TAG + ' SUCCESS: ' + chunks.length + ' chunks matched, context length: ' + context.length + ' chars, total time: ' + metrics.totalTimeMs + 'ms');

    return { context, metrics };

  } catch (err) {
    console.error(LOG_TAG + ' ERROR:', err.message);
    metrics.error = err.message;
    metrics.totalTimeMs = Date.now() - startTime;
    return { context: '', metrics };
  }
}

/**
 * Log RAG retrieval metrics to database
 * @param {Object} params - Log parameters
 */
export async function logRagRetrieval(params) {
  const {
    userId,
    profileId = null,
    audienceId = null,
    funnelId = null,
    leadMagnetId = null,
    sourceFunction,
    generationType,
    metrics,
    freshnessCheck = { performed: false, count: 0, names: [] },
    generationSuccessful = true,
    errorMessage = null
  } = params;

  try {
    const { error } = await supabase.from('rag_retrieval_logs').insert({
      user_id: userId,
      profile_id: profileId,
      audience_id: audienceId,
      funnel_id: funnelId,
      lead_magnet_id: leadMagnetId,
      source_function: sourceFunction,
      generation_type: generationType,
      search_query: metrics.query,
      total_chunks_in_db: metrics.totalChunksInDb,
      chunks_retrieved: metrics.chunksRetrieved,
      similarity_threshold: metrics.similarityThreshold,
      model_used: metrics.modelUsed,
      query_vector_length: metrics.queryVectorLength,
      top_5_scores: metrics.top5Scores,
      chunks_used: metrics.chunksUsed,
      knowledge_context_length: metrics.knowledgeContextLength,
      knowledge_context_passed: metrics.knowledgeContextPassed,
      freshness_check_performed: freshnessCheck.performed,
      previous_names_count: freshnessCheck.count,
      previous_names_avoided: freshnessCheck.names,
      embedding_time_ms: metrics.embeddingTimeMs,
      retrieval_time_ms: metrics.retrievalTimeMs,
      total_time_ms: metrics.totalTimeMs,
      generation_successful: generationSuccessful,
      error_message: errorMessage || metrics.error
    });

    if (error) {
      console.error('[KNOWLEDGE-SEARCH] Failed to log RAG retrieval:', error.message);
    } else {
      console.log('[KNOWLEDGE-SEARCH] RAG retrieval logged successfully');
    }
  } catch (err) {
    console.error('[KNOWLEDGE-SEARCH] Error logging RAG retrieval:', err.message);
  }
}

/**
 * Get previous funnel product names for freshness check
 * @param {string} userId - User ID
 * @param {number} limit - Max funnels to check
 * @returns {Object} Freshness check result
 */
export async function getPreviousFunnelNamesWithMetrics(userId, limit = 10) {
  console.log('[KNOWLEDGE-SEARCH] Checking previous funnel names for user: ' + userId);

  const result = {
    performed: true,
    count: 0,
    names: []
  };

  if (!userId) {
    console.log('[KNOWLEDGE-SEARCH] No user_id provided, skipping freshness check');
    result.performed = false;
    return result;
  }

  try {
    const { data: funnels, error } = await supabase
      .from('funnels')
      .select('name, front_end, bump, upsell_1, upsell_2')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[KNOWLEDGE-SEARCH] Error fetching previous funnels:', error.message);
      result.performed = false;
      return result;
    }

    if (!funnels || funnels.length === 0) {
      console.log('[KNOWLEDGE-SEARCH] No previous funnels found');
      return result;
    }

    // Extract all product names from previous funnels
    const previousNames = [];
    funnels.forEach(funnel => {
      if (funnel.name) previousNames.push(funnel.name);
      if (funnel.front_end?.name) previousNames.push(funnel.front_end.name);
      if (funnel.bump?.name) previousNames.push(funnel.bump.name);
      if (funnel.upsell_1?.name) previousNames.push(funnel.upsell_1.name);
      if (funnel.upsell_2?.name) previousNames.push(funnel.upsell_2.name);
    });

    // Remove duplicates
    result.names = [...new Set(previousNames)];
    result.count = result.names.length;

    console.log('[KNOWLEDGE-SEARCH] Found ' + result.count + ' previous product names to avoid');
    return result;

  } catch (err) {
    console.error('[KNOWLEDGE-SEARCH] getPreviousFunnelNames error:', err.message);
    result.performed = false;
    return result;
  }
}
