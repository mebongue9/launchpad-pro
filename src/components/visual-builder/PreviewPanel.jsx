// src/components/visual-builder/PreviewPanel.jsx
// Large cover preview with 6 format interior page tabs
// Highlights the tab matching the selected product's format
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/StyleEditor.jsx

import { useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Loader2, Sparkles } from 'lucide-react'

export function PreviewPanel({
  template,
  title,
  subtitle,
  titleSize = 100,
  subtitleSize = 100,
  authorName,
  authorSize = 100,
  handle,
  handleSize = 100,
  productFormat = null,
  onGenerate,
  generating = false,
  generationStatus = null,
  disabled = false
}) {
  const [activeTab, setActiveTab] = useState('cover')

  if (!template) {
    return (
      <div className="text-center py-12 text-gray-500">
        Select a template to see preview
      </div>
    )
  }

  const year = new Date().getFullYear()
  const displayAuthor = authorName || 'Your Name'
  const displayHandle = handle || 'Your Brand'

  // Generate cover HTML with placeholders replaced
  const coverHtml = useMemo(() => {
    return generateCoverHtml(template, {
      title: title || 'Your Title',
      subtitle: subtitle || 'Your subtitle goes here',
      author: displayAuthor,
      handle: displayHandle,
      year,
      titleSize,
      subtitleSize,
      authorSize,
      handleSize
    })
  }, [template, title, subtitle, displayAuthor, displayHandle, year, titleSize, subtitleSize, authorSize, handleSize])

  // Generate all 6 format preview HTMLs
  const formatHtmls = useMemo(() => {
    const baseData = { title: title || 'Your Title', author: displayAuthor, handle: displayHandle }
    return {
      checklist: generateChecklistHtml(template, baseData),
      worksheet: generateWorksheetHtml(template, baseData),
      planner: generatePlannerHtml(template, baseData),
      'swipe-file': generateSwipeFileHtml(template, baseData),
      blueprint: generateBlueprintHtml(template, baseData),
      'cheat-sheet': generateCheatSheetHtml(template, baseData)
    }
  }, [template, title, displayAuthor, displayHandle])

  // All 7 tabs: Cover + 6 formats
  const tabs = [
    { id: 'cover', label: 'Cover', format: null },
    { id: 'checklist', label: 'Checklist', format: 'checklist' },
    { id: 'worksheet', label: 'Worksheet', format: 'worksheet' },
    { id: 'planner', label: 'Planner', format: 'planner' },
    { id: 'swipe-file', label: 'Swipe File', format: 'swipe-file' },
    { id: 'blueprint', label: 'Blueprint', format: 'blueprint' },
    { id: 'cheat-sheet', label: 'Cheat Sheet', format: 'cheat-sheet' }
  ]

  // Get HTML for active tab
  const getTabHtml = (tabId) => {
    if (tabId === 'cover') return coverHtml
    return formatHtmls[tabId] || coverHtml
  }

  const activeHtml = getTabHtml(activeTab)

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher + Generate button */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {tabs.map(tab => {
            const isMatchingFormat = tab.format && tab.format === productFormat
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {/* Blue dot indicator for matching format - always visible */}
                {isMatchingFormat && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                )}
                {tab.label}
              </button>
            )
          })}
        </div>
        <Button
          onClick={onGenerate}
          disabled={disabled || generating || !title}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {generationStatus === 'starting' && 'Starting...'}
              {generationStatus === 'processing' && 'Generating PDF...'}
              {!generationStatus && 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate PDF
            </>
          )}
        </Button>
      </div>

      {/* Large preview area */}
      <div className="flex-1 flex justify-center items-start overflow-auto bg-gray-100 rounded-xl p-4">
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden"
          style={{
            width: '420px',
            height: '594px',
            minWidth: '420px'
          }}
        >
          <iframe
            srcDoc={activeHtml}
            title={`${activeTab} Preview`}
            className="w-full h-full border-0 pointer-events-none"
            style={{
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              width: '210mm',
              height: '297mm'
            }}
          />
        </div>
      </div>

      {/* Mini thumbnails at bottom */}
      <div className="mt-4 flex gap-2 justify-center flex-wrap">
        {tabs.map(tab => {
          const isMatchingFormat = tab.format && tab.format === productFormat
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-shrink-0 transition-all ${
                isActive
                  ? 'ring-2 ring-purple-500 ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {/* Blue dot indicator for matching format - always visible */}
              {isMatchingFormat && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm z-10" />
              )}
              <div className="w-14 h-20 bg-white rounded shadow overflow-hidden">
                <iframe
                  srcDoc={getTabHtml(tab.id)}
                  title={`${tab.label} Thumbnail`}
                  className="w-full h-full border-0 pointer-events-none"
                  style={{
                    transform: 'scale(0.067)',
                    transformOrigin: 'top left',
                    width: '210mm',
                    height: '297mm'
                  }}
                />
              </div>
              <div className={`text-xs mt-1 text-center truncate w-14 ${
                isMatchingFormat ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {tab.label.split(' ')[0]}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// COVER HTML GENERATOR
// ============================================

function generateCoverHtml(template, data) {
  const { title, subtitle, author, handle, year, titleSize = 100, subtitleSize = 100, authorSize = 100, handleSize = 100 } = data

  let html = template.html_template
    // Standard placeholders (existing templates)
    .replace(/\{\{title\}\}/g, escapeHtml(title))
    .replace(/\{\{subtitle\}\}/g, escapeHtml(subtitle))
    .replace(/\{\{author\}\}/g, escapeHtml(author))
    .replace(/\{\{handle\}\}/g, escapeHtml(handle))
    .replace(/\{\{year\}\}/g, year)
    // Alternative placeholders (imported templates)
    .replace(/\{\{product_title\}\}/gi, escapeHtml(title))
    .replace(/\{\{product_subtitle\}\}/gi, escapeHtml(subtitle))
    .replace(/\{\{author_name\}\}/gi, escapeHtml(author))
    .replace(/\{\{author_handle\}\}/gi, escapeHtml(handle))
    .replace(/\{\{author_tagline\}\}/gi, escapeHtml(subtitle))

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="${template.font_family_url}" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    :root {
      --title-scale: ${titleSize / 100};
      --subtitle-scale: ${subtitleSize / 100};
      --author-scale: ${authorSize / 100};
      --handle-scale: ${handleSize / 100};
    }
    ${template.css_styles}

    /* Override styles for imported templates - must come AFTER template.css_styles */
    /* Issue 2 fix: Remove white margins from imported templates */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      display: block !important;
    }
    .cover {
      box-shadow: none !important;
      margin: 0 !important;
    }

    /* Issue 1 fix: Apply slider scaling to imported template classes */
    .title-text {
      font-size: calc(72px * var(--title-scale, 1)) !important;
    }
    .subtitle-text {
      font-size: calc(14px * var(--subtitle-scale, 1)) !important;
    }
    .author-name {
      font-size: calc(14px * var(--author-scale, 1)) !important;
    }
    .author-handle {
      font-size: calc(12px * var(--handle-scale, 1)) !important;
    }
    .author-tagline {
      font-size: calc(13px * var(--subtitle-scale, 1)) !important;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`
}

// ============================================
// BASE STYLES FOR ALL FORMAT PAGES
// ============================================

function getBaseStyles(template) {
  const { primary_color, secondary_color, tertiary_color, font_family, is_gradient } = template

  const headerGradient = is_gradient
    ? `linear-gradient(90deg, ${secondary_color} 0%, ${primary_color} 50%, ${tertiary_color} 100%)`
    : primary_color

  const lightBg = getLightBackground(primary_color)

  return {
    headerGradient,
    lightBg,
    css: `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: #fff; }
      .page { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; }
      .header-bar { height: 8px; background: ${headerGradient}; }
      .page-content { flex: 1; padding: 40px; }
      .format-label { font-family: '${font_family}', sans-serif; font-size: 12px; font-weight: 600; color: ${primary_color}; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px; }
      .page-title { font-family: '${font_family}', sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2; margin-bottom: 20px; }
      .divider { width: 70px; height: 4px; background: ${is_gradient ? headerGradient : primary_color}; margin-bottom: 24px; }
      .page-footer { padding: 16px 40px; border-top: 2px solid ${primary_color}; display: flex; align-items: center; justify-content: space-between; }
      .footer-handle { font-size: 11px; color: #888; }
      .footer-page { font-size: 11px; color: #888; }
    `
  }
}

// ============================================
// CHECKLIST FORMAT
// ============================================

function generateChecklistHtml(template, data) {
  const { primary_color } = template
  const { handle } = data
  const base = getBaseStyles(template)

  const items = [
    'Define your ideal client avatar',
    'Research competitor offerings',
    'Outline your unique value proposition',
    'Create your lead magnet content',
    'Design professional cover and interior'
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${template.font_family_url}" rel="stylesheet">
<style>
  ${base.css}
  .checklist-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .checklist-table th { background: ${primary_color}; color: white; padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; }
  .checklist-table td { padding: 14px 16px; border-bottom: 1px solid #e5e5e5; }
  .checkbox { width: 18px; height: 18px; border: 2px solid ${primary_color}; border-radius: 3px; display: inline-block; margin-right: 12px; vertical-align: middle; }
  .item-text { font-size: 14px; color: #333; }
  .notes-line { border-bottom: 1px dashed #ccc; min-height: 20px; }
</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="format-label">Checklist</div>
    <div class="page-title">Action Items</div>
    <div class="divider"></div>
    <table class="checklist-table">
      <tr><th style="width: 60%">Action Item</th><th style="width: 40%">Notes</th></tr>
      ${items.map(item => `
        <tr>
          <td><span class="checkbox"></span><span class="item-text">${escapeHtml(item)}</span></td>
          <td><div class="notes-line"></div></td>
        </tr>
      `).join('')}
    </table>
  </div>
  <div class="page-footer">
    <div class="footer-handle">@${escapeHtml(handle)}</div>
    <div class="footer-page">1</div>
  </div>
</div></body></html>`
}

// ============================================
// WORKSHEET FORMAT
// ============================================

function generateWorksheetHtml(template, data) {
  const { primary_color } = template
  const { handle } = data
  const base = getBaseStyles(template)

  const sections = [
    { title: 'Your Vision', prompt: 'What does success look like for you in 6 months?', lines: 4 },
    { title: 'Current Challenges', prompt: 'What obstacles are holding you back right now?', lines: 4 },
    { title: 'Action Steps', prompt: 'What 3 things can you do this week to move forward?', lines: 4 }
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${template.font_family_url}" rel="stylesheet">
<style>
  ${base.css}
  .section { border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
  .section-title { font-size: 16px; font-weight: 600; color: ${primary_color}; margin-bottom: 8px; }
  .section-prompt { font-size: 13px; font-style: italic; color: #666; margin-bottom: 16px; }
  .writing-area { display: flex; flex-direction: column; gap: 4px; }
  .writing-line { height: 28px; border-bottom: 1px dashed #ccc; }
</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="format-label">Worksheet</div>
    <div class="page-title">Reflection Exercise</div>
    <div class="divider"></div>
    ${sections.map(section => `
      <div class="section">
        <div class="section-title">${escapeHtml(section.title)}</div>
        <div class="section-prompt">${escapeHtml(section.prompt)}</div>
        <div class="writing-area">
          ${Array(section.lines).fill('<div class="writing-line"></div>').join('')}
        </div>
      </div>
    `).join('')}
  </div>
  <div class="page-footer">
    <div class="footer-handle">@${escapeHtml(handle)}</div>
    <div class="footer-page">1</div>
  </div>
</div></body></html>`
}

// ============================================
// PLANNER FORMAT
// ============================================

function generatePlannerHtml(template, data) {
  const { primary_color } = template
  const { handle } = data
  const base = getBaseStyles(template)

  const days = ['Monday', 'Tuesday', 'Wednesday']

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${template.font_family_url}" rel="stylesheet">
<style>
  ${base.css}
  .planner-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
  .day-block { border: 2px solid ${primary_color}; border-radius: 8px; overflow: hidden; }
  .day-header { background: ${primary_color}; color: white; padding: 10px; font-weight: 600; font-size: 14px; text-align: center; }
  .day-content { padding: 12px; }
  .field-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .focus-line { height: 24px; border-bottom: 1px solid #ddd; margin-bottom: 12px; }
  .task-row { display: flex; align-items: center; gap: 8px; height: 24px; margin-bottom: 4px; }
  .task-checkbox { width: 14px; height: 14px; border: 2px solid ${primary_color}; border-radius: 2px; flex-shrink: 0; }
  .task-line { flex: 1; border-bottom: 1px dashed #ccc; }
  .notes-area { height: 40px; border: 1px dashed #ccc; border-radius: 4px; margin-top: 8px; }
</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="format-label">Planner</div>
    <div class="page-title">Weekly Focus</div>
    <div class="divider"></div>
    <div class="planner-grid">
      ${days.map(day => `
        <div class="day-block">
          <div class="day-header">${day}</div>
          <div class="day-content">
            <div class="field-label">Focus</div>
            <div class="focus-line"></div>
            <div class="field-label">Tasks</div>
            <div class="task-row"><div class="task-checkbox"></div><div class="task-line"></div></div>
            <div class="task-row"><div class="task-checkbox"></div><div class="task-line"></div></div>
            <div class="task-row"><div class="task-checkbox"></div><div class="task-line"></div></div>
            <div class="field-label">Notes</div>
            <div class="notes-area"></div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="page-footer">
    <div class="footer-handle">@${escapeHtml(handle)}</div>
    <div class="footer-page">1</div>
  </div>
</div></body></html>`
}

// ============================================
// SWIPE FILE FORMAT
// ============================================

function generateSwipeFileHtml(template, data) {
  const { primary_color } = template
  const { handle } = data
  const base = getBaseStyles(template)

  const templates = [
    { title: 'Welcome Email', category: 'Email', content: "Hey [Name],\n\nWelcome to [Brand]! I'm so excited you're here...\n\nHere's what to expect next..." },
    { title: 'Follow-Up DM', category: 'Social', content: "Hey! I noticed you checked out [resource]. Quick question - what's your biggest challenge with [topic]?" },
    { title: 'Sales Close', category: 'Sales', content: 'Based on everything we discussed, [Product] sounds like a perfect fit. Ready to get started?' }
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${template.font_family_url}" rel="stylesheet">
<style>
  ${base.css}
  .template-card { border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
  .template-header { background: ${primary_color}10; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e5e5; }
  .template-title { font-weight: 600; font-size: 15px; color: #1a1a1a; }
  .template-category { font-size: 11px; background: #e5e5e5; padding: 2px 8px; border-radius: 10px; color: #666; }
  .template-content { padding: 16px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6; color: #333; background: #fafafa; white-space: pre-wrap; }
  .copy-btn { font-size: 11px; color: ${primary_color}; background: white; border: 1px solid ${primary_color}; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="format-label">Swipe File</div>
    <div class="page-title">Copy-Paste Templates</div>
    <div class="divider"></div>
    ${templates.map((t, i) => `
      <div class="template-card">
        <div class="template-header">
          <div>
            <span style="color: ${primary_color}; font-size: 12px; margin-right: 8px;">Template #${i + 1}</span>
            <span class="template-title">${escapeHtml(t.title)}</span>
          </div>
          <span class="template-category">${escapeHtml(t.category)}</span>
        </div>
        <div class="template-content">${escapeHtml(t.content)}</div>
      </div>
    `).join('')}
  </div>
  <div class="page-footer">
    <div class="footer-handle">@${escapeHtml(handle)}</div>
    <div class="footer-page">1</div>
  </div>
</div></body></html>`
}

// ============================================
// BLUEPRINT FORMAT
// ============================================

function generateBlueprintHtml(template, data) {
  const { primary_color } = template
  const { handle } = data
  const base = getBaseStyles(template)

  const steps = [
    { title: 'Research Your Market', description: 'Understand your audience, competitors, and unique positioning.' },
    { title: 'Define Your Offer', description: 'Create a compelling offer that solves a specific problem.' },
    { title: 'Build Your Funnel', description: 'Set up your lead magnet, landing page, and email sequence.' },
    { title: 'Launch & Iterate', description: 'Go live, gather feedback, and continuously improve.' }
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${template.font_family_url}" rel="stylesheet">
<style>
  ${base.css}
  .blueprint-container { margin-top: 16px; }
  .step { display: flex; gap: 20px; margin-bottom: 24px; position: relative; }
  .step-number { width: 48px; height: 48px; background: ${primary_color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: white; flex-shrink: 0; box-shadow: 0 4px 12px ${primary_color}40; }
  .step:not(:last-child)::after { content: ''; position: absolute; left: 24px; top: 56px; width: 2px; height: calc(100% - 32px); background: linear-gradient(to bottom, ${primary_color}, ${primary_color}40); }
  .step-content { flex: 1; padding-top: 8px; }
  .step-title { font-weight: 600; font-size: 16px; color: #1a1a1a; margin-bottom: 6px; }
  .step-desc { font-size: 14px; line-height: 1.5; color: #555; }
</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="format-label">Blueprint</div>
    <div class="page-title">Step-by-Step Process</div>
    <div class="divider"></div>
    <div class="blueprint-container">
      ${steps.map((step, i) => `
        <div class="step">
          <div class="step-number">${i + 1}</div>
          <div class="step-content">
            <div class="step-title">${escapeHtml(step.title)}</div>
            <div class="step-desc">${escapeHtml(step.description)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="page-footer">
    <div class="footer-handle">@${escapeHtml(handle)}</div>
    <div class="footer-page">1</div>
  </div>
</div></body></html>`
}

// ============================================
// CHEAT SHEET FORMAT
// ============================================

function generateCheatSheetHtml(template, data) {
  const { primary_color } = template
  const { handle } = data
  const base = getBaseStyles(template)

  const sections = [
    { title: 'Quick Wins', items: ['Post consistently at peak times', 'Use strong CTAs', 'Engage before posting'] },
    { title: 'Content Types', items: ['Educational carousels', 'Behind-the-scenes', 'Testimonials & results'] },
    { title: 'Engagement Tips', items: ['Reply within 1 hour', 'Ask questions', 'Use polls & quizzes'] },
    { title: 'Growth Hacks', items: ['Collab with peers', 'Cross-promote platforms', 'Repurpose top content'] }
  ]

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${template.font_family_url}" rel="stylesheet">
<style>
  ${base.css}
  .cheat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
  .cheat-section { background: #f9fafb; border-radius: 8px; padding: 16px; border-top: 4px solid ${primary_color}; }
  .cheat-title { font-size: 14px; font-weight: 600; color: ${primary_color}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .cheat-list { list-style: none; }
  .cheat-list li { font-size: 13px; color: #333; padding: 6px 0; padding-left: 16px; position: relative; }
  .cheat-list li::before { content: '•'; color: ${primary_color}; font-weight: bold; position: absolute; left: 0; }
</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="format-label">Cheat Sheet</div>
    <div class="page-title">Quick Reference Guide</div>
    <div class="divider"></div>
    <div class="cheat-grid">
      ${sections.map(section => `
        <div class="cheat-section">
          <div class="cheat-title">${escapeHtml(section.title)}</div>
          <ul class="cheat-list">
            ${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="page-footer">
    <div class="footer-handle">@${escapeHtml(handle)}</div>
    <div class="footer-page">1</div>
  </div>
</div></body></html>`
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

export default PreviewPanel
