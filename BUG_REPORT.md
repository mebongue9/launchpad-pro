# Bug Report: Language Selection, TLDR, and Cross-Promo Features

**Test Date:** 2026-01-04
**Tester:** QA Tester Bot
**Environment:** http://localhost:5173 (Development)
**Files Reviewed:**
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/lib/languages.js`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/components/common/LanguageSelector.jsx`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/components/settings/FavoriteLanguagesManager.jsx`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/pages/FunnelBuilder.jsx`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/netlify/functions/process-generation-background.js`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/hooks/useGenerationJob.jsx`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/hooks/useFunnels.jsx`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/hooks/useProfiles.jsx`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/pages/Settings.jsx`

---

## Summary

After a thorough code review of the Language Selection, TLDR, and Cross-Promo features, I found **2 bugs** and **3 potential issues** that should be addressed.

---

## BUG 1: Language Not Passed to Funnel Generation in Background Job

**Severity:** HIGH
**Component:** `process-generation-background.js` - `generateFunnel` function

### Description
The main `generateFunnel` function in the background job receives the `language` parameter in `inputData` and uses it for the funnel prompt. However, the language suffix is only appended to the main funnel prompt at line 442:

```javascript
// Line 442
${getLanguagePromptSuffix(language)}
```

But the TLDR generation call at line 547 correctly passes the language:
```javascript
tldrs[level] = await generateTLDR(jobId, funnel[level], language);
```

And cross-promo at line 560-565 also correctly passes it:
```javascript
crossPromos[level] = await generateCrossPromo(
  jobId,
  funnel[level],
  existing_product,
  profile,
  language
);
```

**Status:** WORKING CORRECTLY - The language is properly passed throughout the funnel generation flow.

---

## BUG 2: Settings Page Language Update Only Affects First Profile

**Severity:** MEDIUM
**Component:** `src/pages/Settings.jsx` - Lines 54-69, 72

### Description
The Settings page hardcodes language preferences to the first profile only:

```javascript
// Line 72
const currentFavoriteLanguages = profiles[0]?.favorite_languages || ['English', 'French', 'Spanish', 'Indonesian', 'German']

// Lines 54-69 - handleUpdateFavoriteLanguages
async function handleUpdateFavoriteLanguages(newLanguages) {
  if (!profiles.length) {
    addToast('Please create a profile first', 'error')
    return
  }

  setSavingLanguages(true)
  try {
    await updateFavoriteLanguages(profiles[0].id, newLanguages)  // Always updates first profile
    ...
  }
}
```

### Steps to Reproduce
1. Create multiple profiles
2. Go to Settings
3. Update favorite languages
4. The change only applies to the first profile, not the currently selected one

### Expected Behavior
- Either apply to all profiles, or
- Allow user to select which profile to update, or
- Make language preferences account-level (not profile-level)

### Actual Behavior
Language preferences only affect the first profile in the list.

---

## BUG 3: FavoriteLanguagesManager Nested Incorrectly in Settings

**Severity:** LOW
**Component:** `src/pages/Settings.jsx` - Lines 165-178

### Description
The `FavoriteLanguagesManager` component is nested inside a `Card` component, but the `FavoriteLanguagesManager` already renders its own card-like container with shadow and border:

```javascript
// Settings.jsx lines 165-178
<Card>
  <h2>...</h2>
  <p>...</p>
  <FavoriteLanguagesManager ... />  {/* This has its own card styling */}
