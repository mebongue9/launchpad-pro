// netlify/functions/visual-builder-generate.js
// Generates PDF from cover template + interior pages
// POST /api/visual-builder-generate
// RELEVANT FILES: src/pages/VisualBuilder.jsx, netlify/functions/lib/cover-renderer.js

import { createClient } from '@supabase/supabase-js'
import { renderCover } from './lib/cover-renderer.js'
import { renderInterior } from './lib/interior-renderer.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

    // 5. For now, return HTML (PDF generation requires puppeteer setup)
    // TODO: Add puppeteer-core + @sparticuz/chromium for actual PDF generation
    console.log(`✅ ${LOG_TAG} HTML generated successfully`)

    // Return the HTML for client-side PDF generation
    // Once puppeteer is configured, this will return actual PDF URLs
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        coverHtml,
        interiorHtml,
        message: 'HTML generated. Use client-side PDF generation for now.',
        // These will be populated once we add Supabase storage upload
        pdfUrl: null,
        coverPngUrl: null
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
