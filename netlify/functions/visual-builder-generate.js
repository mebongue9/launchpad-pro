// netlify/functions/visual-builder-generate.js
// Generates high-quality PDF using PDFShift API
// POST /api/visual-builder-generate
// RELEVANT FILES: lib/cover-renderer.js, lib/interior-renderer.js

import { createClient } from '@supabase/supabase-js'
import { renderCover } from './lib/cover-renderer.js'
import { renderInterior } from './lib/interior-renderer.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PDFSHIFT_API_KEY = process.env.PDFSHIFT_API_KEY
const PDFSHIFT_API_URL = 'https://api.pdfshift.io/v3/convert/pdf'

const LOG_TAG = '[VISUAL-BUILDER-GENERATE]'

export async function handler(event) {
  console.log(`🎨 ${LOG_TAG} Function invoked`)

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const {
      userId,
      funnelId,
      leadMagnetId,
      productType,
      coverTemplateId,
      title,
      titleSize = 100,
      subtitle,
      subtitleSize = 100,
      authorName,
      authorSize = 100,
      handle: handleInput,
      handleSize = 100
    } = body

    console.log(`📥 ${LOG_TAG} Request:`, { funnelId, leadMagnetId, productType, coverTemplateId })

    // Validate required fields
    if (!coverTemplateId) {
      return errorResponse(400, 'coverTemplateId is required')
    }
    if (!title) {
      return errorResponse(400, 'title is required')
    }
    if (!funnelId && !leadMagnetId) {
      return errorResponse(400, 'Either funnelId or leadMagnetId is required')
    }

    // 1. Load cover template
    console.log(`📚 ${LOG_TAG} Loading cover template...`)
    const { data: template, error: templateError } = await supabase
      .from('cover_templates')
      .select('*')
      .eq('id', coverTemplateId)
      .single()

    if (templateError || !template) {
      console.error(`❌ ${LOG_TAG} Template error:`, templateError)
      return errorResponse(404, 'Cover template not found')
    }

    // 2. Load content based on product type
    console.log(`📄 ${LOG_TAG} Loading content...`)
    let content = null
    if (funnelId) {
      const { data: funnel } = await supabase
        .from('funnels')
        .select('generated_content')
        .eq('id', funnelId)
        .single()
      content = funnel?.generated_content
    } else if (leadMagnetId) {
      const { data: leadMagnet } = await supabase
        .from('lead_magnets')
        .select('generated_content')
        .eq('id', leadMagnetId)
        .single()
      content = leadMagnet?.generated_content
    }

    // 3. Load user profile for interior pages
    console.log(`👤 ${LOG_TAG} Loading profile...`)
    let profile = null
    if (userId) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, social_handle, photo_url, tagline, bio')
        .eq('id', userId)
        .single()
      profile = profileData
    }

    // 4. Render HTML
    console.log(`🎨 ${LOG_TAG} Rendering HTML...`)
    const coverData = {
      title,
      subtitle,
      author: authorName || profile?.name || '',
      handle: handleInput || profile?.social_handle || '',
      year: new Date().getFullYear()
    }
    const coverOptions = { titleSize, subtitleSize, authorSize, handleSize }

    const coverHtml = renderCover(template, coverData, coverOptions)
    const interiorHtml = renderInterior(template, { title, content, format: productType }, profile)

    // Combine cover and interior into single document
    const combinedHtml = combineDocuments(coverHtml, interiorHtml)

    // 5. Call PDFShift API
    console.log(`📄 ${LOG_TAG} Calling PDFShift API...`)
    const pdfBuffer = await generatePdfWithPdfShift(combinedHtml)

    if (!pdfBuffer) {
      return errorResponse(500, 'Failed to generate PDF')
    }

    console.log(`✅ ${LOG_TAG} PDF generated, size: ${pdfBuffer.length} bytes`)

    // 6. Upload to Supabase Storage
    console.log(`📤 ${LOG_TAG} Uploading to storage...`)
    const fileName = `visual-builder/${funnelId || leadMagnetId}/${Date.now()}-styled.pdf`

    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error(`❌ ${LOG_TAG} Upload error:`, uploadError)
      return errorResponse(500, `Failed to upload PDF: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-pdfs')
      .getPublicUrl(fileName)

    const pdfUrl = urlData.publicUrl
    console.log(`✅ ${LOG_TAG} PDF uploaded:`, pdfUrl)

    // 7. Create/update styled_products record
    const styledProductData = {
      funnel_id: funnelId || null,
      lead_magnet_id: leadMagnetId || null,
      product_type: productType || 'lead_magnet',
      cover_template_id: coverTemplateId,
      cover_title: title,
      cover_subtitle: subtitle || null,
      title_size_percent: titleSize,
      subtitle_size_percent: subtitleSize,
      pdf_url: pdfUrl,
      cover_png_url: null // Can generate cover image later if needed
    }

    const { data: styledProduct, error: insertError } = await supabase
      .from('styled_products')
      .insert(styledProductData)
      .select()
      .single()

    if (insertError) {
      console.error(`⚠️ ${LOG_TAG} styled_products insert error (non-fatal):`, insertError)
    }

    // 8. Return success with PDF URL
    console.log(`✅ ${LOG_TAG} Complete!`)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        pdfUrl,
        styledProductId: styledProduct?.id || null
      })
    }

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error:`, error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    }
  }
}

/**
 * Combine cover and interior HTML into single multi-page document
 */
function combineDocuments(coverHtml, interiorHtml) {
  // Extract body content from interior HTML
  const interiorBodyMatch = interiorHtml.match(/<body>([\s\S]*)<\/body>/)
  const interiorBody = interiorBodyMatch ? interiorBodyMatch[1] : ''

  // Extract styles from interior HTML
  const interiorStyleMatch = interiorHtml.match(/<style>([\s\S]*?)<\/style>/)
  const interiorStyles = interiorStyleMatch ? interiorStyleMatch[1] : ''

  // Extract body content from cover HTML
  const coverBodyMatch = coverHtml.match(/<body>([\s\S]*)<\/body>/)
  const coverBody = coverBodyMatch ? coverBodyMatch[1] : ''

  // Extract styles from cover HTML
  const coverStyleMatch = coverHtml.match(/<style>([\s\S]*?)<\/style>/)
  const coverStyles = coverStyleMatch ? coverStyleMatch[1] : ''

  // Extract font link from cover
  const fontLinkMatch = coverHtml.match(/<link href="([^"]+)" rel="stylesheet">/)
  const fontLink = fontLinkMatch ? `<link href="${fontLinkMatch[1]}" rel="stylesheet">` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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

/**
 * Generate PDF using PDFShift API
 */
async function generatePdfWithPdfShift(html) {
  if (!PDFSHIFT_API_KEY) {
    console.error(`❌ ${LOG_TAG} PDFSHIFT_API_KEY not configured`)
    throw new Error('PDFSHIFT_API_KEY environment variable not set')
  }

  const authHeader = 'Basic ' + Buffer.from(`api:${PDFSHIFT_API_KEY}`).toString('base64')

  const response = await fetch(PDFSHIFT_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: html,
      format: 'A4',
      margin: '0',
      sandbox: false,
      use_print: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ ${LOG_TAG} PDFShift error:`, response.status, errorText)
    throw new Error(`PDFShift API error: ${response.status} - ${errorText}`)
  }

  // PDFShift returns the PDF as binary
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message })
  }
}
