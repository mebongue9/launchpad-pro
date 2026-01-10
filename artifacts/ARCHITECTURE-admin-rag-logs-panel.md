# ARCHITECTURE: Admin Real-Time RAG Logs Panel

**Task:** Add admin-only UI panel to view RAG retrieval logs in real-time
**Approved by:** User (SPEC-ADMIN-RAG-LOGS-PANEL.md)
**Date:** 2026-01-10

## Problem Statement

Currently, verifying RAG functionality requires terminal logs or database queries. Admin needs a visual indicator showing RAG status during generation.

## Solution

Add a READ-ONLY collapsible panel that:
- Shows real-time RAG retrieval logs during generation
- Displays status indicator (green = working, red = failed)
- Only visible to admin users
- Polls `rag_retrieval_logs` table every 2.5 seconds

## Files to Create

### 1. `/src/components/AdminRagLogsPanel.jsx`
React component that:

### 2. `/directives/admin-rag-logs-panel.md`
Directive documenting lessons learned and usage instructions for this feature.
- Checks if user is admin (via admin_users table)
- Fetches from `rag_retrieval_logs` table
- Displays status indicator and collapsible log details
- Auto-expands on error with copy button

## Files to Modify

### 2. `/src/pages/FunnelBuilder.jsx`
- Import AdminRagLogsPanel
- Add panel after generation progress section
- Pass `isGenerating` prop

### 3. `/src/pages/LeadMagnetBuilder.jsx`
- Import AdminRagLogsPanel
- Add panel after generation progress sections
- Pass `isGenerating` prop (leadMagnetJob.isActive || funnelJob.isActive)

## What NOT to Modify

- ❌ No changes to `rag_retrieval_logs` table schema
- ❌ No changes to any RAG/vector search logic
- ❌ No changes to any generation functions
- ❌ No changes to `batched-generators.js`
- ❌ No changes to `knowledge-search.js`

This is a READ-ONLY UI feature.

## Security

- Component only renders for admin users
- Admin check queries `admin_users` table
- Uses existing Supabase RLS policies
