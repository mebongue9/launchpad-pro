// /src/styles/templates/brutalist.js
// Raw, bold typography with high contrast
// Unconventional layouts, no-frills aesthetic
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const brutalist = {
  id: 'brutalist',
  name: 'Brutalist',
  category: 'creative',
  description: 'Raw, bold typography with unconventional layouts',
  preview: {
    bg: '#ffffff',
    accent: '#000000'
  },

  fonts: {
    heading: '"Space Mono", monospace',
    body: '"Space Mono", monospace',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'
  },

  colors: {
    background: '#ffffff',
    backgroundAlt: '#f0f0f0',
    text: '#000000',
    textMuted: '#444444',
    primary: '#000000',
    secondary: '#ff0000',
    accent: '#0000ff',
    danger: '#ff0000',
    success: '#00ff00',
    border: '#000000'
  },

  typography: {
    h1: { size: '64px', weight: '700', lineHeight: '1.0' },
    h2: { size: '40px', weight: '700', lineHeight: '1.1' },
    h3: { size: '24px', weight: '700', lineHeight: '1.2' },
    body: { size: '15px', weight: '400', lineHeight: '1.6' },
    small: { size: '12px', weight: '400', lineHeight: '1.4' }
  },

  spacing: {
    page: '40px',
    section: '40px',
    element: '20px'
  },

  components: {
    card: {
      background: '#ffffff',
      border: '4px solid #000000',
      borderRadius: '0',
      shadow: 'none',
      padding: '24px'
    },
    button: {
      background: '#000000',
      color: '#ffffff',
      borderRadius: '0',
      padding: '16px 32px',
      fontWeight: '700'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '0',
      fontSize: '11px',
      fontWeight: '700'
    }
  }
}

export function generateHTML(content, branding, template = brutalist) {
  const { title, subtitle, sections = [] } = content
  const { name, tagline, logo_url, photo_url, social_handle } = branding || {}

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Untitled'}</title>
  <link href="${template.fonts.googleFontsUrl}" rel="stylesheet">
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

    .border-frame {
      position: absolute;
      top: 20px;
      right: 20px;
      bottom: 20px;
      left: 20px;
      border: 2px solid ${template.colors.text};
      pointer-events: none;
    }

    .cover {
      display: flex;
      flex-direction: column;
      min-height: calc(297mm - 80px);
      padding: 20px;
    }

    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }

    .logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }

    .meta {
      text-align: right;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .photo {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border: 4px solid ${template.colors.text};
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
      letter-spacing: -0.03em;
    }

    h2 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h2.size};
      font-weight: ${template.typography.h2.weight};
      line-height: ${template.typography.h2.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 24px;
      text-transform: uppercase;
    }

    h3 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h3.size};
      font-weight: ${template.typography.h3.weight};
      line-height: ${template.typography.h3.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 16px;
      text-transform: uppercase;
    }

    .subtitle {
      font-size: 18px;
      margin-bottom: 60px;
      max-width: 500px;
      border-left: 4px solid ${template.colors.secondary};
      padding-left: 16px;
    }

    .author {
      margin-top: auto;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-top: 2px solid ${template.colors.text};
      padding-top: 16px;
    }

    .section {
      margin-bottom: ${template.spacing.section};
      padding: 20px;
    }

    .section-header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 24px;
      border-bottom: 4px solid ${template.colors.text};
      padding-bottom: 12px;
    }

    .section-number {
      font-size: 72px;
      font-weight: 700;
      line-height: 1;
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      background: ${template.colors.text};
      color: ${template.colors.background};
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .content {
      color: ${template.colors.text};
      line-height: 1.7;
    }

    .highlight {
      background: ${template.colors.secondary};
      color: ${template.colors.background};
      padding: 2px 4px;
    }

    .card {
      background: ${template.components.card.background};
      border: ${template.components.card.border};
      padding: ${template.components.card.padding};
      margin: 24px 0;
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: calc(297mm - 80px);
      padding: 20px;
    }

    .cta-content {
      border: 4px solid ${template.colors.text};
      padding: 40px;
      text-align: center;
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
      letter-spacing: 0.1em;
      margin-top: 32px;
      border: none;
    }

    .social {
      margin-top: 24px;
      font-size: 14px;
      text-transform: uppercase;
    }

    .footer-line {
      position: absolute;
      bottom: 40px;
      left: 40px;
      right: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 20mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="border-frame"></div>
    <div class="cover">
      <div class="cover-top">
        ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : '<div></div>'}
        <div class="meta">
          <div>${new Date().getFullYear()}</div>
          <div>GUIDE</div>
        </div>
      </div>
      ${photo_url ? `<img src="${photo_url}" alt="Author" class="photo">` : ''}
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">${name}${tagline ? ` // ${tagline}` : ''}</p>` : ''}
    </div>
    <div class="footer-line">
      <span>PAGE 01</span>
      <span>${(title || 'DOCUMENT').toUpperCase().substring(0, 30)}</span>
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="border-frame"></div>
    <div class="section">
      <div class="section-header">
        <span class="section-number">${String(i + 1).padStart(2, '0')}</span>
        <div>
          ${section.type ? `<span class="section-type">${section.type}</span><br>` : ''}
          <h2 style="margin: 8px 0 0 0;">${section.title || `SECTION ${i + 1}`}</h2>
        </div>
      </div>
      <div class="content">${section.content || ''}</div>
    </div>
    <div class="footer-line">
      <span>PAGE ${String(i + 2).padStart(2, '0')}</span>
      <span>${(title || 'DOCUMENT').toUpperCase().substring(0, 30)}</span>
    </div>
  </div>
  `).join('')}

  <div class="page">
    <div class="border-frame"></div>
    <div class="cta-page">
      <div class="cta-content">
        <h2>END.</h2>
        <p style="margin-top: 24px;">NOW GO EXECUTE.</p>
        <a href="#" class="button">TAKE ACTION →</a>
        ${name ? `<p style="margin-top: 48px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">${name}</p>` : ''}
        ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
      </div>
    </div>
    <div class="footer-line">
      <span>PAGE ${String(sections.length + 2).padStart(2, '0')}</span>
      <span>FIN</span>
    </div>
  </div>
</body>
</html>`
}
