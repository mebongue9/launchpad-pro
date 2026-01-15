// Generate full HTML files for each format using real funnel data
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env
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

// Profile data (from handoff)
const PROFILE = {
  name: 'Martin Ebongue',
  handle: '@realmartinebongue',
  photoUrl: 'https://psfgnelrxzdckucvytzj.supabase.co/storage/v1/object/public/photos/10391013-6e2e-4b9d-9abc-208f7668df56/1767696269597.png',
  tagline: 'Helping creators monetize small audiences',
  niche: 'digital product creation and social media monetization'
}

// Color scheme
const COLORS = {
  primary: '#8B2500',
  secondary: '#CD4F00',
  primaryLight: '#CD4F00'
}

const FUNNEL_1 = '66670305-6854-4b78-ab72-7d9167bfa808'
const FUNNEL_2 = '04a65423-db27-4d63-aba8-f8d917f2f99e'

// Escape HTML special characters
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Convert markdown to HTML
function markdownToHtml(text) {
  if (!text) return ''

  let html = escapeHtml(text)

  // Convert **bold** to <strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Convert *italic* to <em>
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Convert [text](url) to clickable link - bolded and in primary color
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color: var(--primary-color); text-decoration: none;"><strong>$1</strong></a>'
  )

  return html
}

// Convert text to paragraphs with markdown support
function textToParagraphs(text) {
  if (!text) return ''

  const paragraphs = text.split('\n\n').filter(p => p.trim())
  return paragraphs.map(p => {
    const html = markdownToHtml(p.trim())
    // Handle bullet lists
    if (p.trim().startsWith('-')) {
      const items = p.split('\n').filter(l => l.trim().startsWith('-'))
      return `<ul class="bullet-list">${items.map(item =>
        `<li>${markdownToHtml(item.replace(/^-\s*/, ''))}</li>`
      ).join('')}</ul>`
    }
    return `<p>${html}</p>`
  }).join('\n')
}

// Generate base CSS - matching REFERENCE-16px-approved.html
function getBaseCSS() {
  return `
@page {
  size: 210mm 297mm;
  margin: 0;
}

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

:root {
  --primary-color: ${COLORS.primary};
  --primary-light: ${COLORS.primaryLight};
  --primary-dark: #5a1800;
  --light-bg: rgb(251, 241, 235);
  --text-color: #1a1a1a;
  --text-muted: #666;
  --background: #ffffff;
}

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

.page-content {
  padding: 20mm 20mm 30mm 20mm;
  min-height: calc(297mm - 50mm);
}

.header-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--primary-color);
}

.chapter-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.chapter-title {
  font-size: 22px;
  font-weight: 700;
  color: #000;
  line-height: 1.3;
  margin-bottom: 20px;
}

.body-text {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  margin-bottom: 16px;
}

.body-text p {
  margin-bottom: 12px;
}

.body-text strong {
  color: #000;
}

.bullet-list {
  margin: 12px 0;
  padding-left: 0;
  list-style: none;
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

/* Footer - matching REFERENCE-16px-approved.html */
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

.footer-page-number {
  font-size: 10px;
  color: #666;
  font-weight: 600;
}

/* Page break rules */
.phase-header,
.blueprint-step,
.meta-box,
.bullet-list,
.cheat-card,
.day-block,
.task-item,
.swipe-card {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}
`
}

// Generate Blueprint CSS
function getBlueprintCSS() {
  return `
.intro-text {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  margin-bottom: 20px;
}

.intro-text p {
  margin-bottom: 12px;
}

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
}

.meta-box strong {
  color: #000;
}

.blueprint-step {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
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
  font-size: 18px;
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

.critical-section {
  margin-top: 24px;
  padding: 16px;
  background: #f8f8f8;
  border-left: 3px solid var(--primary-color);
}

.critical-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 12px;
  text-transform: uppercase;
}

.critical-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.critical-list li {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  padding-left: 20px;
  position: relative;
  margin-bottom: 6px;
}

.critical-list li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: 600;
}

.closing-text {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  margin-top: 20px;
}

.closing-text p {
  margin-bottom: 12px;
}
`
}

