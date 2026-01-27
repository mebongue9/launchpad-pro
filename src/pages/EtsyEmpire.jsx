// /src/pages/EtsyEmpire.jsx
// Etsy Empire - Automated visual content factory
// Generates Etsy listing mockups and Pinterest pins from PDF products
// RELEVANT FILES: src/hooks/useEtsyEmpire.js, src/components/etsy-empire/*.jsx

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useEtsyEmpire } from '../hooks/useEtsyEmpire'
import { useFunnels } from '../hooks/useFunnels'
import { useToast } from '../components/ui/Toast'
import { ProjectList } from '../components/etsy-empire/ProjectList'
import { NewProjectModal } from '../components/etsy-empire/NewProjectModal'
import {
  Crown,
  Plus,
  Filter,
  Loader2,
  Trash2
} from 'lucide-react'

// Filter options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
]

const DATE_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' }
]

export default function EtsyEmpire() {
  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    getProject,
    pollForResult,
    deleteProject,
    uploadPdf
  } = useEtsyEmpire()
  const { funnels } = useFunnels()
  const { addToast } = useToast()

  // Modal state
  const [showNewModal, setShowNewModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filter state
  const [funnelFilter, setFunnelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Expanded project state
  const [expandedProject, setExpandedProject] = useState(null)
  const [projectDetails, setProjectDetails] = useState(null)
  const [pollingProject, setPollingProject] = useState(null)

  // Delete confirmation state
  const [deletingProject, setDeletingProject] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Build funnel options for filter dropdown
  const funnelOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Funnels' }]
    const uniqueFunnels = new Map()

    // Add funnels from projects
    projects.forEach(p => {
      if (p.funnel_id && p.funnels?.name && !uniqueFunnels.has(p.funnel_id)) {
        uniqueFunnels.set(p.funnel_id, p.funnels.name)
      }
    })

    // Add funnels from hook
    funnels.forEach(f => {
      if (!uniqueFunnels.has(f.id)) {
        uniqueFunnels.set(f.id, f.name)
      }
    })

    uniqueFunnels.forEach((name, id) => {
      options.push({ value: id, label: name })
    })

    options.push({ value: 'standalone', label: '(standalone)' })

    return options
  }, [projects, funnels])

  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = [...projects]

    // Funnel filter
    if (funnelFilter) {
      if (funnelFilter === 'standalone') {
        result = result.filter(p => !p.funnel_id)
      } else {
        result = result.filter(p => p.funnel_id === funnelFilter)
      }
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(p => p.status === statusFilter)
    }

    // Date filter
    if (dateFilter) {
      const days = parseInt(dateFilter)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      result = result.filter(p => new Date(p.created_at) >= cutoff)
    }

    return result
  }, [projects, funnelFilter, statusFilter, dateFilter])

  // Handle project expansion
  const handleExpand = useCallback(async (projectId) => {
    if (!projectId) {
      setExpandedProject(null)
      setProjectDetails(null)
      return
    }

    setExpandedProject(projectId)
    setProjectDetails(null)

    try {
      const details = await getProject(projectId)
      setProjectDetails(details)

      // If processing, start polling
      if (details.status === 'processing' || details.status === 'pending') {
        setPollingProject(projectId)
        pollForResult(projectId, (update) => {
          setProjectDetails(update)
          if (update.status === 'completed' || update.status === 'failed') {
            setPollingProject(null)
          }
        }).catch(err => {
          console.error('Polling error:', err)
          setPollingProject(null)
        })
      }
    } catch (err) {
      addToast('Failed to load project details', 'error')
    }
  }, [getProject, pollForResult, addToast])

  // Handle new project submission
  const handleCreateProject = async (data) => {
    setSubmitting(true)
    try {
      const result = await createProject(data)
      addToast('Generation started! This may take a few minutes.', 'success')
      setShowNewModal(false)

      // Expand the new project to show progress
      if (result.project_id) {
        handleExpand(result.project_id)
      }
    } catch (err) {
      addToast(err.message || 'Failed to start generation', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle project deletion
  const handleDelete = async () => {
    if (!deletingProject) return

    setDeleteLoading(true)
    try {
      await deleteProject(deletingProject.id)
      addToast('Project deleted', 'success')
      setDeletingProject(null)
      if (expandedProject === deletingProject.id) {
        setExpandedProject(null)
        setProjectDetails(null)
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete project', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle project retry
  const handleRetry = async (project) => {
    // Re-create with same data
    setSubmitting(true)
    try {
      const data = {
        pdf_url: project.pdf_url,
        product_title: project.product_title,
        tldr_text: project.tldr_text,
        secondary_benefits: project.secondary_benefits || [],
        funnel_id: project.funnel_id,
        product_type: project.product_type,
        pinterest_enabled: project.pinterest_enabled,
        manifestable_ratio: project.manifestable_ratio
      }
      const result = await createProject(data)
      addToast('Retry started!', 'success')
      if (result.project_id) {
        handleExpand(result.project_id)
      }
    } catch (err) {
      addToast(err.message || 'Failed to retry', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etsy Empire</h1>
          <p className="text-gray-500 mt-1">
            Generate Etsy listing mockups and Pinterest pins from your PDF products
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Generation
        </Button>
      </div>

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />

          {/* Funnel Filter */}
          <select
            value={funnelFilter}
            onChange={(e) => setFunnelFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {funnelOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {DATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(funnelFilter || statusFilter || dateFilter) && (
            <button
              onClick={() => {
                setFunnelFilter('')
                setStatusFilter('')
                setDateFilter('')
              }}
              className="text-sm text-purple-600 hover:underline"
            >
              Clear filters
            </button>
          )}

          {/* Results count */}
          <span className="ml-auto text-sm text-gray-500">
            {filteredProjects.length} of {projects.length} projects
          </span>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
          <Button variant="secondary" onClick={fetchProjects} className="mt-2">
            Retry
          </Button>
        </Card>
      )}

      {/* Project List */}
      <Card>
        <ProjectList
          projects={filteredProjects}
          loading={loading}
          expandedProject={expandedProject}
          projectDetails={projectDetails}
          onExpand={handleExpand}
          onDelete={setDeletingProject}
          onRetry={handleRetry}
        />
      </Card>

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Projects Yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Create your first Etsy Empire project to generate beautiful
            listing mockups and Pinterest pins from your PDF products.
          </p>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Project
          </Button>
        </Card>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateProject}
        funnels={funnels}
        uploadPdf={uploadPdf}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deletingProject.product_title}</strong>"?
              All generated images will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeletingProject(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
