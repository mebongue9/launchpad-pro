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
        { handle, photoUrl, primaryColor: primary_color },
        format
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
 * Get complete interior CSS adapted for Letter size (8.5in x 11in)
 */
function getInteriorCSS(template, headerGradient, lightBg) {
  const { primary_color, secondary_color, font_family, is_gradient } = template

  return `
/* ============================================
   LAUNCHPAD PRO PDF INTERIOR STYLES
   Letter size (8.5in x 11in)
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

/* Page Dimensions - Letter */
@page {
  size: 8.5in 11in;
  margin: 0;
}

.page {
  width: 8.5in;
  height: 11in;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  background: var(--background);
  /* SAFE ZONES - INCREASED BOTTOM FOR FOOTER */
  padding-top: 0.6in;
  padding-bottom: 1.1in;
  padding-left: 0.75in;
  padding-right: 0.75in;
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
  height: 6px;
  background: var(--header-gradient);
}

/* ============================================
   PAGE CONTENT AREA
   ============================================ */
.page-content {
  max-width: 7in;
  max-height: 9.1in;
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
   FOOTER - FIXED WITH PROPER SPACING
   ============================================ */
.footer-line {
  position: absolute;
  bottom: 0.85in;
  left: 0.75in;
  right: 0.75in;
  height: 1px;
  background: var(--primary-color);
  opacity: 0.3;
}

.page-footer {
  position: absolute;
  bottom: 0.5in;
  left: 0.75in;
  right: 0.75in;
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

.footer-page-number {
  font-size: 10px;
  color: #666;
  font-weight: 600;
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

/* ============================================
   BLUEPRINT FORMAT
   ============================================ */
.phase-header {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-top: 24px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--primary-light);
}

.meta-box {
  font-size: 14px;
  color: #444;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f8f8;
  border-radius: 4px;
  line-height: 1.6;
  page-break-inside: avoid;
  break-inside: avoid;
}

.meta-box strong {
  color: #000;
}

.blueprint-step {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.step-number {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 8px;
}

.step-text {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
}

.step-text p {
  margin-bottom: 12px;
}

.step-text p:last-child {
  margin-bottom: 0;
}

.bullet-list {
  margin: 16px 0;
  padding-left: 0;
  list-style: none;
  page-break-inside: avoid;
  break-inside: avoid;
}

.bullet-list li {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  padding-left: 20px;
  position: relative;
  margin-bottom: 8px;
}

.bullet-list li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: 600;
}

/* ============================================
   CHEAT SHEET FORMAT
   ============================================ */
.cheat-card {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-left: 3px solid var(--primary-color);
  padding: 16px 20px;
  margin-bottom: 20px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.cheat-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.cheat-section {
  margin-bottom: 14px;
}

.cheat-section:last-child {
  margin-bottom: 0;
}

.cheat-section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cheat-section-content {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.cheat-section-content ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.cheat-section-content li {
  padding-left: 16px;
  position: relative;
  margin-bottom: 6px;
}

.cheat-section-content li::before {
  content: "•";
  color: var(--primary-color);
  font-weight: bold;
  position: absolute;
  left: 0;
}

.cheat-section-content ol {
  padding-left: 20px;
  margin: 0;
}

.cheat-section-content ol li {
  padding-left: 4px;
  margin-bottom: 6px;
}

.cheat-section-content ol li::before {
  content: none;
}

.example-box {
  background: white;
  border: 1px solid #ddd;
  padding: 12px 14px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #444;
  font-style: italic;
}

/* ============================================
   PLANNER FORMAT
   ============================================ */
.day-header {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
  margin-top: 24px;
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--primary-light);
}

.day-header:first-of-type {
  margin-top: 0;
}

.day-block {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-bottom: 8px;
}

.task-item {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.task-checkbox {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid var(--primary-color);
  border-radius: 3px;
  margin-top: 3px;
}

.task-content {
  flex: 1;
}

.task-time {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.task-title {
  font-size: 15px;
  font-weight: 700;
  color: #000;
  margin-bottom: 6px;
}

.task-details {
  font-size: 14px;
  line-height: 1.5;
  color: #444;
}

.task-details p {
  margin-bottom: 4px;
}

.task-details strong {
  color: #000;
}

.info-box {
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  padding: 14px 16px;
  margin: 20px 0;
  page-break-inside: avoid;
  break-inside: avoid;
}

.info-box-title {
  font-size: 13px;
  font-weight: 700;
  color: #000;
  margin-bottom: 10px;
}

.info-box-content {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
}

.info-box-content p {
  margin-bottom: 4px;
}

.tracking-section {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  padding: 14px 16px;
  margin-top: 20px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.tracking-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tracking-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.tracking-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #444;
}

.tracking-line {
  flex: 1;
  height: 1px;
  border-bottom: 1px solid #ccc;
  max-width: 80px;
}

/* ============================================
   SWIPE FILE FORMAT
   ============================================ */
.swipe-card {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-left: 3px solid var(--primary-color);
  padding: 18px 20px;
  margin-bottom: 20px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.swipe-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.swipe-content {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
}

.swipe-content p {
  margin-bottom: 12px;
}

.swipe-content p:last-child {
  margin-bottom: 0;
}

.swipe-content strong {
  color: #000;
  font-weight: 600;
}

.fill-blank {
  display: inline-block;
  min-width: 120px;
  border-bottom: 1px solid var(--primary-color);
  margin: 0 4px;
}

/* ============================================
   FORMAT-SPECIFIC PAGE BREAK RULES
   ============================================ */
.blueprint-step,
.meta-box,
.bullet-list,
.cheat-card,
.cheat-section,
.day-block,
.task-item,
.info-box,
.tracking-section,
.swipe-card {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

.phase-header,
.day-header,
.step-title,
.cheat-card-title,
.swipe-card-title {
  page-break-after: avoid !important;
  break-after: avoid !important;
}
`
}

