# Visual Builder Specification

This document defines how the Visual Builder transforms content into designed HTML/PDF outputs. It includes the 12 style templates and design rules adapted from Zane's presentation builder.

---

## Overview

The Visual Builder:
1. Takes structured content (from Product Builder or Lead Magnet Builder)
2. Applies a selected style template
3. Generates complete, standalone HTML
4. Converts to PDF when needed

---

## Output Types

### PDF Documents
- Lead magnets
- Product content (checklists, guides, templates)
- Printable resources

**Characteristics:**
- Page breaks between sections
- Print-optimized styling
- No animations
- Header/footer on each page

### Presentations
- Course slides
- Pitch decks
- Video slide backgrounds

**Characteristics:**
- Full-screen slides
- Keyboard navigation
- Animations and transitions
- Progress indicator

---

## Style Templates (12 Total)

Each template is defined as a JavaScript object containing:
- `name`: Display name
- `category`: clean | creative | dark
- `fonts`: Google Font imports
- `colors`: Color palette
- `typography`: Font sizes and weights
- `spacing`: Padding and gaps
- `components`: Styled elements (cards, buttons, badges)
- `animations`: Transition effects (presentations only)

### Template Structure

```javascript
const templateStructure = {
  name: "Template Name",
  category: "clean", // clean | creative | dark
  
  fonts: {
    heading: "Inter",
    body: "Inter",
    accent: "Inter", // optional
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  },
  
  colors: {
    background: "#ffffff",
    backgroundAlt: "#f8fafc",
    text: "#1e293b",
    textMuted: "#64748b",
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#8b5cf6",
    danger: "#ef4444",
    success: "#22c55e",
    border: "#e2e8f0"
  },
  
  typography: {
    h1: { size: "48px", weight: "700", lineHeight: "1.2" },
    h2: { size: "32px", weight: "600", lineHeight: "1.3" },
    h3: { size: "24px", weight: "600", lineHeight: "1.4" },
    body: { size: "18px", weight: "400", lineHeight: "1.6" },
    small: { size: "14px", weight: "400", lineHeight: "1.5" }
  },
  
  spacing: {
    page: "60px",
    section: "40px",
    element: "20px"
  },
  
  components: {
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      padding: "24px"
    },
    button: {
      background: "#3b82f6",
      color: "#ffffff",
      borderRadius: "8px",
      padding: "12px 24px",
      fontWeight: "600"
    },
    badge: {
      padding: "4px 12px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: "500"
    }
  },
  
  animations: {
    slideIn: "transform 0.6s ease-out",
    fadeIn: "opacity 0.4s ease-out",
    stagger: "0.1s" // delay between elements
  }
};
```

---

## The 11 Style Templates

### Clean/Professional Category

#### 1. Apple Minimal
```javascript
const appleMinimal = {
  name: "Apple Minimal",
  category: "clean",
  fonts: {
    heading: "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
    body: "SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif",
    googleFontsUrl: null // System fonts
  },
  colors: {
    background: "#ffffff",
    backgroundAlt: "#f5f5f7",
    text: "#1d1d1f",
    textMuted: "#86868b",
    primary: "#0071e3",
    secondary: "#34c759",
    accent: "#5856d6",
    danger: "#ff3b30",
    success: "#34c759",
    border: "#d2d2d7"
  },
  // ... full definition
};
```

#### 2. Apple Keynote Style (Light)
- Bright, polished presentation feel
- Subtle gradients
- Bold headlines with refined body text

#### 3. Minimalist Clean
- Maximum whitespace
- Single accent color
- Ultra-clean typography

#### 4. Swiss Design
- Grid-based layout
- Strong typography hierarchy
- Geometric elements
- Red accent color

#### 5. Editorial Magazine
- Sophisticated layout
- Serif headings
- Pull quotes and large imagery
- Multi-column options

### Creative/Trendy Category

#### 6. Memphis Design
- Bold geometric shapes
- Playful colors (pink, yellow, blue)
- Squiggly lines and dots
- 80s/90s revival aesthetic

#### 7. Hand-drawn Sketch
- Sketch-style borders
- Handwritten fonts
- Doodle elements
- Casual, approachable feel

#### 8. Brutalist
- Raw, bold typography
- High contrast
- Unconventional layouts
- No-frills aesthetic

#### 9. Cluely Style
- Modern SaaS aesthetic
- Gradient accents
- Card-based layout
- Tech-forward feel

### Dark/Tech Category

