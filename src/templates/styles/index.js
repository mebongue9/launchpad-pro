// /src/templates/styles/index.js
// Visual style templates for PDF and presentation design
// Defines CSS variables, fonts, colors, and visual characteristics
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/lib/pdf-generator.js

// ==============================================
// STYLE DEFINITIONS (11 Styles)
// ==============================================

export const styleTemplates = {
  // 1. Apple Minimal
  'apple-minimal': {
    id: 'apple-minimal',
    name: 'Apple Minimal',
    description: 'White, clean, SF-style font',
    preview: '⚪',
    category: 'clean',
    css: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#ffffff',
      primaryColor: '#000000',
      secondaryColor: '#86868b',
      accentColor: '#0071e3',
      headingWeight: '600',
      bodyWeight: '400',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      padding: '48px',
      lineHeight: '1.5'
    },
    characteristics: ['ultra-clean', 'minimal shadows', 'generous spacing', 'subtle borders']
  },

  // 2. Apple Keynote Light
  'apple-keynote-light': {
    id: 'apple-keynote-light',
    name: 'Apple Keynote Light',
    description: 'White with subtle gradients',
    preview: '🌤️',
    category: 'clean',
    css: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)',
      primaryColor: '#1d1d1f',
      secondaryColor: '#6e6e73',
      accentColor: '#0066cc',
      headingWeight: '700',
      bodyWeight: '400',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      padding: '56px',
      lineHeight: '1.6'
    },
    characteristics: ['subtle gradients', 'soft shadows', 'rounded corners', 'elegant']
  },

  // 3. Minimalist Clean
  'minimalist-clean': {
    id: 'minimalist-clean',
    name: 'Minimalist Clean',
    description: 'Lots of whitespace, simple',
    preview: '◻️',
    category: 'clean',
    css: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      backgroundColor: '#ffffff',
      primaryColor: '#111827',
      secondaryColor: '#9ca3af',
      accentColor: '#4f46e5',
      headingWeight: '500',
      bodyWeight: '400',
      borderRadius: '8px',
      boxShadow: 'none',
      padding: '64px',
      lineHeight: '1.7'
    },
    characteristics: ['extreme whitespace', 'no shadows', 'thin lines', 'breathing room']
  },

  // 4. Swiss Design
  'swiss-design': {
    id: 'swiss-design',
    name: 'Swiss Design',
    description: 'Bold, red accents, uppercase',
    preview: '🇨🇭',
    category: 'bold',
    css: {
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      backgroundColor: '#ffffff',
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#ff0000',
      headingWeight: '700',
      bodyWeight: '400',
      borderRadius: '0px',
      boxShadow: 'none',
      padding: '48px',
      lineHeight: '1.4',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    characteristics: ['bold typography', 'red accents', 'grid-based', 'uppercase headings']
  },

  // 5. Editorial Magazine
  'editorial-magazine': {
    id: 'editorial-magazine',
    name: 'Editorial Magazine',
    description: 'Serif fonts, elegant',
    preview: '📰',
    category: 'elegant',
    css: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      backgroundColor: '#faf9f7',
      primaryColor: '#1a1a1a',
      secondaryColor: '#666666',
      accentColor: '#b8860b',
      headingWeight: '400',
      bodyWeight: '400',
      borderRadius: '0px',
      boxShadow: 'none',
      padding: '56px',
      lineHeight: '1.8'
    },
    characteristics: ['serif typography', 'editorial feel', 'warm tones', 'classic elegance']
  },

  // 6. Memphis Design
  'memphis-design': {
    id: 'memphis-design',
    name: 'Memphis Design',
    description: 'Geometric shapes, bright colors',
    preview: '🎨',
    category: 'playful',
    css: {
      fontFamily: 'Poppins, sans-serif',
      backgroundColor: '#ffffff',
      primaryColor: '#1a1a2e',
      secondaryColor: '#16213e',
      accentColor: '#e94560',
      secondaryAccent: '#0f3460',
      tertiaryAccent: '#f9c80e',
      headingWeight: '700',
      bodyWeight: '500',
      borderRadius: '0px',
      boxShadow: '8px 8px 0px #1a1a2e',
      padding: '40px',
      lineHeight: '1.5'
    },
    characteristics: ['bold colors', 'geometric shapes', 'playful', 'offset shadows']
  },

  // 7. Hand-drawn Sketch
  'hand-drawn-sketch': {
    id: 'hand-drawn-sketch',
    name: 'Hand-drawn Sketch',
    description: 'Dashed borders, casual feel',
    preview: '✏️',
    category: 'casual',
    css: {
      fontFamily: '"Comic Neue", "Patrick Hand", cursive, sans-serif',
      backgroundColor: '#fffef5',
      primaryColor: '#2d2d2d',
      secondaryColor: '#666666',
      accentColor: '#4a90d9',
      headingWeight: '700',
      bodyWeight: '400',
      borderRadius: '0px',
      boxShadow: 'none',
      padding: '40px',
      lineHeight: '1.6',
      borderStyle: 'dashed',
      borderWidth: '2px'
    },
    characteristics: ['dashed borders', 'hand-drawn feel', 'casual', 'friendly']
  },

  // 8. Brutalist
  'brutalist': {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Courier font, black borders',
    preview: '🏗️',
    category: 'bold',
    css: {
      fontFamily: '"Courier New", Courier, monospace',
      backgroundColor: '#ffffff',
      primaryColor: '#000000',
      secondaryColor: '#333333',
      accentColor: '#000000',
      headingWeight: '700',
      bodyWeight: '400',
      borderRadius: '0px',
      boxShadow: 'none',
      padding: '32px',
      lineHeight: '1.4',
      borderWidth: '3px',
      borderColor: '#000000'
    },
    characteristics: ['monospace font', 'thick borders', 'raw aesthetic', 'high contrast']
  },

  // 9. Cluely Style (Purple Gradients)
  'cluely-style': {
    id: 'cluely-style',
    name: 'Cluely Style',
    description: 'Purple gradients, modern SaaS',
    preview: '💜',
    category: 'modern',
    css: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      primaryColor: '#ffffff',
      secondaryColor: 'rgba(255,255,255,0.8)',
      accentColor: '#fbbf24',
      headingWeight: '700',
      bodyWeight: '400',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
      padding: '48px',
      lineHeight: '1.6'
    },
    characteristics: ['purple gradients', 'light text', 'modern SaaS', 'gold accents']
  },

  // 10. Dark Glowing
  'dark-glowing': {
    id: 'dark-glowing',
    name: 'Dark Glowing',
    description: 'Dark background, cyan glow',
    preview: '🌙',
    category: 'dark',
    css: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      backgroundColor: '#0f172a',
      primaryColor: '#f1f5f9',
      secondaryColor: '#94a3b8',
      accentColor: '#22d3ee',
      headingWeight: '600',
      bodyWeight: '400',
      borderRadius: '12px',
      boxShadow: '0 0 24px rgba(34, 211, 238, 0.2)',
      padding: '48px',
      lineHeight: '1.6',
      glowColor: 'rgba(34, 211, 238, 0.4)'
    },
    characteristics: ['dark mode', 'cyan glow', 'modern tech', 'subtle glow effects']
  },

  // 11. Black Neon Glow
  'black-neon-glow': {
    id: 'black-neon-glow',
    name: 'Black Neon Glow',
    description: 'Black background, magenta/cyan neon',
    preview: '🌈',
    category: 'dark',
    css: {
      fontFamily: '"Space Grotesk", Inter, sans-serif',
      backgroundColor: '#000000',
      primaryColor: '#ffffff',
      secondaryColor: '#a1a1aa',
      accentColor: '#ec4899',
      secondaryAccent: '#06b6d4',
      headingWeight: '700',
      bodyWeight: '400',
      borderRadius: '8px',
      boxShadow: '0 0 30px rgba(236, 72, 153, 0.3), 0 0 60px rgba(6, 182, 212, 0.2)',
      padding: '48px',
      lineHeight: '1.5',
      glowColor: 'rgba(236, 72, 153, 0.5)'
    },
    characteristics: ['pure black', 'neon glow', 'cyberpunk', 'magenta and cyan']
  }
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

