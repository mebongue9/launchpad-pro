# CLAUDE.md — Development Instructions

This file contains instructions for Claude Code when building this project. Read this FIRST before writing any code.

---

## Project Overview

**What we're building:** Launchpad Pro — A SaaS app for coaches to generate product funnels, lead magnets, and designed PDFs/presentations using AI. Companion to Launch Builder Pro.

**Tech stack:**
- React + Vite (frontend)
- Tailwind CSS (styling)
- Supabase (auth, database, storage)
- Netlify (hosting + serverless functions)
- Claude API (AI generation)

---

## 🚨 ACTIVE MAJOR PROJECTS (January 2026)

### Batched Generation System Redesign
**Status:** 🟡 PLANNING PHASE - Awaiting Approval
**Priority:** 🔴 CRITICAL
**Documentation:** `docs/BATCHED-GENERATION-REDESIGN.md`
**Plan:** `~/.claude/plans/optimized-singing-pike.md`

**What:** Complete redesign of funnel generation from 51+ sequential API calls to 14 batched calls with automatic retry logic.

**Impact:** This is a MAJOR system redesign. Success rate will improve from ~33% to 95%+. DO NOT modify generation-related code without checking this documentation first.

**Timeline:**
- Planning: January 4, 2026 ✅
- Implementation: 3-4 days (awaiting approval)
- Expected Completion: January 7-8, 2026

**Before working on generation code, READ:**
1. `docs/BATCHED-GENERATION-REDESIGN.md` - Full project documentation with timestamps
2. `docs/README.md` - Documentation index and navigation guide

---

# ⛔ MANDATORY WORKFLOW — READ THIS FIRST

## The Problem This Solves
You have 15 specialized agents. In the past, they were skipped because there was no enforcement. This section creates **HARD GATES** that **CANNOT BE BYPASSED**.

## The Rule
**You are NOT allowed to say a feature is "done" or "complete" until ALL required agents have run and produced their artifacts.**

If Martin asks "is this done?" and you haven't run the agents, the answer is **"No, I still need to run [agent names]"** — not "yes" with a mental note to maybe check later.

---

## WORKFLOW PHASES (MANDATORY)

Every task follows this exact sequence. **You cannot skip phases.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: PLANNING                                                          │
│  ├── VISION-GUARDIAN checks alignment                                       │
│  ├── ARCHITECT designs approach                                             │
│  └── GATE: Architecture artifact must exist before coding                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  PHASE 2: BUILDING                                                          │
│  ├── DEVELOPER writes code                                                  │
│  ├── CHANGE-GUARDIAN monitors scope                                         │
│  └── GATE: Code must compile and run before review                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  PHASE 3: CODE REVIEW                                                       │
│  ├── CODE-REVIEWER checks quality                                           │
│  ├── SECURITY-FORTRESS-BUILDER checks security                              │
│  └── GATE: Both must approve before QA                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  PHASE 4: TESTING (ALL MUST RUN)                                            │
│  ├── QA-FUNCTIONAL tests happy paths                                        │
│  ├── QA-EDGE-CASES tests what breaks                                        │
│  ├── QA-INTEGRATION tests regressions                                       │
│  ├── UI-REVIEWER tests visual/responsive                                    │
│  ├── MICROCOPY-PERFECTIONIST reviews all text                               │
│  ├── AI-INTEGRATION-SPECIALIST tests prompts (if AI involved)               │
│  └── GATE: ALL QA artifacts must exist before "done"                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  PHASE 5: DEPLOYMENT (when deploying)                                       │
│  ├── Deploy to Netlify                                                      │
│  ├── DEPLOYMENT-CHECKER verifies production                                 │
│  └── GATE: Deployment artifact must confirm working                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  PHASE 6: DOCUMENTATION (ALWAYS)                                            │
│  ├── KNOWLEDGE-BASE-KEEPER logs any issues/solutions                        │
│  ├── PROGRESS-TRACKER updates PROJECT-STATUS.md                             │
│  └── GATE: Status must be updated before session ends                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## HARD GATES — CANNOT PROCEED WITHOUT

### Gate 1: Before Writing Code
**Required:** ARCHITECTURE artifact exists
**Blocker:** "Cannot write code. Architecture not defined. Running ARCHITECT agent first."

