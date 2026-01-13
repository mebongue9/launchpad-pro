# Session 19 Handoff - Background Function Architecture for PDF Generation

## Date: 2026-01-13

## Summary
Implemented Netlify Background Functions architecture for high-quality PDF generation using Puppeteer. The architecture is complete and deployed, but the background function is timing out on Netlify's free tier.

## What Was Accomplished

### 1. Background Function Architecture
Created a job-based architecture with three components:
- **visual-builder-generate.js** - Job starter that creates a styled_products record and returns jobId immediately (202 Accepted)
- **visual-builder-generate-background.js** - Heavy processing function for Puppeteer PDF generation
- **visual-builder-status.js** - Polling endpoint to check job completion status

### 2. Frontend Polling Implementation
Updated `VisualBuilder.jsx` to:
- Start generation and receive jobId
- Poll `/api/visual-builder-status?jobId=xxx` every 2 seconds
- Show "Generating PDF..." status during processing
- Handle completion/failure states

### 3. Netlify Configuration
Updated `netlify.toml`:
- Added `puppeteer-core` to `external_node_modules` (required for esbuild bundling)
- Configured `included_files` for both chromium and puppeteer-core

## Current Issue

**Background function timeout**: The background function is not completing. The job stays in "processing" status indefinitely.

### Root Cause Analysis
Netlify Background Functions only get extended timeout (15 minutes) when:
1. Invoked directly by Netlify's infrastructure (webhooks, scheduled triggers)
2. NOT when called via HTTP from another function

The current implementation calls the background function via HTTP fetch, which means it's treated as a regular function call and subject to the 10-second timeout on the free tier.

### Evidence
- Job status remains "processing" after 2+ minutes
- Polling works correctly (many GET requests to status endpoint)
- Direct curl to background function also doesn't complete

## Files Changed This Session

1. **netlify/functions/visual-builder-generate.js** - Rewritten as job starter
2. **netlify/functions/visual-builder-generate-background.js** - NEW: Background PDF processor
3. **netlify/functions/visual-builder-status.js** - NEW: Status polling endpoint
4. **netlify.toml** - Added puppeteer-core config
5. **src/pages/VisualBuilder.jsx** - Added polling logic
6. **src/components/visual-builder/PreviewPanel.jsx** - Added generationStatus prop

## Options for Resolution

### Option 1: Use External PDF API (Recommended for Production)
Services like:
- **PDFShift** ($9/mo for 500 PDFs)
- **DocRaptor** ($15/mo)
- **Browserless.io** ($45/mo)

These provide reliable, fast PDF generation without timeout concerns.

### Option 2: Upgrade to Netlify Pro
- Pro plan extends function timeout to 26 seconds (still may not be enough for Puppeteer)
- Background functions get true 15-minute timeout when properly invoked

### Option 3: Use Netlify Scheduled Functions
- Implement a queue in Supabase
- Use scheduled function to process queue periodically
- More complex but works on free tier

### Option 4: Simplify PDF Generation
- Pre-render content as simple HTML
- Use lightweight PDF library (like jsPDF) server-side
- Sacrifice some quality for speed

## Commits Made
1. `88cac8e` - feat: Implement background function architecture for PDF generation
2. `cf78d34` - fix: Add puppeteer-core to external modules for Netlify bundling

## Next Steps
1. Choose a resolution option from above
2. If using external API: Create API integration and update background function
3. If using Netlify Pro: Test if 26s is sufficient or if true background invocation is needed
4. Consider adding queue-based processing for reliability

## Testing Notes
The frontend polling and job tracking work correctly. The issue is purely in the background function execution timing out.
