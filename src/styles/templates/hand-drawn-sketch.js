// /src/styles/templates/hand-drawn-sketch.js
// Sketch-style borders, handwritten fonts
// Casual, approachable feel with doodle elements
// RELEVANT FILES: src/styles/templates/index.js, src/pages/VisualBuilder.jsx

export const handDrawnSketch = {
  id: 'hand-drawn-sketch',
  name: 'Hand-drawn Sketch',
  category: 'creative',
  description: 'Casual sketch-style with handwritten fonts',
  preview: {
    bg: '#fefefe',
    accent: '#2c5282'
  },

  fonts: {
    heading: '"Caveat", cursive',
    body: '"Nunito", -apple-system, sans-serif',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Nunito:wght@400;600&display=swap'
  },

  colors: {
    background: '#fefefe',
    backgroundAlt: '#f7f7f5',
    text: '#2d3748',
    textMuted: '#718096',
    primary: '#2c5282',
    secondary: '#38a169',
    accent: '#d69e2e',
    danger: '#c53030',
    success: '#38a169',
    border: '#2d3748'
  },

  typography: {
    h1: { size: '56px', weight: '700', lineHeight: '1.2' },
    h2: { size: '40px', weight: '600', lineHeight: '1.3' },
    h3: { size: '28px', weight: '500', lineHeight: '1.4' },
    body: { size: '17px', weight: '400', lineHeight: '1.7' },
    small: { size: '14px', weight: '400', lineHeight: '1.5' }
  },

  spacing: {
    page: '56px',
    section: '48px',
    element: '24px'
  },

  components: {
    card: {
      background: '#fefefe',
      border: '2px dashed #2d3748',
      borderRadius: '8px',
      shadow: 'none',
      padding: '28px'
    },
    button: {
      background: '#2c5282',
      color: '#ffffff',
      borderRadius: '24px',
      padding: '14px 32px',
      fontWeight: '600'
    },
    badge: {
      padding: '6px 14px',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: '600'
    }
  }
}

export function generateHTML(content, branding, template = handDrawnSketch) {
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
      background-image:
        linear-gradient(${template.colors.backgroundAlt} 1px, transparent 1px);
      background-size: 100% 32px;
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .doodle {
      position: absolute;
      font-family: ${template.fonts.heading};
      color: ${template.colors.primary};
      opacity: 0.15;
      pointer-events: none;
    }

    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: calc(297mm - 112px);
      position: relative;
    }

    .logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 32px;
      border: 2px dashed ${template.colors.text};
      border-radius: 50%;
      padding: 8px;
    }

    .photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 24px;
      border: 3px solid ${template.colors.primary};
      transform: rotate(-3deg);
    }

    h1 {
      font-family: ${template.fonts.heading};
      font-size: ${template.typography.h1.size};
      font-weight: ${template.typography.h1.weight};
      line-height: ${template.typography.h1.lineHeight};
      color: ${template.colors.text};
      margin-bottom: 16px;
      transform: rotate(-1deg);
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
      font-size: 20px;
      color: ${template.colors.textMuted};
      margin-bottom: 40px;
      max-width: 450px;
      font-style: italic;
    }

    .author {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      color: ${template.colors.textMuted};
      font-family: ${template.fonts.heading};
      font-size: 22px;
    }

    .arrow-doodle {
      display: inline-block;
      transform: rotate(10deg);
    }

    .section {
      margin-bottom: ${template.spacing.section};
      position: relative;
    }

    .section-type {
      display: inline-block;
      padding: ${template.components.badge.padding};
      border-radius: ${template.components.badge.borderRadius};
      font-size: ${template.components.badge.fontSize};
      font-weight: ${template.components.badge.fontWeight};
      background: ${template.colors.accent}30;
      color: ${template.colors.text};
      margin-bottom: 16px;
      font-family: ${template.fonts.heading};
      transform: rotate(-2deg);
    }

    .content {
      color: ${template.colors.text};
      line-height: 1.8;
    }

    .card {
      background: ${template.components.card.background};
      border: ${template.components.card.border};
      border-radius: ${template.components.card.borderRadius};
      padding: ${template.components.card.padding};
      margin-bottom: 24px;
      transform: rotate(0.5deg);
      position: relative;
    }

    .card::before {
      content: '📌';
      position: absolute;
      top: -12px;
      left: 20px;
      font-size: 24px;
    }

    .checklist {
      list-style: none;
      padding: 0;
    }

    .checklist li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 0;
      font-family: ${template.fonts.heading};
      font-size: 20px;
    }

    .checklist li::before {
      content: '☐';
      font-size: 18px;
    }

    .highlight {
      background: ${template.colors.accent}40;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .cta-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 112px);
      position: relative;
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
      font-family: ${template.fonts.heading};
      transform: rotate(2deg);
    }

    .social {
      margin-top: 24px;
      color: ${template.colors.primary};
      font-family: ${template.fonts.heading};
      font-size: 22px;
    }

    .star-doodle::after {
      content: ' ⭐';
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 20mm; background-image: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <span class="doodle" style="top: 80px; right: 80px; font-size: 120px; transform: rotate(15deg);">✨</span>
    <span class="doodle" style="bottom: 100px; left: 60px; font-size: 80px; transform: rotate(-10deg);">→</span>
    <div class="cover">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      ${photo_url ? `<img src="${photo_url}" alt="Photo" class="photo">` : ''}
      <h1>${title || 'Untitled'}</h1>
      ${subtitle ? `<p class="subtitle">"${subtitle}"</p>` : ''}
      ${name ? `<p class="author"><span class="arrow-doodle">→</span> by ${name}</p>` : ''}
    </div>
  </div>

  ${sections.map((section, i) => `
  <div class="page">
    <span class="doodle" style="top: ${60 + (i * 30) % 100}px; right: ${40 + (i * 20) % 80}px; font-size: ${60 + (i * 10) % 40}px; transform: rotate(${(i * 15) % 30}deg);">
      ${['☆', '→', '!', '♥', '✓'][i % 5]}
    </span>
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
    <span class="doodle" style="top: 100px; left: 80px; font-size: 100px; transform: rotate(-15deg);">★</span>
    <span class="doodle" style="bottom: 120px; right: 100px; font-size: 80px; transform: rotate(20deg);">♥</span>
    <div class="cta-page">
      ${logo_url ? `<img src="${logo_url}" alt="Logo" class="logo">` : ''}
      <h2>You got this! 💪</h2>
      <p class="subtitle">Now go make it happen...</p>
      <a href="#" class="button">Let's do it! →</a>
      ${name ? `<p style="margin-top: 40px; font-family: 'Caveat', cursive; font-size: 24px;">Made with ♥ by ${name}</p>` : ''}
      ${social_handle ? `<p class="social">${social_handle}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}
