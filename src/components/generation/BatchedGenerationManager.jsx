// src/components/generation/BatchedGenerationManager.jsx
// All-in-one wrapper for batched generation UI
// Combines progress, resume, and error handling
// RELEVANT FILES: src/hooks/useBatchedGeneration.jsx

import { useEffect, useState } from 'react';
import { useBatchedGeneration } from '../../hooks/useBatchedGeneration';
import BatchedGenerationProgress from './BatchedGenerationProgress';
import BatchedGenerationResume from './BatchedGenerationResume';
import BatchedGenerationError from './BatchedGenerationError';

export default function BatchedGenerationManager({ funnelId, onComplete, autoStart = false }) {
  const {
    isGenerating,
    progress,
    error,
    canResume,
    startGeneration,
    resumeGeneration,
    retryFailedTask,
    checkGenerationStatus
  } = useBatchedGeneration();

  const [showError, setShowError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [resumeStatus, setResumeStatus] = useState(null);

  // Check generation status on mount
  useEffect(() => {
    if (funnelId) {
      checkGenerationStatus(funnelId).then(status => {
        setResumeStatus(status);
      });
    }
  }, [funnelId, checkGenerationStatus]);

  // Auto-start if requested and not already complete
  useEffect(() => {
    if (autoStart && funnelId && resumeStatus?.status === 'not_started') {
      handleStart();
    }
  }, [autoStart, funnelId, resumeStatus]);

  // Show error when generation fails
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // Call onComplete when generation finishes
  useEffect(() => {
    if (progress.completed === progress.total && progress.total > 0) {
      if (onComplete) {
        onComplete();
      }
    }
  }, [progress, onComplete]);

  async function handleStart() {
    try {
      await startGeneration(funnelId);
    } catch (err) {
      console.error('Start generation error:', err);
    }
  }

  async function handleResume() {
    setRetrying(true);
    setShowError(false);
    try {
      await resumeGeneration(funnelId);
    } catch (err) {
      console.error('Resume generation error:', err);
    } finally {
      setRetrying(false);
    }
  }

  async function handleRetry() {
    setRetrying(true);
    setShowError(false);
    try {
      // Resume will retry failed tasks
      await resumeGeneration(funnelId);
    } catch (err) {
      console.error('Retry error:', err);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Resume Button (if interrupted) */}
      {canResume && !isGenerating && !showError && resumeStatus?.status === 'interrupted' && (
        <BatchedGenerationResume
          progress={resumeStatus.progress}
          onResume={handleResume}
          loading={retrying}
        />
      )}

      {/* Error Display */}
      {showError && error && (
        <BatchedGenerationError
          error={error}
          progress={progress}
          onRetry={handleRetry}
          onDismiss={() => setShowError(false)}
          retrying={retrying}
        />
      )}

      {/* Progress Display */}
      {(isGenerating || progress.completed > 0) && (
        <BatchedGenerationProgress
          progress={progress}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
