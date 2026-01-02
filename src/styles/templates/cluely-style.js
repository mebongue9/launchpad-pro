// /src/styles/templates/cluely-style.js
// Modern SaaS aesthetic with gradient accents
// Card-based layout, tech-forward feel
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const cluelyStyle = {
  id: 'cluely-style',
  name: 'Cluely Style',
  category: 'creative',
  description: 'Modern SaaS aesthetic with gradients and cards',
  preview: {
    bg: '#f8fafc',
    accent: '#6366f1'
  },

  fonts: {
    heading: '"Inter", -apple-system, sans-serif',
    body: '"Inter", -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  },

  colors: {
    background: '#f8fafc',
    backgroundAlt: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    danger: '#ef4444',
    success: '#10b981',
    border: '#e2e8f0'
  },

  typography: {
    h1: { size: '48px', weight: '700', lineHeight: '1.15' },
    h2: { size: '32px', weight: '600', lineHeight: '1.25' },
    h3: { size: '22px', weight: '600', lineHeight: '1.35' },
    body: { size: '16px', weight: '400', lineHeight: '1.65' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '48px',
    section: '40px',
    element: '20px'
  },

  components: {
    card: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '28px'
    },
    button: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: '#ffffff',
      borderRadius: '12px',
      padding: '14px 28px',
      fontWeight: '600'
    },
    badge: {
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '600'
    }
  }
}

export function generateHTML(content, branding, template = cluelyStyle) {
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
      justify-content: center;
      min-height: calc(297mm - 96px);
      position: relative;
    }

    .cover::before {
      content: '';
      position: absolute;
      top: -48px;
      right: -48px;
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, ${template.colors.primary}20 0%, ${template.colors.secondary}20 100%);
      border-radius: 50%;
      filter: blur(60px);
    }

    .logo {
      width: 56px;
      height: 56px;
      object-fit: contain;
      margin-bottom: 32px;
    }

    .photo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      object-fit: cover;
      margin-bottom: 24px;
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 16px;
      position: relative;
    }

    h2 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h2.size};
      font-weight: ${template.typography.h2.weight};
      line-height: ${template.typography.h2.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 16px;
    }

    h3 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h3.size};
      font-weight: ${template.typography.h3.weight};
      line-height: ${template.typography.h3.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 12px;
    }

    .subtitle {
      font-size: 18px;
      color: ${template.colors.textMuted};
      margin-bottom: 32px;
      max-width: 480px;
    }

    .author {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      color: ${template.colors.textMuted};
      margin-top: auto;
      padding-top: 40px;
    }

    .author img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      object-fit: cover;
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
      background: linear-gradient(135deg, ${template.colors.primary}15 0%, ${template.colors.secondary}15 100%);
      color: ${template.colors.primary};
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .content {
      color: ${template.colors.textMuted};
      line-height: 1.75;
    }

    .card {
      background: ${template.components.card.background};
      border: ${template.components.card.border};
      border-radius: ${template.components.card.borderRadius};
      box-shadow: ${template.components.card.shadow};
      padding: ${template.components.card.padding};
      margin-bottom: 20px;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 24px;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: ${template.colors.backgroundAlt};
      border-radius: 12px;
    }

    .feature-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      flex-shrink: 0;
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 96px);
      position: relative;
    }

    .cta-page::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 500px;
      height: 300px;
      background: linear-gradient(180deg, transparent 0%, ${template.colors.primary}10 100%);
      border-radius: 100% 100% 0 0;
    }

    .button {
      display: inline-block;
      background: ${template.components.button.background};
      color: ${template.components.button.color};
      padding: ${template.components.button.padding};
      border-radius: ${template.components.button.borderRadius};
      font-weight: ${template.components.button.fontWeight};
      text-decoration: none;
      font-size: 15px;
      margin-top: 28px;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }

    .social {
      margin-top: 20px;
      color: ${template.colors.textMuted};
      font-size: 14px;
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
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${(name || photo_url) ? `
      <div class="author">
        ${photo_url ? `<img src="${photo_url}" alt="Author">` : ''}
        <div>
          ${name ? `<strong>${name}</strong>` : ''}
          ${tagline ? `<br><span style="font-size: 13px;">${tagline}</span>` : ''}
        </div>
      </div>
      ` : ''}
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="section">
      ${section.type ? `<span class="section-type">${section.type}</span>` : ''}
      <h2>${section.title || `Section ${i + 1}`}</h2>
      <div class="card">
        <div class="content">${section.content || ''}</div>
      </div>
    </div>
  </div>
  `).join('')}

  <div class="page">
    <div class="cta-page">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h2>Ready to Get Started?</h2>
      <p class="subtitle">Transform your business with these proven strategies</p>
      <a href="#" class="button">Get Started Now →</a>
      ${name ? `<p class="social" style="margin-top: 32px;">Created by ${name}</p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
