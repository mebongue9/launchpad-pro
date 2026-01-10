// /src/components/common/LanguageSelector.jsx
// Language dropdown with favorites at top
// Used in funnel creation to select output language for AI content
// RELEVANT FILES: src/lib/languages.js, src/pages/FunnelBuilder.jsx

import { ALL_LANGUAGES, DEFAULT_FAVORITE_LANGUAGES } from '../../lib/languages'

export default function LanguageSelector({
  value,
  onChange,
  favoriteLanguages = DEFAULT_FAVORITE_LANGUAGES,
  label = 'Output Language',
  className = ''
}) {
  // Get non-favorite languages (sorted alphabetically)
  const otherLanguages = ALL_LANGUAGES.filter(
    lang => !favoriteLanguages.includes(lang)
  )

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        value={value || 'English'}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full max-w-xs
          px-3 py-2
          border border-gray-300 rounded-lg
          bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          text-gray-900
        "
      >
        {/* Favorites section */}
        <optgroup label="Favorites">
          {favoriteLanguages.map(lang => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </optgroup>

        {/* All other languages */}
        <optgroup label="All Languages">
          {otherLanguages.map(lang => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </optgroup>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        All AI-generated content will be in this language
      </p>
    </div>
  )
}
