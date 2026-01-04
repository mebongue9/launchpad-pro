// netlify/functions/lib/task-orchestrator.js
// Orchestrates execution of 14 batched generation tasks with resume capability
// Coordinates retry engine and batched generators
// RELEVANT FILES: netlify/functions/lib/retry-engine.js, netlify/functions/lib/batched-generators.js

import { createClient } from '@supabase/supabase-js';
import { executeWithRetry } from './retry-engine.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[TASK-ORCHESTRATOR]';

// Define all 14 tasks
export const TASKS = [
  { id: '1', name: 'lead_magnet_part_1', description: 'Lead Magnet: Cover + Chapters 1-3' },
  { id: '2', name: 'lead_magnet_part_2', description: 'Lead Magnet: Chapters 4-5 + Bridge + CTA' },
  { id: '3', name: 'frontend_part_1', description: 'Front-End: Cover + Chapters 1-3' },
  { id: '4', name: 'frontend_part_2', description: 'Front-End: Chapters 4-6 + Bridge + CTA' },
  { id: '5', name: 'bump_full', description: 'Bump: Full product (short)' },
  { id: '6', name: 'upsell1_part_1', description: 'Upsell 1: Cover + First half' },
  { id: '7', name: 'upsell1_part_2', description: 'Upsell 1: Second half + Bridge + CTA' },
  { id: '8', name: 'upsell2_part_1', description: 'Upsell 2: Cover + First half' },
  { id: '9', name: 'upsell2_part_2', description: 'Upsell 2: Second half + Bridge + CTA' },
  { id: '10', name: 'all_tldrs', description: 'All 5 product TLDRs' },
  { id: '11', name: 'marketplace_batch_1', description: 'Marketplace: Lead Magnet + Front-End + Bump' },
  { id: '12', name: 'marketplace_batch_2', description: 'Marketplace: Upsell 1 + Upsell 2' },
  { id: '13', name: 'all_emails', description: 'All 6 emails' },
  { id: '14', name: 'bundle_listing', description: 'Bundle listing' }
];

// Initialize task records for a funnel
export async function initializeTaskRecords(funnelId) {
  console.log(`📝 ${LOG_TAG} Initializing ${TASKS.length} task records for funnel ${funnelId}`);

  const records = TASKS.map(task => ({
    funnel_id: funnelId,
    task_id: task.id,
    task_name: task.name,
    status: 'pending',
    attempt_count: 0
  }));

  // Insert all records (ON CONFLICT DO NOTHING to allow resume)
  for (const record of records) {
    const { error } = await supabase
      .from('generation_tasks')
      .upsert(record, {
        onConflict: 'funnel_id,task_id',
        ignoreDuplicates: true
      });

    if (error) {
      console.error(`❌ ${LOG_TAG} Error initializing task ${record.task_id}:`, error);
    }
  }

  console.log(`✅ ${LOG_TAG} Task records initialized`);
}

// Get current task statuses for resume capability
export async function getTaskStatuses(funnelId) {
  console.log(`🔍 ${LOG_TAG} Checking task statuses for funnel ${funnelId}`);

  const { data: tasks, error } = await supabase
    .from('generation_tasks')
    .select('task_id, status, attempt_count')
    .eq('funnel_id', funnelId)
    .order('task_id');

  if (error) {
    console.error(`❌ ${LOG_TAG} Error getting task statuses:`, error);
    return {};
  }

  // Convert to map: task_id -> status
  const statusMap = {};
  tasks.forEach(task => {
    statusMap[task.task_id] = {
      status: task.status,
      attemptCount: task.attempt_count
    };
  });

  const completed = tasks.filter(t => t.status === 'completed').length;
  console.log(`📊 ${LOG_TAG} Progress: ${completed}/${TASKS.length} tasks completed`);

  return statusMap;
}

// Report progress (can be polled by frontend)
export async function reportProgress(funnelId) {
  const taskStatuses = await getTaskStatuses(funnelId);
  const completed = Object.values(taskStatuses).filter(t => t.status === 'completed').length;
  const inProgress = Object.values(taskStatuses).filter(t => t.status === 'in_progress').length;
  const failed = Object.values(taskStatuses).filter(t => t.status === 'failed').length;
  const pending = Object.values(taskStatuses).filter(t => t.status === 'pending').length;

  return {
    total: TASKS.length,
    completed,
    inProgress,
    failed,
    pending,
    percentage: Math.round((completed / TASKS.length) * 100)
  };
}

// Main orchestration function
export async function orchestrateGeneration(funnelId, generators) {
  console.log(`🚀 ${LOG_TAG} Starting orchestrated generation for funnel ${funnelId}`);
  console.log(`📋 ${LOG_TAG} Total tasks: ${TASKS.length}`);

  // Step 1: Initialize task records
  await initializeTaskRecords(funnelId);

  // Step 2: Get current statuses (for resume)
  const taskStatuses = await getTaskStatuses(funnelId);

  // Step 3: Execute each task
  const results = [];

  for (const task of TASKS) {
    const currentStatus = taskStatuses[task.id]?.status || 'pending';

    // Skip if already completed (resume scenario)
    if (currentStatus === 'completed') {
      console.log(`⏭️ ${LOG_TAG} Task ${task.id} (${task.name}) already completed - skipping`);
      results.push({
        taskId: task.id,
        taskName: task.name,
        status: 'skipped',
        reason: 'already_completed'
      });
      continue;
    }

    // Get the generator function for this task
    const generatorFn = generators[task.name];

    if (!generatorFn) {
      console.error(`❌ ${LOG_TAG} No generator function found for task ${task.name}`);
      results.push({
        taskId: task.id,
        taskName: task.name,
        status: 'error',
        error: 'No generator function'
      });
      continue;
    }

    console.log(`\n▶️ ${LOG_TAG} Executing task ${task.id}/${TASKS.length}: ${task.description}`);

    try {
      // Execute with automatic retry
      const result = await executeWithRetry(
        funnelId,
        task.id,
        task.name,
        generatorFn
      );

      results.push({
        taskId: task.id,
        taskName: task.name,
        status: 'completed',
        result
      });

      // Log progress
      const progress = await reportProgress(funnelId);
      console.log(`📊 ${LOG_TAG} Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);

    } catch (error) {
      console.error(`❌ ${LOG_TAG} Task ${task.id} failed after all retries:`, error.message);
      results.push({
        taskId: task.id,
        taskName: task.name,
        status: 'failed',
        error: error.message
      });

      // Stop orchestration if a task fails
      console.error(`🛑 ${LOG_TAG} Stopping orchestration due to failed task`);
      break;
    }
  }

  // Final progress report
  const finalProgress = await reportProgress(funnelId);
  console.log(`\n✅ ${LOG_TAG} Orchestration complete`);
  console.log(`📊 ${LOG_TAG} Final: ${finalProgress.completed}/${finalProgress.total} completed, ${finalProgress.failed} failed`);

  return {
    success: finalProgress.failed === 0,
    progress: finalProgress,
    results
  };
}
