// netlify/functions/generate-funnel-content-batched.js
// NEW batched generation endpoint using task orchestrator
// Replaces old chapter-by-chapter with 14 batched tasks + automatic retry
// RELEVANT FILES: lib/task-orchestrator.js, lib/batched-generators.js, lib/retry-engine.js

import { createClient } from '@supabase/supabase-js';
import { orchestrateGeneration } from './lib/task-orchestrator.js';
import { generators } from './lib/batched-generators.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[GENERATE-FUNNEL-BATCHED]';

export async function handler(event) {
  console.log(`🚀 ${LOG_TAG} Function invoked`);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { funnel_id, skip_lead_magnet } = JSON.parse(event.body || '{}');

    if (!funnel_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing funnel_id' })
      };
    }

    console.log(`🚀 ${LOG_TAG} Starting batched generation for funnel: ${funnel_id}`);
    if (skip_lead_magnet) {
      console.log(`⏭️ ${LOG_TAG} Skipping lead magnet tasks (already generated)`);
    }

    // Verify funnel exists
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name, user_id')
      .eq('id', funnel_id)
      .single();

    if (funnelError || !funnel) {
      console.error(`❌ ${LOG_TAG} Funnel not found:`, funnelError?.message);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Funnel not found' })
      };
    }

    console.log(`✅ ${LOG_TAG} Funnel found: ${funnel.name}`);

    // Filter generators if skip_lead_magnet is set
    // This is used when called from LeadMagnetBuilder where lead magnet was already generated
    let generatorsToRun = generators;
    if (skip_lead_magnet) {
      generatorsToRun = Object.fromEntries(
        Object.entries(generators).filter(([key]) => !key.startsWith('lead_magnet_'))
      );
      console.log(`📋 ${LOG_TAG} Starting orchestration with 12 batched tasks (skipping lead magnet)...`);
    } else {
      console.log(`📋 ${LOG_TAG} Starting orchestration with 14 batched tasks...`);
    }

    // Run orchestrator with generators (14 or 12 depending on skip_lead_magnet)
    const result = await orchestrateGeneration(funnel_id, generatorsToRun);

    console.log(`✅ ${LOG_TAG} Generation completed:`, {
      success: result.success,
      completed: result.progress.completed,
      failed: result.progress.failed,
      total: result.progress.total
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: result.success,
        message: result.success
          ? 'Funnel content generated successfully'
          : 'Generation completed with errors',
        funnel_id,
        progress: result.progress,
        results: result.results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Generation failed:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
}