### Gate 2: Before Code Review
**Required:** Code compiles, no errors
**Blocker:** "Cannot proceed to review. Build errors exist. Fixing first."

### Gate 3: Before QA
**Required:** CODE-REVIEW artifact approves OR lists specific fixes completed
**Blocker:** "Cannot proceed to QA. Code review not complete."

### Gate 4: Before "Done"
**Required:** ALL of these artifacts exist:
- QA-FUNCTIONAL-{task-id}.md
- QA-EDGE-CASES-{task-id}.md
- QA-INTEGRATION-{task-id}.md
- UI-REVIEW-{task-id}.md
- MICROCOPY-REVIEW-{task-id}.md
- (If AI involved) AI-INTEGRATION-{task-id}.md
- (If security touched) SECURITY-REVIEW-{task-id}.md

**Blocker:** "Cannot mark as done. Missing artifacts: [list]. Running agents now."

### Gate 5: Before Session End
**Required:** PROJECT-STATUS.md updated with current state
**Blocker:** "Cannot end session. Status not updated. Updating now."

---

## AUTOMATIC TRIGGERS — AGENTS RUN THEMSELVES

You don't wait to be asked. These agents trigger automatically:

| Condition | Agent | Action |
|-----------|-------|--------|
| New task starts | VISION-GUARDIAN | Check alignment |
| Before any code | ARCHITECT | Design approach |
| Any file modified | CHANGE-GUARDIAN | Verify in scope |
| Code complete | CODE-REVIEWER | Review quality |
| Auth/input/API touched | SECURITY-FORTRESS-BUILDER | Security review |
| UI components added | UI-REVIEWER | Visual review |
| UI components added | MICROCOPY-PERFECTIONIST | Text review |
| Claude API touched | AI-INTEGRATION-SPECIALIST | Prompt testing |
| After any feature | QA-FUNCTIONAL | Test happy path |
| After any feature | QA-EDGE-CASES | Test edge cases |
| After any feature | QA-INTEGRATION | Test regressions |
| Any deployment | DEPLOYMENT-CHECKER | Verify production |
| Any error fixed | KNOWLEDGE-BASE-KEEPER | Document solution |
| Session start/end | PROGRESS-TRACKER | Update status |

---

## THE AGENTS (15 Total)

### Planning & Governance
| Agent | File | Purpose |
|-------|------|---------|
| VISION-GUARDIAN | /agents/VISION-GUARDIAN.md | Keeps project on purpose |
| ARCHITECT | /agents/ARCHITECT.md | Designs technical approach |
| CHANGE-GUARDIAN | /agents/CHANGE-GUARDIAN.md | Blocks scope creep |

### Development
| Agent | File | Purpose |
|-------|------|---------|
| DEVELOPER | /agents/DEVELOPER.md | Writes the code |
| CODE-REVIEWER | /agents/CODE-REVIEWER.md | Reviews code quality |
| SECURITY-FORTRESS-BUILDER | /agents/SECURITY-FORTRESS-BUILDER.md | Reviews security |

### Quality Assurance
| Agent | File | Purpose |
|-------|------|---------|
| QA-FUNCTIONAL | /agents/QA-FUNCTIONAL.md | Tests happy paths |
| QA-EDGE-CASES | /agents/QA-EDGE-CASES.md | Tests what breaks |
| QA-INTEGRATION | /agents/QA-INTEGRATION.md | Tests regressions |
| UI-REVIEWER | /agents/UI-REVIEWER.md | Tests visual/responsive |
| MICROCOPY-PERFECTIONIST | /agents/MICROCOPY-PERFECTIONIST.md | Reviews all UI text |
| AI-INTEGRATION-SPECIALIST | /agents/AI-INTEGRATION-SPECIALIST.md | Tests AI prompts |

### Operations
| Agent | File | Purpose |
|-------|------|---------|
| DEPLOYMENT-CHECKER | /agents/DEPLOYMENT-CHECKER.md | Verifies deployments |
| KNOWLEDGE-BASE-KEEPER | /agents/KNOWLEDGE-BASE-KEEPER.md | Documents problems/solutions |
| PROGRESS-TRACKER | /agents/PROGRESS-TRACKER.md | Maintains project status |

