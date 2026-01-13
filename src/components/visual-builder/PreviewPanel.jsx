// src/components/visual-builder/PreviewPanel.jsx
// Live preview showing cover + interior pages with template colors
// Updates in real-time as user edits title/subtitle
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/StyleEditor.jsx

import { useMemo } from 'react'

export function PreviewPanel({
  template,
  title,
  subtitle,
  titleSize = 100,
  subtitleSize = 100,
  profile,
  content
}) {
  if (!template) {
    return (
      <div className="text-center py-12 text-gray-500">
        Select a template to see preview
      </div>
    )
  }

  const year = new Date().getFullYear()
  const author = profile?.name || 'Your Name'
  const handle = profile?.social_handle || profile?.business_name || 'Your Brand'

  // Generate cover HTML with placeholders replaced
  const coverHtml = useMemo(() => {
    return generateCoverHtml(template, {
      title: title || 'Your Title',
      subtitle: subtitle || 'Your subtitle goes here',
      author,
      handle,
      year,
      titleSize,
      subtitleSize
    })
  }, [template, title, subtitle, author, handle, year, titleSize, subtitleSize])

  // Generate interior page HTML
  const interiorHtml = useMemo(() => {
    return generateInteriorHtml(template, {
      title: title || 'Your Title',
      author,
      handle,
      photoUrl: profile?.photo_url
    })
  }, [template, title, author, handle, profile?.photo_url])

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Preview</h3>

      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Cover */}
        <div className="flex-shrink-0">
          <div className="text-xs text-gray-500 mb-2 text-center">Cover</div>
          <div
            className="w-48 h-64 rounded shadow-lg overflow-hidden bg-white"
            style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
          >
            <iframe
              srcDoc={coverHtml}
              title="Cover Preview"
              className="w-full h-full border-0 pointer-events-none"
              style={{ transform: 'scale(0.23)', transformOrigin: 'top left', width: '210mm', height: '297mm' }}
            />
          </div>
        </div>

        {/* Chapter Page */}
        <div className="flex-shrink-0">
          <div className="text-xs text-gray-500 mb-2 text-center">Chapter</div>
          <div className="w-48 h-64 rounded shadow-lg overflow-hidden bg-white">
            <iframe
              srcDoc={interiorHtml.chapter}
              title="Chapter Preview"
              className="w-full h-full border-0 pointer-events-none"
              style={{ transform: 'scale(0.23)', transformOrigin: 'top left', width: '210mm', height: '297mm' }}
            />
          </div>
        </div>

        {/* Checklist Page */}
        <div className="flex-shrink-0">
          <div className="text-xs text-gray-500 mb-2 text-center">Checklist</div>
          <div className="w-48 h-64 rounded shadow-lg overflow-hidden bg-white">
            <iframe
              srcDoc={interiorHtml.checklist}
              title="Checklist Preview"
              className="w-full h-full border-0 pointer-events-none"
              style={{ transform: 'scale(0.23)', transformOrigin: 'top left', width: '210mm', height: '297mm' }}
            />
          </div>
        </div>

        {/* Steps Page */}
        <div className="flex-shrink-0">
          <div className="text-xs text-gray-500 mb-2 text-center">Steps</div>
          <div className="w-48 h-64 rounded shadow-lg overflow-hidden bg-white">
            <iframe
              srcDoc={interiorHtml.steps}
              title="Steps Preview"
              className="w-full h-full border-0 pointer-events-none"
              style={{ transform: 'scale(0.23)', transformOrigin: 'top left', width: '210mm', height: '297mm' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate cover HTML from template
function generateCoverHtml(template, data) {
  const { title, subtitle, author, handle, year, titleSize, subtitleSize } = data
  const titleScale = titleSize / 100
  const subtitleScale = subtitleSize / 100

  // Replace placeholders in template HTML
  let html = template.html_template
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{subtitle\}\}/g, subtitle)
    .replace(/\{\{author\}\}/g, author)
    .replace(/\{\{handle\}\}/g, handle)
    .replace(/\{\{year\}\}/g, year)

  // Build full HTML document
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="${template.font_family_url}" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
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

// Generate interior page HTML with template colors
function generateInteriorHtml(template, data) {
  const { title, author, handle, photoUrl } = data
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
      <div class="footer-handle">@${handle}</div>
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
      <div class="footer-handle">@${handle}</div>
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
      <div class="footer-handle">@${handle}</div>
    </div>
    <div class="footer-page">12</div>
  </div>
</div></body></html>`

  return { chapter, checklist, steps }
}

// Generate light background color from primary color
function getLightBackground(hex) {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Create very light version (10% opacity equivalent)
  const lightR = Math.round(r + (255 - r) * 0.92)
  const lightG = Math.round(g + (255 - g) * 0.92)
  const lightB = Math.round(b + (255 - b) * 0.92)

  return `rgb(${lightR}, ${lightG}, ${lightB})`
}

export default PreviewPanel
