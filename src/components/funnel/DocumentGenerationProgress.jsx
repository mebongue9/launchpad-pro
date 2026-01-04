// /src/components/funnel/DocumentGenerationProgress.jsx
// Shows progress bar and status for document generation (TLDRs, cross-promos)
// Displays after user saves a funnel
// RELEVANT FILES: src/hooks/useFunnels.jsx, src/pages/FunnelBuilder.jsx

import { FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function DocumentGenerationProgress({ job }) {
  if (!job) return null

  const { status, progress, currentTask, completedChunks, totalChunks } = job

  // Status-based styling
  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
        return {
          bgColor: 'bg-green-50 border-green-200',
          progressColor: 'bg-green-500',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: 'Documents Generated!',
          textColor: 'text-green-700'
        }
      case 'failed':
        return {
          bgColor: 'bg-red-50 border-red-200',
          progressColor: 'bg-red-500',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          title: 'Generation Failed',
          textColor: 'text-red-700'
        }
      default:
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          progressColor: 'bg-blue-500',
          icon: <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
          title: 'Generating Documents...',
          textColor: 'text-blue-700'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`
      rounded-lg border p-4 mb-4
      ${config.bgColor}
      transition-all duration-300
    `}>
      <div className="flex items-center gap-3 mb-3">
        {config.icon}
        <div className="flex-1">
          <h4 className={`font-medium ${config.textColor}`}>
            {config.title}
          </h4>
          <p className="text-sm text-gray-600">
            {currentTask}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${config.textColor}`}>
            {progress}%
          </span>
          <p className="text-xs text-gray-500">
            {completedChunks}/{totalChunks} tasks
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${config.progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task list (optional - shows what's being generated) */}
      {status !== 'complete' && status !== 'failed' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <TaskBadge label="TLDRs" done={completedChunks >= 4} current={completedChunks < 4} />
          <TaskBadge label="Cross-promos" done={completedChunks >= 7} current={completedChunks >= 4 && completedChunks < 7} />
        </div>
      )}
    </div>
  )
}

function TaskBadge({ label, done, current }) {
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        {label}
      </span>
    )
  }

  if (current) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
        <Loader2 className="w-3 h-3 animate-spin" />
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
      <FileText className="w-3 h-3" />
      {label}
    </span>
  )
}
