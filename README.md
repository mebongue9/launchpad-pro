# Launchpad Pro

AI-powered SaaS application for coaches to generate complete product funnels, lead magnets, and professionally designed PDFs in minutes instead of weeks.

## Overview

Launchpad Pro solves the biggest challenges coaches face when launching digital products:

- **Coming up with product ideas** - What should I sell? What format? What price?
- **Writing the content** - The actual copy, frameworks, checklists, guides
- **Designing the deliverables** - Making PDFs and slides look professional
- **Creating lead magnets** - Free content that sells the paid products
- **Building coherent funnels** - Products that naturally lead to each other

This app automates ALL of these in one place, taking coaches from idea to launch-ready product in hours, not weeks.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19 + Vite 7 | User interface |
| Styling | Tailwind CSS 4 | Rapid UI development |
| Routing | React Router 7 | Client-side navigation |
| Hosting | Netlify | Frontend + serverless functions |
| Database | Supabase PostgreSQL | Data storage with RLS |
| Auth | Supabase Auth | User authentication |
| File Storage | Supabase Storage | PDFs, logos, generated outputs |
| AI Generation | Claude API (Anthropic) | Content and funnel generation |
| Embeddings | OpenAI API | Vector search for knowledge base |

---

## Features

### 1. Profile and Audience Management
- Create multiple business profiles with branding (logo, tagline, colors)
- Define target audiences with pain points and desires
- Reuse profiles and audiences across all generations

### 2. AI-Powered Funnel Builder
- Generate complete 5-product funnel architectures:
  - Front-end product ($7-17)
  - Bump offer ($7-17)
  - Upsell 1 ($27-47)
  - Upsell 2 ($47-97)
  - Upsell 3 ($97-297)
- Anti-cannibalization design ensures products lead naturally to each other
- Optional: Link existing products as final upsell destination
- Manual entry option for custom funnels

### 3. AI-Powered Lead Magnet Builder
- Generate 3 unique lead magnet ideas per funnel
- Full content generation with promotion kit:
  - Video script with exact words
  - Instagram/Facebook caption
  - TikTok/DM version caption
  - CTA keyword

### 4. Visual Builder with 10 Style Templates
- Transform content into designed HTML/PDF outputs
- Available styles:
  - **Clean/Professional**: Apple Minimal, Minimalist Clean, Swiss Design, Editorial Magazine
  - **Creative/Trendy**: Memphis Design, Hand-drawn Sketch, Brutalist, Cluely Style
  - **Dark/Tech**: Dark Glowing, Black Neon Glow
- Client-side PDF generation via html2pdf.js
- Fullscreen preview mode

### 5. History Page
- View all generated content and designs
- Download HTML or PDF versions
- Quick access to past creations

### 6. Settings Page
- Account management
- Usage statistics

### 7. Vector Database Integration
- Knowledge base with 3400+ embedded chunks
- Semantic search for AI context
- OpenAI text-embedding-ada-002 for embeddings
- Cosine similarity matching for relevant content retrieval

---

## Project Structure

```
launchpad-pro/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── profiles/
│   │   │   ├── ProfileCard.jsx
│   │   │   ├── ProfileForm.jsx
│   │   │   └── ProfileList.jsx
│   │   ├── audiences/
│   │   │   ├── AudienceCard.jsx
│   │   │   ├── AudienceForm.jsx
│   │   │   └── AudienceList.jsx
│   │   ├── existing-products/
│   │   │   ├── ExistingProductList.jsx
│   │   │   └── ExistingProductForm.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       ├── Loading.jsx
│   │       ├── Modal.jsx
│   │       └── Toast.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profiles.jsx
│   │   ├── Audiences.jsx
│   │   ├── ExistingProducts.jsx
│   │   ├── FunnelBuilder.jsx
│   │   ├── LeadMagnetBuilder.jsx
│   │   ├── VisualBuilder.jsx
│   │   ├── History.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── useAuth.jsx
│   │   ├── useProfiles.jsx
│   │   ├── useAudiences.jsx
│   │   ├── useFunnels.jsx
│   │   ├── useLeadMagnets.jsx
│   │   ├── useExistingProducts.jsx
│   │   ├── useCreations.jsx
│   │   └── useVectorSearch.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   └── utils.js
│   ├── prompts/
│   │   ├── funnel-strategist.js
│   │   ├── lead-magnet-strategist.js
│   │   ├── product-builder.js
│   │   └── lead-magnet-content.js
│   ├── styles/
│   │   └── templates/
│   │       ├── index.js
│   │       ├── apple-minimal.js
│   │       ├── minimalist-clean.js
│   │       ├── swiss-design.js
│   │       ├── editorial-magazine.js
│   │       ├── cluely-style.js
│   │       ├── memphis-design.js
│   │       ├── hand-drawn-sketch.js
│   │       ├── brutalist.js
│   │       ├── dark-glowing.js
│   │       └── black-neon-glow.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── netlify/
│   └── functions/
│       ├── generate-funnel.js
│       ├── generate-lead-magnet-ideas.js
│       ├── generate-lead-magnet-content.js
│       ├── generate-content.js
│       ├── vector-search.js
│       └── setup-database.js
├── docs/
│   ├── 00-QUICK-START.md
│   ├── 01-PROJECT-BRIEF.md
│   ├── 02-TECHNICAL-ARCHITECTURE.md
│   ├── 03-DATABASE-SCHEMA.md
│   ├── 04-IMPLEMENTATION-PHASES.md
│   ├── 05-AI-PROMPTS.md
│   └── 06-VISUAL-BUILDER-SPEC.md
├── package.json
├── vite.config.js
├── netlify.toml
└── CLAUDE.md
```

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Anthropic API key (Claude)
- OpenAI API key (for embeddings)
- Netlify account (for deployment)