</Card>
```

And in FavoriteLanguagesManager.jsx line 50:
```javascript
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
```

### Impact
This creates a nested card-in-card visual appearance, which may look awkward.

### Recommendation
Either remove the Card wrapper in Settings.jsx or remove the container styling from FavoriteLanguagesManager.

---

## POTENTIAL ISSUE 1: Language Count Mismatch

**Severity:** LOW
**Component:** `src/lib/languages.js`

### Description
The user story mentions "32 supported languages" but the `ALL_LANGUAGES` array contains exactly 32 languages. This is correct, but the array should be verified:

```javascript
// Counted languages in ALL_LANGUAGES array:
// 1. Arabic, 2. Bengali, 3. Chinese (Simplified), 4. Chinese (Traditional),
// 5. Czech, 6. Danish, 7. Dutch, 8. English, 9. Finnish, 10. French,
// 11. German, 12. Greek, 13. Hebrew, 14. Hindi, 15. Hungarian,
// 16. Indonesian, 17. Italian, 18. Japanese, 19. Korean, 20. Malay,
// 21. Norwegian, 22. Polish, 23. Portuguese (Brazil), 24. Portuguese (Portugal),
// 25. Romanian, 26. Russian, 27. Spanish, 28. Swedish, 29. Thai,
// 30. Turkish, 31. Ukrainian, 32. Vietnamese
```

**Status:** CONFIRMED - 32 languages present.

---

## POTENTIAL ISSUE 2: No Profile Selection in FunnelBuilder Uses Favorite Languages

**Severity:** MEDIUM
**Component:** `src/pages/FunnelBuilder.jsx` - Lines 430-441

### Description
The FunnelBuilder correctly loads favorite languages from the selected profile:

```javascript
// Lines 430-441
<LanguageSelector
  value={selectedLanguage}
  onChange={setSelectedLanguage}
  favoriteLanguages={
    profiles.find(p => p.id === selectedProfile)?.favorite_languages ||
    DEFAULT_FAVORITE_LANGUAGES
  }
  label="Output Language"
