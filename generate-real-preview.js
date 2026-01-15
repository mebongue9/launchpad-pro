// Generate HTML preview with REAL data from database
// Creates 3 variants with different font sizes
// Run: node generate-real-preview.js

import { createClient } from '@supabase/supabase-js'
import { renderInterior } from './netlify/functions/lib/interior-renderer.js'
import fs from 'fs'
import path from 'path'

// Load env vars
const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

// Final font size - 16px baseline (user selected)
const FINAL_VARIANT = {
  name: '16px-final',
  chapterTitle: '36px',
  phaseHeader: '18px',
  stepTitle: '17px',
  stepBullet: '16px',
  stepMeta: '15px',
  bodyText: '16px',
  lineHeight: '1.7'
}

async function main() {
  console.log('=== GENERATING FORMAT PREVIEWS (16px baseline) ===\n')

  // Create outputs directory
  const outputDir = path.join(process.cwd(), 'outputs')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  // Fix encoding helper
  const fixEncoding = (text) => {
    if (!text) return text
    return text
      .replace(/â†'/g, '→')
      .replace(/â€"/g, '—')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")
  }

  // 1. Get all unique formats from database
  console.log('1. Fetching all formats from database...')
  const { data: allLeadMagnets } = await supabase
    .from('lead_magnets')
    .select('*')
    .order('created_at', { ascending: false })

  const formats = [...new Set(allLeadMagnets.map(lm => lm.format))]
  console.log('   Found formats:', formats.join(', '))

  // 2. Get profile
  console.log('\n2. Fetching profile...')
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  console.log('   Name:', profile.name)
  console.log('   Handle:', profile.social_handle)

  // 3. Get cover template for colors
  console.log('\n3. Fetching cover template...')
  const { data: template } = await supabase
    .from('cover_templates')
    .select('*')
    .limit(1)
    .single()

  console.log('   Template:', template.name)
  console.log('   Primary Color:', template.primary_color)

  // 4. Generate preview for each format
  console.log('\n4. Generating format previews...\n')

  for (const format of formats) {
    // Get the most recent lead magnet of this format
    const leadMagnet = allLeadMagnets.find(lm => lm.format === format)

    console.log(`   === ${format.toUpperCase()} ===`)
    console.log(`   Title: ${leadMagnet.name}`)

    // Parse content
    let content = leadMagnet.content
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch (e) {
        console.error(`   ERROR parsing content for ${format}:`, e)
        continue
      }
    }

    if (!content || !content.chapters || content.chapters.length === 0) {
      console.error(`   ERROR: No chapters in ${format}`)
      continue
    }

    console.log(`   Chapters: ${content.chapters.length}`)

    // Fix encoding
    content.chapters = content.chapters.map(ch => ({
      ...ch,
      title: fixEncoding(ch.title),
      content: fixEncoding(ch.content)
    }))

    // Generate HTML with 16px baseline
    const html = generateFullHtml(template, content, profile, FINAL_VARIANT, leadMagnet.name, format)
    const filename = `preview-format-${format.toLowerCase().replace(/\s+/g, '-')}.html`
    const filepath = path.join(outputDir, filename)

    fs.writeFileSync(filepath, html)
    console.log(`   ✅ Saved: outputs/${filename}\n`)
  }

  console.log('=== DONE ===')
  console.log('\nOpen in browser:')
  formats.forEach(format => {
    const filename = `preview-format-${format.toLowerCase().replace(/\s+/g, '-')}.html`
    console.log(`   http://localhost:9999/${filename}`)
  })
}

