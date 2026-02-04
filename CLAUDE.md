# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

---

## 🔑 AUTONOMOUS ACCESS - READ THIS FIRST

**YOU HAVE FULL CLI ACCESS. DO NOT ASK USER FOR CREDENTIALS OR MANUAL STEPS.**

### Netlify CLI (Already Logged In)
- Status: **AUTHENTICATED** as Martin Ebongue
- Project: **launchpad-pro-app**
- Commands you can run:
  ```bash
  netlify deploy --prod                    # Deploy to production
  netlify env:get VARIABLE_NAME            # Get any environment variable
  netlify functions:list                   # List all functions
  netlify status                           # Check project status
  ```

### Supabase CLI (Already Linked)
- Status: **INSTALLED & LINKED**
- Project ref: **psfgnelrxzdckucvytzj**
- Commands you can run:
  ```bash
  # Run migrations yourself
  SUPABASE_ACCESS_TOKEN=$(netlify env:get SUPABASE_ACCESS_TOKEN) supabase db push

  # List projects
  SUPABASE_ACCESS_TOKEN=$(netlify env:get SUPABASE_ACCESS_TOKEN) supabase projects list

  # Any other supabase CLI command
  SUPABASE_ACCESS_TOKEN=$(netlify env:get SUPABASE_ACCESS_TOKEN) supabase [command]
  ```

### Supabase API (Direct Database Access)
- You can query/modify database directly via REST API:
  ```bash
  SUPABASE_URL=$(netlify env:get SUPABASE_URL)
  SUPABASE_KEY=$(netlify env:get SUPABASE_SERVICE_ROLE_KEY)

  # Query any table
  curl "${SUPABASE_URL}/rest/v1/table_name" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}"

  # Insert/update/delete - you have FULL access
  ```

### All Environment Variables
- Location: **Netlify environment variables**
- Access via: `netlify env:get VARIABLE_NAME`
- Available variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_ACCESS_TOKEN`
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - And others...

### GitHub CLI
- You have access to GitHub CLI for git operations

### Project Paths
- Working directory: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro`
- Migrations: `supabase/migrations/`
- Functions: `netlify/functions/`
- Environment: `.env` (local only, use Netlify env for production)

### ❌ NEVER ASK USER TO:
- Go to Netlify dashboard to check deployments
- Go to Supabase dashboard to run migrations
- Manually get environment variables
- Check database manually
- Deploy manually
- Run any CLI command you can run yourself

### ✅ ALWAYS DO YOURSELF:
- Deploy with `netlify deploy --prod`
- Run migrations with Supabase CLI
- Query database with Supabase API
- Get env vars with `netlify env:get`
- Check deployment status with Netlify CLI
- Only ask user as ABSOLUTE LAST RESORT if CLI genuinely cannot do it

---

## 3-Layer Architecture

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes that mismatch.

---

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**
- SOPs written in Markdown, live in `directives/`
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases
- Natural language instructions, like you'd give a mid-level employee
- These are living documents—update them as you learn

**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing.
- Read directives, call execution tools in the right order, handle errors, ask for clarification, update directives with learnings
- You're the glue between intent and execution
- You don't do work directly—you read `directives/task_name.md`, prepare inputs/outputs, then run `execution/script_name.py`

**Layer 3: Execution (Doing the work)**
- Deterministic Python scripts in `execution/`
- Environment variables and API tokens stored in `.env`
- Handle API calls, data processing, file operations, database interactions
- Reliable, testable, fast. Well-commented.

**Why this works:** If you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. Push complexity into deterministic code. You focus on decision-making only.

---

## Core Operating Principles

### 1. Check for Existing Tools First
Before writing any script:
1. Check `execution/` for existing scripts that do what you need
2. Check `directives/` for SOPs that cover this task
3. Only create new scripts/directives if none exist
4. If creating new ones, ask user first unless it's a clear subtask

### 2. Always Test Your Work
**This is mandatory.** After any script change or creation:
1. Run the script with test inputs
2. Verify the output is correct
3. If it fails, enter the self-annealing loop (below)
4. Only report success to user after confirmed working

**Exception for paid services:** If testing would consume paid API credits (OpenAI, Claude API, paid scraping services, etc.), ask user before running: "This will use [X] credits to test. Proceed?"

### 3. Self-Annealing Loop (Critical)
When something breaks, you don't stop and report—you fix it:

