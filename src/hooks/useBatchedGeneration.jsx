/**
 * @deprecated DO NOT USE THIS HOOK
 *
 * Created Jan 4-5, 2026 - fundamentally broken:
 * - Calls synchronous endpoint (generate-funnel-content-batched.js) that times out after 10-26 seconds
 * - Netlify functions have hard timeout limits, this cannot run 14 API calls (70-420+ seconds)
 * - Removed the 2-step workflow users need to review/regenerate lead magnet content
 *
 * USE INSTEAD:
 * - useLeadMagnetContentJob (for lead magnet content - 2 API calls)
 * - useFunnelRemainingContentJob (for remaining 12 funnel products)
 *
 * These hooks use the background function system with proper 15-minute timeout.
 *
 * This file will be deleted after confirming the fix works.
 */

// src/hooks/useBatchedGeneration.jsx
// Hook for batched generation system (14 tasks with automatic retry)
// Replaces old chapter-by-chapter with orchestrator-based generation
// RELEVANT FILES: netlify/functions/generate-funnel-content-batched.js, netlify/functions/check-generation-progress.js

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL = 3000; // Poll every 3 seconds

export function useBatchedGeneration() {
  const { user } = useAuth();
  const [funnelId, setFunnelId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({
    total: 14,
    completed: 0,
    inProgress: 0,
    failed: 0,
    pending: 14,
    percentage: 0
  });
  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState(null);
  const [canResume, setCanResume] = useState(false);

  const pollIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Check if funnel has incomplete generation tasks
  const checkGenerationStatus = useCallback(async (fId) => {
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from('generation_tasks')
        .select('task_id, status')
        .eq('funnel_id', fId);

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) {
        // No tasks yet - not started
        setCanResume(false);
        return { status: 'not_started', progress: null };
      }

      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const failed = tasks.filter(t => t.status === 'failed').length;

      const hasIncomplete = completed > 0 && completed < 14;
      const hasInProgress = inProgress > 0;
      const hasFailed = failed > 0;

      setCanResume(hasIncomplete || hasFailed);

      if (completed === 14) {
        return { status: 'completed', progress: { completed, inProgress, failed, pending: 0, total: 14, percentage: 100 } };
      } else if (hasInProgress) {
        return { status: 'in_progress', progress: { completed, inProgress, failed, pending: 14 - completed - inProgress - failed, total: 14, percentage: Math.round((completed / 14) * 100) } };
      } else if (hasFailed) {
        return { status: 'failed', progress: { completed, inProgress, failed, pending: 14 - completed - failed, total: 14, percentage: Math.round((completed / 14) * 100) } };
      } else if (completed > 0) {
        return { status: 'interrupted', progress: { completed, inProgress, failed, pending: 14 - completed, total: 14, percentage: Math.round((completed / 14) * 100) } };
      }

      return { status: 'not_started', progress: null };
    } catch (err) {
      console.error('[BATCHED-GEN] Error checking status:', err);
      return { status: 'error', progress: null };
    }
  }, []);

  // Poll progress from check-generation-progress endpoint
  const pollProgress = useCallback(async (fId) => {
    try {
      const response = await fetch(`/.netlify/functions/check-generation-progress?funnel_id=${fId}`);

      if (!response.ok) {
        throw new Error('Failed to check progress');
      }

      const data = await response.json();
      const progressData = data.progress;

      setProgress({
        total: progressData.total || 14,
        completed: progressData.completed || 0,
        inProgress: progressData.inProgress || 0,
        failed: progressData.failed || 0,
        pending: progressData.pending || 14,
        percentage: progressData.percentage || 0
      });

      // If generation is complete or failed, stop polling
      if (progressData.completed === 14 || progressData.failed > 0) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsGenerating(false);

        if (progressData.failed > 0) {
          setError('Generation failed on some tasks');
          setCanResume(true);
        } else {
          setError(null);
        }
      }

      return progressData;
    } catch (err) {
      console.error('[BATCHED-GEN] Poll error:', err);
      return null;
    }
  }, []);

  // Start batched generation - ALL 14 tasks (including lead magnet)
  const startGeneration = useCallback(async (fId) => {
    if (!user?.id) {
      throw new Error('User must be logged in');
    }

    setFunnelId(fId);
    setIsGenerating(true);
    setError(null);
    setProgress({
      total: 14,
      completed: 0,
      inProgress: 0,
      failed: 0,
      pending: 14,
      percentage: 0
    });

    // Clear existing poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    try {
      // Call batched generation endpoint - runs all 14 tasks including lead magnet
      const response = await fetch('/.netlify/functions/generate-funnel-content-batched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnel_id: fId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start generation');
      }

      // Start polling for progress
      pollIntervalRef.current = setInterval(() => {
        pollProgress(fId);
      }, POLL_INTERVAL);

      // Poll immediately
      await pollProgress(fId);

      return true;
    } catch (err) {
      console.error('[BATCHED-GEN] Start generation error:', err);
      setError(err.message);
      setIsGenerating(false);
      throw err;
    }
  }, [user, pollProgress]);

  // Resume interrupted generation
  const resumeGeneration = useCallback(async (fId) => {
    console.log('[BATCHED-GEN] Resuming generation for funnel:', fId);
    return startGeneration(fId);
  }, [startGeneration]);

  // Retry failed task
  const retryFailedTask = useCallback(async (fId, taskId) => {
    try {
      // Reset failed task to pending
      const { error: resetError } = await supabase
        .from('generation_tasks')
        .update({
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('funnel_id', fId)
        .eq('task_id', taskId);

      if (resetError) throw resetError;

      // Resume generation
      return resumeGeneration(fId);
    } catch (err) {
      console.error('[BATCHED-GEN] Retry failed task error:', err);
      throw err;
    }
  }, [resumeGeneration]);

  // Cancel generation (client-side only - stops polling)
  const cancelGeneration = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsGenerating(false);
    setFunnelId(null);
    setProgress({
      total: 14,
      completed: 0,
      inProgress: 0,
      failed: 0,
      pending: 14,
      percentage: 0
    });
    setError(null);
  }, []);

  return {
    funnelId,
    isGenerating,
    progress,
    currentTask,
    error,
    canResume,
    startGeneration,
    resumeGeneration,
    retryFailedTask,
    cancelGeneration,
    checkGenerationStatus
  };
}
