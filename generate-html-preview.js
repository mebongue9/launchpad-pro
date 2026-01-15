// Generate HTML preview WITHOUT calling PDFShift
// Run: node generate-html-preview.js
// Then open: preview-output.html in browser

import { renderCover } from './netlify/functions/lib/cover-renderer.js'
import { renderInterior } from './netlify/functions/lib/interior-renderer.js'
import fs from 'fs'

// Sample template (matching what's in database)
const template = {
  id: 'test',
  name: 'Bold Gradient',
  primary_color: '#FF6B35',
  secondary_color: '#FF8C42',
  tertiary_color: '#FFB347',
  font_family: 'Montserrat',
  font_family_url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap',
  is_gradient: true,
  // HTML template for cover (simplified)
  html_template: `
    <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFB347 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; color: white; text-align: center;">
      <h1 style="font-family: Montserrat, sans-serif; font-size: 36px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase;">{{title}}</h1>
      <div style="display: flex; align-items: center; gap: 20px; margin-top: 40px;">
        <span style="font-size: 24px; font-weight: 700;">{{year}}</span>
        <p style="font-size: 14px; max-width: 300px;">{{subtitle}}</p>
      </div>
      <div style="position: absolute; bottom: 40px; text-align: center;">
        <p style="font-size: 16px; font-weight: 600;">{{author}}</p>
        <p style="font-size: 12px; opacity: 0.8;">{{handle}}</p>
      </div>
    </div>
  `,
  // CSS styles (required - was outputting 'undefined' without this)
  css_styles: ''
}

// Sample profile data (from schema: name, social_handle, photo_url, logo_url, tagline, niche)
const profile = {
  name: 'Martin Ebongue',
  social_handle: 'realmartinebongue',
  photo_url: 'https://psfgnelrxzdckucvytzj.supabase.co/storage/v1/object/public/profile-photos/test-photo.jpg',
  logo_url: null,
  tagline: 'Helping entrepreneurs build profitable online businesses',
  niche: 'digital marketing and online business'
}

// Sample content with PHASE, STEP, bullets, markdown
const content = {
  chapters: [
    {
      title: 'The Reality Check - Why Your Current Posting Strategy Isn\'t Making Sales',
      content: `**PHASE 1:** UNDERSTANDING THE PROBLEM

**STEP 1.1:** Face the truth about posting frequency
→ You think one or two posts is enough. It's not.
→ When you're selling digital products, you need way more visibility than that.
→ I post 3-4 times every single day and keep growing. The more you post, the more you grow.
→ It's not an answer people like. They don't like that answer. They like some shiny little hack that's not reality.

What you need: Willingness to post more than once daily
Expected outcome: Understanding why your single daily posts aren't converting

**STEP 1.2:** Recognize the value problem
→ You're not pushing yourself hard enough to create content that's actually valuable.
→ People follow value. Your brain should feel a little broken when you're done creating content because it hurt your mental capacity that much.
→ Most content fails because creators underestimate what "valuable" actually means.

What you need: Commitment to creating genuinely helpful content
Expected outcome: Clarity on why your content isn't attracting buyers

**PHASE 2:** THE TRAFFIC-SALES CONNECTION

**STEP 2.1:** Understand the simple formula
→ Traffic × Conversion = Sales
→ Most people have a traffic problem, not a product problem
→ You need eyeballs before you can make sales`
    },
    {
      title: 'The 3-Post System Breakdown',
      content: `**PHASE 1:** MORNING POST - THE AUTHORITY BUILDER

**STEP 1.1:** Create educational content
→ Teach something valuable from your expertise
→ Use carousel format for maximum engagement
→ Include actionable tips they can implement today

What you need: 30 minutes of focused writing time
Expected outcome: A post that positions you as the expert

**STEP 1.2:** Optimize for the algorithm
→ Post between 7-9 AM in your audience's timezone
→ Engage with comments in the first hour
→ Use 3-5 relevant hashtags

What you need: Understanding of your audience's schedule
Expected outcome: Maximum reach on your educational content`
    }
  ]
}

// Cover data
const coverData = {
  title: 'The 3-Post Daily System: Turn 100 Views Into $50',
  subtitle: 'Daily posting system that converts small audiences into buyers using 3 specific post types at optimal times',
  author: profile.name,
  handle: '@' + profile.social_handle,
  year: new Date().getFullYear()
}

const coverOptions = {
  titleSize: 100,
  subtitleSize: 100,
  authorSize: 100,
  handleSize: 100
}

// Generate HTML
console.log('Generating cover HTML...')
const coverHtml = renderCover(template, coverData, coverOptions)

console.log('Generating interior HTML...')
const interiorHtml = renderInterior(template, { title: coverData.title, content, format: 'lead_magnet' }, profile)

// Combine into single document
function combineDocuments(coverHtml, interiorHtml) {
  const interiorBodyMatch = interiorHtml.match(/<body>([\s\S]*)<\/body>/)
  const interiorBody = interiorBodyMatch ? interiorBodyMatch[1] : ''

  const interiorStyleMatch = interiorHtml.match(/<style>([\s\S]*?)<\/style>/)
  const interiorStyles = interiorStyleMatch ? interiorStyleMatch[1] : ''

  const coverBodyMatch = coverHtml.match(/<body>([\s\S]*)<\/body>/)
  const coverBody = coverBodyMatch ? coverBodyMatch[1] : ''

  const coverStyleMatch = coverHtml.match(/<style>([\s\S]*?)<\/style>/)
  const coverStyles = coverStyleMatch ? coverStyleMatch[1] : ''

  const fontLinkMatch = coverHtml.match(/<link href="([^"]+)" rel="stylesheet">/)
  const fontLink = fontLinkMatch ? `<link href="${fontLinkMatch[1]}" rel="stylesheet">` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Preview - Check Variables and Formatting</title>
  ${fontLink}
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover-page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
    }
    ${coverStyles}
    ${interiorStyles}
  </style>
</head>
<body>
  <div class="cover-page">
    ${coverBody}
  </div>
  ${interiorBody}
</body>
</html>`
}

const combinedHtml = combineDocuments(coverHtml, interiorHtml)

// Save to file
fs.writeFileSync('preview-output.html', combinedHtml)
console.log('\n✅ HTML saved to: preview-output.html')
console.log('📂 Open this file in your browser to preview')
console.log('\n=== CHECKLIST ===')
console.log('□ Profile name showing: Martin Ebongue')
console.log('□ Handle showing: @realmartinebongue')
console.log('□ Photo showing (or placeholder)')
console.log('□ PHASE headers styled correctly')
console.log('□ STEP titles styled correctly')
console.log('□ Arrow bullets (→) showing')
console.log('□ What you need / Expected outcome in meta boxes')
console.log('□ No asterisks (**) showing as text')
console.log('□ Proper margins (not cut off)')
console.log('□ Typography hierarchy visible')
console.log('□ About the Author page has profile data')
