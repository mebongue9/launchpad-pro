# BUG REPORT - Test Group 2: Email Sequences, Marketplace Listings, Bundles

**Date:** 2026-01-04
**Tested By:** QA Tester Bot
**Environment:** Code Review (localhost:5173)
**Severity Legend:** CRITICAL | HIGH | MEDIUM | LOW

---

## CRITICAL BUG #1: Components Not Integrated Into UI

### Title
EmailSequencePreview, MarketplaceListings, and BundlePreview components are NOT integrated anywhere in the application

### Environment
- URL: http://localhost:5173
- Application: Launchpad Pro
- Files Affected:
  - `/src/components/funnel/EmailSequencePreview.jsx`
  - `/src/components/funnel/MarketplaceListings.jsx`
  - `/src/components/funnel/BundlePreview.jsx`

### Steps to Reproduce
1. Navigate to any page in the application
2. Look for Email Sequences, Marketplace Listings, or Bundle features
3. No UI elements exist to access these features

### Expected Behavior
These components should be integrated into the Funnel Builder page or a dedicated Funnel Detail page so users can:
- Generate email sequences for their funnels
- Create marketplace listings (Etsy/Gumroad)
- Generate bundle listings

### Actual Behavior
The components exist but are NOT imported or rendered anywhere in the application. Running a grep search for these component names only returns their own files:
```
Found 5 files
src/components/funnel/BundlePreview.jsx
src/hooks/useBundles.js
src/components/funnel/MarketplaceListings.jsx
src/hooks/useMarketplaceListings.js
src/components/funnel/EmailSequencePreview.jsx
```

The FunnelBuilder.jsx page does NOT import or use these components. There is no Funnel Detail page where they could be rendered.

### Console/Network Errors
N/A - Components never load because they are not integrated

### Logs/IDs
- App.jsx routes do not include a funnel detail route
- FunnelBuilder.jsx imports do not include these components

### Impact
**CRITICAL** - Users cannot access email generation, marketplace listing, or bundle features despite the backend functions existing and being fully implemented.

---

## HIGH BUG #2: useEmailSequences Hook File Extension Mismatch

### Title
useEmailSequences.js imports useAuth.js but useAuth is defined in useAuth.jsx

### Environment
- File: `/src/hooks/useEmailSequences.js`
- Line: 8

### Steps to Reproduce
1. Open `/src/hooks/useEmailSequences.js`
2. Review the import statement: `import { useAuth } from './useAuth'`
3. Check that the actual file is `useAuth.jsx` not `useAuth.js`

### Expected Behavior
Import should resolve correctly regardless of extension due to Vite's module resolution.

### Actual Behavior
The file `useAuth.jsx` exists but is being imported without the extension. While Vite typically handles this, it creates inconsistency in the codebase. The file extension in the header comment says `.js` but component is `.jsx`.

### Impact
**MEDIUM** - May work in development but could cause issues in certain build configurations or with stricter module resolution settings.

---

## MEDIUM BUG #3: Missing Error Handling for Clipboard API

### Title
Copy-to-clipboard functionality may fail silently on unsupported browsers

### Environment
- Files:
  - `/src/components/funnel/EmailSequencePreview.jsx` (lines 24-28)
  - `/src/components/funnel/MarketplaceListings.jsx` (lines 26-30)
  - `/src/components/funnel/BundlePreview.jsx` (lines 25-29)

### Steps to Reproduce
1. Open any of the preview components
2. Click a "Copy" button
3. If clipboard API is not available (older browsers, insecure context), the operation fails silently

### Expected Behavior
Error should be caught and user notified that copy failed.

### Actual Behavior
```javascript
const handleCopy = async () => {
  await navigator.clipboard.writeText(text)  // No try-catch
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```
No try-catch block around the clipboard API call. If it fails, the promise rejection is unhandled.

### Impact
**MEDIUM** - Poor user experience on unsupported browsers or in non-HTTPS contexts.

---

## MEDIUM BUG #4: Potential Null Reference in MarketplaceListings

