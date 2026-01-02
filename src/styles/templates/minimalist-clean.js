// /src/styles/templates/minimalist-clean.js
// Ultra-minimal design with maximum whitespace
// Single accent color, clean typography
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const minimalistClean = {
  id: 'minimalist-clean',
  name: 'Minimalist Clean',
  category: 'clean',
  description: 'Maximum whitespace with ultra-clean typography',
  preview: {
    bg: '#fafafa',
    accent: '#111111'
  },

  fonts: {
    heading: '"Inter", -apple-system, sans-serif',
    body: '"Inter", -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  },

  colors: {
    background: '#fafafa',
    backgroundAlt: '#ffffff',
    text: '#111111',
    textMuted: '#666666',
    primary: '#111111',
    secondary: '#333333',
    accent: '#000000',
    danger: '#dc2626',
    success: '#16a34a',
    border: '#e5e5e5'
  },

  typography: {
    h1: { size: '48px', weight: '300', lineHeight: '1.2' },
    h2: { size: '32px', weight: '400', lineHeight: '1.3' },
    h3: { size: '24px', weight: '500', lineHeight: '1.4' },
    body: { size: '17px', weight: '400', lineHeight: '1.7' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '100px',
    section: '80px',
    element: '32px'
  },

  components: {
    card: {
      background: '#ffffff',
      border: '1px solid #e5e5e5',
      borderRadius: '0',
      shadow: 'none',
      padding: '40px'
    },
    button: {
      background: '#111111',
      color: '#ffffff',
      borderRadius: '0',
      padding: '16px 40px',
      fontWeight: '500'
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '0',
      fontSize: '11px',
      fontWeight: '600'
    }
  }
}

export function generateHTML(content, branding, template = minimalistClean) {
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
      justify-content: flex-end;
      min-height: calc(297mm - 200px);
    }

    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 60px;
    }

    .photo {
      width: 80px;
      height: 80px;
      object-fit: cover;
      margin-bottom: 40px;
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }

    h2 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h2.size};
      font-weight: ${template.typography.h2.weight};
      line-height: ${template.typography.h2.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 24px;
      letter-spacing: -0.01em;
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
      font-weight: 300;
      margin-bottom: 60px;
    }

    .author {
      font-size: 14px;
      color: ${template.colors.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .section {
      margin-bottom: ${template.spacing.section};
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      border: 1px solid ${template.colors.text};
      color: ${template.colors.text};
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .content {
      color: ${template.colors.text};
      line-height: 1.8;
      max-width: 600px;
    }

    .divider {
      width: 40px;
      height: 1px;
      background: ${template.colors.text};
      margin: 40px 0;
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: calc(297mm - 200px);
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
      margin-top: 40px;
      align-self: flex-start;
    }

    .social {
      margin-top: 40px;
      color: ${template.colors.textMuted};
      font-size: 14px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 25mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">${name}</p>` : ''}
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="section">
      ${section.type ? `<span class="section-type">${section.type}</span>` : ''}
      <h2>${section.title || `Section ${i + 1}`}</h2>
      <div class="divider"></div>
      <div class="content">${section.content || ''}</div>
    </div>
  </div>
  `).join('')}

  <div class="page">
    <div class="cta-page">
      <h2>Next Steps</h2>
      <div class="divider"></div>
      <p class="content">Take action on what you've learned.</p>
      ${name ? `<p class="author" style="margin-top: 60px;">Created by ${name}</p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
