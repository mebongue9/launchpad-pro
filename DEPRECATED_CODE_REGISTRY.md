# Deprecated Code Registry

**Purpose:** Track deprecated code patterns that MUST NOT be used in production.
**Last Updated:** 2026-01-04
**Maintained By:** Development team (update when deprecating code)

---

## How to Use This Registry

### For Developers:
- ✅ Check this file before using any generation-related functions
- ✅ Search your code for deprecated patterns before committing
- ✅ Update this file when deprecating new code
- ✅ Run `code-execution-verifier` agent before deployment

### For Testers:
- The `code-execution-verifier` agent automatically reads this registry
- Violations are flagged in `CODE_VERSION_VIOLATIONS.md` report
- CRITICAL violations block deployment

### For Code Reviewers:
- Check PRs against this registry
- Reject PRs that introduce deprecated patterns
- Require proof that correct versions are being used

---

## Deprecated Endpoints

### ❌ `/.netlify/functions/generate-lead-magnet-content`

**Status:** DEPRECATED - DO NOT USE
**Replacement:** `/.netlify/functions/generate-lead-magnet-content-batched`
**Reason:** Makes 8+ sequential API calls instead of 2 batched calls
**Since:** 2026-01-04
**Severity:** 🔴 CRITICAL

**Impact:**
- Wastes API credits (4x more calls than needed)
- Slower generation time (sequential vs batched)
- Higher failure rate (more API calls = more chances to fail)

**Migration Path:**
```javascript
// ❌ OLD - DO NOT USE
const response = await fetch('/.netlify/functions/generate-lead-magnet-content', {
  method: 'POST',
  body: JSON.stringify({ lead_magnet, profile, audience, front_end })
})

// ✅ NEW - USE THIS
const response = await fetch('/.netlify/functions/generate-lead-magnet-content-batched', {
  method: 'POST',
  body: JSON.stringify({ lead_magnet, profile, audience, front_end })
})
```

---

### ❌ `/.netlify/functions/process-generation-background`

**Status:** DEPRECATED - DO NOT USE
**Replacement:** `/.netlify/functions/generate-funnel-content-batched`
**Reason:** Makes 51+ sequential calls instead of 14 batched tasks
**Since:** 2026-01-04
**Severity:** 🔴 CRITICAL

**Impact:**
- Extremely high API usage (51+ calls)
- High failure rate (~33% of generations fail)
- Wastes API credits significantly
- Slow generation (sequential processing)

**Migration Path:**
```javascript
// ❌ OLD - DO NOT USE (job-based background system)
const { error } = await supabase
  .from('generation_jobs')
  .insert({ job_type: 'funnel_content', ... })

// ✅ NEW - USE THIS (batched direct generation)
const response = await fetch('/.netlify/functions/generate-funnel-content-batched', {
  method: 'POST',
  body: JSON.stringify({ funnel, profile, audience })
})
```

---

## Deprecated Functions

### ❌ `useLeadMagnetContentJob()`

**File:** `src/hooks/useGenerationJob.jsx` (lines 340-358)
**Status:** DEPRECATED - DO NOT USE
**Replacement:** `useLeadMagnets.generateContent()`
**Reason:** Job-based system replaced with direct batched API calls
**Since:** 2026-01-04
**Severity:** 🟠 HIGH

**Impact:**
- Calls old endpoint that makes 8+ API calls
- Uses polling system (inefficient)
- Wastes API credits

**Migration Path:**
```javascript
// ❌ OLD - DO NOT USE
import { useLeadMagnetContentJob } from '../hooks/useGenerationJob'

function MyComponent() {
  const contentJob = useLeadMagnetContentJob()

  async function generate() {
    await contentJob.generateContent(idea, profile, audience, product)
  }
}

// ✅ NEW - USE THIS
import { useLeadMagnets } from '../hooks/useLeadMagnets'

function MyComponent() {
  const { generateContent } = useLeadMagnets()

  async function generate() {
    const result = await generateContent(idea, profile, audience, product)
    // Result is returned directly (no job polling needed)
  }
}
```

---

### ❌ `useFunnelContentJob()`

**File:** `src/hooks/useGenerationJob.jsx` (lines 360-378)
**Status:** DEPRECATED - DO NOT USE
**Replacement:** `useBatchedGeneration.startGeneration()`
**Reason:** Job-based system replaced with batched task system
**Since:** 2026-01-04
**Severity:** 🟠 HIGH

**Impact:**
- Calls old endpoint that makes 51+ API calls
- High failure rate (~33%)
- Wastes API credits significantly

**Migration Path:**
```javascript
// ❌ OLD - DO NOT USE
import { useFunnelContentJob } from '../hooks/useGenerationJob'

function MyComponent() {
  const funnelJob = useFunnelContentJob()

  async function generate() {
    await funnelJob.generateContent(funnel, profile, audience)
  }
}

// ✅ NEW - USE THIS
import { useBatchedGeneration } from '../hooks/useBatchedGeneration'

function MyComponent() {
  const { startGeneration } = useBatchedGeneration()

  async function generate() {
    await startGeneration(funnel, profile, audience)
    // Uses batched system with 14 tasks instead of 51+ calls
  }
}
```

