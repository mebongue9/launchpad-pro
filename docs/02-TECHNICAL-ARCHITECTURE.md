# Technical Architecture

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite | User interface |
| Styling | Tailwind CSS | Rapid UI development |
| Hosting | Netlify | Frontend deployment |
| Database | Supabase PostgreSQL | Data storage |
| Auth | Supabase Auth | User authentication |
| File Storage | Supabase Storage | PDFs, images, logos |
| AI | Claude API (Anthropic) | All content/visual generation |
| PDF Generation | Puppeteer (headless Chrome) | HTML to PDF conversion |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         NETLIFY                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 React Frontend                        │    │
│  │  • Auth pages (login, signup)                        │    │
│  │  • Dashboard                                          │    │
│  │  • Profile management                                 │    │
│  │  • Funnel builder UI                                  │    │
│  │  • Lead magnet builder UI                            │    │
│  │  • Visual builder UI                                  │    │
│  │  • Presentation mode                                  │    │
│  │  • History/downloads                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Netlify Functions (Serverless)          │    │
│  │  • /api/generate-funnel                              │    │
│  │  • /api/generate-lead-magnet                         │    │
│  │  • /api/generate-content                             │    │
│  │  • /api/generate-visual                              │    │
│  │  • /api/convert-pdf                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  SUPABASE   │    │ CLAUDE API  │    │  PUPPETEER  │
   │             │    │             │    │  (or alt)   │
   │ • Auth      │    │ • Funnel    │    │             │
   │ • Database  │    │   strategy  │    │ • HTML→PDF  │
   │ • Storage   │    │ • Content   │    │             │
   │   (files)   │    │   writing   │    │             │
   │             │    │ • Visual    │    │             │
   │             │    │   generation│    │             │
   └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Folder Structure

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
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatsCards.jsx
│   │   ├── profiles/
│   │   │   ├── ProfileList.jsx
│   │   │   ├── ProfileForm.jsx
│   │   │   └── ProfileCard.jsx
│   │   ├── audiences/
│   │   │   ├── AudienceList.jsx
│   │   │   ├── AudienceForm.jsx
│   │   │   └── AudienceCard.jsx
│   │   ├── funnels/
│   │   │   ├── FunnelBuilder.jsx
│   │   │   ├── FunnelPreview.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── FunnelHistory.jsx
│   │   ├── lead-magnets/
│   │   │   ├── LeadMagnetBuilder.jsx
│   │   │   ├── IdeaSelector.jsx
│   │   │   └── ContentPreview.jsx
│   │   ├── visual-builder/
│   │   │   ├── VisualBuilder.jsx
│   │   │   ├── StyleSelector.jsx
│   │   │   ├── PreviewPane.jsx
│   │   │   └── PresentationMode.jsx
│   │   ├── history/
│   │   │   ├── CreationHistory.jsx
│   │   │   └── CreationCard.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Select.jsx
│   │       ├── Modal.jsx
│   │       ├── Loading.jsx
│   │       └── Toast.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profiles.jsx
│   │   ├── Audiences.jsx
│   │   ├── FunnelBuilder.jsx
│   │   ├── LeadMagnetBuilder.jsx
│   │   ├── VisualBuilder.jsx
│   │   ├── History.jsx
│   │   └── Settings.jsx
│   ├── lib/
│   │   ├── supabase.js          # Supabase client
│   │   ├── claude.js            # Claude API calls
│   │   └── utils.js             # Helper functions
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProfiles.js
│   │   ├── useAudiences.js
│   │   ├── useFunnels.js
│   │   └── useCreations.js
│   ├── prompts/
│   │   ├── funnel-strategist.js
│   │   ├── lead-magnet-strategist.js
│   │   ├── product-builder.js
│   │   └── visual-builder.js
│   ├── styles/
│   │   ├── templates/           # 11 style templates
│   │   │   ├── apple-minimal.js
│   │   │   ├── apple-keynote-light.js
│   │   │   ├── minimalist-clean.js
│   │   │   ├── swiss-design.js
│   │   │   ├── editorial-magazine.js
│   │   │   ├── memphis-design.js
│   │   │   ├── hand-drawn-sketch.js
│   │   │   ├── brutalist.js
│   │   │   ├── cluely-style.js
│   │   │   ├── dark-glowing.js
│   │   │   └── black-neon-glow.js
│   │   └── globals.css
│   ├── App.jsx
│   └── main.jsx
├── netlify/
│   └── functions/
│       ├── generate-funnel.js
│       ├── generate-lead-magnet.js
│       ├── generate-content.js
│       ├── generate-visual.js
│       └── convert-pdf.js
├── CLAUDE.md                    # Development instructions
├── package.json
├── tailwind.config.js
├── vite.config.js
└── netlify.toml
```

---

## API Endpoints (Netlify Functions)

### POST /api/generate-funnel
**Input:**
```json
{
  "profile": { "name": "...", "audience": "...", "niche": "..." },
  "existing_product": { "name": "...", "price": "..." } // optional
}
```
**Output:**
```json
{
  "funnel": {
    "front_end": { "name": "...", "format": "checklist", "price": "$17" },
    "bump": { "name": "...", "format": "templates", "price": "$9" },
    "upsell_1": { "name": "...", "format": "guide", "price": "$47" },
    "upsell_2": { "name": "...", "format": "course", "price": "$97" },
    "upsell_3": { "name": "...", "format": "...", "price": "$197" }
  }
}
```

### POST /api/generate-content
**Input:**
```json
{
  "product": { "name": "...", "format": "...", "description": "..." },
  "profile": { "name": "...", "branding": {...} },
  "funnel_context": { "position": "front_end", "next_product": "..." }
}
```
**Output:**
```json
{
  "content": {
    "title": "...",
    "subtitle": "...",
    "sections": [
      { "heading": "...", "body": "..." }
    ],
    "cta": { "text": "...", "link": "..." }
  }
}
```

### POST /api/generate-lead-magnet
**Input:**
```json
{
  "profile": {...},
  "front_end_product": {...},
  "excluded_topics": ["topic1", "topic2"]
}
```
**Output:**
```json
{
  "ideas": [
    { "title": "...", "format": "...", "keyword": "...", "why": "..." },
    { "title": "...", "format": "...", "keyword": "...", "why": "..." },
    { "title": "...", "format": "...", "keyword": "...", "why": "..." }
  ]
}
```

### POST /api/generate-visual
**Input:**
```json
{
  "content": {...},
  "style": "apple-minimal",
  "branding": { "name": "...", "tagline": "...", "logo_url": "..." },
  "output_type": "pdf" // or "presentation"
}
```
**Output:**
```json
{
  "html": "<html>...</html>",
  "pdf_url": "https://storage.supabase.co/..."
}
```

### POST /api/convert-pdf
**Input:**
```json
{
  "html": "<html>...</html>",
  "filename": "my-lead-magnet.pdf"
}
```
**Output:**
```json
{
  "pdf_url": "https://storage.supabase.co/..."
}
```

---

## Authentication Flow

1. User signs up with email/password (Supabase Auth)
2. Email verification sent
3. User logs in → receives JWT
4. JWT stored in localStorage
5. All API calls include JWT in header
6. Supabase RLS (Row Level Security) ensures users only see their own data

---

## Data Flow Example: Building a Funnel

```
1. User clicks "New Funnel"
        ↓
