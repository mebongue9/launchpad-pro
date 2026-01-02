// /src/components/audiences/AudienceList.jsx
// Displays all user audiences in a grid
// Shows empty state when no audiences exist
// RELEVANT FILES: src/hooks/useAudiences.js, src/pages/Audiences.jsx, src/components/audiences/AudienceCard.jsx

import { AudienceCard } from './AudienceCard'
import { Loading } from '../ui/Loading'
import { Users, Plus } from 'lucide-react'

export function AudienceList({ audiences, loading, error, onEdit, onDelete, onCreate }) {
  if (loading) {
    return <Loading message="Loading audiences..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (audiences.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No audiences yet</h3>
        <p className="text-gray-500 mb-4">
          Define your target audiences to create personalized funnels and lead magnets.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Define Your First Audience
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {audiences.map((audience) => (
        <AudienceCard
          key={audience.id}
          audience={audience}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
