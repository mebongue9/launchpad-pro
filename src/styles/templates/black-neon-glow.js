// /src/styles/templates/black-neon-glow.js
// Pure black background with neon accents
// High-impact glowing effects
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const blackNeonGlow = {
  id: 'black-neon-glow',
  name: 'Black Neon Glow',
  category: 'dark',
  description: 'Pure black with vibrant neon glow effects',
  preview: {
    bg: '#000000',
    accent: '#ff00ff'
  },

  fonts: {
    heading: '"Space Grotesk", -apple-system, sans-serif',
    body: '"Inter", -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500&display=swap'
  },

  colors: {
    background: '#000000',
    backgroundAlt: '#0a0a0a',
    text: '#ffffff',
    textMuted: '#888888',
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ffff00',
    danger: '#ff0055',
    success: '#00ff88',
    border: '#333333'
  },

  typography: {
    h1: { size: '56px', weight: '700', lineHeight: '1.1' },
    h2: { size: '40px', weight: '600', lineHeight: '1.2' },
    h3: { size: '26px', weight: '600', lineHeight: '1.3' },
    body: { size: '16px', weight: '400', lineHeight: '1.7' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '56px',
    section: '48px',
    element: '24px'
  },

  components: {
    card: {
      background: '#0a0a0a',
      border: '1px solid #333333',
      borderRadius: '12px',
      shadow: '0 0 40px rgba(255, 0, 255, 0.15)',
      padding: '32px'
    },
    button: {
      background: 'transparent',
      color: '#ff00ff',
      borderRadius: '8px',
      padding: '14px 32px',
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

export function generateHTML(content, branding, template = blackNeonGlow) {
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

    .grid-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        linear-gradient(rgba(255, 0, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 0, 255, 0.03) 1px, transparent 1px);
      background-size: 30px 30px;
      pointer-events: none;
    }

    .glow-line {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${template.colors.primary}, transparent);
      box-shadow: 0 0 20px ${template.colors.primary};
    }

    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 112px);
      position: relative;
      z-index: 1;
    }

    .logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      margin-bottom: 40px;
      filter: drop-shadow(0 0 30px ${template.colors.primary});
    }

    .photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 32px;
      border: 3px solid ${template.colors.primary};
      box-shadow: 0 0 30px ${template.colors.primary}, inset 0 0 20px rgba(255, 0, 255, 0.3);
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 20px;
      text-shadow:
        0 0 10px ${template.colors.primary},
        0 0 30px ${template.colors.primary},
        0 0 60px rgba(255, 0, 255, 0.5);
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
      max-width: 480px;
    }

    .author {
      font-size: 16px;
      color: ${template.colors.secondary};
      text-shadow: 0 0 10px ${template.colors.secondary};
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
      background: transparent;
      color: ${template.colors.primary};
      border: 1px solid ${template.colors.primary};
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(255, 0, 255, 0.2);
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
      position: relative;
    }

    .card::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 20%;
      right: 20%;
      height: 2px;
      background: ${template.colors.primary};
      box-shadow: 0 0 10px ${template.colors.primary};
    }

    .neon-text {
      color: ${template.colors.primary};
      text-shadow:
        0 0 5px ${template.colors.primary},
        0 0 15px ${template.colors.primary},
        0 0 30px rgba(255, 0, 255, 0.5);
    }

    .cyan-text {
      color: ${template.colors.secondary};
      text-shadow:
        0 0 5px ${template.colors.secondary},
        0 0 15px ${template.colors.secondary},
        0 0 30px rgba(0, 255, 255, 0.5);
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 112px);
      position: relative;
      z-index: 1;
    }

    .button {
      display: inline-block;
      background: transparent;
      color: ${template.colors.primary};
      padding: ${template.components.button.padding};
      border-radius: ${template.components.button.borderRadius};
      font-weight: ${template.components.button.fontWeight};
      text-decoration: none;
      font-size: 16px;
      margin-top: 32px;
      border: 2px solid ${template.colors.primary};
      box-shadow: 0 0 20px rgba(255, 0, 255, 0.5), inset 0 0 20px rgba(255, 0, 255, 0.1);
      text-shadow: 0 0 10px ${template.colors.primary};
    }

    .social {
      margin-top: 24px;
      color: ${template.colors.secondary};
      text-shadow: 0 0 10px ${template.colors.secondary};
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 20mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="grid-bg"></div>
    <div class="glow-line" style="top: 100px; left: 0; width: 40%; opacity: 0.5;"></div>
    <div class="glow-line" style="bottom: 150px; right: 0; width: 50%; opacity: 0.3;"></div>
    <div class="cover">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      ${photo_url ? `<img src="${photo_url}" alt="Photo" class="photo">` : ''}
      <h1 class="neon-text">${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">${name}</p>` : ''}
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="grid-bg"></div>
    <div class="glow-line" style="top: ${60 + (i * 40) % 200}px; ${i % 2 === 0 ? 'left' : 'right'}: 0; width: ${30 + (i * 10) % 30}%; opacity: 0.4;"></div>
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
    <div class="grid-bg"></div>
    <div class="glow-line" style="top: 50%; left: 10%; width: 80%; opacity: 0.6;"></div>
    <div class="cta-page">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h2 class="cyan-text">LEVEL UP</h2>
      <p class="subtitle">The future is now. Take action.</p>
      <a href="#" class="button">ACTIVATE →</a>
      ${name ? `<p style="margin-top: 40px;" class="author">${name}</p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
