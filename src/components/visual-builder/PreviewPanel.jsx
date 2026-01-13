// src/components/visual-builder/PreviewPanel.jsx
// Large cover preview with smaller interior page thumbnails
// Updates in real-time as user edits fields
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
  onGenerate,
  generating = false,
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

  // Generate interior page HTML
  const interiorHtml = useMemo(() => {
    return generateInteriorHtml(template, {
      title: title || 'Your Title',
      author: displayAuthor,
      handle: displayHandle
    })
  }, [template, title, displayAuthor, displayHandle])

  const tabs = [
    { id: 'cover', label: 'Cover', html: coverHtml },
    { id: 'chapter', label: 'Chapter', html: interiorHtml.chapter },
    { id: 'checklist', label: 'Checklist', html: interiorHtml.checklist },
    { id: 'steps', label: 'Steps', html: interiorHtml.steps }
  ]

  const activeHtml = tabs.find(t => t.id === activeTab)?.html || coverHtml

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher + Generate button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          onClick={onGenerate}
          disabled={disabled || generating || !title}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
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
      <div className="mt-4 flex gap-3 justify-center">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 transition-all ${
              activeTab === tab.id
                ? 'ring-2 ring-purple-500 ring-offset-2'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <div className="w-16 h-22 bg-white rounded shadow overflow-hidden">
              <iframe
                srcDoc={tab.html}
                title={`${tab.label} Thumbnail`}
                className="w-full h-full border-0 pointer-events-none"
                style={{
                  transform: 'scale(0.076)',
                  transformOrigin: 'top left',
                  width: '210mm',
                  height: '297mm'
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">{tab.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Generate cover HTML from template
function generateCoverHtml(template, data) {
  const { title, subtitle, author, handle, year, titleSize = 100, subtitleSize = 100, authorSize = 100, handleSize = 100 } = data

  // Replace placeholders in template HTML
  let html = template.html_template
    .replace(/\{\{title\}\}/g, escapeHtml(title))
    .replace(/\{\{subtitle\}\}/g, escapeHtml(subtitle))
    .replace(/\{\{author\}\}/g, escapeHtml(author))
    .replace(/\{\{handle\}\}/g, escapeHtml(handle))
    .replace(/\{\{year\}\}/g, year)

  // Build full HTML document with size CSS variables
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
  </style>
</head>
<body>
  ${html}
</body>
</html>`
}

// Generate interior page HTML with template colors
function generateInteriorHtml(template, data) {
  const { title, author, handle } = data
  const { primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_gradient } = template

  // Calculate header gradient
  const headerGradient = is_gradient
    ? `linear-gradient(90deg, ${secondary_color} 0%, ${primary_color} 50%, ${tertiary_color} 100%)`
    : primary_color

  // Calculate light background for callouts
  const lightBg = getLightBackground(primary_color)

  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; }
    .page { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; }
    .header-bar { height: 8px; background: ${headerGradient}; }
    .page-content { flex: 1; padding: 40px; }
    .chapter-label { font-family: '${font_family}', sans-serif; font-size: 12px; font-weight: 600; color: ${primary_color}; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px; }
    .chapter-title { font-family: '${font_family}', sans-serif; font-size: 32px; font-weight: 700; color: #1a1a1a; line-height: 1.1; margin-bottom: 24px; }
    .divider { width: 70px; height: 4px; background: ${is_gradient ? headerGradient : primary_color}; margin: 24px 0; }
    .body-text { font-size: 14px; line-height: 1.7; color: #333; margin-bottom: 20px; }
    .callout { background: ${lightBg}; border-left: 4px solid ${primary_color}; padding: 20px; margin: 20px 0; }
    .callout-title { font-family: '${font_family}', sans-serif; font-size: 13px; font-weight: 600; color: ${primary_color}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .callout-text { font-size: 13px; line-height: 1.6; color: #333; }
    .checklist-item { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .checkbox { width: 20px; height: 20px; border: 2px solid ${primary_color}; border-radius: 3px; flex-shrink: 0; margin-top: 2px; }
    .checklist-text { font-size: 14px; line-height: 1.5; color: #333; }
    .step { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
    .step-number { width: 32px; height: 32px; background: ${is_gradient ? headerGradient : primary_color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: '${font_family}', sans-serif; font-size: 16px; font-weight: 700; color: white; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-weight: 600; font-size: 15px; color: #1a1a1a; margin-bottom: 4px; }
    .step-text { font-size: 13px; line-height: 1.6; color: #555; }
    .page-footer { padding: 16px 40px; border-top: 2px solid ${primary_color}; display: flex; align-items: center; justify-content: space-between; }
    .footer-left { display: flex; align-items: center; gap: 12px; }
    .footer-photo { width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${primary_color}; background: #ddd; }
    .footer-handle { font-size: 11px; color: #888; }
    .footer-page { font-size: 11px; color: #888; }
  `

  const chapter = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${font_family_url}" rel="stylesheet"><style>${baseStyles}</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="chapter-label">Chapter 1</div>
    <div class="chapter-title">The Foundation:<br>Know Your Ideal Client</div>
    <div class="divider"></div>
    <p class="body-text">Before you can attract clients, you need to know exactly who you're trying to reach. This isn't about demographics — it's about understanding their deepest frustrations and desires.</p>
    <div class="callout">
      <div class="callout-title">Key Insight</div>
      <div class="callout-text">Your ideal client isn't "everyone who can pay." It's the specific person who gets the BEST results from your unique approach.</div>
    </div>
  </div>
  <div class="page-footer">
    <div class="footer-left">
      <div class="footer-photo"></div>
      <div class="footer-handle">@${escapeHtml(handle)}</div>
    </div>
    <div class="footer-page">3</div>
  </div>
</div></body></html>`

  const checklist = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${font_family_url}" rel="stylesheet"><style>${baseStyles}</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="chapter-label">Checklist</div>
    <div class="chapter-title">Daily Client<br>Attraction Actions</div>
    <div class="divider"></div>
    <div class="checklist-item"><div class="checkbox"></div><div class="checklist-text">Post one piece of value-driven content</div></div>
    <div class="checklist-item"><div class="checkbox"></div><div class="checklist-text">Engage with 10 potential client posts</div></div>
    <div class="checklist-item"><div class="checkbox"></div><div class="checklist-text">Send 3 personalized DMs to warm leads</div></div>
    <div class="checklist-item"><div class="checkbox"></div><div class="checklist-text">Follow up with interested prospects</div></div>
    <div class="checklist-item"><div class="checkbox"></div><div class="checklist-text">Review analytics and optimize</div></div>
  </div>
  <div class="page-footer">
    <div class="footer-left">
      <div class="footer-photo"></div>
      <div class="footer-handle">@${escapeHtml(handle)}</div>
    </div>
    <div class="footer-page">7</div>
  </div>
</div></body></html>`

  const steps = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><link href="${font_family_url}" rel="stylesheet"><style>${baseStyles}</style></head>
<body><div class="page">
  <div class="header-bar"></div>
  <div class="page-content">
    <div class="chapter-label">Process</div>
    <div class="chapter-title">The 4-Step<br>Outreach Formula</div>
    <div class="divider"></div>
    <div class="step"><div class="step-number">1</div><div class="step-content"><div class="step-title">Research First</div><div class="step-text">Spend 2 minutes learning about them.</div></div></div>
    <div class="step"><div class="step-number">2</div><div class="step-content"><div class="step-title">Lead With Value</div><div class="step-text">Share a relevant insight. No pitch yet.</div></div></div>
    <div class="step"><div class="step-number">3</div><div class="step-content"><div class="step-title">Ask One Question</div><div class="step-text">Get them talking about their challenge.</div></div></div>
    <div class="step"><div class="step-number">4</div><div class="step-content"><div class="step-title">Offer The Next Step</div><div class="step-text">Only after rapport is built, suggest how you might help.</div></div></div>
  </div>
  <div class="page-footer">
    <div class="footer-left">
      <div class="footer-photo"></div>
      <div class="footer-handle">@${escapeHtml(handle)}</div>
    </div>
    <div class="footer-page">12</div>
  </div>
</div></body></html>`

  return { chapter, checklist, steps }
}

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

// Generate light background color from primary color
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
