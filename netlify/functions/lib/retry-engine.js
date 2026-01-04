// netlify/functions/lib/retry-engine.js
// Core retry engine with automatic retry logic and escalating delays
// Handles up to 7 retry attempts with configurable delays from app_settings
// RELEVANT FILES: netlify/functions/lib/task-orchestrator.js, supabase/migrations/create-app-settings-table.sql

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[RETRY-ENGINE]';

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load retry settings from database
export async function getRetrySettings() {
  console.log(`🔧 ${LOG_TAG} Loading retry settings from database...`);

  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', [
      'retry_attempt_2_delay',
      'retry_attempt_3_delay',
      'retry_attempt_4_delay',
      'retry_attempt_5_delay',
      'retry_attempt_6_delay',
      'retry_attempt_7_delay',
      'max_retry_attempts'
    ]);

  if (error) {
    console.error(`❌ ${LOG_TAG} Error loading settings:`, error);
    // Return defaults if database fails
    return {
      delays: [0, 5, 30, 120, 300, 300, 300],
      maxAttempts: 7
    };
  }

  // Convert settings array to object
  const settingsMap = {};
  settings.forEach(s => {
    settingsMap[s.key] = parseInt(s.value);
  });

  const delays = [
    0, // Attempt 1 - no delay
    settingsMap.retry_attempt_2_delay || 5,
    settingsMap.retry_attempt_3_delay || 30,
    settingsMap.retry_attempt_4_delay || 120,
    settingsMap.retry_attempt_5_delay || 300,
    settingsMap.retry_attempt_6_delay || 300,
    settingsMap.retry_attempt_7_delay || 300
  ];

  console.log(`✅ ${LOG_TAG} Loaded retry settings:`, {
    delays,
    maxAttempts: settingsMap.max_retry_attempts || 7
  });

  return {
    delays,
    maxAttempts: settingsMap.max_retry_attempts || 7
  };
}

// Update task status in database
export async function updateTaskStatus(funnelId, taskId, status, errorMessage = null) {
  console.log(`📝 ${LOG_TAG} Updating task ${taskId} status to: ${status}`);

  const updates = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('generation_tasks')
    .update(updates)
    .eq('funnel_id', funnelId)
    .eq('task_id', taskId);

  if (error) {
    console.error(`❌ ${LOG_TAG} Error updating task status:`, error);
    throw error;
  }

  console.log(`✅ ${LOG_TAG} Task ${taskId} updated to ${status}`);
}

// Update attempt count
export async function updateTaskAttempt(funnelId, taskId, attemptCount) {
  console.log(`📝 ${LOG_TAG} Recording attempt ${attemptCount} for task ${taskId}`);

  const { error } = await supabase
    .from('generation_tasks')
    .update({
      attempt_count: attemptCount,
      last_attempt_at: new Date().toISOString()
    })
    .eq('funnel_id', funnelId)
    .eq('task_id', taskId);

  if (error) {
    console.error(`❌ ${LOG_TAG} Error updating attempt count:`, error);
  }
}

// Check if error should trigger immediate failure (no retry)
function shouldFailImmediately(error) {
  // Authentication errors - don't retry
  if (error.status === 401 || error.message?.includes('authentication')) {
    return true;
  }

  // Bad request errors - don't retry
  if (error.status === 400) {
    return true;
  }

  // Otherwise, retry
  return false;
}

// Main retry execution function
export async function executeWithRetry(funnelId, taskId, taskName, generateFn) {
  console.log(`🚀 ${LOG_TAG} Starting task ${taskId} (${taskName}) with retry logic`);

  // Load retry settings
  const { delays, maxAttempts } = await getRetrySettings();

  // Mark task as in_progress
  await updateTaskStatus(funnelId, taskId, 'in_progress');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 ${LOG_TAG} Attempt ${attempt}/${maxAttempts} for task ${taskId}`);

      // Wait before this attempt (0 for first attempt)
      if (attempt > 1) {
        const delaySeconds = delays[attempt - 1];
        console.log(`⏳ ${LOG_TAG} Waiting ${delaySeconds}s before retry...`);
        await sleep(delaySeconds * 1000);
      }

      // Record this attempt
      await updateTaskAttempt(funnelId, taskId, attempt);

      // Execute the generation function
      console.log(`▶️ ${LOG_TAG} Executing generation function for task ${taskId}...`);
      const result = await generateFn();

      // Success!
      console.log(`✅ ${LOG_TAG} Task ${taskId} completed successfully on attempt ${attempt}`);
      await updateTaskStatus(funnelId, taskId, 'completed');
      return result;

    } catch (error) {
      console.error(`❌ ${LOG_TAG} Attempt ${attempt} failed for task ${taskId}:`, error.message);

      // Check if we should fail immediately
      if (shouldFailImmediately(error)) {
        console.error(`🚫 ${LOG_TAG} Immediate failure - no retry for error: ${error.message}`);
        await updateTaskStatus(funnelId, taskId, 'failed', error.message);
        throw new Error(`Task ${taskId} failed immediately: ${error.message}`);
      }

      // If this was the last attempt, mark as failed
      if (attempt === maxAttempts) {
        const errorMsg = `Failed after ${maxAttempts} attempts: ${error.message}`;
        console.error(`🚫 ${LOG_TAG} ${errorMsg}`);
        await updateTaskStatus(funnelId, taskId, 'failed', errorMsg);
        throw new Error(errorMsg);
      }

      // Otherwise, log and continue to next attempt
      const nextDelay = delays[attempt]; // Next attempt's delay
      console.log(`🔄 ${LOG_TAG} Will retry in ${nextDelay}s (attempt ${attempt + 1}/${maxAttempts})`);
    }
  }

  // Should never reach here, but just in case
  throw new Error(`Task ${taskId} exhausted all retry attempts`);
}
