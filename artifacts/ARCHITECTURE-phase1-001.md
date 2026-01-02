# ARCHITECTURE: Phase 1 Foundation
**Task ID:** phase1-001
**Date:** 2025-01-02
**Requirements Reference:** docs/04-IMPLEMENTATION-PHASES.md (Phase 1)

## Approach Summary
Set up a React + Vite application with Tailwind CSS, configure Supabase for authentication and database, and build the foundational UI components (dashboard layout, profile management, audience management). This establishes the core infrastructure for all subsequent phases.

## Files to Create

### Project Configuration
| File Path | Purpose |
|-----------|---------|
| `/package.json` | Project dependencies |
| `/vite.config.js` | Vite configuration |
| `/tailwind.config.js` | Tailwind CSS configuration |
| `/postcss.config.js` | PostCSS configuration |
| `/.env` | Environment variables (local only) |
| `/.env.example` | Environment template |
| `/.gitignore` | Git ignore rules |
| `/netlify.toml` | Netlify deployment configuration |
| `/index.html` | HTML entry point |

### Source Files - Core
| File Path | Purpose |
|-----------|---------|
| `/src/main.jsx` | React entry point |
| `/src/App.jsx` | Root component with router |
| `/src/index.css` | Global styles with Tailwind |

### Source Files - Library
| File Path | Purpose |
|-----------|---------|
| `/src/lib/supabase.js` | Supabase client initialization |
| `/src/lib/utils.js` | Helper functions |

### Source Files - Hooks
| File Path | Purpose |
|-----------|---------|
| `/src/hooks/useAuth.js` | Authentication state hook |
| `/src/hooks/useProfiles.js` | Profile CRUD operations |
| `/src/hooks/useAudiences.js` | Audience CRUD operations |

### Source Files - UI Components
| File Path | Purpose |
|-----------|---------|
| `/src/components/ui/Button.jsx` | Reusable button component |
| `/src/components/ui/Input.jsx` | Form input with label/error |
| `/src/components/ui/Card.jsx` | Card container component |
| `/src/components/ui/Loading.jsx` | Loading spinner |
| `/src/components/ui/Toast.jsx` | Toast notifications |
| `/src/components/ui/Modal.jsx` | Modal dialog component |

### Source Files - Auth Components
| File Path | Purpose |
|-----------|---------|
| `/src/components/auth/LoginForm.jsx` | Login form |
| `/src/components/auth/SignupForm.jsx` | Signup form |
| `/src/components/auth/ProtectedRoute.jsx` | Auth route wrapper |

### Source Files - Layout Components
| File Path | Purpose |
|-----------|---------|
| `/src/components/layout/Sidebar.jsx` | Navigation sidebar |
| `/src/components/layout/DashboardLayout.jsx` | Main layout wrapper |
| `/src/components/layout/MobileMenu.jsx` | Responsive mobile menu |

### Source Files - Profile Components
| File Path | Purpose |
|-----------|---------|
| `/src/components/profiles/ProfileList.jsx` | Display all profiles |
| `/src/components/profiles/ProfileForm.jsx` | Create/edit profile form |
| `/src/components/profiles/ProfileCard.jsx` | Single profile display |

### Source Files - Audience Components
| File Path | Purpose |
|-----------|---------|
| `/src/components/audiences/AudienceList.jsx` | Display all audiences |
| `/src/components/audiences/AudienceForm.jsx` | Create/edit audience form |
| `/src/components/audiences/AudienceCard.jsx` | Single audience display |

### Source Files - Pages
| File Path | Purpose |
|-----------|---------|
| `/src/pages/Login.jsx` | Login page |
| `/src/pages/Signup.jsx` | Signup page |
| `/src/pages/Dashboard.jsx` | Main dashboard |
| `/src/pages/Profiles.jsx` | Profile management page |
| `/src/pages/Audiences.jsx` | Audience management page |
| `/src/pages/FunnelBuilder.jsx` | Placeholder for Phase 2 |
| `/src/pages/LeadMagnetBuilder.jsx` | Placeholder for Phase 2 |
| `/src/pages/VisualBuilder.jsx` | Placeholder for Phase 3 |
| `/src/pages/History.jsx` | Placeholder for Phase 4 |

## Files NOT to Touch
- All files in `/docs/` - Documentation only
- All files in `/agents/` - Agent definitions only
- `/CLAUDE.md` - Development instructions
- `/VISION.md` - Project vision
- `/PROJECT-STATUS.md` - Will be updated by Progress Tracker only

## Technical Decisions

### 1. React Router DOM v6
**Decision:** Use React Router v6 with createBrowserRouter
**Rationale:** Standard approach, supports nested layouts, works well with Netlify
**Alternatives Considered:** Tanstack Router (newer but less documentation), Next.js (overkill for SPA)

### 2. Supabase Auth with Email/Password
**Decision:** Use Supabase's built-in email/password auth
**Rationale:** Simplest approach, integrates seamlessly with RLS, no additional providers needed
**Alternatives Considered:** Magic links (slower UX), OAuth (unnecessary complexity for MVP)

### 3. Context API for Auth State
**Decision:** Use React Context for global auth state
**Rationale:** Built-in React, no extra dependencies, sufficient for single-user auth state
**Alternatives Considered:** Zustand (external dependency), Redux (overkill)

### 4. Component Colocation
**Decision:** Colocate related components (profiles/, audiences/, auth/)
**Rationale:** Easier navigation, clear ownership, matches existing folder structure spec
**Alternatives Considered:** Flat components folder (harder to find related files)

## Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "tailwindcss": "^3.x",
    "vite": "^5.x"
  }
}
```

## Supabase Tables Required (from 03-DATABASE-SCHEMA.md)
1. `profiles` - User business profiles with branding
2. `audiences` - Target audience definitions

## Supabase Storage Buckets Required
1. `logos` - Profile logos
2. `photos` - Profile photos

## Risks and Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase connection issues | Low | High | Test connection early, clear error messages |
| RLS policy misconfiguration | Medium | High | Test with multiple users before proceeding |
| File upload failures | Low | Medium | Validate file type/size client-side first |
| Mobile responsive issues | Medium | Medium | Test on mobile during development, not after |

## Phase 1 Acceptance Criteria
1. [ ] User can sign up with email/password
2. [ ] User can log in/log out
3. [ ] Protected routes redirect unauthenticated users
4. [ ] User can create/edit/delete profiles
5. [ ] User can upload logo and photo to profile
6. [ ] User can create/edit/delete audiences
7. [ ] Sidebar navigation works on desktop and mobile
8. [ ] Data persists in Supabase
9. [ ] RLS ensures users only see their own data

## Approval Checklist
- [x] Approach is the simplest that meets requirements
- [x] No unnecessary complexity
- [x] Fits existing codebase patterns (first code, establishing patterns)
- [x] Risks are acceptable

**Status:** APPROVED

---
*Architecture reviewed and approved. Development may proceed with the approach documented above.*
