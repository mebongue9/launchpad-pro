// /src/lib/utils.js
// Helper utility functions used throughout the app
// Contains formatting, validation, and common operations
// RELEVANT FILES: src/components/profiles/ProfileForm.jsx, src/components/audiences/AudienceForm.jsx

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function truncate(str, length = 50) {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}