function generateFullHtml(template, content, profile, variant, title) {
  const { primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_gradient } = template

  const headerGradient = is_gradient
    ? `linear-gradient(90deg, ${secondary_color} 0%, ${primary_color} 50%, ${tertiary_color} 100%)`
    : primary_color

  // Calculate light background
  const lightBg = getLightBackground(primary_color)

  const author = profile.name || 'Author'
  // Remove @ prefix if already present in database
  let handle = profile.social_handle || ''
  if (handle.startsWith('@')) {
    handle = handle.substring(1)
  }
  const photoUrl = profile.photo_url || getPlaceholderPhoto()
  const tagline = profile.tagline || ''
  const niche = profile.niche || ''
  // Build grammatically correct bio
  let bio
  if (niche) {
    // If niche starts with a verb like "Help", restructure the sentence
    if (niche.toLowerCase().startsWith('help')) {
      // Change "help" to "helps" for proper grammar
      bio = `${author} helps ${niche.slice(5)}, delivering exceptional results for clients.`
    } else {
      bio = `${author} is an expert in ${niche.charAt(0).toLowerCase() + niche.slice(1)}, helping clients achieve exceptional results.`
    }
  } else {
    bio = `${author} is an expert in their field, helping clients achieve exceptional results.`
  }

  // Build pages
  const pages = []
  let pageNumber = 1

  // Cover page (simple)
  pages.push(renderCoverPage(title, content.subtitle || '', author, handle, template, variant))
  pageNumber++

  // Content pages
  content.chapters.forEach((chapter, index) => {
    pages.push(renderChapterPage(chapter, index + 1, pageNumber, {
      handle,
      photoUrl,
      primaryColor: primary_color,
      variant
    }, template))
    pageNumber++
  })

  // About the Author page
  pages.push(renderAboutPage({
    author,
    handle,
    photoUrl,
    tagline,
    bio,
    primaryColor: primary_color,
    variant
  }, template))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - ${variant.name} - ${title}</title>
  <link href="${font_family_url}" rel="stylesheet">
  <style>
${getCSS(template, headerGradient, lightBg, variant)}
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

function getCSS(template, headerGradient, lightBg, variant) {
  const { primary_color, secondary_color, font_family } = template

  return `
/* CSS Variables */
:root {
  --primary-color: ${primary_color};
  --primary-light: ${secondary_color || primary_color};
  --header-gradient: ${headerGradient};
  --light-bg: ${lightBg};
  --text-color: #1a1a1a;
  --text-muted: #666;
  --background: #ffffff;
}

/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #e0e0e0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Page Container */
.page {
  width: 210mm;
  min-height: 297mm;
  margin: 20px auto;
  background: var(--background);
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  overflow: hidden;
}

@media print {
  .page {
    margin: 0;
    box-shadow: none;
    page-break-after: always;
  }
}

/* Header Bar */
.header-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: var(--header-gradient);
}

/* Page Content */
.page-content {
  padding: 20mm 20mm 30mm 20mm;
  min-height: calc(297mm - 50mm);
}

/* Chapter Label */
.chapter-label {
  font-family: '${font_family}', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-bottom: 8px;
}

/* Chapter Title */
.chapter-title {
  font-family: '${font_family}', sans-serif;
  font-size: ${variant.chapterTitle};
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  margin-bottom: 16px;
}

/* Divider */
.divider {
  width: 60px;
  height: 4px;
  background: var(--header-gradient);
  margin-bottom: 24px;
}

/* Phase Header */
.phase-header {
  font-family: '${font_family}', sans-serif;
  font-size: ${variant.phaseHeader};
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-top: 24px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--light-bg);
}

/* Step Item */
.step-item {
  margin-bottom: 20px;
}

.step-title {
  font-size: ${variant.stepTitle};
  font-weight: 400;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.step-title strong {
  font-weight: 700;
}

/* Bullet Points */
.step-bullet {
  font-size: ${variant.stepBullet};
  line-height: ${variant.lineHeight};
  color: #333;
  padding-left: 20px;
  position: relative;
  margin-bottom: 6px;
}

.bullet-arrow {
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: 600;
}

/* Step Meta */
.step-meta {
  font-size: ${variant.stepMeta};
  color: #555;
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--light-bg);
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}

.step-meta strong {
  color: #333;
}

/* Body Text */
.body-text {
  font-size: ${variant.bodyText};
  line-height: ${variant.lineHeight};
  color: #333;
  margin-bottom: 14px;
}

/* Footer */
.footer-line {
  position: absolute;
  bottom: 22mm;
  left: 20mm;
  right: 20mm;
  height: 1px;
  background: var(--primary-color);
  opacity: 0.3;
}

.page-footer {
  position: absolute;
  bottom: 10mm;
  left: 20mm;
  right: 20mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-photo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-color);
}

.footer-handle {
  font-size: 10px;
  color: #666;
}

.footer-page {
  font-size: 10px;
  color: #888;
}

/* Cover Page */
.cover-page {
  width: 210mm;
  height: 297mm;
  margin: 20px auto;
  background: var(--header-gradient);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  color: white;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.cover-title {
  font-family: '${font_family}', sans-serif;
  font-size: 42px;
  font-weight: 800;
  text-transform: uppercase;
  line-height: 1.1;
  margin-bottom: 30px;
  max-width: 80%;
}

.cover-subtitle {
  font-size: 16px;
  max-width: 70%;
  opacity: 0.9;
  line-height: 1.5;
}

.cover-author {
  position: absolute;
  bottom: 60px;
  text-align: center;
}

.cover-author-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.cover-author-handle {
  font-size: 14px;
  opacity: 0.8;
}

.cover-year {
  position: absolute;
  top: 40px;
  left: 40px;
  font-size: 24px;
  font-weight: 700;
}

/* About Page */
.about-section {
  text-align: center;
  padding-top: 40mm;
}

.about-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--primary-color);
  margin: 0 auto 24px;
  display: block;
}

.about-name {
  font-family: '${font_family}', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.about-tagline {
  font-size: 15px;
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 8px;
}

.about-handle {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.about-bio {
  font-size: ${variant.bodyText};
  line-height: 1.8;
  color: #444;
  text-align: left;
  max-width: 150mm;
  margin: 0 auto;
}
`
}

function renderCoverPage(title, subtitle, author, handle, template, variant) {
  return `
  <div class="cover-page">
    <div class="cover-year">${new Date().getFullYear()}</div>
    <h1 class="cover-title">${escapeHtml(title)}</h1>
    <p class="cover-subtitle">${escapeHtml(subtitle)}</p>
    <div class="cover-author">
      <div class="cover-author-name">${escapeHtml(author)}</div>
      <div class="cover-author-handle">${handle ? '@' + escapeHtml(handle) : ''}</div>
    </div>
  </div>`
}

function renderChapterPage(chapter, chapterNum, pageNum, profile, template) {
  const { handle, photoUrl, primaryColor, variant } = profile
  const { title, content } = chapter

  // Parse content with structure detection
  const parsedContent = parseChapterContent(content)
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">Chapter ${chapterNum}</div>
      <h1 class="chapter-title">${escapeHtml(title)}</h1>
      <div class="divider"></div>
      ${parsedContent}
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="" onerror="this.style.background='#ddd'">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page">${pageNum}</span>
    </div>
  </div>`
}

function renderAboutPage(profile, template) {
  const { author, handle, photoUrl, tagline, bio, primaryColor, variant } = profile
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="about-section">
        <img src="${photoUrl}" class="about-photo" alt="${escapeHtml(author)}" onerror="this.style.background='#ddd'">
        <div class="about-name">${escapeHtml(author)}</div>
        ${tagline ? `<div class="about-tagline">${escapeHtml(tagline)}</div>` : ''}
        ${handleDisplay ? `<div class="about-handle">${handleDisplay}</div>` : ''}
      </div>
      <div class="divider" style="margin: 24px auto;"></div>
      <p class="about-bio">${escapeHtml(bio)}</p>
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="" onerror="this.style.background='#ddd'">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page">About</span>
    </div>
  </div>`
}

// Content parsing with markdown bold support
function parseChapterContent(content) {
  if (!content) return '<p class="body-text">No content available.</p>'

  const lines = content.split('\n')
  const html = []
  let inStep = false
  let stepMeta = []

  // Helper to convert **text** to <strong>text</strong>
  // Must be called BEFORE escaping HTML
  const parseBoldAndEscape = (text) => {
    // First, find all **bold** sections and protect them
    const parts = []
    let lastIndex = 0
    const regex = /\*\*([^*]+)\*\*/g
    let match

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match (escaped)
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.slice(lastIndex, match.index)))
      }
      // Add the bold text (escaped content, wrapped in strong)
      parts.push(`<strong>${escapeHtml(match[1])}</strong>`)
      lastIndex = regex.lastIndex
    }

    // Add remaining text (escaped)
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.slice(lastIndex)))
    }

    return parts.join('')
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Phase header: **PHASE 1:** or PHASE 1:
    const phaseMatch = trimmed.match(/^\*{0,2}(PHASE\s+\d+):\*{0,2}\s*(.+)$/i)
    if (phaseMatch) {
      if (inStep && stepMeta.length > 0) {
        html.push(`<div class="step-meta">${stepMeta.join('<br>')}</div>`)
        stepMeta = []
      }
      if (inStep) {
        html.push('</div>')
        inStep = false
      }
      html.push(`<div class="phase-header">${escapeHtml(phaseMatch[1])}: ${escapeHtml(phaseMatch[2].replace(/^\*+|\*+$/g, ''))}</div>`)
      continue
    }

    // Step header: **STEP 1.1:** Title
    // Make "STEP X.X:" bold, rest regular weight
    const stepMatch = trimmed.match(/^\*{0,2}(STEP\s+\d+\.\d+):\*{0,2}\s*(.+)$/i)
    if (stepMatch) {
      if (inStep && stepMeta.length > 0) {
        html.push(`<div class="step-meta">${stepMeta.join('<br>')}</div>`)
        stepMeta = []
      }
      if (inStep) {
        html.push('</div>')
      }
      html.push('<div class="step-item">')
      // Bold only the "STEP X.X:" part, rest is normal weight
      html.push(`<div class="step-title"><strong>${escapeHtml(stepMatch[1])}:</strong> ${escapeHtml(stepMatch[2].replace(/^\*+|\*+$/g, ''))}</div>`)
      inStep = true
      continue
    }

    // What you need:
    const needMatch = trimmed.match(/^What you need:\s*(.+)$/i)
    if (needMatch) {
      stepMeta.push(`<strong>What you need:</strong> ${escapeHtml(needMatch[1])}`)
      continue
    }

    // Expected outcome:
    const outcomeMatch = trimmed.match(/^Expected outcome:\s*(.+)$/i)
    if (outcomeMatch) {
      stepMeta.push(`<strong>Expected outcome:</strong> ${escapeHtml(outcomeMatch[1])}`)
      continue
    }

    // Bullet: → or • or -
    const bulletMatch = trimmed.match(/^[→•·\-]\s*(.+)$/)
    if (bulletMatch) {
      // Parse bold within bullet content
      html.push(`<div class="step-bullet"><span class="bullet-arrow">→</span> ${parseBoldAndEscape(bulletMatch[1])}</div>`)
      continue
    }

    // Regular paragraph - parse bold markdown
    html.push(`<p class="body-text">${parseBoldAndEscape(trimmed)}</p>`)
  }

  // Close any open step
  if (inStep) {
    if (stepMeta.length > 0) {
      html.push(`<div class="step-meta">${stepMeta.join('<br>')}</div>`)
    }
    html.push('</div>')
  }

  return html.join('\n')
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
  if (!hex || hex.length < 7) return '#f5f5f5'
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lightR = Math.round(r + (255 - r) * 0.92)
    const lightG = Math.round(g + (255 - g) * 0.92)
    const lightB = Math.round(b + (255 - b) * 0.92)
    return `rgb(${lightR}, ${lightG}, ${lightB})`
  } catch (e) {
    return '#f5f5f5'
  }
}

