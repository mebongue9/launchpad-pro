// /src/components/funnel/FunnelFilters.jsx
// Filter component for funnel list with search, dropdowns, and date range
// Provides filtering by profile, audience, product, status, and date
// RELEVANT FILES: src/pages/FunnelBuilder.jsx, src/components/funnel/FunnelCard.jsx

import { Search, X, Filter, LayoutGrid, List, ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'content_generated', label: 'In Progress' },
  { value: 'complete', label: 'Complete' }
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'alpha_asc', label: 'A to Z' },
  { value: 'alpha_desc', label: 'Z to A' },
  { value: 'updated', label: 'Recently Updated' }
]

export default function FunnelFilters({
  filters,
  onFilterChange,
  profiles = [],
  audiences = [],
  existingProducts = [],
  viewMode = 'list',
  onViewModeChange,
  sortBy = 'newest',
  onSortChange
}) {
  const hasActiveFilters = filters.search || filters.profileId || filters.audienceId ||
    filters.productId || filters.status || filters.dateFrom || filters.dateTo

  function clearAllFilters() {
    onFilterChange({
      search: '',
      profileId: '',
      audienceId: '',
      productId: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  function updateFilter(key, value) {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Top row: Search, Sort, View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search funnels..."
            className="
              w-full pl-10 pr-4 py-2
              border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-sm
            "
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="
              appearance-none pl-3 pr-10 py-2
              border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-sm bg-white cursor-pointer
            "
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange?.('list')}
            className={`
              p-2 rounded-md transition-colors
              ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}
            `}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange?.('grid')}
            className={`
              p-2 rounded-md transition-colors
              ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}
            `}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-gray-500 mr-2">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Profile filter */}
        <select
          value={filters.profileId || ''}
          onChange={(e) => updateFilter('profileId', e.target.value)}
          className="
            text-sm px-3 py-1.5
            border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-white
          "
        >
          <option value="">All Profiles</option>
          {profiles.map(profile => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>

        {/* Audience filter */}
        <select
          value={filters.audienceId || ''}
          onChange={(e) => updateFilter('audienceId', e.target.value)}
          className="
            text-sm px-3 py-1.5
            border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-white
          "
        >
          <option value="">All Audiences</option>
          {audiences.map(audience => (
            <option key={audience.id} value={audience.id}>
              {audience.name}
            </option>
          ))}
        </select>

        {/* Product filter */}
        <select
          value={filters.productId || ''}
          onChange={(e) => updateFilter('productId', e.target.value)}
          className="
            text-sm px-3 py-1.5
            border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-white
          "
        >
          <option value="">All Products</option>
          {existingProducts.map(product => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="
            text-sm px-3 py-1.5
            border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-white
          "
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="
              text-sm px-2 py-1.5
              border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
            placeholder="From"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="
              text-sm px-2 py-1.5
              border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
            placeholder="To"
          />
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="
              text-sm px-3 py-1.5
              text-red-600 hover:bg-red-50
              rounded-lg transition-colors
              flex items-center gap-1
            "
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// Quick stats component
export function FunnelStats({ funnels }) {
  const total = funnels.length
  const complete = funnels.filter(f => f.status === 'complete').length
  const inProgress = funnels.filter(f => f.status === 'content_generated').length
  const drafts = funnels.filter(f => f.status === 'draft').length

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="font-medium">{total} funnel{total !== 1 ? 's' : ''}</span>
      <span className="text-gray-300">•</span>
      <span className="text-green-600">{complete} complete</span>
      <span className="text-gray-300">•</span>
      <span className="text-blue-600">{inProgress} in progress</span>
      <span className="text-gray-300">•</span>
      <span className="text-gray-500">{drafts} draft{drafts !== 1 ? 's' : ''}</span>
    </div>
  )
}
