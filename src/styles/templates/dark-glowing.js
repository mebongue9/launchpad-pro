// /src/styles/templates/dark-glowing.js
// Dark theme with glowing text effects
// Cyan/purple accents, tech/premium feel
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const darkGlowing = {
  id: 'dark-glowing',
  name: 'Dark Glowing',
  category: 'dark',
  description: 'Dark background with glowing cyan/purple accents',
  preview: {
    bg: '#0a0a0a',
    accent: '#00d4ff'
  },

  fonts: {
    heading: '"Inter", -apple-system, sans-serif',
    body: '"Inter", -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  },

  colors: {
    background: '#0a0a0a',
    backgroundAlt: '#141414',
    text: '#ffffff',
    textMuted: '#888888',
    primary: '#00d4ff',
    secondary: '#8b5cf6',
    accent: '#00d4ff',
    danger: '#ff4444',
    success: '#00ff88',
    border: '#333333'
  },

  typography: {
    h1: { size: '52px', weight: '700', lineHeight: '1.1' },
    h2: { size: '36px', weight: '600', lineHeight: '1.2' },
    h3: { size: '24px', weight: '600', lineHeight: '1.3' },
    body: { size: '17px', weight: '400', lineHeight: '1.7' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '60px',
    section: '48px',
    element: '24px'
  },

  components: {
    card: {
      background: '#141414',
      border: '1px solid #333333',
      borderRadius: '16px',
      shadow: '0 0 30px rgba(0, 212, 255, 0.1)',
      padding: '32px'
    },
    button: {
      background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)',
      color: '#000000',
      borderRadius: '8px',
      padding: '14px 28px',
      fontWeight: '600'
    },
    badge: {
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    }
  }
}

export function generateHTML(content, branding, template = darkGlowing) {
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
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .glow-orb {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.3;
      pointer-events: none;
    }

    .glow-cyan {
      background: ${template.colors.primary};
      top: -100px;
      right: -100px;
    }

    .glow-purple {
      background: ${template.colors.secondary};
      bottom: -100px;
      left: -100px;
    }

    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 120px);
      position: relative;
      z-index: 1;
    }

    .logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      margin-bottom: 40px;
      filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.5));
    }

    .photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 24px;
      border: 3px solid ${template.colors.primary};
      box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 20px;
      text-shadow: 0 0 40px rgba(0, 212, 255, 0.5);
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
      font-size: 20px;
      color: ${template.colors.textMuted};
      margin-bottom: 40px;
      max-width: 500px;
    }

    .author {
      font-size: 16px;
      color: ${template.colors.textMuted};
    }

    .author strong {
      color: ${template.colors.primary};
    }

    .section {
      margin-bottom: ${template.spacing.section};
      position: relative;
      z-index: 1;
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      border-radius: ${template.components.badge.borderRadius};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      background: ${template.colors.primary}20;
      color: ${template.colors.primary};
      border: 1px solid ${template.colors.primary}40;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .content {
      color: ${template.colors.textMuted};
      line-height: 1.8;
    }

    .card {
      background: ${template.components.card.background};
      border: ${template.components.card.border};
      border-radius: ${template.components.card.borderRadius};
      box-shadow: ${template.components.card.shadow};
      padding: ${template.components.card.padding};
      margin-bottom: 24px;
    }

    .gradient-text {
      background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .cta-page {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(297mm - 120px);
      position: relative;
      z-index: 1;
    }

    .button {
      display: inline-block;
      background: ${template.components.button.background};
      color: ${template.components.button.color};
      padding: ${template.components.button.padding};
      border-radius: ${template.components.button.borderRadius};
      font-weight: ${template.components.button.fontWeight};
      text-decoration: none;
      font-size: 16px;
      margin-top: 32px;
      box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
    }

    .social {
      margin-top: 24px;
      color: ${template.colors.primary};
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 20mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="glow-orb glow-cyan"></div>
    <div class="glow-orb glow-purple"></div>
    <div class="cover">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      ${photo_url ? `<img src="${photo_url}" alt="Photo" class="photo">` : ''}
      <h1 class="gradient-text">${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">By <strong>${name}</strong></p>` : ''}
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="glow-orb glow-cyan" style="top: ${i % 2 === 0 ? '-150px' : 'auto'}; bottom: ${i % 2 === 0 ? 'auto' : '-150px'};"></div>
    <div class="section">
      ${section.type ? `<span class="section-type">${section.type}</span>` : ''}
      <h2>${section.title || `Section ${i + 1}`}</h2>
      <div class="content">${section.content || ''}</div>
    </div>
  </div>
  `).join('')}

  <div class="page">
    <div class="glow-orb glow-cyan"></div>
    <div class="glow-orb glow-purple"></div>
    <div class="cta-page">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h2 class="gradient-text">Ready to Level Up?</h2>
      <p class="subtitle">Start your transformation journey today</p>
      ${name ? `<p class="author">Created by <strong>${name}</strong></p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