// Generate Cheat Sheet CSS
function getCheatSheetCSS() {
  return `
.cheat-card {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-left: 3px solid var(--primary-color);
  padding: 16px 20px;
  margin-bottom: 20px;
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
`
}

// Generate Planner CSS
function getPlannerCSS() {
  return `
.week-header {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.week-goal {
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
  font-style: italic;
}

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
  margin-bottom: 8px;
}

.day-goal {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  font-style: italic;
}

.task-item {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
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

.tracking-section {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  padding: 14px 16px;
  margin-top: 20px;
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
`
}

// Generate Swipe File CSS
function getSwipeFileCSS() {
  return `
.swipe-intro {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  margin-bottom: 24px;
}

.swipe-card {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-left: 3px solid var(--primary-color);
  padding: 18px 20px;
  margin-bottom: 24px;
}

.template-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.swipe-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.template-section {
  margin-bottom: 16px;
}

.template-section:last-child {
  margin-bottom: 0;
}

.template-section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 6px;
}

.template-section-content {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
}

.template-section-content p {
  margin-bottom: 8px;
}

.fill-blank {
  display: inline-block;
  min-width: 100px;
  border-bottom: 1px solid var(--primary-color);
  margin: 0 2px;
  color: var(--primary-color);
  font-weight: 500;
}

.example-card {
  background: white;
  border: 1px solid #ddd;
  padding: 14px 16px;
  margin-top: 16px;
}

.example-label {
  font-size: 11px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.example-content {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
}

.example-content p {
  margin-bottom: 8px;
}

.swipe-content {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
}

.swipe-content p {
  margin-bottom: 12px;
}
`
}

// Generate About Page CSS
function getAboutCSS() {
  return `
.about-section {
  text-align: center;
  padding-top: 80px;
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

.about-divider {
  width: 60px;
  height: 4px;
  background: var(--primary-color);
  margin: 20px auto;
}

.about-bio {
  font-size: 14px;
  line-height: 1.7;
  color: #444;
  text-align: left;
  max-width: 5.5in;
  margin: 0 auto;
}
`
}

// Render page footer
function renderFooter(pageNum) {
  return `
    <div class="footer-line"></div>
    <div class="page-footer">
      <div class="footer-left">
        <img src="${PROFILE.photoUrl}" class="footer-photo" alt="">
        <span class="footer-handle">${PROFILE.handle}</span>
      </div>
      <span class="footer-page-number">${pageNum}</span>
    </div>`
}

// Render About page
function renderAboutPage() {
  const bio = `${PROFILE.name} is an expert in ${PROFILE.niche}, helping clients achieve exceptional results. With years of experience building successful digital product businesses, he has helped thousands of creators turn their knowledge into profitable income streams. His practical, no-fluff approach focuses on strategies that work for people with small audiences who want to generate consistent revenue without needing millions of followers.`

  return `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="about-section">
        <img src="${PROFILE.photoUrl}" class="about-photo" alt="${escapeHtml(PROFILE.name)}">
        <div class="about-name">${escapeHtml(PROFILE.name)}</div>
        <div class="about-tagline">${escapeHtml(PROFILE.tagline)}</div>
        <div class="about-handle">${PROFILE.handle}</div>
        <div class="about-divider"></div>
        <p class="about-bio">${escapeHtml(bio)}</p>
      </div>
    </div>
    ${renderFooter('About')}
  </div>`
}

