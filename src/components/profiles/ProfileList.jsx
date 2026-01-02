// /src/components/profiles/ProfileList.jsx
// Displays all user profiles in a grid
// Shows empty state when no profiles exist
// RELEVANT FILES: src/hooks/useProfiles.js, src/pages/Profiles.jsx, src/components/profiles/ProfileCard.jsx

import { ProfileCard } from './ProfileCard'
import { Loading } from '../ui/Loading'
import { User, Plus } from 'lucide-react'

export function ProfileList({ profiles, loading, error, onEdit, onDelete, onCreate }) {
  if (loading) {
    return <Loading message="Loading profiles..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first profile to personalize your funnels and lead magnets.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Your First Profile
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
