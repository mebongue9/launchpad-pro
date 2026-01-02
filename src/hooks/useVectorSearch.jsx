// /src/hooks/useVectorSearch.jsx
// Hook for semantic search against knowledge base
// Returns relevant content chunks for AI context
// RELEVANT FILES: netlify/functions/vector-search.js, src/hooks/useFunnels.jsx

import { useState, useCallback } from 'react'

export function useVectorSearch() {
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)

  const searchKnowledge = useCallback(async (query, options = {}) => {
    const { limit = 10, threshold = 0.65 } = options

    setSearching(true)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/vector-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit, threshold })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      return data.results || []
    } catch (err) {
      setError(err.message)
      console.error('Vector search error:', err)
      return []
    } finally {
      setSearching(false)
    }
  }, [])

  // Helper to format results for AI context
  const getContextForPrompt = useCallback(async (topic, maxChunks = 5) => {
    const results = await searchKnowledge(topic, { limit: maxChunks, threshold: 0.6 })

    if (results.length === 0) {
      return ''
    }

    const context = results
      .map((r, i) => `[Source ${i + 1}]:\n${r.content}`)
      .join('\n\n---\n\n')

    return `\n\n=== RELEVANT KNOWLEDGE FROM THE CREATOR'S CONTENT ===\n${context}\n=== END KNOWLEDGE ===\n\nUse the above knowledge to inform your response. Match the creator's voice, terminology, and teaching style.`
  }, [searchKnowledge])

  return {
    searchKnowledge,
    getContextForPrompt,
    searching,
    error
  }
}
