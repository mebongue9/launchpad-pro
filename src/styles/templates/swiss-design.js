// /src/styles/templates/swiss-design.js
// Grid-based Swiss/International Typographic Style
// Strong typography hierarchy, geometric elements, red accent
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const swissDesign = {
  id: 'swiss-design',
  name: 'Swiss Design',
  category: 'clean',
  description: 'Grid-based layout with strong typography and red accents',
  preview: {
    bg: '#ffffff',
    accent: '#ff0000'
  },

  fonts: {
    heading: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    googleFontsUrl: null
  },

  colors: {
    background: '#ffffff',
    backgroundAlt: '#f0f0f0',
    text: '#000000',
    textMuted: '#555555',
    primary: '#ff0000',
    secondary: '#000000',
    accent: '#ff0000',
    danger: '#ff0000',
    success: '#00aa00',
    border: '#000000'
  },

  typography: {
    h1: { size: '72px', weight: '700', lineHeight: '1.0' },
    h2: { size: '36px', weight: '700', lineHeight: '1.1' },
    h3: { size: '24px', weight: '700', lineHeight: '1.2' },
    body: { size: '16px', weight: '400', lineHeight: '1.5' },
    small: { size: '12px', weight: '400', lineHeight: '1.4' }
  },

  spacing: {
    page: '60px',
    section: '48px',
    element: '24px'
  },

  components: {
    card: {
      background: '#ffffff',
      border: '2px solid #000000',
      borderRadius: '0',
      shadow: 'none',
      padding: '32px'
    },
    button: {
      background: '#ff0000',
      color: '#ffffff',
      borderRadius: '0',
      padding: '14px 28px',
      fontWeight: '700'
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '0',
      fontSize: '11px',
      fontWeight: '700'
    }
  }
}

export function generateHTML(content, branding, template = swissDesign) {
  const { title, subtitle, sections = [] } = content
  const { name, tagline, logo_url, photo_url, social_handle } = branding || {}

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Untitled'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${template.fonts.body};
      background: ${template.colors.background};
      color: ${template.colors.text};
      line-height: ${template.typography.body.lineHeight};
      font-size: ${template.typography.body.size};
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: ${template.spacing.page};
      margin: 0 auto;
      background: ${template.colors.background};
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .grid-lines {
      position: absolute;
      top: 0;
      left: ${template.spacing.page};
      right: ${template.spacing.page};
      bottom: 0;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 10px;
      pointer-events: none;
      opacity: 0.03;
    }

    .grid-lines > div {
      background: ${template.colors.text};
    }

    .cover {
      display: flex;
      flex-direction: column;
      min-height: calc(297mm - 120px);
      position: relative;
    }

    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 40px;
    }

    .red-bar {
      width: 80px;
      height: 8px;
      background: ${template.colors.primary};
      margin-bottom: 32px;
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }

    h2 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h2.size};
      font-weight: ${template.typography.h2.weight};
      line-height: ${template.typography.h2.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 20px;
      text-transform: uppercase;
    }

    h3 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h3.size};
      font-weight: ${template.typography.h3.weight};
      line-height: ${template.typography.h3.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 16px;
    }

    .subtitle {
      font-size: 20px;
      color: ${template.colors.textMuted};
      margin-bottom: 40px;
      max-width: 400px;
    }

    .author {
      margin-top: auto;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section {
      margin-bottom: ${template.spacing.section};
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      background: ${template.colors.primary};
      color: ${template.colors.background};
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .content {
      color: ${template.colors.text};
      line-height: 1.6;
      columns: 2;
      column-gap: 40px;
    }

    .content.single-column {
      columns: 1;
    }

    .page-number {
      position: absolute;
      bottom: 40px;
      left: ${template.spacing.page};
      font-size: 14px;
      font-weight: 700;
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      min-height: calc(297mm - 120px);
    }

    .button {
      display: inline-block;
      background: ${template.components.button.background};
      color: ${template.components.button.color};
      padding: ${template.components.button.padding};
      font-weight: ${template.components.button.fontWeight};
      text-decoration: none;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 32px;
    }

    .social {
      margin-top: 24px;
      font-size: 14px;
      text-transform: uppercase;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 20mm; }
      .grid-lines { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="grid-lines">
      ${Array(12).fill('<div></div>').join('')}
    </div>
    <div class="cover">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <div class="red-bar"></div>
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">${name}${tagline ? ` / ${tagline}` : ''}</p>` : ''}
    </div>
    <span class="page-number">01</span>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="grid-lines">
      ${Array(12).fill('<div></div>').join('')}
    </div>
    <div class="section">
      ${section.type ? `<span class="section-type">${section.type}</span>` : ''}
      <h2>${section.title || `Section ${i + 1}`}</h2>
      <div class="content${(section.content?.length || 0) < 500 ? ' single-column' : ''}">${section.content || ''}</div>
    </div>
    <span class="page-number">${String(i + 2).padStart(2, '0')}</span>
  </div>
  `).join('')}

  <div class="page">
    <div class="grid-lines">
      ${Array(12).fill('<div></div>').join('')}
    </div>
    <div class="cta-page">
      <div class="red-bar"></div>
      <h2>Take Action</h2>
      <p class="subtitle">Apply what you've learned and see results.</p>
      ${name ? `<p class="author">Created by ${name}</p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
    <span class="page-number">${String(sections.length + 2).padStart(2, '0')}</span>
  </div>
</body>
</html>`
}