/>
```

However, this only works AFTER a profile is selected. The issue is:

1. When no profile is selected (`selectedProfile === null`), `profiles.find(...)` returns `undefined`
2. This triggers the fallback to `DEFAULT_FAVORITE_LANGUAGES`
3. Once a profile is selected, favorites update correctly

**Status:** WORKING AS DESIGNED - Falls back to defaults when no profile selected.

---

## POTENTIAL ISSUE 3: useFunnelProductJob Missing Language Parameter

**Severity:** MEDIUM
**Component:** `src/hooks/useGenerationJob.jsx` - Lines 307-320

### Description
The `useFunnelProductJob` hook does NOT accept or pass a language parameter:

```javascript
// Lines 307-320
export function useFunnelProductJob() {
  const job = useGenerationJob()

  const generateProductContent = useCallback(async (product, profile, audience, nextProduct = null) => {
    return job.startJob('funnel_product', {
      product,
      profile,
      audience,
      next_product: nextProduct
      // MISSING: language parameter!
    })
  }, [job])

  return { ...job, generateProductContent }
}
```

Compare to `useFunnelJob` which correctly includes language:
```javascript
// Lines 292-305
const generateFunnel = useCallback(async (profile, audience, existingProduct = null, language = 'English') => {
  return job.startJob('funnel', {
    profile,
    audience,
    existing_product: existingProduct,
    language  // Correctly passed
  })
}, [job])
```

### Impact
When generating individual product content (after funnel is created), the language preference will not be passed, potentially resulting in English-only content.

### Recommended Fix
Add language parameter to `useFunnelProductJob`:
```javascript
const generateProductContent = useCallback(async (product, profile, audience, nextProduct = null, language = 'English') => {
  return job.startJob('funnel_product', {
    product,
    profile,
    audience,
    next_product: nextProduct,
    language
  })
}, [job])
```

---

## TLDR Generation Analysis

**Status:** WORKING CORRECTLY

The TLDR generation is properly wired up in `process-generation-background.js`:

1. **Lines 536-551:** After funnel generation, TLDRs are generated for each product level
2. **Lines 722-752:** The `generateTLDR` function is properly defined with language support
3. **Line 742:** Language suffix is correctly applied to TLDR prompts

```javascript
// Line 547
tldrs[level] = await generateTLDR(jobId, funnel[level], language);
```

---

## Cross-Promo Generation Analysis

**Status:** WORKING CORRECTLY

The Cross-Promo generation is properly wired up:

1. **Lines 554-570:** Cross-promos are generated for paid products when an existing product exists
2. **Lines 759-803:** The `generateCrossPromo` function is properly defined with language support
3. **Line 786:** Language suffix is correctly applied to cross-promo prompts

```javascript
// Lines 559-566
crossPromos[level] = await generateCrossPromo(
  jobId,
  funnel[level],
  existing_product,
  profile,
  language
);
```

---

## Component Rendering Analysis

### LanguageSelector.jsx - WORKING CORRECTLY
- Renders select with optgroups for Favorites and All Languages
- Favorites shown at top in separate optgroup
- Default value handled with `value || 'English'`
- Helper text explains purpose

### FavoriteLanguagesManager.jsx - WORKING CORRECTLY
- Add/remove/reorder functionality implemented
- Prevents removing last language (minimum 1)
- Move up/down buttons with proper disabled states
- Loading state support

### FunnelBuilder.jsx Language Integration - WORKING CORRECTLY
- LanguageSelector imported and used (line 15, 432-440)
- Language state managed with useState (line 115)
- Language passed to generateFunnel (line 166)
- Language passed to saveFunnel (lines 178-184)
- Language reset on resetAll (line 249)

---

## Import Verification

All imports are correctly defined:

**LanguageSelector.jsx:**
```javascript
import { ALL_LANGUAGES, DEFAULT_FAVORITE_LANGUAGES } from '../../lib/languages'
```

**FavoriteLanguagesManager.jsx:**
```javascript
import { ALL_LANGUAGES, DEFAULT_FAVORITE_LANGUAGES } from '../../lib/languages'
```

**FunnelBuilder.jsx:**
```javascript
import LanguageSelector from '../components/common/LanguageSelector'
import { DEFAULT_FAVORITE_LANGUAGES } from '../lib/languages'
```

---

## Test Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| LanguageSelector renders | PASS | Component structure correct |
| Favorites shown at top | PASS | Uses optgroup with "Favorites" label |
| Language saves with funnel | PASS | Passed through saveFunnel (line 184) |
| TLDR generation wired | PASS | Called in generateFunnel after product levels |
| Cross-Promo generation wired | PASS | Called for paid products when existing_product exists |
| Import errors | NONE | All imports correctly defined |
| Missing dependencies | NONE | All required modules imported |

---

## Recommendations

1. **HIGH PRIORITY:** Add language parameter to `useFunnelProductJob` hook
2. **MEDIUM PRIORITY:** Fix Settings.jsx to handle language preferences for all profiles or make it account-level
3. **LOW PRIORITY:** Remove nested card styling in Settings.jsx FavoriteLanguagesManager section

---

## Files That Need Changes

1. `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/hooks/useGenerationJob.jsx` - Add language to useFunnelProductJob
2. `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/pages/Settings.jsx` - Fix profile-specific language handling

---
---

# Bug Report: Format Templates and Style Templates

**Test Date:** 2026-01-04
**Test Group:** 3 - Format Templates and Style Templates
**Environment:** Launchpad Pro at http://localhost:5173
**Tester:** QA Tester Bot

---

## Summary

After reviewing all format and style template files, I found **6 bugs/issues** ranging from critical integration problems to minor UI issues.

---

## BUG #1: Critical - Tailwind Dynamic Class Names Will Not Work

**Title:** Dynamic grid classes in React preview components will not be compiled by Tailwind

**Environment:**
- Files: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/planner.js` (line 116), `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/cheat-sheet.js` (line 122)
- Framework: Tailwind CSS with JIT compilation

**Steps to Reproduce:**
1. Create a planner or cheat-sheet format with `content.columns = 3`
2. View the React preview component
3. Observe the grid layout

**Expected Behavior:**
Grid should display with 3 columns using `grid-cols-3` class

**Actual Behavior:**
Dynamic class names like `grid-cols-${content?.columns || 2}` are NOT supported by Tailwind JIT compiler. These classes will not be included in the CSS bundle because Tailwind cannot detect them at build time.