```
ERROR DETECTED
     ↓
[1] Read error message and full stack trace
     ↓
[2] Identify root cause (don't guess—trace it)
     ↓
[3] Fix the script
     ↓
[4] Test again
     ↓
[5] Still broken? → Return to step 1 (max 3 attempts)
     ↓
[6] Working? → Update directive with what you learned
     ↓
[7] Report success to user
```

**After 3 failed attempts:** Stop, summarize what you tried, show the error, ask user for guidance.

### 4. Update Directives as You Learn
Directives are living documents. When you discover:
- API rate limits or constraints
- Better approaches than documented
- Common errors and their fixes
- Timing expectations
- Edge cases

...you update the directive immediately. Add a `## Lessons Learned` section if one doesn't exist.

**Do not** create or overwrite directives without asking unless:
- It's a clear subtask of something user requested
- You're adding to an existing directive's Lessons Learned section

---

## Self-Annealing Examples

**Example 1: API Rate Limit**
```
Task: Scrape 500 URLs
Error: 429 Too Many Requests after 100 calls
Fix: Add 1-second delay between requests
Test: Run on 10 URLs → works
Update directive: "Rate limit: 100 requests/minute. Script includes 1s delay."
```

**Example 2: Missing Dependency**
```
Task: Process video files
Error: ModuleNotFoundError: ffmpeg-python
Fix: Add to script header: subprocess.run(["pip", "install", "ffmpeg-python"])
Test: Run script → works
Update directive: "Requires ffmpeg-python. Script auto-installs if missing."
```

**Example 3: Data Format Change**
```
Task: Parse API response
Error: KeyError: 'data' (API now returns 'results')
Fix: Update script to check for both keys
Test: Run with sample response → works
Update directive: "API v2 uses 'results' key, v1 used 'data'. Script handles both."
```

---

## File Organization

### Directory Structure
```
project/
├── .env                 # API keys and secrets (never commit)
├── .tmp/                # Intermediate files (always regenerated)
├── credentials.json     # Google OAuth (in .gitignore)
├── token.json          # Google OAuth token (in .gitignore)
├── directives/         # SOPs in Markdown
│   ├── _template.md    # Template for new directives
│   └── [task_name].md  # One file per workflow
└── execution/          # Python scripts
    └── [script_name].py # One file per tool
```

### Deliverables vs Intermediates
- **Deliverables**: Google Sheets, Google Slides, or other cloud outputs user can access
- **Intermediates**: Temporary files in `.tmp/` needed during processing

**Key principle:** Local files are for processing only. Deliverables live in cloud services. Everything in `.tmp/` can be deleted and regenerated.

---

## Directive Template

When creating a new directive, use this structure:

```markdown
# [Task Name]

## Purpose
One sentence: what this accomplishes.

## Inputs
- What the user provides
- What format it should be in

## Process
1. Step one
2. Step two
3. Step three

## Scripts Used
- `execution/script_name.py` - what it does

## Outputs
- What gets created
- Where it goes

## Edge Cases
- Known issues and how to handle them

## Lessons Learned
- (Added automatically as you discover things)
```

---

## Pre-Flight Checklist

Before starting any task:

- [ ] Is there a directive for this? → Read it first
- [ ] Are there existing scripts? → Use them, don't recreate
- [ ] Will testing cost money? → Ask user first
- [ ] Do I have all required inputs? → Ask if unclear

Before reporting task complete:

- [ ] Did I test the output?
- [ ] Does the output match what was requested?
- [ ] Did I update the directive with anything I learned?
- [ ] Are deliverables in the cloud (not local files)?

---

## Error Reporting Format

When you hit an error you can't self-fix (after 3 attempts), report like this:

```
## ❌ Task Failed: [Task Name]

**What I tried:**
1. First approach and why it failed
2. Second approach and why it failed  
3. Third approach and why it failed

**Current error:**
[exact error message]

**My diagnosis:**
[What you think is wrong]

**Suggested next steps:**
[What might fix it, or what info you need]
```

---

## Summary

You sit between human intent (directives) and deterministic execution (Python scripts). Your job:

1. **Read** directives before acting
2. **Route** to the right scripts
3. **Test** everything before reporting done
4. **Fix** errors automatically (self-anneal)
5. **Learn** by updating directives

Be pragmatic. Be reliable. Self-anneal. Get smarter over time.