### Title
Character count display may crash if listing fields are undefined

### Environment
- File: `/src/components/funnel/MarketplaceListings.jsx`
- Lines: 101, 117, 134

### Steps to Reproduce
1. If API returns a listing with missing `marketplace_title`, `etsy_description`, or `normal_description`
2. Component attempts to call `.length` on undefined
3. Application crashes

### Expected Behavior
Safe null checks before accessing `.length` property.

### Actual Behavior
```javascript
<span className="text-xs text-gray-400">
  ({listing.marketplace_title.length}/140 chars)
</span>
```
If `listing.marketplace_title` is undefined or null, calling `.length` will throw a TypeError.

### Impact
**MEDIUM** - Application could crash if API response is malformed.

---

## MEDIUM BUG #5: Missing Loading State in useMarketplaceListings Hook

### Title
useMarketplaceListings hook does not provide a loading state for fetchListings

### Environment
- File: `/src/hooks/useMarketplaceListings.js`

### Steps to Reproduce
1. Call `fetchListings(funnelId)`
2. There is no `loading` state to indicate data is being fetched

### Expected Behavior
Hook should provide a `loading` state similar to `generating` state.

### Actual Behavior
```javascript
export function useMarketplaceListings() {
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)  // Only generating state
  const [error, setError] = useState(null)
  // Missing: const [loading, setLoading] = useState(false)
```
The `fetchListings` function has no loading indicator. Compare with `useBundles.js` which correctly provides `loading` state.

### Impact
**MEDIUM** - UI cannot show loading spinner while fetching existing marketplace listings.

---

## LOW BUG #6: Inconsistent Export Pattern

### Title
EmailSequencePreview uses default export while hooks use named exports

### Environment
- Files:
  - `/src/components/funnel/EmailSequencePreview.jsx` - `export default function`
  - `/src/hooks/useEmailSequences.js` - `export function`

### Steps to Reproduce
Compare export statements across files.

### Expected Behavior
Consistent export pattern throughout the codebase.

### Actual Behavior
Components use default exports, hooks use named exports. This is actually a reasonable pattern but worth documenting.

### Impact
**LOW** - No functional impact, just consistency observation.

---

## LOW BUG #7: Bundle Price Calculation May Produce Unexpected Results

### Title
Bundle price calculation rounds to nearest integer which may not match user expectations

### Environment
- File: `/netlify/functions/generate-bundle-listings.js`
- Line: 104

### Steps to Reproduce
1. Create a funnel with products totaling $33
2. Bundle price = Math.round(33 * 0.45) = Math.round(14.85) = 15

### Expected Behavior
Documentation or UI should clarify the pricing calculation method.

### Actual Behavior
```javascript
const bundlePrice = Math.round(totalIndividualPrice * 0.45);
```
The 45% is described as "~45% of total value" but the rounding could be confusing for users.

### Impact
**LOW** - Pricing works correctly but may not match exact user expectations.

---

## SUMMARY

| Bug ID | Severity | Status | Component |
|--------|----------|--------|-----------|
| #1 | CRITICAL | Open | UI Integration |
| #2 | MEDIUM | Open | useEmailSequences.js |
| #3 | MEDIUM | Open | All Preview Components |
| #4 | MEDIUM | Open | MarketplaceListings.jsx |
| #5 | MEDIUM | Open | useMarketplaceListings.js |
| #6 | LOW | Open | Export Pattern |
| #7 | LOW | Open | Bundle Pricing |

---

## RECOMMENDATION

**DO NOT SHIP** until Critical Bug #1 is resolved. The core features (email sequences, marketplace listings, bundles) are completely inaccessible to users despite being fully implemented in the backend.

### Required Fix for Bug #1:
Either:
1. Create a new `FunnelDetail.jsx` page that displays these components when viewing a specific funnel
2. Add these components to the existing FunnelBuilder.jsx after a funnel is saved
3. Create a dedicated content generation page accessible from the funnel list

The Netlify functions, React hooks, and UI components are all properly structured and should work once integrated.
