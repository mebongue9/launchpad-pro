# Implementation Phases

## Overview

This project is divided into 4 phases. Each phase should be completed and tested before moving to the next. This prevents scope creep and ensures a stable foundation.

**Estimated Total Time:** 2-3 weeks of focused development

---

## Phase 1: Foundation (Days 1-3)

### Goal
Get the basic app running with authentication and data management.

### Tasks

#### 1.1 Project Setup
- [ ] Create new Vite + React project
- [ ] Install dependencies:
  - `@supabase/supabase-js`
  - `react-router-dom`
  - `tailwindcss` + setup
  - `lucide-react` (icons)
- [ ] Configure Tailwind
- [ ] Set up folder structure (see Technical Architecture)
- [ ] Create `.env` file with Supabase credentials
- [ ] Configure Netlify deployment

#### 1.2 Supabase Setup
- [ ] Create Supabase project
- [ ] Run database schema SQL (all tables)
- [ ] Create storage buckets (logos, photos, outputs)
- [ ] Set up RLS policies
- [ ] Test database connection from app

#### 1.3 Authentication
- [ ] Create `lib/supabase.js` client
- [ ] Build Login page + form
- [ ] Build Signup page + form
- [ ] Create `ProtectedRoute` component
- [ ] Implement auth state management
- [ ] Add logout functionality
- [ ] Test full auth flow

#### 1.4 Basic Layout
- [ ] Create Dashboard layout with sidebar
- [ ] Build navigation (Profiles, Audiences, Funnels, Lead Magnets, History)
- [ ] Create placeholder pages for each section
- [ ] Add responsive mobile menu

#### 1.5 Profile Management
- [ ] Build ProfileList component (shows all profiles)
- [ ] Build ProfileForm component (create/edit)
- [ ] Implement CRUD operations via Supabase
- [ ] Add logo/photo upload to Supabase Storage
- [ ] Test creating, editing, deleting profiles

#### 1.6 Audience Management
- [ ] Build AudienceList component
- [ ] Build AudienceForm component
- [ ] Implement CRUD operations
- [ ] Test creating, editing, deleting audiences

### Phase 1 Deliverable
A working app where users can:
- Sign up / log in
- Create and manage profiles with branding
- Create and manage audiences
- Navigate between sections

---

## Phase 2: Core AI Features (Days 4-8)

### Goal
Implement the funnel builder and lead magnet builder with Claude API integration.

### Tasks

#### 2.1 Netlify Functions Setup
- [ ] Create `/netlify/functions/` directory
- [ ] Set up first test function
- [ ] Configure environment variables in Netlify
- [ ] Test function deployment

#### 2.2 Claude API Integration
- [ ] Create `lib/claude.js` helper
- [ ] Build function to call Claude API
- [ ] Handle streaming (optional) or standard responses
- [ ] Error handling and retries

#### 2.3 Funnel Strategist
- [ ] Create `/api/generate-funnel` function
- [ ] Port funnel strategist prompt (from prompts doc)
- [ ] Build FunnelBuilder page UI:
  - Profile selector dropdown
  - Audience selector dropdown
  - Existing product selector (optional)
  - "Generate Funnel" button
  - Loading state
  - Funnel preview display
- [ ] Implement approve/edit flow
- [ ] Save approved funnel to database

#### 2.4 Content Generator
- [ ] Create `/api/generate-content` function
- [ ] Port product builder prompt
- [ ] Build content generation UI:
  - Show each product in funnel
  - "Generate Content" button per product
  - Content preview
  - Edit capability
- [ ] Save generated content to funnel record

#### 2.5 Lead Magnet Builder
- [ ] Create `/api/generate-lead-magnet-ideas` function
- [ ] Create `/api/generate-lead-magnet-content` function
- [ ] Port lead magnet strategist prompt
- [ ] Build LeadMagnetBuilder page UI:
  - Select funnel (or front-end product)
  - Show 3 AI-generated ideas
  - Pick one
  - Generate full content
  - Preview and approve
- [ ] Save to database
- [ ] Track used topics in topics_used table

#### 2.6 Existing Products
- [ ] Build ExistingProductList component
- [ ] Build ExistingProductForm component
- [ ] Implement CRUD operations
- [ ] Link to funnel builder as upsell option

### Phase 2 Deliverable
A working app where users can:
- Generate complete funnel architectures via AI
- Generate content for each funnel product
- Generate lead magnets that connect to funnels
- Everything saved to database

---

## Phase 3: Visual Builder (Days 9-14)

### Goal
Transform content into beautiful designed PDFs and presentations.

### Tasks

