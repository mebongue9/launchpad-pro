// /src/pages/Audiences.jsx
// Audience management page with list and create/edit modal
// Full CRUD functionality for target audiences
// RELEVANT FILES: src/hooks/useAudiences.js, src/components/audiences/AudienceList.jsx, src/components/audiences/AudienceForm.jsx

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAudiences } from '../hooks/useAudiences'
import { AudienceList } from '../components/audiences/AudienceList'
import { AudienceForm } from '../components/audiences/AudienceForm'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'

export default function Audiences() {
  const { audiences, loading, error, deleteAudience, fetchAudiences } = useAudiences()
  const { addToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAudience, setEditingAudience] = useState(null)

  const handleCreate = () => {
    setEditingAudience(null)
    setModalOpen(true)
  }

  const handleEdit = (audience) => {
    setEditingAudience(audience)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this audience?')) {
      return
    }

    try {
      await deleteAudience(id)
      addToast('Audience deleted successfully', 'success')
    } catch (err) {
      addToast('Failed to delete audience', 'error')
    }
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditingAudience(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audiences</h1>
          <p className="text-gray-500 mt-1">
            Define your target audiences and their pain points
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Audience
        </button>
      </div>

      <AudienceList
        audiences={audiences}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingAudience ? 'Edit Audience' : 'Define Audience'}
      >
        <AudienceForm
          audience={editingAudience}
          onClose={handleClose}
          onSuccess={fetchAudiences}
        />
      </Modal>
    </div>
  )
}
