// /src/components/etsy-empire/ProjectList.jsx
// Table of projects with status badges
// Click to expand and show details/progress/assets
// RELEVANT FILES: src/pages/EtsyEmpire.jsx, src/hooks/useEtsyEmpire.js

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Clock, Check, AlertCircle, Loader2, Trash2, RefreshCw } from 'lucide-react'
import { ProjectProgress } from './ProjectProgress'
import { AssetGallery } from './AssetGallery'
import { DownloadPanel } from './DownloadPanel'

// Status badge component
function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700'
  }

  const icons = {
    pending: <Clock className="w-3 h-3" />,
    processing: <Loader2 className="w-3 h-3 animate-spin" />,
    completed: <Check className="w-3 h-3" />,
    failed: <AlertCircle className="w-3 h-3" />
  }

  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
      {icons[status]}
      {labels[status] || status}
    </span>
  )
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectList({
  projects = [],
  onExpand,
  expandedProject,
  projectDetails,
  onDelete,
  onRetry,
  loading = false
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No projects yet. Click "+ New Generation" to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Funnel</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const isExpanded = expandedProject === project.id
            const details = isExpanded ? projectDetails : null

            return (
              <tr key={project.id} className="group">
                {/* Main row */}
                <td colSpan={5} className="p-0">
                  <div
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isExpanded ? 'bg-purple-50/50' : ''
                    }`}
                  >
                    {/* Clickable row content */}
                    <button
                      onClick={() => onExpand(isExpanded ? null : project.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center py-4 px-4">
                        {/* Product Name */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {project.product_title}
                          </p>
                          {project.tldr_text && (
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                              {project.tldr_text}
                            </p>
                          )}
                        </div>

                        {/* Funnel */}
                        <div className="w-32 px-4">
                          <span className="text-sm text-gray-600">
                            {project.funnels?.name || '(standalone)'}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="w-24 px-4">
                          <span className="text-sm text-gray-500">
                            {formatDate(project.created_at)}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="w-28 px-4">
                          <StatusBadge status={project.status} />
                        </div>

                        {/* Actions */}
                        <div className="w-24 px-4 flex items-center justify-end gap-2">
                          {project.status === 'failed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onRetry?.(project)
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Retry"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete?.(project)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="pt-4 space-y-6">
                          {/* Loading state */}
                          {!details && (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                            </div>
                          )}

                          {/* Pending/Processing state */}
                          {details && (details.status === 'pending' || details.status === 'processing') && (
                            <ProjectProgress project={details} />
                          )}

                          {/* Completed state */}
                          {details && details.status === 'completed' && (
                            <>
                              <AssetGallery
                                assets={details.assets || []}
                                pinterestEnabled={details.pinterest_enabled}
                              />
                              <DownloadPanel
                                project={details}
                                assets={details.assets || []}
                                spintax={details.spintax}
                              />
                            </>
                          )}

                          {/* Failed state */}
                          {details && details.status === 'failed' && (
                            <div className="space-y-4">
                              <ProjectProgress project={details} />
                              {details.completed_tasks > 0 && (
                                <>
                                  <p className="text-sm text-gray-500">
                                    Partial results ({details.completed_tasks} images generated before failure):
                                  </p>
                                  <AssetGallery
                                    assets={details.assets || []}
                                    pinterestEnabled={details.pinterest_enabled}
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