/**
 * Render a chapter page with format-specific styling
 */
function renderChapterPage(chapter, chapterNum, pageNum, profile, format = '') {
  const { handle, photoUrl, primaryColor } = profile
  const { title, content } = chapter

  // Handle display (don't show bare "@" if no handle)
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  // Normalize format for comparison
  const normalizedFormat = (format || '').toLowerCase().replace(/\s+/g, '-')

  // Route to format-specific renderer
  switch (normalizedFormat) {
    case 'blueprint':
      return renderBlueprintPage(chapter, chapterNum, pageNum, profile)
    case 'cheat-sheet':
      return renderCheatSheetPage(chapter, chapterNum, pageNum, profile)
    case 'planner':
      return renderPlannerPage(chapter, chapterNum, pageNum, profile)
    case 'swipe-file':
      return renderSwipeFilePage(chapter, chapterNum, pageNum, profile)
    default:
      // Default: use existing content parser
      const parsedContent = parseChapterContent(content)
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
      <span class="footer-page-number">${pageNum}</span>
    </div>
  </div>`
  }
}

/**
 * Render Blueprint format page
 */
function renderBlueprintPage(chapter, chapterNum, pageNum, profile) {
  const { handle, photoUrl } = profile
  const { title, content } = chapter
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  // Parse content into steps (simple split by numbered patterns or paragraphs)
  const steps = parseContentToSteps(content)

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">CHAPTER ${chapterNum}</div>
      <h1 class="chapter-title">${escapeHtml(title)}</h1>

      ${steps.map((step, i) => `
      <div class="blueprint-step">
        <div class="step-number">${i + 1}</div>
        <div class="step-content">
          <div class="step-title">${escapeHtml(step.title || `Step ${i + 1}`)}</div>
          <div class="step-text">
            <p>${escapeHtml(step.text)}</p>
          </div>
        </div>
      </div>`).join('')}
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page-number">${pageNum}</span>
    </div>
  </div>`
}

/**
 * Render Cheat Sheet format page
 */
function renderCheatSheetPage(chapter, chapterNum, pageNum, profile) {
  const { handle, photoUrl } = profile
  const { title, content } = chapter
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  // Parse content into sections
  const sections = parseContentToSections(content)

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">CHAPTER ${chapterNum}</div>
      <h1 class="chapter-title">${escapeHtml(title)}</h1>

      <div class="cheat-card">
        <div class="cheat-card-title">${escapeHtml(title)}</div>
        ${sections.map(section => `
        <div class="cheat-section">
          <div class="cheat-section-title">${escapeHtml(section.title || 'Key Points')}</div>
          <div class="cheat-section-content">
            <ul>
              ${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page-number">${pageNum}</span>
    </div>
  </div>`
}

/**
 * Render Planner format page
 */
function renderPlannerPage(chapter, chapterNum, pageNum, profile) {
  const { handle, photoUrl } = profile
  const { title, content } = chapter
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  // Parse content into tasks
  const tasks = parseContentToTasks(content)

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">WEEK ${chapterNum}</div>
      <h1 class="chapter-title">${escapeHtml(title)}</h1>

      <div class="day-block">
        <div class="day-header">DAY ${chapterNum}</div>
        ${tasks.map((task, i) => `
        <div class="task-item">
          <div class="task-checkbox"></div>
          <div class="task-content">
            <div class="task-time">${task.time || `${7 + i}:00 AM`}</div>
            <div class="task-title">${escapeHtml(task.title || `Task ${i + 1}`)}</div>
            <div class="task-details">
              <p>${escapeHtml(task.text)}</p>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page-number">${pageNum}</span>
    </div>
  </div>`
}

/**
 * Render Swipe File format page
 */
function renderSwipeFilePage(chapter, chapterNum, pageNum, profile) {
  const { handle, photoUrl } = profile
  const { title, content } = chapter
  const handleDisplay = handle ? `@${escapeHtml(handle)}` : ''

  // For swipe file, content becomes a template card
  const templateContent = content || ''

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">CHAPTER ${chapterNum}</div>
      <h1 class="chapter-title">${escapeHtml(title)}</h1>

      <div class="swipe-card">
        <div class="swipe-card-title">Template #${chapterNum}: ${escapeHtml(title)}</div>
        <div class="swipe-content">
          ${formatSwipeContent(templateContent)}
        </div>
      </div>
    </div>
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${handleDisplay}</span>
      </div>
      <span class="footer-page-number">${pageNum}</span>
    </div>
  </div>`
}

/**
 * Parse content into steps for Blueprint format
 */
function parseContentToSteps(content) {
  if (!content) return [{ text: 'No content available', title: 'Step 1' }]

  // Split by numbered patterns like "1.", "Step 1:", etc.
  const stepPattern = /(?:^|\n)(?:\d+\.|Step\s+\d+:?)\s*/gi
  const parts = content.split(stepPattern).filter(s => s.trim())

  if (parts.length === 0) {
    // No numbered steps found, split by paragraphs
    return content.split(/\n\n+/).filter(s => s.trim()).map((text, i) => ({
      title: `Step ${i + 1}`,
      text: text.trim()
    }))
  }

  return parts.map((text, i) => {
    const lines = text.trim().split('\n')
    const firstLine = lines[0] || ''
    const rest = lines.slice(1).join(' ').trim()

    return {
      title: firstLine.replace(/^\*\*|\*\*$/g, '').substring(0, 50),
      text: rest || firstLine
    }
  })
}

/**
 * Parse content into sections for Cheat Sheet format
 */
function parseContentToSections(content) {
  if (!content) return [{ title: 'Key Points', items: ['No content available'] }]

  // Split by bullet points, arrows, or newlines
  const bulletPattern = /(?:^|\n)[•→\-\*]\s*/g
  const parts = content.split(bulletPattern).filter(s => s.trim())

  if (parts.length <= 1) {
    // No bullets found, split by sentences or lines
    const items = content.split(/[.\n]+/).filter(s => s.trim().length > 10)
    return [{ title: 'Key Points', items: items.length > 0 ? items : [content] }]
  }

  return [{ title: 'Key Points', items: parts }]
}

/**
 * Parse content into tasks for Planner format
 */
function parseContentToTasks(content) {
  if (!content) return [{ title: 'Task 1', text: 'No content available', time: '7:00 AM' }]

  // Split by paragraphs or bullet points
  const parts = content.split(/\n\n+|(?:^|\n)[•→\-\*]\s*/).filter(s => s.trim())

  if (parts.length === 0) {
    return [{ title: 'Task 1', text: content, time: '7:00 AM' }]
  }

  return parts.slice(0, 4).map((text, i) => {
    const lines = text.trim().split('\n')
    const firstLine = lines[0] || ''

    return {
      title: firstLine.substring(0, 40),
      text: lines.slice(1).join(' ').trim() || firstLine,
      time: `${7 + (i * 2)}:00 AM`
    }
  })
}

/**
 * Format swipe file content with fill-in-the-blank styling
 */
function formatSwipeContent(content) {
  if (!content) return '<p>No content available</p>'

  // Split into paragraphs
  const paragraphs = content.split(/\n\n+/).filter(s => s.trim())

  return paragraphs.map(p => {
    // Replace [blank] or ___ or similar patterns with fill-blank spans
    let formatted = escapeHtml(p)
    formatted = formatted.replace(/\[([^\]]*)\]/g, '<span class="fill-blank"></span>')
    formatted = formatted.replace(/_{3,}/g, '<span class="fill-blank"></span>')
    return `<p>${formatted}</p>`
  }).join('\n')
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
      <span class="footer-page-number">${pageNum}</span>
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
      <span class="footer-page-number">About</span>
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
