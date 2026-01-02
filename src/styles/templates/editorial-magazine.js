// /src/styles/templates/editorial-magazine.js
// Sophisticated magazine-style layout
// Serif headings, pull quotes, elegant typography
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const editorialMagazine = {
  id: 'editorial-magazine',
  name: 'Editorial Magazine',
  category: 'clean',
  description: 'Sophisticated magazine-style with serif headings',
  preview: {
    bg: '#fffef8',
    accent: '#1a1a1a'
  },

  fonts: {
    heading: '"Playfair Display", Georgia, serif',
    body: '"Source Sans 3", -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@400;600&display=swap'
  },

  colors: {
    background: '#fffef8',
    backgroundAlt: '#f5f4ee',
    text: '#1a1a1a',
    textMuted: '#666666',
    primary: '#c9a227',
    secondary: '#1a1a1a',
    accent: '#c9a227',
    danger: '#a03232',
    success: '#2a6041',
    border: '#e5e4de'
  },

  typography: {
    h1: { size: '56px', weight: '700', lineHeight: '1.15' },
    h2: { size: '36px', weight: '600', lineHeight: '1.25' },
    h3: { size: '24px', weight: '500', lineHeight: '1.35' },
    body: { size: '17px', weight: '400', lineHeight: '1.75' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '56px',
    section: '48px',
    element: '24px'
  },

  components: {
    card: {
      background: '#ffffff',
      border: '1px solid #e5e4de',
      borderRadius: '0',
      shadow: 'none',
      padding: '32px'
    },
    button: {
      background: '#1a1a1a',
      color: '#ffffff',
      borderRadius: '0',
      padding: '14px 32px',
      fontWeight: '600'
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '0',
      fontSize: '11px',
      fontWeight: '600'
    }
  }
}

export function generateHTML(content, branding, template = editorialMagazine) {
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
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .cover {
      display: flex;
      flex-direction: column;
      min-height: calc(297mm - 112px);
      border-top: 4px solid ${template.colors.text};
      padding-top: 40px;
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 60px;
    }

    .logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }

    .issue-date {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: ${template.colors.textMuted};
    }

    .photo {
      width: 120px;
      height: 120px;
      object-fit: cover;
      margin-bottom: 32px;
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 24px;
      max-width: 600px;
    }

    h2 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h2.size};
      font-weight: ${template.typography.h2.weight};
      line-height: ${template.typography.h2.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 24px;
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
      font-family: ${template.fonts.heading};
      font-size: 22px;
      font-style: italic;
      color: ${template.colors.textMuted};
      margin-bottom: 48px;
      max-width: 500px;
    }

    .author {
      margin-top: auto;
      padding-top: 40px;
      border-top: 1px solid ${template.colors.border};
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .section {
      margin-bottom: ${template.spacing.section};
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${template.colors.text};
    }

    .section-number {
      font-family: ${template.fonts.heading};
      font-size: 48px;
      font-weight: 400;
      color: ${template.colors.primary};
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      border: 1px solid ${template.colors.text};
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .content {
      color: ${template.colors.text};
      line-height: 1.85;
    }

    .content-columns {
      columns: 2;
      column-gap: 40px;
    }

    .pull-quote {
      font-family: ${template.fonts.heading};
      font-size: 28px;
      font-style: italic;
      line-height: 1.4;
      color: ${template.colors.text};
      padding: 32px 0;
      margin: 24px 0;
      border-top: 1px solid ${template.colors.border};
      border-bottom: 1px solid ${template.colors.border};
    }

    .drop-cap {
      float: left;
      font-family: ${template.fonts.heading};
      font-size: 72px;
      line-height: 0.8;
      padding-right: 12px;
      padding-top: 8px;
      color: ${template.colors.primary};
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: calc(297mm - 112px);
      text-align: center;
      border-top: 4px solid ${template.colors.text};
      padding-top: 40px;
    }

    .ornament {
      font-size: 24px;
      color: ${template.colors.primary};
      margin-bottom: 32px;
    }

    .button {
      display: inline-block;
      background: ${template.components.button.background};
      color: ${template.components.button.color};
      padding: ${template.components.button.padding};
      font-weight: ${template.components.button.fontWeight};
      text-decoration: none;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-top: 32px;
    }

    .social {
      margin-top: 32px;
      font-size: 14px;
      font-style: italic;
      color: ${template.colors.textMuted};
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 20mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <div class="cover-header">
        ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : '<div></div>'}
        <span class="issue-date">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>
      ${photo_url ? `<img src="${photo_url}" alt="Author" class="photo">` : ''}
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">By ${name}${tagline ? ` — ${tagline}` : ''}</p>` : ''}
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="section">
      <div class="section-header">
        <span class="section-number">${String(i + 1).padStart(2, '0')}</span>
        <div>
          ${section.type ? `<span class="section-type">${section.type}</span>` : ''}
          <h2 style="margin: 8px 0 0 0;">${section.title || `Section ${i + 1}`}</h2>
        </div>
      </div>
      <div class="content">${section.content || ''}</div>
    </div>
  </div>
  `).join('')}

  <div class="page">
    <div class="cta-page">
      <div class="ornament">❧</div>
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo" style="margin: 0 auto 32px;">` : ''}
      <h2>Continue Your Journey</h2>
      <p class="subtitle" style="margin: 16px auto 0; max-width: 400px;">Apply these insights and transform your approach</p>
      ${name ? `<p class="author" style="margin-top: 48px; border: none; padding: 0;">Created by ${name}</p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
