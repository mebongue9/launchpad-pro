# Coding Conventions

**Analysis Date:** 2026-01-11

## Naming Patterns

**Files:**
- PascalCase.jsx for React components (`ProfileForm.jsx`, `Dashboard.jsx`)
- camelCase.jsx for hooks (`useAuth.jsx`, `useFunnels.jsx`)
- kebab-case.js for utilities and functions (`pdf-generator.js`, `admin-check.js`)
- *.test.js or *.spec.js for tests (`lead-magnet-test.spec.js`)

**Functions:**
- PascalCase for React components: `function ProfileForm({ ... }) { }`
- camelCase for regular functions: `function formatDate(dateString) { }`
- camelCase with `handle` prefix for handlers: `handleClick`, `handleSubmit`
- camelCase with `on` prefix for props: `onClose`, `onChange`

**Variables:**
- camelCase for variables: `const selectedProfile = ...`
- UPPER_SNAKE_CASE for constants: `const LOG_TAG = '[ADMIN-CHECK]'`
- camelCase for state: `const [loading, setLoading] = useState(false)`
- No underscore prefix for private members

**Types:**
- No TypeScript in this codebase (pure JavaScript/JSX)
- JSDoc comments for type documentation where needed

## Code Style

**Formatting:**
- 2-space indentation
- Single quotes for strings
- No semicolons (modern JavaScript style)
- Trailing commas in multiline objects/arrays

**Linting:**
- No ESLint or Prettier configuration files present
- Code style enforced by convention only

## Import Organization

**Order:**
1. React and library imports: `import { useState } from 'react'`
2. Local hooks: `import { useAuth } from './useAuth'`
3. Local components/utils: `import { supabase } from '../lib/supabase'`

**Grouping:**
- No blank lines between groups in most files
- Alphabetical ordering not enforced

**Path Aliases:**
- No path aliases configured (relative imports only)
- Use `../` for parent directory navigation

## Error Handling

**Patterns:**
- Try-catch blocks around async operations
- Return structured error objects: `{ statusCode: 500, body: JSON.stringify({ error: message }) }`
- Console logging with context: `console.error(\`${LOG_TAG} Error:\`, error)`

**Error Types:**
- Throw on invalid input in backend functions
- Return early with error response (no exceptions for expected failures)
- Log error with context before returning

## Logging

**Framework:**
- `console.log()` and `console.error()` (no external logger)

**Patterns:**
- Backend: Emoji-prefixed logging: `console.log('🚀 [START-GENERATION] Function invoked')`
- Frontend: Standard console.log without prefixes
- Log at function boundaries (start, end, errors)

**Tags:**
- Bracketed uppercase tags: `[ADMIN-CHECK]`, `[START-GENERATION]`
- Common emojis: 🚀 (start), ✅ (success), ❌ (error), 📊 (metrics)

## Comments

**When to Comment:**
- Explain why, not what: `// Retry 3 times because API has transient failures`
- Document business rules: `// THE 6 APPROVED FORMATS - Data-proven from Maria Wendt's research`
- Mark deprecated code: `@deprecated DO NOT USE THIS HOOK`
- Reference related files: `// RELEVANT FILES: src/hooks/useProfiles.js`

**File Header Pattern:**
Every file begins with:
```javascript
// /path/to/file.js
// Brief description of purpose
// Additional context if needed
// RELEVANT FILES: related-file-1.js, related-file-2.js
```

**Section Dividers:**
- Long files use visual dividers: `// ============================================`
- Used in `src/lib/utils.js` to separate major functions

**TODO Comments:**
- Format: `// TODO: description`
- No username or issue linking convention

## Function Design

**Size:**
- Most functions under 50 lines
- Large utility files exist (`batched-generators.js` - 1,466 lines) but contain many small functions

**Parameters:**
- Destructure objects in parameter list: `function Component({ prop1, prop2 })`
- Use object for 4+ parameters
- Default values in parameter list: `function fn({ limit = 10 })`

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- Consistent error shape: `{ error: message }`

## Module Design

**Exports:**
- Named exports for utilities and hooks: `export function useAuth() { }`
- Default exports for page components: `export default function Dashboard() { }`
- Named exports for UI components: `export function Button({ }) { }`

**Barrel Files:**
- `src/templates/formats/index.jsx` re-exports all format templates
- `src/styles/templates/index.js` re-exports all style templates
- No index.js barrel files for components (import directly)

## React Patterns

**Component Structure:**
```javascript
// Imports
import { useState } from 'react'

// Component
export function ComponentName({ props }) {
  // Hooks
  const [state, setState] = useState()

  // Handlers
  const handleAction = () => { }

  // Render
  return (
    <div>...</div>
  )
}
```

**Hooks:**
- Custom hooks start with `use`: `useAuth`, `useFunnels`
- Hooks file exports single hook function
- Hooks return objects: `{ data, loading, error, actions }`

**State Management:**
- Local state via `useState`
- No Redux or Zustand (Supabase is source of truth)
- Custom hooks encapsulate data fetching

---

*Convention analysis: 2026-01-11*
*Update when patterns change*