---

## ARTIFACT STRUCTURE

All artifacts go in `/artifacts/` folder:

```
/artifacts/
├── ARCHITECTURE-{task-id}.md
├── CHANGES-{task-id}.md
├── CODE-REVIEW-{task-id}.md
├── SECURITY-REVIEW-{task-id}.md
├── QA-FUNCTIONAL-{task-id}.md
├── QA-EDGE-CASES-{task-id}.md
├── QA-INTEGRATION-{task-id}.md
├── UI-REVIEW-{task-id}.md
├── MICROCOPY-REVIEW-{task-id}.md
├── AI-INTEGRATION-{task-id}.md
└── DEPLOYMENT-CHECK-{task-id}.md

/knowledge/
├── KNOWN-ISSUES.md
└── DECISIONS-LOG.md

/PROJECT-STATUS.md (root level)
/VISION.md (root level)
```

---

## EXAMPLE: Complete Task Flow

**Task:** Add profile creation feature

```
1. VISION-GUARDIAN: "Profile creation aligns with core purpose. Proceed."

2. ARCHITECT: Creates ARCHITECTURE-profile-001.md
   - Files to create: ProfileForm.jsx, profileApi.js
   - Files to modify: App.jsx (add route)
   
3. DEVELOPER: Writes code, creates CHANGES-profile-001.md

4. CHANGE-GUARDIAN: "All changes within approved scope."

5. CODE-REVIEWER: Creates CODE-REVIEW-profile-001.md
   - "APPROVED with minor suggestions"

6. SECURITY-FORTRESS-BUILDER: Creates SECURITY-REVIEW-profile-001.md
   - "RLS verified, no exposed secrets. APPROVED."

7. QA-FUNCTIONAL: Creates QA-FUNCTIONAL-profile-001.md
   - "5/5 acceptance criteria pass. APPROVED."

8. QA-EDGE-CASES: Creates QA-EDGE-CASES-profile-001.md
   - "Tested empty states, validation, errors. 2 minor issues found and fixed."

9. QA-INTEGRATION: Creates QA-INTEGRATION-profile-001.md
   - "No regressions. Auth still works. APPROVED."

10. UI-REVIEWER: Creates UI-REVIEW-profile-001.md
    - "Mobile responsive. No overflow. APPROVED."

11. MICROCOPY-PERFECTIONIST: Creates MICROCOPY-REVIEW-profile-001.md
    - "Button labels clear, error messages helpful. APPROVED."

12. PROGRESS-TRACKER: Updates PROJECT-STATUS.md
    - "Profile creation complete. Next: Audience management."

✅ NOW it's "done"
```

---

## WHAT "DONE" MEANS

A feature is DONE when:

- [ ] Architecture artifact exists
- [ ] Code compiles without errors
- [ ] Code review passed
- [ ] Security review passed (if applicable)
- [ ] QA-Functional passed
- [ ] QA-Edge-Cases passed
- [ ] QA-Integration passed
- [ ] UI Review passed
- [ ] Microcopy Review passed
- [ ] AI Integration tested (if applicable)
- [ ] Deployment verified (if deployed)
- [ ] Status updated

**If ANY checkbox is missing, it is NOT done.**

---

## WHEN MARTIN ASKS "IS THIS DONE?"

**Check this list:**
1. Do all required artifacts exist?
2. Did all agents approve?
3. Is PROJECT-STATUS.md updated?

**If YES to all:** "Yes, [feature] is complete. All agents have reviewed and approved."

**If NO:** "Not yet. I still need to run [list missing agents]. Let me do that now."

**NEVER say "yes" if agents haven't run.**

---

## ENFORCEMENT SUMMARY

1. **Agents are NOT optional** — They run automatically based on triggers
2. **Artifacts are PROOF** — No artifact = agent didn't run
3. **Gates are BLOCKERS** — Cannot proceed without passing
4. **"Done" has a definition** — All checkboxes checked
5. **Martin shouldn't have to ask** — You catch issues before he does

---

## Critical Rules (From Original)

