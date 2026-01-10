# Admin RAG Logs Panel

## Purpose
Display real-time RAG retrieval status during content generation for admin users only.

## Inputs
- `isGenerating` prop: Boolean indicating if generation is active
- User authentication state (to verify admin status)

## Process
1. Component checks if user is admin (via hardcoded email list)
2. Panel remains hidden until `isGenerating` becomes true
3. Captures timestamp the MOMENT generation starts
4. Polls `rag_retrieval_logs` table every 2 seconds
5. Filters logs to only show entries AFTER the captured timestamp
6. Displays status: green (working), red (failed), gray (checking)

## Scripts Used
- `src/components/AdminRagLogsPanel.jsx` - The panel component

## Outputs
- Visual status indicator (green/red/gray)
- Collapsible log details showing chunks retrieved, scores, etc.
- Auto-expands on error with copy button

## Implementation Locations
| Screen | File | Prop |
|--------|------|------|
| Funnel Ideas | FunnelBuilder.jsx:404 | `isGenerating={isGenerating}` |
| Lead Magnet Ideas | LeadMagnetBuilder.jsx:353 | `isGenerating={ideasJob?.isActive}` |
| Lead Magnet Content | LeadMagnetBuilder.jsx:608 | `isGenerating={leadMagnetJob?.isActive}` |
| Funnel Content | LeadMagnetBuilder.jsx:660 | `isGenerating={funnelJob?.isActive}` |

## Edge Cases
- Multiple panels on same page: Each instance tracks its own generation independently
- Generation completes before logs arrive: Final fetch runs 500ms after generation ends
- No logs found: Shows "Checking..." not "Working"

## Lessons Learned

### 1. RLS Policy Required on rag_retrieval_logs Table
The `rag_retrieval_logs` table needs a SELECT policy for authenticated users:
```sql
CREATE POLICY "Users can read RAG logs"
ON rag_retrieval_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);
```
Without this, the frontend gets empty results even when logs exist.

### 2. Timestamp Filtering is CRITICAL
The panel MUST capture the timestamp the MOMENT the user clicks Generate:
```jsx
useEffect(() => {
  if (isGenerating && !generationStartTime) {
    const now = new Date().toISOString();
    setGenerationStartTime(now);
    setShowPanel(true);
    setLogs([]);
  }
}, [isGenerating, generationStartTime]);
```
Then filter all queries with `.gte('created_at', generationStartTime)`. Without this, the panel shows stale logs from previous sessions.

### 3. Panel Must Be Hidden Until Generate Clicked
Use a `showPanel` state that only becomes true when generation starts. The panel should NEVER render on page load - only after the user initiates generation.

### 4. Status Must Show "Checking..." When No Logs
When `logs.length === 0`, the status should be:
```jsx
return { type: 'waiting', message: 'Checking...', color: 'gray' };
```
NOT "Working" - that implies success. "Checking..." is neutral and accurate.

### 5. Admin Check Needs Email Fallback
The `admin_users` table has RLS that blocks anon key queries. Use a hardcoded email list as fallback:
```jsx
const ADMIN_EMAILS = ['mebongue@hotmail.com'];
useEffect(() => {
  if (!user?.email) return;
  setIsAdmin(ADMIN_EMAILS.includes(user.email));
}, [user?.email]);
```

### 6. Multiple Panel Instances Work Fine
LeadMagnetBuilder has 3 separate generation processes (ideas, content, funnel). Each needs its own panel instance with its own `isGenerating` prop. They track independently.

### 7. This is READ-ONLY
The panel NEVER modifies:
- RAG/vector search logic
- Generation functions
- batched-generators.js
- knowledge-search.js
- rag_retrieval_logs table schema

It only READS from the logs table.
