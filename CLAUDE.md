# CLAUDE.MD — MANDATORY RULES FOR ALL PROJECTS

**Last Updated:** January 5, 2026
**Purpose:** Prevent development errors, wasted time, and miscommunication
**Scope:** These rules apply to EVERY project, not just the current one

---

# SECTION 1: BEFORE YOU START ANY WORK

## Rule 1.1: Find The Vision Document

Before writing ANY code for a project, you MUST:

1. Check if a Vision document exists (e.g., `PROJECT-VISION.md`, `SPEC.md`, `REQUIREMENTS.md`)
2. If it exists, READ IT COMPLETELY before doing anything
3. If it doesn't exist, ASK the user: "Is there a specification or vision document for this project?"

**Never assume you understand the project without reading the documentation.**

## Rule 1.2: Confirm Understanding Before Coding

After reading any specification document, you MUST:

1. Write out your understanding of what needs to be built
2. Identify the key workflows and their ORDER
3. Ask: "Is this understanding correct?" and wait for confirmation
4. Only start coding AFTER receiving confirmation

**Do NOT say "I understand" and immediately start coding. Prove you understand first.**

## Rule 1.3: Identify Trigger Points

For any application with multi-step workflows, EXPLICITLY identify:

- What triggers each action
- What does NOT trigger an action
- Where generation/processing happens vs. where it does NOT happen

Write this out and confirm before coding.

---

# SECTION 2: DURING DEVELOPMENT

## Rule 2.1: Proof of Implementation (MANDATORY)

After completing ANY code change, you MUST provide a proof report:
```
📋 PROOF OF IMPLEMENTATION

TASK: [What was requested]

FILE: [Full file path]
LINE [X]-[Y]: [What this code does]
```
[Paste the actual code from those lines]
```

SUMMARY:
- ✅ [Feature 1]: Implemented at [file:line]
```

**If you cannot provide this proof with actual line numbers and actual code, the task is NOT complete.**

## Rule 2.2: No Empty Confirmations

NEVER say any of the following without IMMEDIATELY providing proof:

- "I've implemented..."
- "Done"
- "The changes have been made"

If you say any of these without proof, you are lying. Do not do this.

## Rule 2.3: Check Against Vision Document

Before saying any feature is complete:

1. Open the Vision document
2. Find the section that describes this feature
3. Verify your implementation matches EXACTLY
4. If there's any difference, fix it or ask for clarification

**Do NOT assume you know better than the Vision document.**

---

# SECTION 3: SESSION MANAGEMENT

## Rule 3.1: Session Length Limits

Claude Code sessions should NOT exceed 2-3 hours of continuous work.

**Why:** Long sessions cause confusion, hallucination, and errors.

## Rule 3.2: Handoff Documents

At the END of every session, create a handoff document.

## Rule 3.3: Request Session Breaks

If you notice the conversation is getting very long, STOP and say: "I recommend we create a handoff document and start a fresh session."

---

# SECTION 4: ERROR PREVENTION

## Rule 4.1: When In Doubt, Ask

If you're unsure about anything: **ASK. Do not guess. Do not assume. ASK.**

## Rule 4.2: No Scope Creep

Only build what is specified. Do NOT add features that weren't requested.

## Rule 4.3: No Overcomplication

If the specification describes something simple, build it simply.

## Rule 4.4: Preserve Existing Work

Before modifying any existing code, understand what it currently does and test after changes.

---

**END OF CLAUDE.MD RULES**

---

# SECTION 5: SUPABASE KEYS (DO NOT ASK USER FOR THESE)

**CLAUDE: USE THESE KEYS. DO NOT ASK THE USER FOR THEM.**

## Project URL
```
https://psfgnelrxzdckucvytzj.supabase.co
```

## Service Role Key (BYPASSES RLS - use for admin/debug queries)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs
```

## Query Example (for debugging)
```bash
curl -s 'https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/TABLE_NAME?select=*&limit=10' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs'
```