---

## Deprecated Imports

### ❌ `import { useLeadMagnetContentJob } from '../hooks/useGenerationJob'`

**Status:** DEPRECATED - DO NOT USE
**Replacement:** `import { useLeadMagnets } from '../hooks/useLeadMagnets'`
**Usage:** `const { generateContent } = useLeadMagnets()`
**Reason:** Now using direct batched generation instead of job system
**Since:** 2026-01-04
**Severity:** 🟠 HIGH

**Migration:**
```javascript
// ❌ OLD - Remove this import
import { useLeadMagnetContentJob } from '../hooks/useGenerationJob'

// ✅ NEW - Use this instead
import { useLeadMagnets } from '../hooks/useLeadMagnets'
```

---

### ❌ `import { useFunnelContentJob } from '../hooks/useGenerationJob'`

**Status:** DEPRECATED - DO NOT USE
**Replacement:** `import { useBatchedGeneration } from '../hooks/useBatchedGeneration'`
**Usage:** `const { startGeneration } = useBatchedGeneration()`
**Reason:** Now using batched task system instead of job system
**Since:** 2026-01-04
**Severity:** 🟠 HIGH

**Migration:**
```javascript
// ❌ OLD - Remove this import
import { useFunnelContentJob } from '../hooks/useGenerationJob'

// ✅ NEW - Use this instead
import { useBatchedGeneration } from '../hooks/useBatchedGeneration'
```

---

## Deprecated Patterns

### ❌ Job Polling Pattern

**Pattern:** Using `useEffect` to poll `generation_jobs` table
**Status:** DEPRECATED - DO NOT USE
**Replacement:** Direct promise-based generation with async/await
**Reason:** Batched endpoints return results directly (no polling needed)
**Since:** 2026-01-04
**Severity:** 🟡 MEDIUM

**Old Pattern (DO NOT USE):**
```javascript
// ❌ Polling generation_jobs table
useEffect(() => {
  if (jobId) {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('generation_jobs')
        .select('status, result')
        .eq('id', jobId)
        .single()

      if (data.status === 'complete') {
        setResult(data.result)
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }
}, [jobId])
```

**New Pattern (USE THIS):**
```javascript
// ✅ Direct promise-based generation
async function generate() {
  setLoading(true)
  try {
    const result = await generateContent(idea, profile, audience, product)
    setResult(result) // Result returned directly
  } catch (error) {
    console.error(error)
  } finally {
    setLoading(false)
  }
}
```

---

## Quick Reference: What to Use Instead

| ❌ DON'T USE | ✅ USE INSTEAD | SEVERITY |
|---|---|---|
| `/.netlify/functions/generate-lead-magnet-content` | `/.netlify/functions/generate-lead-magnet-content-batched` | 🔴 CRITICAL |
| `/.netlify/functions/process-generation-background` | `/.netlify/functions/generate-funnel-content-batched` | 🔴 CRITICAL |
| `useLeadMagnetContentJob()` | `useLeadMagnets.generateContent()` | 🟠 HIGH |
| `useFunnelContentJob()` | `useBatchedGeneration.startGeneration()` | 🟠 HIGH |
| Job polling with `useEffect` | Direct async/await promises | 🟡 MEDIUM |

---

## Severity Levels Explained

### 🔴 CRITICAL
- **Blocks deployment immediately**
- Wastes significant API credits
- Must be fixed before any testing or deployment
- Example: Calling old endpoint that makes 8x more API calls

### 🟠 HIGH
- **Allows deployment but must fix ASAP**
- Should be fixed before next release
- Encourages bad patterns
- Example: Importing deprecated hook

### 🟡 MEDIUM
- **Optional improvement**
- Does not block deployment
- Code quality enhancement
- Example: Old polling pattern instead of promises

---

## Adding New Deprecations

When deprecating code:

1. **Add entry to this file** with all required fields:
   - Name of deprecated item
   - Replacement
   - Reason for deprecation
   - Date deprecated
   - Severity level
   - Migration path with code examples

2. **Update `code-execution-verifier` agent** if needed:
   - Add pattern to agent's deprecation registry
   - Update grep commands if new patterns

3. **Communicate to team:**
   - Announce deprecation in team chat
   - Add migration guide
   - Set deadline for migration

4. **Run verification:**
   - Use `code-execution-verifier` agent to find all usages
   - Fix all CRITICAL violations immediately
   - Plan fixes for HIGH violations

---

## History

### 2026-01-04: Initial Registry Created
- Added lead magnet batched generation (2 calls instead of 8)
- Added funnel batched generation (14 tasks instead of 51+ calls)
- Deprecated job-based system hooks
- Deprecated polling patterns

**Reason for Creation:** Multiple incidents where old code executed instead of new batched implementations, wasting API credits and user time.

---

**Remember:** This registry is your source of truth for what NOT to use. Check it before every commit, every PR, every deployment.

**Questions?** Run the `code-execution-verifier` agent or check with the tech lead.
