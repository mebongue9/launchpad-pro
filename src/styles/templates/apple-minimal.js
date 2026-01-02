// /src/styles/templates/apple-minimal.js
// Apple-inspired minimal clean design
// System fonts, maximum whitespace, refined elegance
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const appleMinimal = {
  id: 'apple-minimal',
  name: 'Apple Minimal',
  category: 'clean',
  description: 'Clean, elegant design inspired by Apple aesthetics',
  preview: {
    bg: '#ffffff',
    accent: '#0071e3'
  },

  fonts: {
    heading: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    googleFontsUrl: null
  },

  colors: {
    background: '#ffffff',
    backgroundAlt: '#f5f5f7',
    text: '#1d1d1f',
    textMuted: '#86868b',
    primary: '#0071e3',
    secondary: '#34c759',
    accent: '#5856d6',
    danger: '#ff3b30',
    success: '#34c759',
    border: '#d2d2d7'
  },

  typography: {
    h1: { size: '56px', weight: '700', lineHeight: '1.1' },
    h2: { size: '40px', weight: '600', lineHeight: '1.2' },
    h3: { size: '28px', weight: '600', lineHeight: '1.3' },
    body: { size: '19px', weight: '400', lineHeight: '1.6' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '80px',
    section: '60px',
    element: '24px'
  },

  components: {
    card: {
      background: '#ffffff',
      border: 'none',
      borderRadius: '20px',
      shadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
      padding: '40px'
    },
    button: {
      background: '#0071e3',
      color: '#ffffff',
      borderRadius: '12px',
      padding: '16px 32px',
      fontWeight: '600'
    },
    badge: {
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500'
    }
  }
}

export function generateHTML(content, branding, template = appleMinimal) {
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
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 160px);
    }

    .logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      margin-bottom: 40px;
    }

    .photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 20px;
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 24px;
    }

    h2 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h2.size};
      font-weight: ${template.typography.h2.weight};
      line-height: ${template.typography.h2.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 20px;
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
      font-size: 24px;
      color: ${template.colors.textMuted};
      margin-bottom: 40px;
    }

    .author {
      font-size: 18px;
      color: ${template.colors.textMuted};
    }

    .author strong {
      color: ${template.colors.text};
    }

    .section {
      margin-bottom: ${template.spacing.section};
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      border-radius: ${template.components.badge.borderRadius};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      background: ${template.colors.primary}15;
      color: ${template.colors.primary};
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .content {
      color: ${template.colors.text};
      line-height: 1.7;
    }

    .card {
      background: ${template.components.card.background};
      border-radius: ${template.components.card.borderRadius};
      box-shadow: ${template.components.card.shadow};
      padding: ${template.components.card.padding};
      margin-bottom: 24px;
    }

    .checklist {
      list-style: none;
      padding: 0;
    }

    .checklist li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid ${template.colors.border};
    }

    .checklist li:last-child {
      border-bottom: none;
    }

    .check {
      width: 24px;
      height: 24px;
      background: ${template.colors.success};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      flex-shrink: 0;
    }

    .cta-page {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(297mm - 160px);
    }

    .button {
      display: inline-block;
      background: ${template.components.button.background};
      color: ${template.components.button.color};
      padding: ${template.components.button.padding};
      border-radius: ${template.components.button.borderRadius};
      font-weight: ${template.components.button.fontWeight};
      text-decoration: none;
      font-size: 18px;
      margin-top: 32px;
    }

    .social {
      margin-top: 24px;
      color: ${template.colors.textMuted};
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 20mm; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page">
    <div class="cover">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      ${photo_url ? `<img src="${photo_url}" alt="Photo" class="photo">` : ''}
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">By <strong>${name}</strong>${tagline ? ` - ${tagline}` : ''}</p>` : ''}
    </div>
  </div>

  <!-- Content Pages -->
  ${sections.map((section, i) => `
  <div class="page">
    <div class="section">
      ${section.type ? `<span class="section-type">${section.type}</span>` : ''}
      <h2>${section.title || `Section ${i + 1}`}</h2>
      <div class="content">${section.content || ''}</div>
    </div>
  </div>
  `).join('')}

  <!-- CTA Page -->
  <div class="page">
    <div class="cta-page">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h2>Ready to Take Action?</h2>
      <p class="subtitle">Start your transformation today</p>
      ${name ? `<p class="author">Created by <strong>${name}</strong></p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