**Code Evidence:**
```javascript
// planner.js line 116
<div className={`grid grid-cols-${content?.columns || 2} gap-4`}>

// cheat-sheet.js line 122
<div className={`grid grid-cols-${content?.columns || 2} gap-6`}>
```

**Root Cause:**
Tailwind CSS JIT mode scans source files for complete class names. Dynamic interpolation like `grid-cols-${variable}` is not detected, so these utility classes are not generated.

**Impact:** HIGH - Preview rendering will be broken for any non-default column count

**Recommended Fix:**
Use a mapping object or conditional classes:
```javascript
const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4'
};
<div className={`grid ${columnClasses[content?.columns] || 'grid-cols-2'} gap-4`}>
```

---

## BUG #2: Critical - Two Separate Template Systems Not Integrated

**Title:** VisualBuilder uses different template system than PDF generator

**Environment:**
- VisualBuilder: imports from `../styles/templates` (10 style-based templates)
- PDF Generator: imports from `../templates/formats` (6 format templates) + `../templates/styles` (11 style definitions)

**Steps to Reproduce:**
1. Open VisualBuilder page
2. Note the templates available for selection
3. Check PDF generator exports
4. Compare available format types

**Expected Behavior:**
Both systems should use the same template definitions for consistency

**Actual Behavior:**
There are TWO completely separate template systems:
1. `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/styles/templates/` - 10 templates used by VisualBuilder (apple-minimal, minimalist-clean, etc.)
2. `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/` - 6 format templates (checklist, worksheet, planner, etc.)
3. `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/styles/` - 11 style definitions (apple-minimal, apple-keynote-light, etc.)

The format templates (checklist, worksheet, etc.) in `/src/templates/formats/` are **NOT integrated into VisualBuilder**.

**Code Evidence:**
```javascript
// VisualBuilder.jsx line 14
import { templateList, generateVisualHTML } from '../styles/templates'
// Uses 10 visual style templates

// pdf-generator.js lines 9-10
import { generateFormatHTML } from '../templates/formats';
import { getStyle } from '../templates/styles';
// Uses 6 format templates + 11 style templates
```

**Impact:** HIGH - Users cannot create checklists, worksheets, planners, etc. from the VisualBuilder UI

---

## BUG #3: Medium - Missing Template in styles/index.js

**Title:** Apple Keynote Light style missing from src/styles/templates/index.js

**Environment:**
- File: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/styles/index.js` defines 11 styles
- File: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/styles/templates/index.js` only imports 10 templates

**Steps to Reproduce:**
1. Check `/src/templates/styles/index.js` for style list
2. Check `/src/styles/templates/index.js` for imported templates
3. Compare the two lists

**Expected Behavior:**
Both files should have the same 11 styles/templates

**Actual Behavior:**
- `/src/templates/styles/index.js` has 11 styles including `apple-keynote-light`
- `/src/styles/templates/index.js` is MISSING `apple-keynote-light` (only has 10 templates)

**Code Evidence:**
```javascript
// src/templates/styles/index.js includes:
// 'apple-minimal', 'apple-keynote-light', 'minimalist-clean', 'swiss-design',
// 'editorial-magazine', 'memphis-design', 'hand-drawn-sketch', 'brutalist',
// 'cluely-style', 'dark-glowing', 'black-neon-glow'

// src/styles/templates/index.js imports only:
// appleMinimal, minimalistClean, swissDesign, editorialMagazine, cluelyStyle,
// memphisDesign, handDrawnSketch, brutalist, darkGlowing, blackNeonGlow
// MISSING: appleKeynoteLight
```

**Impact:** MEDIUM - Users cannot select Apple Keynote Light style in VisualBuilder

---

## BUG #4: Low - Gradient Background Invalid in Cheat-Sheet Footer

**Title:** Invalid Tailwind gradient class `to-blue-25` in cheat-sheet preview