### 1. Clone and Install

```bash
git clone <repository-url>
cd launchpad-pro
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Supabase (Frontend - exposed to browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase (Backend - Netlify Functions only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs (Backend - Netlify Functions only)
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-key

# App URL
VITE_APP_URL=http://localhost:5173
```

For production, add these same variables in your Netlify dashboard under Site Settings > Environment Variables.

### 3. Supabase Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (see docs/03-DATABASE-SCHEMA.md for full schema)
-- Key tables: profiles, audiences, existing_products, funnels,
-- lead_magnets, creations, topics_used, knowledge_chunks

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('outputs', 'outputs', true);
```

The complete database schema is documented in `/docs/03-DATABASE-SCHEMA.md`.

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

To test Netlify Functions locally:

```bash
npm install -g netlify-cli
netlify dev
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `netlify dev` | Run with Netlify Functions locally |

---

## Database Schema

### Core Tables

- **profiles** - Business/brand profiles with branding info
- **audiences** - Target audience definitions with pain points and desires
- **existing_products** - Products the user already sells
- **funnels** - Generated funnel architectures (5 products each)
- **lead_magnets** - Generated lead magnets with content and promotion kit
- **creations** - History of all visual outputs (HTML/PDF)
- **topics_used** - Tracks used topics to prevent duplicates
- **knowledge_chunks** - Vector embeddings for semantic search (3400+ chunks)

All tables implement Row Level Security (RLS) to ensure users only access their own data.

---

## API Endpoints (Netlify Functions)

### POST /.netlify/functions/generate-funnel

Generates a complete funnel architecture using Claude AI.

**Request:**
```json
{
  "profile": { "name": "...", "niche": "...", "vibe": "..." },
  "audience": { "name": "...", "pain_points": [], "desires": [] },
  "existing_product": { "name": "...", "price": 497 }
}
```

**Response:**
```json
{
  "funnel_name": "Pinterest Freedom Funnel",
  "front_end": { "name": "...", "format": "checklist", "price": 17 },
  "bump": { "name": "...", "format": "templates", "price": 9 },
  "upsell_1": { "name": "...", "format": "guide", "price": 47 },
  "upsell_2": { "name": "...", "format": "course", "price": 97 },
  "upsell_3": { "name": "...", "format": "...", "price": 197 }
}
```

### POST /.netlify/functions/generate-lead-magnet-ideas

Generates 3 unique lead magnet ideas for a funnel's front-end product.

### POST /.netlify/functions/generate-lead-magnet-content

Generates full lead magnet content with promotion kit.

### POST /.netlify/functions/generate-content

Generates content for individual funnel products.

### POST /.netlify/functions/vector-search

Semantic search against knowledge base embeddings.

**Request:**
```json
{
  "query": "search query",
  "limit": 10,
  "threshold": 0.7
}
```

---

## Deployment

### Netlify Deployment

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. Add environment variables in Netlify dashboard
4. Deploy

The `netlify.toml` is pre-configured:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Production Checklist

- [ ] All environment variables set in Netlify
- [ ] Supabase RLS policies enabled on all tables
- [ ] Storage buckets created with proper policies
- [ ] API keys are not exposed to frontend
- [ ] Rate limiting considered for AI functions

---

## Architecture Diagram

```
                        NETLIFY
    ┌──────────────────────────────────────────┐
    │         React Frontend (Vite)            │
    │  - Auth pages (login, signup)            │
    │  - Dashboard with sidebar navigation     │
    │  - Profile/Audience management           │
    │  - Funnel Builder UI                     │
    │  - Lead Magnet Builder UI                │
    │  - Visual Builder with templates         │
    │  - History and Settings                  │
    └────────────────────┬─────────────────────┘
                         │
    ┌────────────────────┴─────────────────────┐
    │      Netlify Functions (Serverless)      │
    │  - /generate-funnel                      │
    │  - /generate-lead-magnet-ideas           │
    │  - /generate-lead-magnet-content         │
    │  - /generate-content                     │
    │  - /vector-search                        │
    └────────────────────┬─────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌───────────┐    ┌───────────┐
   │ SUPABASE│    │ CLAUDE API│    │ OPENAI API│
   │         │    │           │    │           │
   │ - Auth  │    │ - Funnel  │    │ - Vector  │
   │ - DB    │    │   strategy│    │   embed-  │
   │ - Files │    │ - Content │    │   dings   │
   │         │    │   writing │    │           │
   └─────────┘    └───────────┘    └───────────┘
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/src/App.jsx` | Root component with routing |
| `/src/lib/supabase.js` | Supabase client configuration |
| `/src/hooks/useAuth.jsx` | Authentication state management |
| `/src/styles/templates/index.js` | Style template registry |
| `/netlify/functions/generate-funnel.js` | Funnel generation with Claude |
| `/netlify/functions/vector-search.js` | Knowledge base semantic search |
| `/docs/03-DATABASE-SCHEMA.md` | Complete database schema |
| `/docs/04-IMPLEMENTATION-PHASES.md` | Development phases |
| `/CLAUDE.md` | Development instructions and coding standards |

---

## Security Considerations

- API keys are only used in Netlify Functions (server-side)
- Supabase RLS ensures users only access their own data
- File uploads limited to appropriate sizes
- Input sanitization before AI calls
- Environment variables never exposed to frontend (except `VITE_` prefixed)

---

## License

MIT

---

## Support

For issues or questions, open a GitHub issue or contact the development team.