2. Selects Profile + Audience from dropdowns
        ↓
3. Optionally selects existing product as final upsell
        ↓
4. Clicks "Generate Funnel"
        ↓
5. Frontend calls POST /api/generate-funnel
        ↓
6. Netlify Function:
   a. Loads funnel strategist prompt
   b. Injects profile + audience data
   c. Calls Claude API
   d. Parses response
   e. Returns funnel structure
        ↓
7. Frontend displays funnel preview
        ↓
8. User clicks "Approve" or adjusts
        ↓
9. For each product in funnel:
   a. Frontend calls POST /api/generate-content
   b. Claude generates content
   c. Content saved to Supabase
        ↓
10. Funnel marked complete, saved to history
```

---

## File Storage (Supabase Storage)

**Buckets:**
- `logos` — User uploaded logos
- `photos` — User uploaded photos
- `outputs` — Generated PDFs and HTML files

**File naming convention:**
```
outputs/{user_id}/{creation_type}/{timestamp}-{name}.pdf
outputs/{user_id}/{creation_type}/{timestamp}-{name}.html

Example:
outputs/abc123/lead-magnets/2024-01-15-pinterest-secrets.pdf
outputs/abc123/products/2024-01-15-traffic-avalanche-checklist.pdf
```

---

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx  # Server-side only

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# App
VITE_APP_URL=https://yourapp.netlify.app
```

---

## Security Considerations

1. **API Keys** — Never exposed to frontend, only in Netlify Functions
2. **RLS** — Supabase Row Level Security on all tables
3. **Input Validation** — Sanitize all user inputs before Claude calls
4. **Rate Limiting** — Implement on Netlify Functions to prevent abuse
5. **File Upload Limits** — Max 5MB for logos/photos

---

## Performance Considerations

1. **Claude API Latency** — Show loading states, consider streaming
2. **PDF Generation** — Can be slow, run async with status updates
3. **Caching** — Cache style templates, don't regenerate each time
4. **Database Queries** — Index frequently queried columns
