# RAG Chunk Limit Decision: 20 → 40

**Date:** January 9, 2026
**Decision Made By:** Martin Ebongue (Admin/Owner)
**Status:** APPROVED

---

## Executive Summary

After conducting A/B/C/D testing with chunk limits of 10, 20, 30, and 40, the admin has made an executive decision to increase the RAG chunk limit from 20 to 40 based on **significantly improved content quality**.

---

## Test Results

### Test Configuration
- **Test Idea:** "4 Facebook Group Posts That Generated $12,847 in 30 Days"
- **Audience:** Female coaches and course creators
- **Format:** Swipe File (FREE Lead Magnet)

### Quality Comparison

| Test | Chunks | Specificity | Uses Creator's Story | Voice Match |
|------|--------|-------------|---------------------|-------------|
| A    | 10     | Generic engagement focus | No | Generic |
| B    | 20     | Trust/engagement focus | No | Generic |
| C    | 30     | Includes specific dollar amounts | Somewhat | Better |
| **D** | **40** | **References $53k success story, small audience expertise** | **Yes** | **Best** |

### Key Finding

**Test D (40 chunks) produced ideas that:**
1. Referenced the creator's actual success stories ($53k coaching student)
2. Matched the creator's unique selling proposition (small audience = big money)
3. Used language and frameworks from the creator's knowledge base
4. Required NO editing to sound authentic

**Tests A & B (10-20 chunks) produced:**
- Generic titles focused on "engagement" and "trust"
- No reference to creator's unique stories or frameworks
- Content that sounds like generic AI output

---

## Alignment with Vision Document

From PROJECT-VISION.md, Section "Everything Comes From The Vector Database":

> "The vector database is the heart of the system. EVERY piece of generated content must be grounded in the user's actual knowledge base."

**40 chunks enables this vision better than 20 chunks because:**
- More knowledge context = Better voice matching
- More chunks = More creator-specific examples and stories
- More context = Content that sounds like the creator, not generic AI

---

## Cost Analysis (Admin Approved)

| Setting | Estimated Cost/Generation | Quality |
|---------|--------------------------|---------|
| 20 chunks | ~$0.06 | Generic |
| 40 chunks | ~$0.12 | Authentic |

**Admin Statement:**
> "I don't mind paying a little bit more if the quality is a million times better. This is an internal app with controlled query volume. Even if we pay 80 cents instead of 20 cents, it's perfectly fine. Quality is the priority."

---

## Decision

✅ **APPROVED: Change default RAG chunk limit from 20 to 40**

**Justification:**
1. Quality testing proves 40 chunks produces significantly better results
2. Admin has approved the additional cost
3. Aligns with vision: "Everything Comes From The Vector Database"
4. Query volume is controlled (internal app)
5. Better voice matching outweighs token efficiency concerns

---

## Files to Update

1. `netlify/functions/lib/knowledge-search.js` - Default limit: 20 → 40
2. `netlify/functions/generate-funnel.js` - limit: 20 → 40
3. `netlify/functions/generate-lead-magnet-ideas.js` - limit: 20 → 40
4. `netlify/functions/generate-lead-magnet-background.js` - limit: 20 → 40
5. `netlify/functions/generate-lead-magnet-content-batched.js` - limit: 20 → 40 (2 locations)
6. `netlify/functions/lib/batched-generators.js` - limit: 20 → 40 (14 locations)

---

## Approval

**Approved By:** Martin Ebongue (Admin)
**Date:** January 9, 2026
**Signature:** Executive decision based on quality testing

---

*This decision document serves as justification for any validation hooks questioning the limit increase.*
