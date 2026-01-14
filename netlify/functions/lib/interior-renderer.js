// netlify/functions/lib/interior-renderer.js
// Renders interior pages with proper CSS, typography hierarchy, and profile data
// RELEVANT FILES: visual-builder-generate.js, content-parser.js

import { parseChapterContent } from './content-parser.js'

// Placeholder image for missing profile photos (1x1 transparent pixel as data URI)
const PLACEHOLDER_PHOTO = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ddd"/%3E%3Ccircle cx="50" cy="40" r="18" fill="%23999"/%3E%3Cellipse cx="50" cy="85" rx="30" ry="25" fill="%23999"/%3E%3C/svg%3E'

/**
 * Render interior pages HTML with template colors
 * @param {Object} template - Cover template (for colors)
 * @param {Object} data - Content data { title, content, format }
 * @param {Object} profile - Profile data { name, social_handle, photo_url, logo_url, tagline, niche }
 * @returns {string} Complete HTML document with all interior pages
 */
export function renderInterior(template, data, profile) {
  const { primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_gradient } = template
  const { title, content, format } = data

  // Profile data with fallbacks
  const author = profile?.name || 'Author'
  const handle = profile?.social_handle || ''
  const photoUrl = profile?.photo_url || PLACEHOLDER_PHOTO
  const tagline = profile?.tagline || ''
  const niche = profile?.niche || ''

  // Construct bio from name + niche
  const bio = niche
    ? `${author} is an expert in ${niche}, helping clients achieve exceptional results.`
    : `${author} is an expert in their field, helping clients achieve exceptional results.`

  // Calculate header gradient
  const headerGradient = is_gradient
    ? `linear-gradient(90deg, ${secondary_color} 0%, ${primary_color} 50%, ${tertiary_color} 100%)`
    : primary_color

  // Calculate light background for callouts (8% opacity of primary)
  const lightBg = getLightBackground(primary_color)

  // Get complete CSS
  const css = getInteriorCSS(template, headerGradient, lightBg)

  // Build pages from content
  const pages = []
  let pageNumber = 2 // Start at 2 (cover is page 1)

  if (content && content.chapters && content.chapters.length > 0) {
    content.chapters.forEach((chapter, index) => {
      pages.push(renderChapterPage(
        chapter,
        index + 1,
        pageNumber,
        { handle, photoUrl, primaryColor: primary_color }
      ))
      pageNumber++
    })
  } else {
    // Default sample chapter if no content
    console.log('[INTERIOR-RENDERER] No chapters found in content, using sample')
    pages.push(renderSampleChapter(pageNumber, { handle, photoUrl, primaryColor: primary_color }))
    pageNumber++
  }

  // Add About the Author page at the end
  pages.push(renderAboutPage({
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
${css}
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

/**
 * Get complete interior CSS adapted for A4
 */
function getInteriorCSS(template, headerGradient, lightBg) {
  const { primary_color, secondary_color, font_family, is_gradient } = template

  return `
/* ============================================
   LAUNCHPAD PRO PDF INTERIOR STYLES
   Adapted for A4 (210mm x 297mm)
   ============================================ */

/* CSS Variables */
:root {
  --primary-color: ${primary_color};
  --primary-light: ${secondary_color || primary_color};
  --header-gradient: ${headerGradient};
  --light-bg: ${lightBg};
  --text-color: #000;
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
  background: var(--background);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Page Dimensions - A4 */
@page {
  size: A4;
  margin: 0;
}

.page {
  width: 210mm;
  height: 297mm;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  background: var(--background);
  /* Safe zones for A4 */
  padding: 15mm 20mm 25mm 20mm;
}

.page:last-child {
  page-break-after: avoid;
}

/* ============================================
   HEADER BAR - Top accent strip
   ============================================ */
.header-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: var(--header-gradient);
}

/* ============================================
   PAGE CONTENT AREA
   ============================================ */
.page-content {
  /* Content area: 210mm - 40mm = 170mm wide
     Height: 297mm - 15mm - 25mm - footer = ~240mm */
  max-height: 240mm;
  overflow: hidden;
}

/* ============================================
   CHAPTER LABEL
   ============================================ */
.chapter-label {
  font-family: '${font_family}', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-bottom: 8px;
}

/* ============================================
   CHAPTER TITLE
   ============================================ */
.chapter-title {
  font-family: '${font_family}', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
  margin-bottom: 16px;
}

/* ============================================
   DIVIDER
   ============================================ */
.divider {
  width: 60px;
  height: 4px;
  background: var(--header-gradient);
  margin-bottom: 20px;
}

/* ============================================
   PHASE HEADER
   ============================================ */
.phase-header {
  font-family: '${font_family}', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-top: 16px;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--light-bg);
}

/* ============================================
   STEP ITEM
   ============================================ */
.step-item {
  margin-bottom: 14px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.step-title {
  font-size: 11px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
}

/* ============================================
   BULLET POINTS (arrows)
   ============================================ */
.step-bullet {
  font-size: 10px;
  line-height: 1.5;
  color: #333;
  padding-left: 16px;
  position: relative;
  margin-bottom: 4px;
}

.bullet-arrow {
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: 600;
}

/* ============================================
   STEP META (What you need / Expected outcome)
   ============================================ */
.step-meta {
  font-size: 9px;
  color: #666;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--light-bg);
  border-radius: 4px;
}

.step-meta strong {
  color: #333;
}

/* ============================================
   BODY TEXT
   ============================================ */
.body-text {
  font-size: 10px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
}

/* ============================================
   CALLOUT BOX
   ============================================ */
.callout {
  background: var(--light-bg);
  border-left: 3px solid var(--primary-color);
  padding: 12px 14px;
  margin: 14px 0;
}

.callout-title {
  font-family: '${font_family}', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.callout-text {
  font-size: 10px;
  line-height: 1.5;
  color: #333;
}

/* ============================================
   FOOTER - Every page
   ============================================ */
.footer-line {
  position: absolute;
  bottom: 18mm;
  left: 20mm;
  right: 20mm;
  height: 1px;
  background: var(--primary-color);
  opacity: 0.3;
}

.page-footer {
  position: absolute;
  bottom: 8mm;
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--primary-color);
}

.footer-handle {
  font-size: 9px;
  color: #888;
}

.footer-page {
  font-size: 9px;
  color: #888;
}

/* ============================================
   ABOUT THE AUTHOR PAGE
   ============================================ */
.about-section {
  text-align: center;
  padding-top: 30mm;
}

.about-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-color);
  margin: 0 auto 20px;
  display: block;
}

.about-name {
  font-family: '${font_family}', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.about-tagline {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 6px;
}

.about-handle {
  font-size: 12px;
  color: #666;
  margin-bottom: 20px;
}

.about-bio {
  font-size: 11px;
  line-height: 1.7;
  color: #444;
  text-align: left;
  max-width: 140mm;
  margin: 0 auto;
}

/* ============================================
   PAGE BREAK RULES
   ============================================ */
.phase-header,
.step-item,
.step-meta,
.callout {
  page-break-inside: avoid;
  break-inside: avoid;
}

.phase-header,
.step-title,
.chapter-title {
  page-break-after: avoid;
  break-after: avoid;
}

p, .step-bullet {
  orphans: 2;
  widows: 2;
}
`
}

/**
 * Render a chapter page
 */
function renderChapterPage(chapter, chapterNum, pageNum, profile) {
  const { handle, photoUrl, primaryColor } = profile
  const { title, content } = chapter

  // Parse chapter content with structure detection
  const parsedContent = parseChapterContent(content)

  // Handle display (don't show bare "@" if no handle)
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
        <img src="${photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page">${pageNum}</span>
    </div>
  </div>`
}

/**
 * Render sample chapter (when no content)
 */
function renderSampleChapter(pageNum, profile) {
  const { handle, photoUrl } = profile
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">Chapter 1</div>
      <h1 class="chapter-title">Getting Started</h1>
      <div class="divider"></div>
      <p class="body-text">This is where your content will appear. Each chapter from your generated content will be formatted with the colors and styling from your selected cover template.</p>
      <div class="callout">
        <div class="callout-title">Key Insight</div>
        <div class="callout-text">Your content is automatically styled to match your cover, creating a cohesive professional look throughout your document.</div>
      </div>
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page">${pageNum}</span>
    </div>
  </div>`
}

/**
 * Render About the Author page
 */
function renderAboutPage(profile) {
  const { author, handle, photoUrl, tagline, bio, primaryColor } = profile
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="about-section">
        <img src="${photoUrl}" class="about-photo" alt="${escapeHtml(author)}">
        <div class="about-name">${escapeHtml(author)}</div>
        ${tagline ? `<div class="about-tagline">${escapeHtml(tagline)}</div>` : ''}
        ${handleDisplay ? `<div class="about-handle">${handleDisplay}</div>` : ''}
      </div>
      <div class="divider" style="margin: 20px auto;"></div>
      <p class="about-bio">${escapeHtml(bio)}</p>
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page">About</span>
    </div>
  </div>`
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

/**
 * Calculate light background color (8% opacity of primary)
 */
function getLightBackground(hex) {
  if (!hex || hex.length < 7) return '#f5f5f5'
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    // Mix with white at 92%
    const lightR = Math.round(r + (255 - r) * 0.92)
    const lightG = Math.round(g + (255 - g) * 0.92)
    const lightB = Math.round(b + (255 - b) * 0.92)
    return `rgb(${lightR}, ${lightG}, ${lightB})`
  } catch (e) {
    return '#f5f5f5'
  }
}

export default { renderInterior }
