// src/components/generation/BatchedGenerationError.jsx
// Error display for batched generation with retry capability
// Shows when all 7 retry attempts fail for a task
// RELEVANT FILES: src/hooks/useBatchedGeneration.jsx, lib/retry-engine.js

import { XCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export default function BatchedGenerationError({
  error,
  progress,
  onRetry,
  onDismiss,
  retrying
}) {
  if (!error) return null;

  const { completed, failed, total } = progress || {};

  return (
    <Card className="bg-red-50 border-red-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-900">
                Generation Failed
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {progress && (
            <div className="mt-3 p-3 bg-red-100 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                Progress: {completed} of {total} tasks completed
              </p>
              {failed > 0 && (
                <p className="text-sm text-red-700 mt-1">
                  {failed} task{failed > 1 ? 's' : ''} failed after maximum retry attempts (7 attempts per task)
                </p>
              )}
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="text-sm text-red-600">
              <p className="font-medium">What you can do:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-red-700">
                <li>Click "Try Again" to retry the failed tasks</li>
                <li>Check your internet connection</li>
                <li>Your progress has been saved - no work is lost</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onRetry}
                disabled={retrying}
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
              >
                {retrying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
              {onDismiss && (
                <Button variant="secondary" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
