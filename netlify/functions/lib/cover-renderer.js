// netlify/functions/lib/cover-renderer.js
// Renders cover HTML from template with placeholder replacement
// RELEVANT FILES: netlify/functions/visual-builder-generate.js

/**
 * Render cover HTML from template
 * @param {Object} template - Cover template from database
 * @param {Object} data - Data to inject (title, subtitle, author, handle, year)
 * @param {Object} options - Size options (titleSize, subtitleSize as percentages)
 * @returns {string} Complete HTML document
 */
export function renderCover(template, data, options = {}) {
  const { title, subtitle, author, handle, year } = data
  const { titleSize = 100, subtitleSize = 100 } = options

  const titleScale = titleSize / 100
  const subtitleScale = subtitleSize / 100

  // Replace placeholders in template HTML
  let html = template.html_template
    .replace(/\{\{title\}\}/g, escapeHtml(title || 'Untitled'))
    .replace(/\{\{subtitle\}\}/g, escapeHtml(subtitle || ''))
    .replace(/\{\{author\}\}/g, escapeHtml(author || ''))
    .replace(/\{\{handle\}\}/g, escapeHtml(handle || ''))
    .replace(/\{\{year\}\}/g, String(year || new Date().getFullYear()))

  // Build full HTML document for A4 page
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${template.font_family_url}" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 210mm;
      height: 297mm;
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    :root {
      --title-scale: ${titleScale};
      --subtitle-scale: ${subtitleScale};
    }
    ${template.css_styles}
  </style>
</head>
<body>
  ${html}
</body>
</html>`
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default { renderCover }
