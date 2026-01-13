// netlify/functions/lib/interior-renderer.js
// Renders interior pages with colors from cover template
// RELEVANT FILES: netlify/functions/visual-builder-generate.js

/**
 * Render interior pages HTML with template colors
 * @param {Object} template - Cover template (for colors)
 * @param {Object} data - Content data
 * @param {Object} profile - Profile data (name, handle, photo)
 * @returns {string} Complete HTML document with all interior pages
 */
export function renderInterior(template, data, profile) {
  const { primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_gradient } = template
  const { title, content, format } = data
  const author = profile?.name || 'Author'
  const handle = profile?.social_handle || ''
  const photoUrl = profile?.photo_url || ''
  const tagline = profile?.tagline || ''
  const bio = profile?.bio || `${author} is an expert in their field, helping clients achieve exceptional results.`

  // Calculate header gradient
  const headerGradient = is_gradient
    ? `linear-gradient(90deg, ${secondary_color} 0%, ${primary_color} 50%, ${tertiary_color} 100%)`
    : primary_color

  // Calculate light background for callouts
  const lightBg = getLightBackground(primary_color)

  const baseStyles = getBaseStyles(template, headerGradient, lightBg)

  // Build pages based on content
  const pages = []

  // Add content pages from the actual content
  if (content && content.chapters) {
    content.chapters.forEach((chapter, index) => {
      pages.push(renderChapterPage(chapter, index + 1, baseStyles, font_family_url, handle))
    })
  } else {
    // Default sample chapter if no content
    pages.push(renderSampleChapter(baseStyles, font_family_url, handle))
  }

  // Add About the Author page at the end
  pages.push(renderAboutPage(baseStyles, font_family_url, {
    author,
    handle,
    photoUrl,
    tagline,
    bio,
    primaryColor: primary_color
  }))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${font_family_url}" rel="stylesheet">
  <style>
    @page { size: A4; margin: 0; }
    ${baseStyles}
  </style>
</head>
<body>
  ${pages.join('\n')}
</body>
</html>`
}

function getBaseStyles(template, headerGradient, lightBg) {
  const { primary_color, font_family, is_gradient } = template

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: 'Inter', -apple-system, sans-serif; background: #fff; }
    .page {
      width: 210mm;
      min-height: 297mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page:last-child { page-break-after: avoid; }
    .header-bar { height: 8px; background: ${headerGradient}; }
    .page-content { flex: 1; padding: 40px; }
    .chapter-label {
      font-family: '${font_family}', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: ${primary_color};
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 10px;
    }
    .chapter-title {
      font-family: '${font_family}', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    .divider {
      width: 70px;
      height: 4px;
      background: ${is_gradient ? headerGradient : primary_color};
      margin: 24px 0;
    }
    .body-text {
      font-size: 14px;
      line-height: 1.7;
      color: #333;
      margin-bottom: 20px;
    }
    .callout {
      background: ${lightBg};
      border-left: 4px solid ${primary_color};
      padding: 20px;
      margin: 20px 0;
    }
    .callout-title {
      font-family: '${font_family}', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: ${primary_color};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .callout-text { font-size: 13px; line-height: 1.6; color: #333; }
    .checklist-item { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid ${primary_color};
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .checklist-text { font-size: 14px; line-height: 1.5; color: #333; }
    .step { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
    .step-number {
      width: 32px;
      height: 32px;
      background: ${is_gradient ? headerGradient : primary_color};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: '${font_family}', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }
    .step-content { flex: 1; }
    .step-title { font-weight: 600; font-size: 15px; color: #1a1a1a; margin-bottom: 4px; }
    .step-text { font-size: 13px; line-height: 1.6; color: #555; }
    .page-footer {
      padding: 16px 40px;
      border-top: 2px solid ${primary_color};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-left { display: flex; align-items: center; gap: 12px; }
    .footer-photo {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid ${primary_color};
      background: #ddd;
      object-fit: cover;
    }
    .footer-handle { font-size: 11px; color: #888; }
    .footer-page { font-size: 11px; color: #888; }
    .about-section { text-align: center; padding-top: 40px; }
    .about-photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid ${primary_color};
      background: #ddd;
      margin: 0 auto 24px;
      object-fit: cover;
    }
    .about-name {
      font-family: '${font_family}', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .about-tagline {
      font-size: 14px;
      color: ${primary_color};
      font-weight: 500;
      margin-bottom: 8px;
    }
    .about-handle { font-size: 13px; color: #666; margin-bottom: 24px; }
    .about-bio { font-size: 14px; line-height: 1.8; color: #444; text-align: left; max-width: 500px; margin: 0 auto; }
  `
}

function renderChapterPage(chapter, num, baseStyles, fontUrl, handle) {
  const { title, content } = chapter
  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">Chapter ${num}</div>
      <div class="chapter-title">${escapeHtml(title)}</div>
      <div class="divider"></div>
      <div class="body-text">${formatContent(content)}</div>
    </div>
    <div class="page-footer">
      <div class="footer-left">
        <div class="footer-photo"></div>
        <div class="footer-handle">@${escapeHtml(handle)}</div>
      </div>
      <div class="footer-page">${num + 2}</div>
    </div>
  </div>`
}

function renderSampleChapter(baseStyles, fontUrl, handle) {
  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">Chapter 1</div>
      <div class="chapter-title">Getting Started</div>
      <div class="divider"></div>
      <p class="body-text">This is where your content will appear. Each chapter from your generated content will be formatted with the colors and styling from your selected cover template.</p>
      <div class="callout">
        <div class="callout-title">Key Insight</div>
        <div class="callout-text">Your content is automatically styled to match your cover, creating a cohesive professional look throughout your document.</div>
      </div>
    </div>
    <div class="page-footer">
      <div class="footer-left">
        <div class="footer-photo"></div>
        <div class="footer-handle">@${escapeHtml(handle)}</div>
      </div>
      <div class="footer-page">3</div>
    </div>
  </div>`
}

function renderAboutPage(baseStyles, fontUrl, profile) {
  const { author, handle, photoUrl, tagline, bio, primaryColor } = profile
  const photoHtml = photoUrl
    ? `<img src="${photoUrl}" class="about-photo" alt="${escapeHtml(author)}">`
    : `<div class="about-photo"></div>`

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="about-section">
        ${photoHtml}
        <div class="about-name">${escapeHtml(author)}</div>
        ${tagline ? `<div class="about-tagline">${escapeHtml(tagline)}</div>` : ''}
        ${handle ? `<div class="about-handle">@${escapeHtml(handle)}</div>` : ''}
      </div>
      <div class="divider" style="margin: 24px auto;"></div>
      <p class="about-bio">${escapeHtml(bio)}</p>
    </div>
    <div class="page-footer">
      <div class="footer-left">
        <div class="footer-photo"></div>
        <div class="footer-handle">@${escapeHtml(handle)}</div>
      </div>
      <div class="footer-page">About</div>
    </div>
  </div>`
}

function formatContent(content) {
  if (!content) return ''
  // Convert basic markdown-like formatting to HTML
  return escapeHtml(content)
    .replace(/\n\n/g, '</p><p class="body-text">')
    .replace(/\n/g, '<br>')
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getLightBackground(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lightR = Math.round(r + (255 - r) * 0.92)
  const lightG = Math.round(g + (255 - g) * 0.92)
  const lightB = Math.round(b + (255 - b) * 0.92)
  return `rgb(${lightR}, ${lightG}, ${lightB})`
}

export default { renderInterior }
