// /src/pages/Profiles.jsx
// Profile management page with list and create/edit modal
// Full CRUD functionality for user profiles
// RELEVANT FILES: src/hooks/useProfiles.js, src/components/profiles/ProfileList.jsx, src/components/profiles/ProfileForm.jsx

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProfiles } from '../hooks/useProfiles'
import { ProfileList } from '../components/profiles/ProfileList'
import { ProfileForm } from '../components/profiles/ProfileForm'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'

export default function Profiles() {
  const { profiles, loading, error, deleteProfile, fetchProfiles } = useProfiles()
  const { addToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)

  const handleCreate = () => {
    setEditingProfile(null)
    setModalOpen(true)
  }

  const handleEdit = (profile) => {
    setEditingProfile(profile)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return
    }

    try {
      await deleteProfile(id)
      addToast('Profile deleted successfully', 'success')
    } catch (err) {
      addToast('Failed to delete profile', 'error')
    }
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditingProfile(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
          <p className="text-gray-500 mt-1">
            Manage your business profiles and branding
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Profile
        </button>
      </div>

      <ProfileList
        profiles={profiles}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={editingProfile ? 'Edit Profile' : 'Create Profile'}
      >
        <ProfileForm
          profile={editingProfile}
          onClose={handleClose}
          onSuccess={fetchProfiles}
        />
      </Modal>
    </div>
  )
}
