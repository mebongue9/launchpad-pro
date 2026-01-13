// netlify/functions/visual-builder-generate.js
// Starts a PDF generation job and triggers background processing
// POST /api/visual-builder-generate
// RELEVANT FILES: visual-builder-generate-background.js, visual-builder-status.js

import { createClient } from '@supabase/supabase-js'

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

    // 1. Create a styled_products record to track the job
    console.log(`📝 ${LOG_TAG} Creating job record...`)
    const jobData = {
      funnel_id: funnelId || null,
      lead_magnet_id: leadMagnetId || null,
      product_type: productType || 'lead_magnet',
      cover_template_id: coverTemplateId,
      cover_title: title,
      cover_subtitle: subtitle || null,
      title_size_percent: titleSize,
      subtitle_size_percent: subtitleSize,
      pdf_url: null, // Will be set by background function
      cover_png_url: null
    }

    const { data: job, error: insertError } = await supabase
      .from('styled_products')
      .insert(jobData)
      .select()
      .single()

    if (insertError) {
      console.error(`❌ ${LOG_TAG} Failed to create job:`, insertError)
      return errorResponse(500, `Failed to create job: ${insertError.message}`)
    }

    const jobId = job.id
    console.log(`✅ ${LOG_TAG} Job created:`, jobId)

    // 2. Trigger the background function
    const backgroundPayload = {
      jobId,
      userId,
      funnelId,
      leadMagnetId,
      productType,
      coverTemplateId,
      title,
      titleSize,
      subtitle,
      subtitleSize,
      authorName,
      authorSize,
      handle: handleInput,
      handleSize
    }

    // Get the site URL for calling the background function
    const siteUrl = process.env.URL || 'https://launchpad-pro-app.netlify.app'
    const backgroundUrl = `${siteUrl}/.netlify/functions/visual-builder-generate-background`

    console.log(`🚀 ${LOG_TAG} Triggering background function...`)

    // Fire and forget - don't await the response
    fetch(backgroundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backgroundPayload)
    }).catch(err => {
      console.error(`⚠️ ${LOG_TAG} Background trigger error (non-fatal):`, err.message)
    })

    // 3. Return job ID immediately
    console.log(`✅ ${LOG_TAG} Returning job ID for polling`)
    return {
      statusCode: 202, // Accepted
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        jobId,
        status: 'processing',
        message: 'PDF generation started. Poll /api/visual-builder-status?jobId=xxx for status.'
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
