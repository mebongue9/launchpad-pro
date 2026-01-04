// /src/components/settings/FavoriteLanguagesManager.jsx
// Allows users to manage their favorite languages for quick selection
// RELEVANT FILES: src/lib/languages.js, src/pages/Settings.jsx, src/hooks/useProfiles.jsx

import { useState } from 'react'
import { ALL_LANGUAGES, DEFAULT_FAVORITE_LANGUAGES } from '../../lib/languages'

export default function FavoriteLanguagesManager({
  favorites = DEFAULT_FAVORITE_LANGUAGES,
  onUpdate,
  loading = false
}) {
  const [selectedToAdd, setSelectedToAdd] = useState('')

  // Languages not already in favorites
  const availableToAdd = ALL_LANGUAGES.filter(
    lang => !favorites.includes(lang)
  )

  const handleAddLanguage = () => {
    if (selectedToAdd && !favorites.includes(selectedToAdd)) {
      const newFavorites = [...favorites, selectedToAdd]
      onUpdate(newFavorites)
      setSelectedToAdd('')
    }
  }

  const handleRemoveLanguage = (lang) => {
    if (favorites.length > 1) {
      const newFavorites = favorites.filter(l => l !== lang)
      onUpdate(newFavorites)
    }
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const newFavorites = [...favorites]
    ;[newFavorites[index - 1], newFavorites[index]] = [newFavorites[index], newFavorites[index - 1]]
    onUpdate(newFavorites)
  }

  const handleMoveDown = (index) => {
    if (index === favorites.length - 1) return
    const newFavorites = [...favorites]
    ;[newFavorites[index], newFavorites[index + 1]] = [newFavorites[index + 1], newFavorites[index]]
    onUpdate(newFavorites)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Favorite Languages
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        These languages appear at the top of the language selector for quick access.
      </p>

      {/* Current favorites list */}
      <div className="space-y-2 mb-4">
        {favorites.map((lang, index) => (
          <div
            key={lang}
            className="
              flex items-center justify-between
              px-3 py-2
              bg-gray-50 rounded-lg
              border border-gray-200
            "
          >
            <span className="text-gray-900">{lang}</span>
            <div className="flex items-center gap-2">
              {/* Move up */}
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0 || loading}
                className="
                  p-1 text-gray-400 hover:text-gray-600
                  disabled:opacity-30 disabled:cursor-not-allowed
                "
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              {/* Move down */}
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === favorites.length - 1 || loading}
                className="
                  p-1 text-gray-400 hover:text-gray-600
                  disabled:opacity-30 disabled:cursor-not-allowed
                "
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Remove */}
              <button
                onClick={() => handleRemoveLanguage(lang)}
                disabled={favorites.length <= 1 || loading}
                className="
                  p-1 text-red-400 hover:text-red-600
                  disabled:opacity-30 disabled:cursor-not-allowed
                "
                title="Remove from favorites"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new favorite */}
      {availableToAdd.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            disabled={loading}
            className="
              flex-1
              px-3 py-2
              border border-gray-300 rounded-lg
              bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50
            "
          >
            <option value="">Select a language to add...</option>
            {availableToAdd.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button
            onClick={handleAddLanguage}
            disabled={!selectedToAdd || loading}
            className="
              px-4 py-2
              bg-blue-600 text-white rounded-lg
              hover:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
