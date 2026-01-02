// /src/components/profiles/ProfileCard.jsx
// Single profile display card with edit/delete actions
// Shows profile name, niche, and branding
// RELEVANT FILES: src/components/profiles/ProfileList.jsx, src/hooks/useProfiles.js

import { Pencil, Trash2, User } from 'lucide-react'
import { Card } from '../ui/Card'

export function ProfileCard({ profile, onEdit, onDelete }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {profile.photo_url ? (
          <img
            src={profile.photo_url}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {profile.name}
          </h3>
          {profile.business_name && (
            <p className="text-sm text-gray-500 truncate">
              {profile.business_name}
            </p>
          )}
          {profile.niche && (
            <p className="text-sm text-blue-600 mt-1">
              {profile.niche}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(profile)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(profile.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {profile.tagline && (
        <p className="mt-3 text-sm text-gray-600 italic">
          "{profile.tagline}"
        </p>
      )}

      {profile.income_method && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Income method: </span>
          <span className="text-xs text-gray-700">{profile.income_method}</span>
        </div>
      )}
    </Card>
  )
}
