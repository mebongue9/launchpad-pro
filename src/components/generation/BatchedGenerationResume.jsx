// src/components/generation/BatchedGenerationResume.jsx
// Resume button for interrupted batched generation
// Shows when funnel has incomplete generation tasks
// RELEVANT FILES: src/hooks/useBatchedGeneration.jsx

import { PlayCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export default function BatchedGenerationResume({ progress, onResume, loading }) {
  if (!progress || progress.completed === 0 || progress.completed === progress.total) {
    return null;
  }

  const { completed, failed, total } = progress;

  return (
    <Card className="bg-amber-50 border-amber-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">
            Generation Incomplete
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Your funnel generation was interrupted. {completed} of {total} tasks completed.
            {failed > 0 && ` ${failed} task${failed > 1 ? 's' : ''} failed and will be retried.`}
          </p>
          <p className="text-sm text-amber-600 mt-2">
            Your progress has been saved. Click below to continue where you left off.
          </p>
          <Button
            onClick={onResume}
            disabled={loading}
            className="mt-4"
            variant="primary"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Resuming...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Resume Generation
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