### 1. Follow the Phases
Development is divided into 4 phases in `04-IMPLEMENTATION-PHASES.md`. Complete each phase fully before moving to the next. Do not skip ahead.

### 2. Read Before Coding
Before implementing any feature:
1. Read the relevant section in the docs
2. Understand the data model
3. Check if there are related components to reference
4. Then write code

### 3. Keep It Simple
- Use standard React patterns (hooks, functional components)
- No complex state management libraries (useState/useContext is enough)
- No unnecessary abstractions
- Code should be readable by a junior developer

### 4. Supabase Patterns
Always use these patterns for Supabase:

```javascript
// Fetching data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error);
  return;
}

// Inserting data
const { data, error } = await supabase
  .from('table_name')
  .insert({ ...values, user_id: user.id })
  .select()
  .single();

// Updating data
const { error } = await supabase
  .from('table_name')
  .update({ ...values })
  .eq('id', recordId)
  .eq('user_id', user.id);

// Deleting data
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', recordId)
  .eq('user_id', user.id);
```

### 5. Component Structure
Every component should follow this structure:

```jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ComponentName({ prop1, prop2 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data on mount
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Do stuff
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### 6. Error Handling
Always handle errors gracefully:
- Show user-friendly error messages
- Log technical errors to console
- Never show raw error objects to users
- Always have loading states

### 7. Tailwind Classes
Use Tailwind utility classes. Keep them readable:

```jsx
// Good - grouped by concern
<div className="
  flex flex-col gap-4
  p-6 rounded-lg
  bg-white shadow-sm
  border border-gray-200
">

// Avoid - long unreadable strings
<div className="flex flex-col gap-4 p-6 rounded-lg bg-white shadow-sm border border-gray-200">
```

### 8. Netlify Functions
Format for serverless functions:

```javascript
// netlify/functions/function-name.js
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    
    if (!body.requiredField) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field' })
      };
    }

    const result = await doSomething(body);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
```

### 9. Claude API Calls
When calling Claude API from Netlify Functions:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: prompt
    }
  ]
});

const text = response.content[0].text;
```

### 10. File Naming
- Components: `PascalCase.jsx` (e.g., `ProfileForm.jsx`)
- Utilities: `camelCase.js` (e.g., `formatDate.js`)
- Styles: `kebab-case.css` (e.g., `global-styles.css`)
- Constants: `UPPER_SNAKE_CASE` in files

---

## UI/UX Guidelines

### Colors
Use Tailwind's default palette. Main colors:
- Primary: `blue-600` (buttons, links)
- Success: `green-600`
- Error: `red-600`
- Warning: `amber-600`
- Neutral: `gray-*` scale

### Typography
- Headings: `font-semibold` or `font-bold`
- Body: default weight
- Small text: `text-sm text-gray-500`

### Spacing
- Consistent gaps: `gap-4`, `gap-6`
- Page padding: `p-6` or `p-8`
- Card padding: `p-4` or `p-6`

### Components to Create
Build these reusable components in `/src/components/ui/`:

```jsx
// Button.jsx
export function Button({ children, variant = 'primary', loading, ...props }) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]}`}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

// Input.jsx
export function Input({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

// Card.jsx
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );
}
```

---

## What NOT to Do

1. **Don't add features not in the spec** — Stick to the phase requirements
2. **Don't use complex libraries** — No Redux, no Zustand, no GraphQL
3. **Don't optimize early** — Make it work first, optimize later
4. **Don't skip agents** — They are MANDATORY
5. **Don't forget mobile** — Test responsive at each step
6. **Don't hardcode API keys** — Always use environment variables
7. **Don't ignore errors** — Handle every error case
8. **Don't say "done" prematurely** — All agents must approve first

---

## Commit Messages

Use clear, descriptive commits:
```
feat: add profile creation form
fix: handle empty audience list
refactor: extract Button component
docs: update README with setup instructions
```

---

## Questions to Ask

If something is unclear:
1. Check the docs first (all 7 documents)
2. Look for similar patterns in existing code
3. Ask before making assumptions about business logic

---

## Remember

The goal is a working product that Martin can use and demo. Keep it simple, make it work, ship it. Polish comes in Phase 4.

**And run the agents. Every time. No exceptions.**