function getPlaceholderPhoto() {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ddd"/%3E%3Ccircle cx="50" cy="40" r="18" fill="%23999"/%3E%3Cellipse cx="50" cy="85" rx="30" ry="25" fill="%23999"/%3E%3C/svg%3E'
}

function generateNotes(leadMagnet, profile, content) {
  return `# Preview Notes

**Generated:** ${new Date().toISOString()}

## Data Source

- **Lead Magnet:** ${leadMagnet.name}
- **Format:** ${leadMagnet.format}
- **Chapters:** ${content.chapters.length}
- **Profile:** ${profile.name}
- **Handle:** @${profile.social_handle || '(not set)'}
- **Photo URL:** ${profile.photo_url ? 'SET' : 'NOT SET - using placeholder'}

## Variants Generated

### Variant A: Comfortable
- Chapter title: 28px
- Body text: 12px
- Recommended for: Most content

### Variant B: Medium
- Chapter title: 26px
- Body text: 11px
- Recommended for: Medium-length content

### Variant C: Compact
- Chapter title: 24px
- Body text: 10px
- Recommended for: Very long content

## Recommendation

Start with **Variant A (Comfortable)** as it has the best readability.

## Known Issues

${!profile.photo_url ? '- ⚠️ Profile photo URL not set - using placeholder' : '- Profile photo URL is set'}

## Next Steps

1. Review all three variants in browser
2. Select preferred font size variant
3. Report any issues
4. Approve for PDF generation
`
}

main().catch(console.error)
