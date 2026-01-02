// /src/styles/templates/memphis-design.js
// Bold geometric shapes, playful colors
// 80s/90s revival aesthetic
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const memphisDesign = {
  id: 'memphis-design',
  name: 'Memphis Design',
  category: 'creative',
  description: 'Bold geometric shapes with playful retro colors',
  preview: {
    bg: '#fff5e6',
    accent: '#ff6b6b'
  },

  fonts: {
    heading: '"Poppins", -apple-system, sans-serif',
    body: '"Poppins", -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'
  },

  colors: {
    background: '#fff5e6',
    backgroundAlt: '#ffffff',
    text: '#1a1a2e',
    textMuted: '#4a4a6a',
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    accent: '#ffe66d',
    danger: '#ff6b6b',
    success: '#4ecdc4',
    border: '#1a1a2e'
  },

  typography: {
    h1: { size: '52px', weight: '800', lineHeight: '1.1' },
    h2: { size: '36px', weight: '700', lineHeight: '1.2' },
    h3: { size: '24px', weight: '600', lineHeight: '1.3' },
    body: { size: '16px', weight: '400', lineHeight: '1.65' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '48px',
    section: '40px',
    element: '24px'
  },

  components: {
    card: {
      background: '#ffffff',
      border: '3px solid #1a1a2e',
      borderRadius: '0',
      shadow: '8px 8px 0 #1a1a2e',
      padding: '28px'
    },
    button: {
      background: '#ff6b6b',
      color: '#ffffff',
      borderRadius: '0',
      padding: '14px 28px',
      fontWeight: '700'
    },
    badge: {
      padding: '6px 14px',
      borderRadius: '0',
      fontSize: '12px',
      fontWeight: '700'
    }
  }
}

export function generateHTML(content, branding, template = memphisDesign) {
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

    .shape {
      position: absolute;
      pointer-events: none;
    }

    .shape-circle {
      border: 4px solid ${template.colors.primary};
      border-radius: 50%;
    }

    .shape-triangle {
      width: 0;
      height: 0;
      border-left: 40px solid transparent;
      border-right: 40px solid transparent;
      border-bottom: 70px solid ${template.colors.secondary};
    }

    .shape-squiggle {
      font-size: 80px;
      color: ${template.colors.accent};
      font-weight: 700;
    }

    .shape-dots {
      display: grid;
      grid-template-columns: repeat(5, 8px);
      gap: 8px;
    }

    .shape-dots span {
      width: 8px;
      height: 8px;
      background: ${template.colors.primary};
      border-radius: 50%;
    }

    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: calc(297mm - 96px);
      position: relative;
      z-index: 1;
    }

    .logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 32px;
      border: 3px solid ${template.colors.text};
      padding: 8px;
    }

    .photo {
      width: 100px;
      height: 100px;
      object-fit: cover;
      margin-bottom: 24px;
      border: 4px solid ${template.colors.text};
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 16px;
      position: relative;
      display: inline-block;
    }

    h1::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 8px;
      background: ${template.colors.accent};
      z-index: -1;
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
      margin-bottom: 12px;
    }

    .subtitle {
      font-size: 18px;
      color: ${template.colors.textMuted};
      margin-bottom: 40px;
      max-width: 450px;
    }

    .author {
      font-size: 16px;
      font-weight: 600;
    }

    .section {
      margin-bottom: ${template.spacing.section};
      position: relative;
      z-index: 1;
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      background: ${template.colors.accent};
      color: ${template.colors.text};
      margin-bottom: 16px;
      text-transform: uppercase;
      transform: rotate(-2deg);
    }

    .content {
      color: ${template.colors.text};
      line-height: 1.7;
    }

    .card {
      background: ${template.components.card.background};
      border: ${template.components.card.border};
      box-shadow: ${template.components.card.shadow};
      padding: ${template.components.card.padding};
      margin-bottom: 24px;
    }

    .highlight-box {
      background: ${template.colors.secondary};
      color: white;
      padding: 20px;
      margin: 20px 0;
      transform: rotate(1deg);
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 96px);
      position: relative;
      z-index: 1;
    }

    .button {
      display: inline-block;
      background: ${template.components.button.background};
      color: ${template.components.button.color};
      padding: ${template.components.button.padding};
      font-weight: ${template.components.button.fontWeight};
      text-decoration: none;
      font-size: 16px;
      text-transform: uppercase;
      margin-top: 28px;
      border: 3px solid ${template.colors.text};
      box-shadow: 6px 6px 0 ${template.colors.text};
    }

    .social {
      margin-top: 24px;
      font-weight: 600;
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
    <div class="shape shape-circle" style="width: 120px; height: 120px; top: 60px; right: 60px;"></div>
    <div class="shape shape-triangle" style="bottom: 80px; right: 100px;"></div>
    <div class="shape shape-squiggle" style="top: 150px; left: -20px;">~</div>
    <div class="shape shape-dots" style="bottom: 150px; left: 60px;">
      ${Array(15).fill('<span></span>').join('')}
    </div>
    <div class="cover">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      ${photo_url ? `<img src="${photo_url}" alt="Photo" class="photo">` : ''}
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      ${name ? `<p class="author">${name}</p>` : ''}
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <div class="shape shape-${['circle', 'triangle', 'squiggle'][i % 3]}" style="width: 80px; height: 80px; top: ${40 + (i * 20) % 100}px; right: ${60 + (i * 30) % 120}px;"></div>
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
    <div class="shape shape-circle" style="width: 200px; height: 200px; top: 40px; left: -60px;"></div>
    <div class="shape shape-triangle" style="top: 80px; right: 80px; transform: rotate(45deg);"></div>
    <div class="shape shape-squiggle" style="bottom: 100px; right: 40px;">~</div>
    <div class="cta-page">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h2>Let's Go!</h2>
      <p class="subtitle">Time to put this into action</p>
      <a href="#" class="button">Start Now →</a>
      ${name ? `<p style="margin-top: 40px; font-weight: 600;">Made with ♥ by ${name}</p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