#### 3.1 Style Templates
- [ ] Create `/src/styles/templates/` directory
- [ ] Port and adapt 12 style templates from Zane's collection:
  - apple-minimal.js
  - apple-keynote-light.js
  - minimalist-clean.js
  - white-pops-color.js
  - swiss-design.js
  - editorial-magazine.js
  - memphis-design.js
  - hand-drawn-sketch.js
  - brutalist.js
  - cluely-style.js
  - dark-glowing.js
  - black-neon-glow.js
- [ ] Each template exports:
  - CSS styles
  - HTML structure template
  - Slide/page layout rules

#### 3.2 Visual Builder API
- [ ] Create `/api/generate-visual` function
- [ ] Port visual builder prompt (from prompts doc)
- [ ] Accept content + style + branding
- [ ] Return complete HTML

#### 3.3 PDF Conversion
- [ ] Research best approach:
  - Option A: Puppeteer in Netlify Function (may have limits)
  - Option B: External service (html2pdf API)
  - Option C: Client-side (html2canvas + jsPDF)
- [ ] Implement chosen approach
- [ ] Create `/api/convert-pdf` function
- [ ] Upload PDF to Supabase Storage
- [ ] Return URL

#### 3.4 Visual Builder UI
- [ ] Build VisualBuilder page:
  - Select what to design (funnel product or lead magnet)
  - Style selector with previews
  - "Generate" button
  - Live preview of HTML
  - "Download PDF" button
  - "Download HTML" button
- [ ] Loading states for generation
- [ ] Error handling

#### 3.5 Branding Integration
- [ ] Pull logo/photo from profile
- [ ] Insert name, tagline, handle into generated content
- [ ] Apply brand colors if set

#### 3.6 Save to History
- [ ] After generation, save to creations table
- [ ] Store HTML URL and PDF URL
- [ ] Generate thumbnail (optional)

### Phase 3 Deliverable
A working app where users can:
- Select content and style
- Generate beautiful HTML
- Convert to PDF
- Download both formats
- See outputs in creation history

---

## Phase 4: Polish & Presentation Mode (Days 15-18)

### Goal
Add presentation mode, improve UX, and prepare for launch.

### Tasks

#### 4.1 Presentation Mode
- [ ] Build PresentationMode component
- [ ] Full-screen HTML display
- [ ] Keyboard navigation (arrows, spacebar)
- [ ] Slide counter / progress indicator
- [ ] Exit button (ESC key)
- [ ] Launch from History or Visual Builder

#### 4.2 Creation History
- [ ] Build History page with grid view
- [ ] Show thumbnails of all creations
- [ ] Filter by type (products, lead magnets, presentations)
- [ ] Sort by date
- [ ] Quick actions: Present, Download PDF, Download HTML, Delete

#### 4.3 UX Improvements
- [ ] Add toast notifications for actions
- [ ] Improve loading states (skeleton screens)
- [ ] Add confirmation modals for destructive actions
- [ ] Form validation with helpful error messages
- [ ] Empty states for lists

#### 4.4 Dashboard
- [ ] Build stats cards:
  - Total funnels created
  - Total lead magnets
  - Total creations
  - Recent activity
- [ ] Quick action buttons
- [ ] Recent creations preview

#### 4.5 Settings Page
- [ ] Account settings (email, password change)
- [ ] Usage stats
- [ ] Delete account option

#### 4.6 Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Fix any layout issues
- [ ] Ensure touch interactions work

#### 4.7 Final Testing
- [ ] Full user journey test
- [ ] Test all edge cases
- [ ] Performance check
- [ ] Fix any bugs

### Phase 4 Deliverable
A polished, production-ready app with:
- Presentation mode
- Complete history management
- Great UX across devices
- Ready for real users

---

## Post-Launch Enhancements (Future)

These are NOT part of the initial build but can be added later:

- [ ] Team/collaboration features
- [ ] Custom style template builder
- [ ] Video export for presentations
- [ ] Integration with LMS platforms
- [ ] Bulk generation
- [ ] Analytics dashboard
- [ ] White-label options

---

## Development Tips

### For Each Phase:
1. Read ALL relevant docs before starting
2. Build the simplest version first
3. Test thoroughly before moving on
4. Commit frequently with clear messages
5. Don't add features not in the spec

### Common Pitfalls to Avoid:
- Don't optimize prematurely
- Don't add "nice to have" features during initial build
- Don't skip error handling
- Don't forget mobile responsiveness
- Don't hardcode values that should be configurable

### Testing Checklist (Use for Each Feature):
- [ ] Happy path works
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Works on mobile
- [ ] Data persists correctly
- [ ] Auth protected where needed
