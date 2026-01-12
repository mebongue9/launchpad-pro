// /src/components/funnel/FunnelCard.jsx
// Reusable funnel card component with enhanced display
// Shows status, dates, profile, audience with visual differentiation
// RELEVANT FILES: src/pages/FunnelBuilder.jsx, src/hooks/useFunnels.jsx

import { Eye, Trash2, Calendar, User, Users, Package } from 'lucide-react'

// Color palette for audience badges (deterministic based on audience name)
const AUDIENCE_COLORS = [
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
]

// Get consistent color for audience based on name hash
function getAudienceColor(audienceName) {
  if (!audienceName) return AUDIENCE_COLORS[0]
  let hash = 0
  for (let i = 0; i < audienceName.length; i++) {
    hash = audienceName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AUDIENCE_COLORS[Math.abs(hash) % AUDIENCE_COLORS.length]
}

// Format date as "4 Jan 2026"
function formatDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Status border colors
// Workflow: draft → in_progress → ready → complete
const STATUS_BORDERS = {
  draft: 'border-l-gray-300',
  in_progress: 'border-l-yellow-500',
  ready: 'border-l-blue-500',
  complete: 'border-l-green-500'
}

// Status labels
const STATUS_LABELS = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
  in_progress: { label: 'In Progress', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ready: { label: 'Ready', bg: 'bg-blue-100', text: 'text-blue-700' },
  complete: { label: 'Complete', bg: 'bg-green-100', text: 'text-green-700' }
}

export default function FunnelCard({ funnel, viewMode = 'list', onView, onDelete }) {
  const audienceColor = getAudienceColor(funnel.audiences?.name)
  const statusBorder = STATUS_BORDERS[funnel.status] || STATUS_BORDERS.draft
  const statusLabel = STATUS_LABELS[funnel.status] || STATUS_LABELS.draft

  const createdDate = formatDate(funnel.created_at)
  const updatedDate = formatDate(funnel.updated_at)

  // Grid view - compact card
  if (viewMode === 'grid') {
    return (
      <div className={`
        bg-white rounded-lg border border-gray-200 p-4
        border-l-4 ${statusBorder}
        hover:shadow-md transition-shadow cursor-pointer
      `}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{funnel.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabel.bg} ${statusLabel.text} flex-shrink-0 ml-2`}>
            {statusLabel.label}
          </span>
        </div>

        {/* Audience badge */}
        {funnel.audiences?.name && (
          <span className={`
            inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full mb-3
            ${audienceColor.bg} ${audienceColor.text}
          `}>
            <Users className="w-3 h-3" />
            {funnel.audiences.name}
          </span>
        )}

        {/* Date */}
        <div className="text-xs text-gray-500 mb-3">
          {createdDate}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); onView?.(funnel); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(funnel); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // List view - detailed horizontal card
  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 p-4
      border-l-4 ${statusBorder}
      hover:shadow-md transition-shadow
    `}>
      <div className="flex items-start justify-between gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title and status */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{funnel.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabel.bg} ${statusLabel.text} flex-shrink-0`}>
              {statusLabel.label}
            </span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            {createdDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Created: {createdDate}
              </span>
            )}
            {updatedDate && updatedDate !== createdDate && (
              <span className="flex items-center gap-1">
                Updated: {updatedDate}
              </span>
            )}
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Profile */}
            {funnel.profiles?.name && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                <User className="w-3 h-3" />
                {funnel.profiles.name}
              </span>
            )}

            {/* Audience - colored badge */}
            {funnel.audiences?.name && (
              <span className={`
                inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
                ${audienceColor.bg} ${audienceColor.text}
              `}>
                <Users className="w-3 h-3" />
                {funnel.audiences.name}
              </span>
            )}

            {/* Existing Product */}
            {funnel.existing_products?.name && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                <Package className="w-3 h-3" />
                {funnel.existing_products.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onView?.(funnel)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            onClick={() => onDelete?.(funnel)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete funnel"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
