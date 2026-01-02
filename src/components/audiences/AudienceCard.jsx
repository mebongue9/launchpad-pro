// /src/components/audiences/AudienceCard.jsx
// Single audience display card with edit/delete actions
// Shows audience name, description, and pain points
// RELEVANT FILES: src/components/audiences/AudienceList.jsx, src/hooks/useAudiences.js

import { Pencil, Trash2, Users } from 'lucide-react'
import { Card } from '../ui/Card'

export function AudienceCard({ audience, onEdit, onDelete }) {
  const painPoints = audience.pain_points || []
  const desires = audience.desires || []

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {audience.name}
            </h3>
            {audience.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {audience.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(audience)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(audience.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {painPoints.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Pain Points</p>
          <div className="flex flex-wrap gap-1">
            {painPoints.slice(0, 3).map((point, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded"
              >
                {point}
              </span>
            ))}
            {painPoints.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                +{painPoints.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {desires.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Desires</p>
          <div className="flex flex-wrap gap-1">
            {desires.slice(0, 3).map((desire, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded"
              >
                {desire}
              </span>
            ))}
            {desires.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                +{desires.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
