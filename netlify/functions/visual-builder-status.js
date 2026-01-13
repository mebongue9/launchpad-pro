// netlify/functions/visual-builder-status.js
// Check status of a PDF generation job
// GET /api/visual-builder-status?jobId=xxx
// RELEVANT FILES: visual-builder-generate.js, src/pages/VisualBuilder.jsx

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LOG_TAG = '[VISUAL-BUILDER-STATUS]'

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const jobId = event.queryStringParameters?.jobId

  if (!jobId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'jobId is required' })
    }
  }

  try {
    console.log(`🔍 ${LOG_TAG} Checking status for job:`, jobId)

    const { data, error } = await supabase
      .from('styled_products')
      .select('id, pdf_url, cover_png_url, updated_at')
      .eq('id', jobId)
      .single()

    if (error || !data) {
      console.error(`❌ ${LOG_TAG} Job not found:`, error)
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Job not found' })
      }
    }

    // Determine status based on pdf_url
    let status = 'processing'
    let pdfUrl = null
    let coverPngUrl = null
    let errorMessage = null

    if (data.pdf_url) {
      if (data.pdf_url.startsWith('error:')) {
        status = 'failed'
        errorMessage = data.pdf_url.replace('error:', '')
      } else {
        status = 'completed'
        pdfUrl = data.pdf_url
        coverPngUrl = data.cover_png_url
      }
    }

    console.log(`📊 ${LOG_TAG} Job ${jobId} status: ${status}`)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        status,
        pdfUrl,
        coverPngUrl,
        error: errorMessage
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
