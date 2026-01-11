# Codebase Structure

**Analysis Date:** 2026-01-11

## Directory Layout

```
launchpad-pro/
├── src/                    # Frontend React application
│   ├── components/         # UI components by feature
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and clients
│   ├── pages/              # Route page components
│   ├── prompts/            # Claude prompt templates
│   ├── styles/             # Design template styles
│   ├── templates/          # PDF format templates
│   ├── App.jsx             # Route configuration
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── netlify/                # Backend serverless functions
│   └── functions/          # Netlify Functions
│       ├── lib/            # Shared backend utilities
│       └── utils/          # Helper utilities
├── e2e/                    # Playwright E2E tests
├── supabase/               # Database config and migrations
│   └── migrations/         # SQL migration files
├── public/                 # Static assets
├── docs/                   # Project documentation
├── dist/                   # Built output (gitignored)
└── .planning/              # Planning documents
```

## Directory Purposes

**src/components/**
- Purpose: Feature-organized React components
- Contains: 16 subdirectories with related components
- Key subdirectories:
  - `ui/` - Base components: Button, Card, Input, Modal, Toast, Loading
  - `auth/` - ProtectedRoute, AdminRoute, LoginForm, SignupForm
  - `layout/` - DashboardLayout, Sidebar
  - `profiles/` - ProfileForm, ProfileCard
  - `audiences/` - AudienceForm, AudienceCard
  - `funnel/` - FunnelCard, FunnelFilters, DocumentGenerationProgress
  - `generation/` - BatchedGenerationManager, BatchedGenerationProgress
  - `editor/` - ContentEditor (TinyMCE wrapper)
  - `admin/` - CreateUserModal, EditUserModal, UserList
  - `export/` - ExportButtons
  - `settings/` - FavoriteLanguagesManager, GenerationSettingsSection

**src/hooks/**
- Purpose: Custom React hooks for state and data management
- Contains: 14 hook files
- Key files:
  - `useAuth.jsx` - Authentication state and methods
  - `useProfiles.jsx` - Profile CRUD operations
  - `useAudiences.jsx` - Audience CRUD operations
  - `useFunnels.jsx` - Funnel CRUD and generation
  - `useLeadMagnets.jsx` - Lead magnet CRUD
  - `useGenerationJob.jsx` - Job status polling
  - `useBatchedGeneration.jsx` - Multi-chunk generation (deprecated)
  - `useAdmin.jsx` - Admin user management

**src/pages/**
- Purpose: Top-level route components (13 pages)
- Contains: One component per route
- Key files:
  - `Dashboard.jsx` - Overview and stats
  - `FunnelBuilder.jsx` - Funnel generation UI
  - `LeadMagnetBuilder.jsx` - Lead magnet creation
  - `VisualBuilder.jsx` - PDF template selection
  - `Profiles.jsx`, `Audiences.jsx` - Data management
  - `Settings.jsx` - User preferences
  - `Admin.jsx` - Admin controls
  - `Login.jsx`, `Signup.jsx` - Auth pages

**src/lib/**
- Purpose: Shared utilities and client initialization
- Contains: 4 utility files
- Key files:
  - `supabase.js` - Supabase client initialization
  - `utils.js` - Helpers (formatDate, truncate, parseFunnelText)
  - `languages.js` - Multi-language support (40+ languages)
  - `pdf-generator.js` - HTML to PDF conversion

**netlify/functions/**
- Purpose: Serverless backend API
- Contains: 40+ function handlers
- Key files:
  - `generate-funnel.js` - Funnel architecture generation
  - `generate-lead-magnet-ideas.js` - Lead magnet ideation
  - `start-generation.js` - Create async job
  - `check-job-status.js` - Poll job progress
  - `process-generation-background.js` - Background processor
  - `admin-*.js` - Admin CRUD operations
  - `vector-search.js` - RAG similarity search

**netlify/functions/lib/**
- Purpose: Shared utilities for backend functions
- Key files:
  - `batched-generators.js` - 14 content generation functions (1,466 lines)
  - `knowledge-search.js` - RAG/vector search with metrics
  - `admin-auth.js` - Admin role verification
  - `retry-engine.js` - Exponential backoff retry
  - `task-orchestrator.js` - Generation task sequencing

## Key File Locations

**Entry Points:**
- `src/main.jsx` - React app initialization
- `src/App.jsx` - Route configuration
- `netlify/functions/*.js` - API entry points (one per function)

**Configuration:**
- `vite.config.js` - Vite build config
- `tailwind.config.js` - Tailwind design tokens
- `postcss.config.js` - PostCSS plugins
- `netlify.toml` - Netlify deployment config
- `playwright.config.js` - E2E test config
- `.env` - Environment variables (gitignored)
- `.env.example` - Environment variable template

**Core Logic:**
- `src/hooks/useFunnels.jsx` - Funnel state management
- `src/hooks/useGenerationJob.jsx` - Job polling
- `netlify/functions/lib/batched-generators.js` - Content generation
- `netlify/functions/lib/knowledge-search.js` - RAG search

**Testing:**
- `e2e/lead-magnet-test.spec.js` - E2E test file
- `playwright.config.js` - Test configuration

## Naming Conventions

**Files:**
- PascalCase.jsx: React components (`ProfileForm.jsx`, `Dashboard.jsx`)
- camelCase.jsx: React hooks (`useAuth.jsx`, `useFunnels.jsx`)
- kebab-case.js: Utilities and functions (`pdf-generator.js`, `admin-check.js`)
- UPPERCASE.md: Important docs (`CLAUDE.md`, `VISION.md`)

**Directories:**
- kebab-case: All directories (`existing-products/`, `lead-magnets/`)
- Plural for collections: `components/`, `hooks/`, `functions/`

**Special Patterns:**
- `use*.jsx`: React hooks
- `*-background.js`: Background functions (15-min timeout)
- `admin-*.js`: Admin-only endpoints
- `generate-*.js`: Generation endpoints

## Where to Add New Code

**New Feature:**
- Primary code: `src/pages/NewFeature.jsx` + `src/components/new-feature/`
- State hook: `src/hooks/useNewFeature.jsx`
- API function: `netlify/functions/new-feature.js`
- Tests: `e2e/new-feature.spec.js`

**New Component:**
- Implementation: `src/components/{feature}/ComponentName.jsx`
- If shared UI: `src/components/ui/ComponentName.jsx`

**New API Endpoint:**
- Handler: `netlify/functions/endpoint-name.js`
- Shared logic: `netlify/functions/lib/endpoint-helpers.js`

**New Format Template:**
- Template: `src/templates/formats/format-name.jsx`
- Style: `src/styles/templates/format-name.js`
- Update index: `src/templates/formats/index.jsx`

**Utilities:**
- Frontend: `src/lib/utility-name.js`
- Backend: `netlify/functions/lib/utility-name.js`

## Special Directories

**dist/**
- Purpose: Vite build output
- Source: Auto-generated by `npm run build`
- Committed: No (gitignored)

**supabase/migrations/**
- Purpose: Database schema migrations
- Source: Manual SQL files
- Committed: Yes

**.planning/**
- Purpose: Project planning documents (GSD system)
- Source: Generated by planning workflows
- Committed: Yes

---

*Structure analysis: 2026-01-11*
*Update when directory structure changes*
