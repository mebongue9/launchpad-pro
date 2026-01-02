// /src/components/ui/Loading.jsx
// Loading spinner component for async operations
// Displays centered spinner with optional message
// RELEVANT FILES: src/pages/Dashboard.jsx, src/hooks/useAuth.js

import { Loader2 } from 'lucide-react'

export function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  )
}
