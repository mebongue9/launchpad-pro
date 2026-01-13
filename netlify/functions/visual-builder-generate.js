// netlify/functions/visual-builder-generate.js
// Generates high-quality PDF from cover template + interior pages using Puppeteer
// POST /api/visual-builder-generate
// RELEVANT FILES: src/pages/VisualBuilder.jsx, netlify/functions/lib/cover-renderer.js

import { createClient } from '@supabase/supabase-js'
import { renderCover } from './lib/cover-renderer.js'
import { renderInterior } from './lib/interior-renderer.js'
import { renderPdf, renderPng, combineHtmlForPdf } from './lib/pdf-renderer.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LOG_TAG = '[VISUAL-BUILDER-GENERATE]'
const STORAGE_BUCKET = 'visual-designs'

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
    console.log(`📄 ${LOG_TAG} Loading cover template...`)
    const { data: template, error: templateError } = await supabase
      .from('cover_templates')
      .select('*')
      .eq('id', coverTemplateId)
      .single()

    if (templateError || !template) {
      console.error(`❌ ${LOG_TAG} Template error:`, templateError)
      return errorResponse(404, 'Cover template not found')
    }

    // 2. Load product data and profile
    let productData = null
    let profileData = null
    let contentData = null

    if (leadMagnetId) {
      console.log(`📦 ${LOG_TAG} Loading lead magnet...`)
      const { data: lm, error } = await supabase
        .from('lead_magnets')
        .select(`
          id, name, format, topic, content,
          profiles:profile_id (id, name, tagline, social_handle, photo_url, business_name)
        `)
        .eq('id', leadMagnetId)
        .single()

      if (error) {
        console.error(`❌ ${LOG_TAG} Lead magnet error:`, error)
        return errorResponse(404, 'Lead magnet not found')
      }

      productData = { type: 'lead_magnet', name: lm.name, format: lm.format }
      contentData = lm.content || {}
      profileData = lm.profiles
    } else if (funnelId && productType) {
      console.log(`📦 ${LOG_TAG} Loading funnel product...`)
      const { data: funnel, error } = await supabase
        .from('funnels')
        .select(`
          id, name, ${productType},
          profiles:profile_id (id, name, tagline, social_handle, photo_url, business_name)
        `)
        .eq('id', funnelId)
        .single()

      if (error) {
        console.error(`❌ ${LOG_TAG} Funnel error:`, error)
        return errorResponse(404, 'Funnel not found')
      }

      const product = funnel[productType]
      if (!product) {
        return errorResponse(404, `Product ${productType} not found in funnel`)
      }

      productData = { type: productType, name: product.name, format: product.format }
      contentData = product.content || {}
      profileData = funnel.profiles
    }

    const year = new Date().getFullYear()
    // Use provided author/handle or fall back to profile data
    const author = authorName || profileData?.name || 'Author'
    const handle = handleInput || profileData?.social_handle || profileData?.business_name || ''

    // 3. Render cover HTML
    console.log(`🎨 ${LOG_TAG} Rendering cover...`)
    const coverHtml = renderCover(template, {
      title,
      subtitle: subtitle || '',
      author,
      handle,
      year
    }, {
      titleSize,
      subtitleSize,
      authorSize,
      handleSize
    })

    // 4. Render interior HTML
    console.log(`📄 ${LOG_TAG} Rendering interior pages...`)
    const interiorHtml = renderInterior(template, {
      title,
      content: contentData,
      format: productData?.format
    }, {
      ...profileData,
      name: author,
      social_handle: handle
    })

    // 5. Combine HTML for full PDF
    console.log(`🔗 ${LOG_TAG} Combining HTML for PDF...`)
    const combinedHtml = combineHtmlForPdf(coverHtml, interiorHtml)

    // 6. Generate PDF using Puppeteer
    console.log(`📝 ${LOG_TAG} Generating PDF with Puppeteer...`)
    const pdfBuffer = await renderPdf(combinedHtml)

    // 7. Generate cover PNG for preview
    console.log(`📸 ${LOG_TAG} Generating cover PNG...`)
    const pngBuffer = await renderPng(coverHtml)

    // 8. Upload to Supabase Storage
    const timestamp = Date.now()
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
    const pdfPath = `${userId || 'anonymous'}/${timestamp}-${safeTitle}.pdf`
    const pngPath = `${userId || 'anonymous'}/${timestamp}-${safeTitle}-cover.png`

    console.log(`☁️ ${LOG_TAG} Uploading to Supabase storage...`)

    // Upload PDF
    const { error: pdfUploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '31536000', // 1 year cache
        upsert: true
      })

    if (pdfUploadError) {
      console.error(`❌ ${LOG_TAG} PDF upload error:`, pdfUploadError)
      return errorResponse(500, `Failed to upload PDF: ${pdfUploadError.message}`)
    }

    // Upload PNG
    const { error: pngUploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(pngPath, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true
      })

    if (pngUploadError) {
      console.error(`❌ ${LOG_TAG} PNG upload error:`, pngUploadError)
      // Continue even if PNG fails - PDF is more important
    }

    // Get public URLs
    const { data: pdfUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(pdfPath)

    const { data: pngUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(pngPath)

    const pdfUrl = pdfUrlData?.publicUrl || null
    const coverPngUrl = pngUrlData?.publicUrl || null

    console.log(`✅ ${LOG_TAG} Upload complete:`, { pdfUrl, coverPngUrl })

    // 9. Save to styled_products table
    console.log(`💾 ${LOG_TAG} Saving to styled_products...`)
    const styledProductData = {
      funnel_id: funnelId || null,
      lead_magnet_id: leadMagnetId || null,
      product_type: productData?.type || 'lead_magnet',
      cover_template_id: coverTemplateId,
      cover_title: title,
      cover_subtitle: subtitle || null,
      title_size_percent: titleSize,
      subtitle_size_percent: subtitleSize,
      pdf_url: pdfUrl,
      cover_png_url: coverPngUrl
    }

    const { data: styledProduct, error: insertError } = await supabase
      .from('styled_products')
      .insert(styledProductData)
      .select()
      .single()

    if (insertError) {
      console.error(`⚠️ ${LOG_TAG} styled_products insert error:`, insertError)
      // Don't fail the whole request - PDF was generated successfully
    } else {
      console.log(`✅ ${LOG_TAG} Saved styled_product:`, styledProduct?.id)
    }

    // 10. Return success with URLs
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        pdfUrl,
        coverPngUrl,
        styledProductId: styledProduct?.id || null,
        message: 'PDF generated successfully'
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

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message })
  }
}
