# Quick Start Guide for Claude Code

Read this FIRST before any other document.

---

## Project: Launchpad Pro

A SaaS app where coaches generate product funnels, lead magnets, and designed PDFs using AI. Companion to Launch Builder Pro.

---

## Document Reading Order

1. **CLAUDE.md** (root) — Development rules and patterns
2. **01-PROJECT-BRIEF.md** — What we're building and why
3. **02-TECHNICAL-ARCHITECTURE.md** — Tech stack and structure
4. **03-DATABASE-SCHEMA.md** — Supabase tables
5. **04-IMPLEMENTATION-PHASES.md** — The roadmap (FOLLOW THIS)
6. **05-AI-PROMPTS.md** — Prompts for Claude API calls
7. **06-VISUAL-BUILDER-SPEC.md** — Style templates and design rules

---

## Tech Stack Summary

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (auth + database + storage)
- **Serverless:** Netlify Functions
- **AI:** Claude API (Anthropic)
- **Hosting:** Netlify

---

## First Steps (Phase 1)

### 1. Create Project
```bash
npm create vite@latest launchpad-pro -- --template react
cd launchpad-pro
npm install
```

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Set Up Environment
Create `.env`:
```
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

### 4. Configure Tailwind
Update `tailwind.config.js`:
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### 5. Set Up Folder Structure
Follow the structure in `02-TECHNICAL-ARCHITECTURE.md`

### 6. Create Supabase Project
- Go to supabase.com
- Create new project
- Run SQL from `03-DATABASE-SCHEMA.md`

---

## Key Files to Create First

1. `src/lib/supabase.js` — Supabase client
2. `src/components/auth/LoginForm.jsx`
3. `src/components/auth/SignupForm.jsx`
4. `src/components/auth/ProtectedRoute.jsx`
5. `src/App.jsx` — Router setup
6. `src/pages/Dashboard.jsx`

---

## Development Flow

For each feature:
1. Read the relevant doc section
2. Create the component
3. Test it works
4. Move to next feature
5. Don't skip ahead

---

## Testing Checklist

After each component:
- [ ] Works on desktop
- [ ] Works on mobile
- [ ] Loading state shows
- [ ] Errors handled gracefully
- [ ] Data saves correctly

---

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy (if Netlify CLI installed)
netlify deploy --prod
```

---

## Questions?

If unclear on something:
1. Check the docs first
2. Look for similar patterns in existing code
3. Ask before assuming business logic

---

## Remember

- Keep it simple
- Follow the phases
- Test as you go
- Don't add features not in spec