// Parse Blueprint content into structured data - handles MULTIPLE phases per chapter
function parseBlueprintContent(content) {
  const result = {
    intro: [],
    phases: [],  // Array of phases, each with meta and steps
    critical: [],
    closing: []
  }

  const lines = content.split('\n')
  let currentSection = 'intro'
  let currentPhase = null
  let currentStep = null
  let stepText = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Check for PHASE header - supports both "**PHASE 1: Title**" and "**PHASE 1:**" with title on next line
    const phaseMatch = line.match(/^\*\*PHASE\s*\d*:?\s*(.+?)\*\*$/i)
    if (phaseMatch) {
      // Save current step if exists
      if (currentStep) {
        currentStep.text = stepText.join('\n\n')
        if (currentPhase) currentPhase.steps.push(currentStep)
        currentStep = null
        stepText = []
      }
      // Save current phase if exists
      if (currentPhase) {
        result.phases.push(currentPhase)
      }
      // Start new phase
      currentPhase = {
        title: phaseMatch[1].trim(),
        meta: { need: '', outcome: '' },
        steps: []
      }
      currentSection = 'meta'
      continue
    }

    // Check for What you need / Expected outcome
    const needMatch = line.match(/^\*\*What you need:\*\*\s*(.+)$/i)
    if (needMatch && currentPhase) {
      currentPhase.meta.need = needMatch[1].trim()
      continue
    }

    const outcomeMatch = line.match(/^\*\*Expected outcome:\*\*\s*(.+)$/i)
    if (outcomeMatch && currentPhase) {
      currentPhase.meta.outcome = outcomeMatch[1].trim()
      currentSection = 'steps'
      continue
    }

    // Check for STEP header - TWO formats:
    // Format 1: **STEP 1: Title here** (colon and title inside bold)
    // Format 2: **STEP 1.1:** Title here (colon inside bold, title outside)
    const stepMatch1 = line.match(/^\*\*STEP\s*([\d.]+):\s*(.+?)\*\*$/i)
    const stepMatch2 = line.match(/^\*\*STEP\s*([\d.]+):\*\*\s*(.*)$/i)
    const stepMatch = stepMatch1 || stepMatch2

    if (stepMatch) {
      // Save previous step
      if (currentStep) {
        currentStep.text = stepText.join('\n\n')
        if (currentPhase) currentPhase.steps.push(currentStep)
      }
      currentStep = {
        number: stepMatch[1],
        title: stepMatch[2] ? stepMatch[2].trim() : '',
        text: ''
      }
      stepText = []
      currentSection = 'steps'
      continue
    }

    // Check for Critical Success Factors
    const criticalMatch = line.match(/^\*\*Critical\s+Success\s+Factors:?\*\*$/i)
    if (criticalMatch) {
      // Save current step
      if (currentStep) {
        currentStep.text = stepText.join('\n\n')
        if (currentPhase) currentPhase.steps.push(currentStep)
        currentStep = null
        stepText = []
      }
      // Save current phase
      if (currentPhase) {
        result.phases.push(currentPhase)
        currentPhase = null
      }
      currentSection = 'critical'
      continue
    }

    // Add content to appropriate section
    if (currentSection === 'intro' && !currentPhase) {
      result.intro.push(line)
    } else if (currentSection === 'steps' && currentStep) {
      // Don't include bold headers in step text
      if (!line.match(/^\*\*.+\*\*$/)) {
        stepText.push(line)
      }
    } else if (currentSection === 'critical') {
      if (line.startsWith('-')) {
        result.critical.push(line.replace(/^-\s*/, ''))
      } else if (!line.match(/^\*\*.+\*\*$/)) {
        result.closing.push(line)
      }
    }
  }

  // Save last step
  if (currentStep) {
    currentStep.text = stepText.join('\n\n')
    if (currentPhase) currentPhase.steps.push(currentStep)
  }

  // Save last phase
  if (currentPhase) {
    result.phases.push(currentPhase)
  }

  return result
}