**Environment:**
- File: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/cheat-sheet.js` (line 148)

**Steps to Reproduce:**
1. Create a cheat-sheet with a footer
2. View the React preview component
3. Inspect the footer gradient

**Expected Behavior:**
Footer should have a gradient from blue-50 to a lighter shade

**Actual Behavior:**
`to-blue-25` is not a valid Tailwind class. Tailwind only includes 50, 100, 200... 900 shades by default.

**Code Evidence:**
```javascript
// cheat-sheet.js line 148
<div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-blue-25 rounded-xl text-center">
```

**Impact:** LOW - Minor visual issue, gradient will fallback to no second color

**Recommended Fix:**
```javascript
<div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-white rounded-xl text-center">
```

---

## BUG #5: Low - Invalid border-l-3 Class in Blueprint Preview

**Title:** Invalid Tailwind class `border-l-3` in blueprint preview

**Environment:**
- File: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/blueprint.js` (line 139)

**Steps to Reproduce:**
1. Create a blueprint with steps that have tips
2. View the React preview component
3. Inspect the Pro Tip box left border

**Expected Behavior:**
Left border should be 3px wide

**Actual Behavior:**
`border-l-3` is not a valid Tailwind class. Valid classes are `border-l`, `border-l-2`, `border-l-4`, `border-l-8`.

**Code Evidence:**
```javascript
// blueprint.js line 139
<div className="bg-gray-50 border-l-3 border-blue-600 pl-4 py-3 rounded-r-lg">
```

**Impact:** LOW - Minor visual issue, border will not render correctly

**Recommended Fix:**
```javascript
<div className="bg-gray-50 border-l-4 border-blue-600 pl-4 py-3 rounded-r-lg">
```
Or add custom value to Tailwind config.

---

## BUG #6: Low - Inconsistent Item Handling in Checklist

**Title:** Checklist template handles items inconsistently between HTML and React

**Environment:**
- File: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/checklist.js`

**Steps to Reproduce:**
1. Pass items array as simple strings: `['Item 1', 'Item 2']`
2. Generate both HTML and React preview

**Expected Behavior:**
Both should handle the data the same way

**Actual Behavior:**
Both handle it correctly with `item.text || item`, but the fallback for `item.note` will be `undefined` for string items rather than empty string in HTML template.

**Code Evidence:**
```javascript
// Line 70 in HTML template - handles both formats
<span style="...">${item.text || item}</span>

// Line 80 - note access on string will be undefined
<div style="...">${item.note || ''}</div>
```

**Impact:** LOW - Works correctly due to `|| ''` fallback, but data structure documentation is unclear

---

## Overall Assessment

| Category | Status |
|----------|--------|
| Format Templates Export | PASS - All 6 formats correctly exported from index.js |
| Format Templates generateHTML | PASS - All 6 have generateHTML functions |
| Style Templates Definitions | PASS - All 11 styles have proper CSS properties |
| getStyle/getStyleList Functions | PASS - Functions work correctly |
| Syntax Errors | PASS - No syntax errors found |
| VisualBuilder Integration | FAIL - Format templates not integrated |
| Dynamic Tailwind Classes | FAIL - Will not compile |

---

## Recommendations

1. **HIGH PRIORITY:** Integrate format templates (checklist, worksheet, planner, swipe-file, blueprint, cheat-sheet) into VisualBuilder so users can select them
2. **HIGH PRIORITY:** Fix dynamic Tailwind classes in planner.js and cheat-sheet.js
3. **MEDIUM PRIORITY:** Add apple-keynote-light template to `/src/styles/templates/`
4. **LOW PRIORITY:** Fix invalid Tailwind classes (border-l-3, to-blue-25)

---

## Files Reviewed for Test Group 3

| File Path | Status |
|-----------|--------|
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/index.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/checklist.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/worksheet.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/planner.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/swipe-file.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/blueprint.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/formats/cheat-sheet.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/templates/styles/index.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/styles/templates/index.js` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/pages/VisualBuilder.jsx` | REVIEWED |
| `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/src/lib/pdf-generator.js` | REVIEWED |

---

**QA Sign-off:** NOT APPROVED

Critical integration issues must be resolved before this feature can be considered complete. The format templates exist but are not accessible from the UI.