#### 10. Dark Glowing Style
- Dark background (#0a0a0a)
- Glowing text effects
- Cyan/purple accent colors
- Tech/premium feel

#### 11. Black Neon Glow
- Pure black background
- Neon accent colors
- Glow effects on text and borders
- High-impact visuals

---

## Color Psychology System

Consistent across all templates:

| Color | Meaning | Use For |
|-------|---------|---------|
| Red shades | Negative, problems, old way | Pain points, what to avoid |
| Green shades | Positive, solutions, new way | Benefits, results, success |
| Blue/Cyan shades | Technology, trust, your solution | CTAs, highlights, brand |
| Amber/Yellow | Caution, attention | Warnings, important notes |
| Purple | Premium, innovation | Upgrades, special features |

---

## PDF Generation Rules

### Page Structure
```css
@page {
  size: A4;
  margin: 0;
}

.page {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  page-break-after: always;
  position: relative;
}

.page:last-child {
  page-break-after: avoid;
}
```

### Content Safe Zones
- Top margin: 20mm
- Bottom margin: 25mm (room for page numbers)
- Side margins: 20mm
- Max content width: 170mm

### Typography for Print
- Body text: 11-12pt minimum
- Headings: proportionally larger
- Line height: 1.5-1.6 for readability

### Image Handling
- Max width: 100% of content area
- Maintain aspect ratio
- Add subtle shadows for depth

---

## Presentation Rules

### Slide Structure
```css
.slide {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 80px;
  position: relative;
}
```

### Animation Sequence
Elements animate in sequentially when slides contain 3+ elements:
1. Headline appears first
2. Subheadline follows (0.2s delay)
3. Body content follows (0.4s delay)
4. Additional elements stagger (0.1s each)

```javascript
// Animation trigger on slide enter
function animateSlide(slide) {
  const elements = slide.querySelectorAll('.animate');
  elements.forEach((el, i) => {
    el.style.animationDelay = `${i * 0.1}s`;
    el.classList.add('animate-in');
  });
}
```

### Keyboard Navigation
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    prevSlide();
  } else if (e.key === 'Escape') {
    exitFullscreen();
  }
});
```

### Progress Indicator
- Show current slide / total slides
- Optional progress bar at top
- Subtle, doesn't distract from content

---

## Branding Integration

### Logo Placement
- Cover page: Centered or top-left
- Subsequent pages: Top-right corner (small)
- Final page: Centered above CTA

### Photo Integration
- Circular crop with subtle border
- Use on cover page
- Optional on about/bio sections

### Name & Tagline
- Cover page: Below title
- Footer: "By [Name]"
- CTA page: Full attribution

### Social Handle
- Final page only
- Format: @handle
- Link if appropriate

---

## Component Library

### Cards
```html
<div class="card">
  <h3 class="card-title">Title</h3>
  <p class="card-content">Content here...</p>
</div>
```

### Badges
```html
<span class="badge badge-success">Benefit</span>
<span class="badge badge-danger">Problem</span>
<span class="badge badge-primary">Feature</span>
```

### Buttons (CTA)
```html
<a href="#" class="button button-primary">
  Get Started →
</a>
```

### Checklists
```html
<ul class="checklist">
  <li class="checklist-item">
    <span class="check">✓</span>
    <span class="text">Item text</span>
  </li>
</ul>
```

### Numbered Steps
```html
<ol class="steps">
  <li class="step">
    <span class="step-number">1</span>
    <div class="step-content">
      <h4>Step Title</h4>
      <p>Step description...</p>
    </div>
  </li>
</ol>
```

### Quotes/Callouts
```html
<blockquote class="callout">
  <p>Important quote or callout text here...</p>
</blockquote>
```

---

## Quality Checklist

Before outputting any visual:

- [ ] All content from source is included
- [ ] Style template applied correctly
- [ ] Colors match template palette
- [ ] Typography hierarchy is clear
- [ ] Spacing is consistent
- [ ] Branding elements present (logo, name, tagline)
- [ ] No content overflow or cutoff
- [ ] Responsive (works at different sizes)
- [ ] Page breaks correct (PDF)
- [ ] Navigation works (presentation)
- [ ] CTA is prominent and clear

---

## File Organization

```
src/styles/templates/
├── index.js              # Exports all templates
├── apple-minimal.js
├── apple-keynote-light.js
├── minimalist-clean.js
├── swiss-design.js
├── editorial-magazine.js
├── memphis-design.js
├── hand-drawn-sketch.js
├── brutalist.js
├── cluely-style.js
├── dark-glowing.js
└── black-neon-glow.js
```

Each template file exports:
```javascript
export const templateName = {
  // Full template definition
};

export const generateHTML = (content, branding) => {
  // Returns complete HTML string
};
```
