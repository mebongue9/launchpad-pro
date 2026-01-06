# ARCHITECTURE: 6-Layer Enforcer Enhancement

**Date:** January 6, 2026
**Related PLAN:** PLAN-enforcer-6-layer-enhancement.md

---

## Files Modified (System Level - ~/.claude/scripts/)

These files are outside the project repository but critical to enforcement:

| File | Layer | Purpose |
|------|-------|---------|
| `~/.claude/scripts/pre-code-validator.py` | 1, 4 | Removed /netlify/ bypass, stricter supervisor |
| `~/.claude/scripts/post-implementation-validator.py` | 3 | Substantive PLAN validation (500+ chars) |
| `~/.claude/scripts/post-code-enforcer.py` | 5 | Audit trail for bypasses |
| `~/.claude/scripts/session-timer.sh` | 6 | Session time limits (NEW) |

## Files Created (Project Level)

| File | Purpose |
|------|---------|
| `.git/hooks/pre-commit` | Git-level enforcement (not tracked) |
| `/artifacts/PLAN-enforcer-6-layer-enhancement.md` | This enhancement plan |
| `/artifacts/ARCHITECTURE-enforcer-6-layer-enhancement.md` | This file |

## Files Previously Modified (Session 7)

| File | Purpose |
|------|---------|
| `/netlify/functions/generate-funnel.js` | Added Maria Wendt naming framework |

---

## Backup Locations

All modified scripts have backups:
- `~/.claude/scripts/pre-code-validator.py.backup`
- `~/.claude/scripts/post-implementation-validator.py.backup`
- `~/.claude/scripts/post-code-enforcer.py.backup`

---

## Restoration Instructions

If enforcer needs to be restored:

```bash
# Restore from backups
cp ~/.claude/scripts/pre-code-validator.py.backup ~/.claude/scripts/pre-code-validator.py
cp ~/.claude/scripts/post-implementation-validator.py.backup ~/.claude/scripts/post-implementation-validator.py
cp ~/.claude/scripts/post-code-enforcer.py.backup ~/.claude/scripts/post-code-enforcer.py

# Remove git hook
rm .git/hooks/pre-commit

# Remove session timer
rm ~/.claude/scripts/session-timer.sh
```

---

## Verification Commands

```bash
# Layer 1: Check /netlify/ removed
grep "always_allowed_dirs" ~/.claude/scripts/pre-code-validator.py

# Layer 2: Test git hook
touch test.txt && git add test.txt && git commit -m "test" 2>&1

# Layer 3: Check 500 char minimum
grep "500" ~/.claude/scripts/post-implementation-validator.py

# Layer 4: Check stricter validation
grep "CONCERN\|VIOLATION" ~/.claude/scripts/pre-code-validator.py

# Layer 5: Check audit trail
grep "BYPASS" ~/.claude/scripts/post-code-enforcer.py

# Layer 6: Check timer exists
ls -la ~/.claude/scripts/session-timer.sh
```
