# Technology Stack

**Analysis Date:** 2026-01-11

## Languages

**Primary:**
- JavaScript/JSX - All application code (`src/**/*.jsx`, `src/**/*.js`)

**Secondary:**
- JavaScript (ES Modules) - Netlify Functions (`netlify/functions/**/*.js`)

## Runtime

**Environment:**
- Node.js 20 - Specified in `netlify.toml` (`build.environment.NODE_VERSION = "20"`)
- ES Modules - `package.json` (`"type": "module"`)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.3 - UI framework (`package.json`, `src/main.jsx`)
- React Router 7.11.0 - Client-side routing (`src/App.jsx`)
- React DOM 19.2.3 - DOM rendering (`src/main.jsx`)

**Testing:**
- Playwright 1.57.0 - E2E testing (`playwright.config.js`, `e2e/`)

**Build/Dev:**
- Vite 7.3.0 - Build tool and dev server (`vite.config.js`)
- Vite React Plugin 5.1.2 - React integration (`vite.config.js`)
- esbuild - Function bundler (`netlify.toml`: `node_bundler = "esbuild"`)

## Key Dependencies

**Critical:**
- @anthropic-ai/sdk 0.71.2 - Claude API for content generation (`netlify/functions/generate-*.js`)
- openai 6.15.0 - Embeddings for RAG/vector search (`netlify/functions/lib/knowledge-search.js`)
- @supabase/supabase-js 2.89.0 - Database client and auth (`src/lib/supabase.js`)

**Infrastructure:**
- pg 8.16.3 - PostgreSQL client for server-side operations (`netlify/functions/`)
- dotenv 17.2.3 - Environment variable loading (`package.json`)

**UI/Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS (`tailwind.config.js`, `src/index.css`)
- PostCSS 8.5.6 - CSS processing (`postcss.config.js`)
- Autoprefixer 10.4.23 - CSS vendor prefixes
- Lucide React 0.562.0 - Icon library (`src/components/`)
- TinyMCE 8.3.1 + TinyMCE React 6.3.0 - Rich text editor (`src/components/editor/`)

## Configuration

**Environment:**
- `.env` - Runtime secrets (Supabase credentials, API keys)
- `.env.example` - Template for environment variables
- Required vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`

**Build:**
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind design tokens
- `postcss.config.js` - PostCSS plugin configuration
- `netlify.toml` - Netlify deployment configuration
- `playwright.config.js` - E2E testing configuration

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js 20+)
- No Docker required

**Production:**
- Netlify - Frontend hosting and serverless functions
- Supabase - PostgreSQL database with pgvector extension
- Deployment URL: `https://launchpad-pro-app.netlify.app`

---

*Stack analysis: 2026-01-11*
*Update after major dependency changes*