// Generate Blueprint HTML - handles multiple phases per chapter
function generateBlueprintHTML(chapters, title) {
  let pages = []
  let pageNum = 2

  chapters.forEach((chapter, chapterIdx) => {
    const content = chapter.content || ''
    const parsed = parseBlueprintContent(content)

    // Track if this is the first page of the chapter
    let isFirstPageOfChapter = true

    // Collect all content items for smart pagination
    let contentItems = []

    // Add intro if exists
    if (parsed.intro.length > 0) {
      contentItems.push({
        type: 'intro',
        content: parsed.intro
      })
    }

    // Add all phases with their meta boxes and steps
    parsed.phases.forEach((phase, phaseIdx) => {
      contentItems.push({
        type: 'phase',
        title: phase.title,
        meta: phase.meta
      })

      phase.steps.forEach(step => {
        contentItems.push({
          type: 'step',
          number: step.number,
          title: step.title,
          text: step.text
        })
      })
    })

    // Add critical section if exists
    if (parsed.critical.length > 0) {
      contentItems.push({
        type: 'critical',
        items: parsed.critical
      })
    }

    // Add closing if exists
    if (parsed.closing.length > 0) {
      contentItems.push({
        type: 'closing',
        content: parsed.closing
      })
    }

    // Now paginate content items - pages expand naturally, so we can fit more
    const itemsPerPage = 6
    let currentPageItems = []
    let currentPageIdx = 0

    function flushPage() {
      if (currentPageItems.length === 0) return

      const chapterLabel = isFirstPageOfChapter
        ? `CHAPTER ${chapterIdx + 1}`
        : `CHAPTER ${chapterIdx + 1} (CONTINUED)`

      let pageContent = `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">${chapterLabel}</div>
      <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>`

      currentPageItems.forEach(item => {
        if (item.type === 'intro') {
          pageContent += `
      <div class="intro-text">
        ${item.content.map(p => `<p>${markdownToHtml(p)}</p>`).join('\n        ')}
      </div>`
        } else if (item.type === 'phase') {
          pageContent += `
      <div class="phase-header">${escapeHtml(item.title)}</div>`

          if (item.meta.need || item.meta.outcome) {
            pageContent += `
      <div class="meta-box">
        ${item.meta.need ? `<strong>What you need:</strong> ${markdownToHtml(item.meta.need)}<br><br>` : ''}
        ${item.meta.outcome ? `<strong>Expected outcome:</strong> ${markdownToHtml(item.meta.outcome)}` : ''}
      </div>`
          }
        } else if (item.type === 'step') {
          pageContent += `
      <div class="blueprint-step">
        <div class="step-number">${item.number}</div>
        <div class="step-content">
          <div class="step-title">${markdownToHtml(item.title)}</div>
          <div class="step-text">
            ${item.text.split('\n\n').filter(p => p.trim()).map(p => `<p>${markdownToHtml(p)}</p>`).join('\n            ')}
          </div>
        </div>
      </div>`
        } else if (item.type === 'critical') {
          pageContent += `
      <div class="critical-section">
        <div class="critical-title">Critical Success Factors</div>
        <ul class="critical-list">
          ${item.items.map(i => `<li>${markdownToHtml(i)}</li>`).join('\n          ')}
        </ul>
      </div>`
        } else if (item.type === 'closing') {
          pageContent += `
      <div class="closing-text">
        ${item.content.map(p => `<p>${markdownToHtml(p)}</p>`).join('\n        ')}
      </div>`
        }
      })

      pageContent += `
    </div>
    ${renderFooter(pageNum)}
  </div>`

      pages.push(pageContent)
      pageNum++
      isFirstPageOfChapter = false
      currentPageItems = []
      currentPageIdx++
    }

    // Distribute content items across pages
    contentItems.forEach((item, idx) => {
      currentPageItems.push(item)

      // Flush page when we have enough items
      // Pages expand naturally now, use reasonable weights
      let itemWeight = 0
      currentPageItems.forEach(i => {
        if (i.type === 'step') itemWeight += 1
        else if (i.type === 'intro') itemWeight += 1
        else if (i.type === 'phase') itemWeight += 0.5
        else if (i.type === 'critical') itemWeight += 1
        else itemWeight += 1
      })

      if (itemWeight >= itemsPerPage) {
        flushPage()
      }
    })

    // Flush any remaining items
    flushPage()
  })

  // Add About page
  pages.push(renderAboutPage())

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${getBaseCSS()}
${getBlueprintCSS()}
${getAboutCSS()}
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

// Parse Swipe File content into structured data
function parseSwipeFileContent(content) {
  const result = {
    intro: '',
    templates: []
  }

  // Split by TEMPLATE headers - support both **TEMPLATE #X:** and plain TEMPLATE #X:
  // First try to find templates with either format
  const templateMatches = []
  const templateRegex = /(?:\*\*)?TEMPLATE\s*#?(\d+):?\s*([^*\n]+)(?:\*\*)?/gi
  let match
  while ((match = templateRegex.exec(content)) !== null) {
    templateMatches.push({
      index: match.index,
      fullMatch: match[0],
      number: match[1],
      title: match[2].trim()
    })
  }

  // If no templates found, return intro only
  if (templateMatches.length === 0) {
    result.intro = content.trim()
    return result
  }

  // First part before first template is intro
  result.intro = content.substring(0, templateMatches[0].index).trim()

  // Process each template
  templateMatches.forEach((tplMatch, idx) => {
    const startIdx = tplMatch.index + tplMatch.fullMatch.length
    const endIdx = idx < templateMatches.length - 1
      ? templateMatches[idx + 1].index
      : content.length
    const templateContent = content.substring(startIdx, endIdx).trim()

    const template = {
      title: tplMatch.title,
      sections: [],
      fillBlank: null,
      example: null
    }

    // Expanded section headers to catch all variations
    const sectionHeaders = [
      'Hook', 'Body', 'Pitch', 'CTA', 'Opening', 'Main Content', 'Closing',
      'Caption', 'Caption Template', 'Visual', 'Format', 'Value Points',
      'Subtle Pitch', 'Direct Pitch', 'Story', 'Reveal Structure',
      'Transition', 'Transition to Pitch', 'B-Roll', 'B-Roll Ideas',
      'Why This Works', 'Why This Template Converts', 'Challenge Structure',
      'Action Steps', 'Posting Strategy', 'Timing Note'
    ]

    const sectionPattern = new RegExp(
      `^(${sectionHeaders.join('|')}):\\s*(.*)$`, 'i'
    )

    const lines = templateContent.split('\n')
    let currentSection = null
    let currentContent = []

    lines.forEach(line => {
      const sectionMatch = line.match(sectionPattern)

      if (sectionMatch) {
        // Save previous section
        if (currentSection) {
          template.sections.push({
            label: currentSection,
            content: currentContent.join('\n')
          })
        }
        currentSection = sectionMatch[1]
        currentContent = sectionMatch[2] ? [sectionMatch[2]] : []
      } else if (line.match(/^\*\*FILL-IN-THE-BLANK/i) || line.match(/^FILL-IN-THE-BLANK/i)) {
        // Save current section and start fill-blank
        if (currentSection) {
          template.sections.push({
            label: currentSection,
            content: currentContent.join('\n')
          })
        }
        currentSection = 'FILL_BLANK'
        currentContent = []
      } else if (line.match(/^\*\*EXAMPLE:?\*\*/i) || line.match(/^EXAMPLE:/i)) {
        // Save current section and start example
        if (currentSection && currentSection !== 'FILL_BLANK') {
          template.sections.push({
            label: currentSection,
            content: currentContent.join('\n')
          })
        } else if (currentSection === 'FILL_BLANK') {
          template.fillBlank = currentContent.join('\n')
        }
        currentSection = 'EXAMPLE'
        currentContent = []
      } else if (currentSection) {
        currentContent.push(line)
      } else {
        // No section yet - might be continuation of intro or unstructured content
        // Start a generic section
        if (line.trim()) {
          currentSection = 'Content'
          currentContent.push(line)
        }
      }
    })

    // Save last section
    if (currentSection === 'FILL_BLANK') {
      template.fillBlank = currentContent.join('\n')
    } else if (currentSection === 'EXAMPLE') {
      template.example = currentContent.join('\n')
    } else if (currentSection) {
      template.sections.push({
        label: currentSection,
        content: currentContent.join('\n')
      })
    }

    result.templates.push(template)
  })

  return result
}

// Generate Swipe File HTML
function generateSwipeFileHTML(chapters, title) {
  let pages = []
  let pageNum = 2
  let templateCounter = 1

  chapters.forEach((chapter, chapterIdx) => {
    const content = chapter.content || ''
    const parsed = parseSwipeFileContent(content)

    // Build page content
    let pageContent = `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">CHAPTER ${chapterIdx + 1}</div>
      <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>`

    // Add intro if exists
    if (parsed.intro) {
      pageContent += `
      <p class="swipe-intro">${markdownToHtml(parsed.intro)}</p>`
    }

    // Add templates
    parsed.templates.forEach((template, tplIdx) => {
      pageContent += `
      <div class="swipe-card">
        <div class="template-label">TEMPLATE #${templateCounter}</div>
        <div class="swipe-card-title">${markdownToHtml(template.title)}</div>`

      // Add sections
      template.sections.forEach(section => {
        if (section.content.trim()) {
          pageContent += `
        <div class="template-section">
          <div class="template-section-label">${escapeHtml(section.label)}:</div>
          <div class="template-section-content">
            ${section.content.split('\n').filter(l => l.trim()).map(l => `<p>${markdownToHtml(l)}</p>`).join('\n            ')}
          </div>
        </div>`
        }
      })

      // Add fill-blank section if exists
      if (template.fillBlank) {
        pageContent += `
        <div class="template-section">
          <div class="template-section-label">FILL-IN-THE-BLANK:</div>
          <div class="template-section-content">
            ${template.fillBlank.split('\n').filter(l => l.trim()).map(l => {
              // Replace [PLACEHOLDER] with styled blanks
              let html = markdownToHtml(l)
              html = html.replace(/\[([A-Z\s]+)\]/g, '<span class="fill-blank">[$1]</span>')
              return `<p>${html}</p>`
            }).join('\n            ')}
          </div>
        </div>`
      }

      // Add example if exists
      if (template.example) {
        pageContent += `
        <div class="example-card">
          <div class="example-label">EXAMPLE</div>
          <div class="example-content">
            ${template.example.split('\n').filter(l => l.trim()).map(l => `<p>${markdownToHtml(l)}</p>`).join('\n            ')}
          </div>
        </div>`
      }

      pageContent += `
      </div>`

      templateCounter++
    })

    pageContent += `
    </div>
    ${renderFooter(pageNum)}
  </div>`

    pages.push(pageContent)
    pageNum++
  })

  // Add About page
  pages.push(renderAboutPage())

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${getBaseCSS()}
${getSwipeFileCSS()}
${getAboutCSS()}
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

// Generate Cheat Sheet HTML
function generateCheatSheetHTML(chapters, title) {
  let pages = []
  let pageNum = 2

  chapters.forEach((chapter, chapterIdx) => {
    const content = chapter.content || ''

    // Parse content into sections
    const sections = []

    // Split by ## headers
    const headerPattern = /##\s+([^\n]+)/g
    const parts = content.split(/(?=##\s+)/)

    parts.forEach(part => {
      const headerMatch = part.match(/^##\s+(.+)/)
      if (headerMatch) {
        const title = headerMatch[1].trim()
        const sectionContent = part.replace(/^##\s+.+\n?/, '').trim()

        // Extract bullet points
        const bullets = sectionContent.match(/^[•→\-\*]\s*.+$/gm) || []
        const items = bullets.map(b => b.replace(/^[•→\-\*]\s*/, ''))

        if (items.length > 0) {
          sections.push({ title, items })
        }
      }
    })

    // If no sections found, create from bullet points
    if (sections.length === 0) {
      const bullets = content.match(/^[•→\-\*]\s*.+$/gm) || []
      if (bullets.length > 0) {
        sections.push({
          title: 'Key Points',
          items: bullets.map(b => b.replace(/^[•→\-\*]\s*/, ''))
        })
      }
    }

    // Build page
    let pageContent = `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">CHAPTER ${chapterIdx + 1}</div>
      <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>

      <div class="cheat-card">
        <div class="cheat-card-title">${escapeHtml(chapter.title)}</div>`

    sections.slice(0, 4).forEach(section => {
      pageContent += `
        <div class="cheat-section">
          <div class="cheat-section-title">${markdownToHtml(section.title)}</div>
          <div class="cheat-section-content">
            <ul>
              ${section.items.slice(0, 6).map(item => `<li>${markdownToHtml(item)}</li>`).join('\n              ')}
            </ul>
          </div>
        </div>`
    })

    pageContent += `
      </div>
    </div>
    ${renderFooter(pageNum)}
  </div>`

    pages.push(pageContent)
    pageNum++
  })

  // Add About page
  pages.push(renderAboutPage())

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${getBaseCSS()}
${getCheatSheetCSS()}
${getAboutCSS()}
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

// Generate Planner HTML
function generatePlannerHTML(chapters, title) {
  let pages = []
  let pageNum = 2

  chapters.forEach((chapter, chapterIdx) => {
    const weekTitle = chapter.chapter_title || chapter.title || `Week ${chapterIdx + 1}`
    const goal = chapter.goal_statement || chapter.goal || ''

    let days = []

    if (chapter.daily_schedule && typeof chapter.daily_schedule === 'object') {
      // Funnel 1 style - nested object structure
      const dayKeys = Object.keys(chapter.daily_schedule).sort()
      dayKeys.slice(0, 3).forEach((dayKey, dayIdx) => {
        const dayData = chapter.daily_schedule[dayKey]
        const tasks = []

        if (dayData.morning_post) {
          tasks.push({
            time: dayData.morning_post.time || '7:00 AM',
            title: dayData.morning_post.type || 'Morning Post',
            details: dayData.morning_post.content_focus || ''
          })
        }

        if (dayData.afternoon_post) {
          tasks.push({
            time: dayData.afternoon_post.time || '12:00 PM',
            title: dayData.afternoon_post.type || 'Afternoon Post',
            details: dayData.afternoon_post.content_focus || ''
          })
        }

        if (tasks.length > 0) {
          days.push({
            name: dayKey,
            goal: dayData.goal || '',
            tasks: tasks
          })
        }
      })
    } else if (chapter.content && typeof chapter.content === 'string') {
      // Funnel 2 style - string content
      const content = chapter.content

      // Parse DAY headers
      const dayPattern = /\*\*DAY\s+(\d+)[^*]*\*\*/gi
      let match
      let lastIndex = 0
      const dayMatches = []

      while ((match = dayPattern.exec(content)) !== null) {
        dayMatches.push({ index: match.index, dayNum: match[1], header: match[0] })
      }

      dayMatches.slice(0, 3).forEach((dayMatch, idx) => {
        const startIdx = dayMatch.index
        const endIdx = dayMatches[idx + 1] ? dayMatches[idx + 1].index : content.length
        const dayContent = content.substring(startIdx, endIdx)

        // Extract tasks (lines with □)
        const taskLines = dayContent.match(/□\s*[^□\n]+/g) || []
        const tasks = taskLines.slice(0, 3).map((line, i) => {
          const cleanLine = line.replace(/^□\s*/, '').trim()
          const topicMatch = cleanLine.match(/^Topic:\s*(.+)$/i)
          return {
            time: i === 0 ? '7:00 AM' : i === 1 ? '12:00 PM' : '3:00 PM',
            title: topicMatch ? topicMatch[1].substring(0, 50) : cleanLine.substring(0, 50),
            details: ''
          }
        })

        if (tasks.length > 0) {
          days.push({
            name: `DAY ${dayMatch.dayNum}`,
            goal: '',
            tasks: tasks
          })
        }
      })
    }

    // Default days if none found
    if (days.length === 0) {
      days = [{
        name: 'DAY 1',
        goal: 'Create engaging content',
        tasks: [
          { time: '7:00 AM', title: 'Morning Content Creation', details: 'Create your first piece of content' },
          { time: '12:00 PM', title: 'Engagement Session', details: 'Respond to comments and DMs' }
        ]
      }]
    }

    // Build page
    let pageContent = `
  <div class="page">
    <div class="header-bar"></div>
    <div class="page-content">
      <div class="chapter-label">WEEK ${chapterIdx + 1}</div>
      <h1 class="chapter-title">${escapeHtml(weekTitle)}</h1>
      ${goal ? `<p class="week-goal">${markdownToHtml(goal)}</p>` : ''}`

    days.forEach(day => {
      pageContent += `
      <div class="day-block">
        <div class="day-header">${escapeHtml(day.name)}</div>
        ${day.goal ? `<p class="day-goal">${markdownToHtml(day.goal)}</p>` : ''}
        ${day.tasks.map(task => `
        <div class="task-item">
          <div class="task-checkbox"></div>
          <div class="task-content">
            <div class="task-time">${task.time}</div>
            <div class="task-title">${markdownToHtml(task.title)}</div>
            ${task.details ? `<div class="task-details"><p>${markdownToHtml(task.details)}</p></div>` : ''}
          </div>
        </div>`).join('')}
      </div>`
    })

    pageContent += `
      <div class="tracking-section">
        <div class="tracking-title">WEEKLY TRACKING</div>
        <div class="tracking-grid">
          <div class="tracking-item">Posts Created: <span class="tracking-line"></span></div>
          <div class="tracking-item">Engagement Rate: <span class="tracking-line"></span></div>
          <div class="tracking-item">New Followers: <span class="tracking-line"></span></div>
          <div class="tracking-item">Revenue: $<span class="tracking-line"></span></div>
        </div>
      </div>
    </div>
    ${renderFooter(pageNum)}
  </div>`

    pages.push(pageContent)
    pageNum++
  })

  // Add About page
  pages.push(renderAboutPage())

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${getBaseCSS()}
${getPlannerCSS()}
${getAboutCSS()}
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

async function main() {
  console.log('Fetching funnel data...')

  const { data: funnel1 } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', FUNNEL_1)
    .single()

  const { data: funnel2 } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', FUNNEL_2)
    .single()

  if (!funnel1 || !funnel2) {
    console.error('Could not fetch funnel data')
    return
  }

  // Output to temp directory first for validation - only copy to final when perfect
  const outputDir = path.join(process.cwd(), 'outputs')

  // Generate Blueprint HTML
  console.log('\nGenerating Blueprint HTML...')
  const blueprintData = funnel1.upsell_2
  const blueprintHTML = generateBlueprintHTML(blueprintData.chapters, blueprintData.name)
  fs.writeFileSync(path.join(outputDir, 'blueprint-test.html'), blueprintHTML)
  console.log('✓ Saved blueprint-test.html to outputs/')

  // Generate Cheat Sheet HTML
  console.log('\nGenerating Cheat Sheet HTML...')
  const cheatsheetData = funnel2.front_end
  const cheatsheetHTML = generateCheatSheetHTML(cheatsheetData.chapters, cheatsheetData.name)
  fs.writeFileSync(path.join(outputDir, 'cheatsheet-test.html'), cheatsheetHTML)
  console.log('✓ Saved cheatsheet-test.html to outputs/')

  // Generate Planner HTML
  console.log('\nGenerating Planner HTML...')
  const plannerData = funnel1.upsell_1
  const plannerHTML = generatePlannerHTML(plannerData.chapters, plannerData.name)
  fs.writeFileSync(path.join(outputDir, 'planner-test.html'), plannerHTML)
  console.log('✓ Saved planner-test.html to outputs/')

  // Generate Swipe File HTML
  console.log('\nGenerating Swipe File HTML...')
  const swipefileData = funnel1.front_end
  const swipefileHTML = generateSwipeFileHTML(swipefileData.chapters, swipefileData.name)
  fs.writeFileSync(path.join(outputDir, 'swipefile-test.html'), swipefileHTML)
  console.log('✓ Saved swipefile-test.html to outputs/')

  console.log('\n=== TEST FILES GENERATED IN outputs/ ===')
  console.log('VALIDATE BEFORE COPYING TO design-testing/')
  console.log('Preview at:')
  console.log('  http://localhost:8082/blueprint-test.html')
  console.log('  http://localhost:8082/cheatsheet-test.html')
  console.log('  http://localhost:8082/planner-test.html')
  console.log('  http://localhost:8082/swipefile-test.html')
}

main().catch(console.error)