// Get all styles as array for selection UI
export function getStyleList() {
  return Object.values(styleTemplates);
}

// Get style by ID
export function getStyle(id) {
  return styleTemplates[id] || null;
}

// Get styles by category
export function getStylesByCategory(category) {
  return Object.values(styleTemplates).filter(s => s.category === category);
}

// Get all categories
export function getStyleCategories() {
  const categories = new Set(Object.values(styleTemplates).map(s => s.category));
  return Array.from(categories);
}

// Get style options for dropdown
export function getStyleOptions() {
  return Object.values(styleTemplates).map(style => ({
    id: style.id,
    name: style.name,
    description: style.description,
    preview: style.preview,
    category: style.category
  }));
}

// Generate CSS variables from style
export function getStyleCSSVariables(styleId) {
  const style = getStyle(styleId);
  if (!style) return {};

  const { css } = style;
  return {
    '--font-family': css.fontFamily,
    '--bg-color': css.backgroundColor,
    '--primary-color': css.primaryColor,
    '--secondary-color': css.secondaryColor,
    '--accent-color': css.accentColor,
    '--heading-weight': css.headingWeight,
    '--body-weight': css.bodyWeight,
    '--border-radius': css.borderRadius,
    '--box-shadow': css.boxShadow,
    '--padding': css.padding,
    '--line-height': css.lineHeight
  };
}

// Generate inline style object from style
export function getStyleInlineCSS(styleId) {
  const style = getStyle(styleId);
  if (!style) return {};

  const { css } = style;
  return {
    fontFamily: css.fontFamily,
    background: css.backgroundColor,
    color: css.primaryColor,
    borderRadius: css.borderRadius,
    boxShadow: css.boxShadow,
    padding: css.padding,
    lineHeight: css.lineHeight
  };
}

export default styleTemplates;
