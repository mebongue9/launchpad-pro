// /src/components/etsy-empire/ProjectProgress.jsx
// Progress bar showing generation progress
// Shows "X of Y images" with visual progress bar
// RELEVANT FILES: src/pages/EtsyEmpire.jsx, src/hooks/useEtsyEmpire.js

import { Loader2 } from 'lucide-react'

export function ProjectProgress({ project }) {
  const { completed_tasks = 0, total_tasks = 0, status } = project || {}
  const percentage = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0

  const statusMessages = {
    pending: 'Queued for processing...',
    processing: `Generating image ${completed_tasks + 1} of ${total_tasks}...`,
    completed: 'Generation complete!',
    failed: 'Generation failed'
  }

  return (
    <div className="space-y-3">
      {/* Status message */}
      <div className="flex items-center gap-2">
        {status === 'processing' && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        )}
        <span className={`text-sm font-medium ${
          status === 'completed' ? 'text-green-600' :
          status === 'failed' ? 'text-red-600' :
          'text-blue-600'
        }`}>
          {statusMessages[status] || 'Processing...'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'completed' ? 'bg-green-500' :
              status === 'failed' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{completed_tasks} of {total_tasks} images</span>
        <span>{percentage}%</span>
      </div>

      {/* Estimated time (for processing status) */}
      {status === 'processing' && total_tasks > 0 && (
        <p className="text-xs text-gray-400">
          Estimated time remaining: ~{Math.ceil((total_tasks - completed_tasks) * 3 / 60)} min
        </p>
      )}

      {/* Error message */}
      {status === 'failed' && project.last_error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{project.last_error}</p>
        </div>
      )}
    </div>
  )
}
