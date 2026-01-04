// Test function for batched generation system
// Tests orchestrator + retry engine + batched generators (tasks 1-2 only)
// RELEVANT FILES: netlify/functions/lib/task-orchestrator.js, netlify/functions/lib/batched-generators.js

import { orchestrateGeneration } from './lib/task-orchestrator.js';
import { generators } from './lib/batched-generators.js';

const LOG_TAG = '[TEST-BATCHED-GEN]';

export async function handler(event) {
  console.log(`🧪 ${LOG_TAG} Testing batched generation system`);

  try {
    const { funnel_id } = JSON.parse(event.body || '{}');

    if (!funnel_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing funnel_id' })
      };
    }

    console.log(`🚀 ${LOG_TAG} Starting test generation for funnel: ${funnel_id}`);
    console.log(`📋 ${LOG_TAG} Testing ONLY tasks 1-2 (lead magnet parts 1-2)`);

    // Create generators map with only tasks 1-2 for testing
    const testGenerators = {
      lead_magnet_part_1: generators.lead_magnet_part_1,
      lead_magnet_part_2: generators.lead_magnet_part_2,
      // Stubs for tasks 3-14 (won't execute in test)
      frontend_part_1: () => ({ skipped: true }),
      frontend_part_2: () => ({ skipped: true }),
      bump_full: () => ({ skipped: true }),
      upsell1_part_1: () => ({ skipped: true }),
      upsell1_part_2: () => ({ skipped: true }),
      upsell2_part_1: () => ({ skipped: true }),
      upsell2_part_2: () => ({ skipped: true }),
      all_tldrs: () => ({ skipped: true }),
      marketplace_batch_1: () => ({ skipped: true }),
      marketplace_batch_2: () => ({ skipped: true }),
      all_emails: () => ({ skipped: true }),
      bundle_listing: () => ({ skipped: true })
    };

    const result = await orchestrateGeneration(funnel_id, testGenerators);

    console.log(`✅ ${LOG_TAG} Test generation completed`);
    console.log(`📊 ${LOG_TAG} Results:`, JSON.stringify(result.progress, null, 2));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Batched generation test completed',
        funnel_id,
        progress: result.progress,
        results: result.results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error(`❌ ${LOG_TAG} Test failed:`, error);
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
