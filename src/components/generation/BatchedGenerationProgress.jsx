// src/components/generation/BatchedGenerationProgress.jsx
// Progress display for batched generation (14 tasks)
// Shows task-based progress instead of chapter-based
// RELEVANT FILES: src/hooks/useBatchedGeneration.jsx, lib/task-orchestrator.js

import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export default function BatchedGenerationProgress({ progress, isGenerating }) {
  if (!isGenerating && progress.completed === 0) {
    return null;
  }

  const { total, completed, inProgress, failed, pending, percentage } = progress;

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {completed === total ? 'Generation Complete!' : 'Generating Funnel Content'}
        </h3>
        {isGenerating && (
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        )}
        {completed === total && (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              failed > 0
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : completed === total
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 font-medium">
            {completed} of {total} tasks completed
          </span>
          <span className="text-gray-600">{percentage}%</span>
        </div>
      </div>

      {/* Task Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-lg font-bold text-green-600">{completed}</p>
          </div>
        </div>

        {inProgress > 0 && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <div>
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="text-lg font-bold text-blue-600">{inProgress}</p>
            </div>
          </div>
        )}

        {failed > 0 && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <XCircle className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-xs text-gray-500">Failed</p>
              <p className="text-lg font-bold text-red-600">{failed}</p>
            </div>
          </div>
        )}

        {pending > 0 && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-gray-600">{pending}</p>
            </div>
          </div>
        )}
      </div>

      {/* Automatic Retry Notice */}
      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
          <RefreshCw className="w-4 h-4" />
          <span>Automatic retry enabled - up to 7 attempts per task</span>
        </div>
      )}

      {/* Completion Message */}
      {completed === total && (
        <div className="text-center py-2">
          <p className="text-green-700 font-medium">
            All content generated successfully! You can now review and customize your funnel.
          </p>
        </div>
      )}
    </div>
  );
}
