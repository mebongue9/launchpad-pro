// netlify/functions/visual-builder-generate-background.js
// Background function for high-quality PDF generation (up to 15 min timeout)
// Returns immediately with job ID, processes in background
// RELEVANT FILES: visual-builder-status.js, src/pages/VisualBuilder.jsx

import { createClient } from '@supabase/supabase-js'
import { renderCover } from './lib/cover-renderer.js'
import { renderInterior } from './lib/interior-renderer.js'
import { renderPdf, renderPng, combineHtmlForPdf } from './lib/pdf-renderer.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LOG_TAG = '[VISUAL-BUILDER-BG]'
const STORAGE_BUCKET = 'visual-designs'

// Ensure storage bucket exists
async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some(b => b.id === STORAGE_BUCKET)

    if (!exists) {
      console.log(`📦 ${LOG_TAG} Creating storage bucket: ${STORAGE_BUCKET}`)
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
      })
    }
  } catch (err) {
    console.error(`⚠️ ${LOG_TAG} Bucket check error:`, err)
  }
}

export async function handler(event) {
  console.log(`🎨 ${LOG_TAG} Background function started`)

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const {
      jobId,
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

    console.log(`📥 ${LOG_TAG} Processing job:`, jobId)

    // Ensure bucket exists
    await ensureBucketExists()

    // 1. Load cover template
    console.log(`📄 ${LOG_TAG} Loading cover template...`)
    const { data: template, error: templateError } = await supabase
      .from('cover_templates')
      .select('*')
      .eq('id', coverTemplateId)
      .single()

    if (templateError || !template) {
      console.error(`❌ ${LOG_TAG} Template error:`, templateError)
      await updateJobStatus(jobId, 'failed', { error: 'Cover template not found' })
      return { statusCode: 200, body: 'Template not found' }
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
          profiles:profile_id (id, name, tagline, social_handle, photo_url, business_name, bio)
        `)
        .eq('id', leadMagnetId)
        .single()

      if (error) {
        console.error(`❌ ${LOG_TAG} Lead magnet error:`, error)
        await updateJobStatus(jobId, 'failed', { error: 'Lead magnet not found' })
        return { statusCode: 200, body: 'Lead magnet not found' }
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
          profiles:profile_id (id, name, tagline, social_handle, photo_url, business_name, bio)
        `)
        .eq('id', funnelId)
        .single()

      if (error) {
        console.error(`❌ ${LOG_TAG} Funnel error:`, error)
        await updateJobStatus(jobId, 'failed', { error: 'Funnel not found' })
        return { statusCode: 200, body: 'Funnel not found' }
      }

      const product = funnel[productType]
      if (!product) {
        await updateJobStatus(jobId, 'failed', { error: `Product ${productType} not found` })
        return { statusCode: 200, body: 'Product not found' }
      }

      productData = { type: productType, name: product.name, format: product.format }
      contentData = product.content || {}
      profileData = funnel.profiles
    }

    const year = new Date().getFullYear()
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

    // 6. Generate PDF using Puppeteer (this is the slow part)
    console.log(`📝 ${LOG_TAG} Generating PDF with Puppeteer...`)
    const pdfBuffer = await renderPdf(combinedHtml)
    console.log(`✅ ${LOG_TAG} PDF generated: ${pdfBuffer.length} bytes`)

    // 7. Generate cover PNG for preview
    console.log(`📸 ${LOG_TAG} Generating cover PNG...`)
    const pngBuffer = await renderPng(coverHtml)
    console.log(`✅ ${LOG_TAG} PNG generated: ${pngBuffer.length} bytes`)

    // 8. Upload to Supabase Storage
    const timestamp = Date.now()
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
    const pdfPath = `${userId || 'anonymous'}/${timestamp}-${safeTitle}.pdf`
    const pngPath = `${userId || 'anonymous'}/${timestamp}-${safeTitle}-cover.png`

    console.log(`☁️ ${LOG_TAG} Uploading PDF to Supabase storage...`)
    const { error: pdfUploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '31536000',
        upsert: true
      })

    if (pdfUploadError) {
      console.error(`❌ ${LOG_TAG} PDF upload error:`, pdfUploadError)
      await updateJobStatus(jobId, 'failed', { error: `Upload failed: ${pdfUploadError.message}` })
      return { statusCode: 200, body: 'Upload failed' }
    }

    console.log(`☁️ ${LOG_TAG} Uploading PNG to Supabase storage...`)
    const { error: pngUploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(pngPath, pngBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true
      })

    if (pngUploadError) {
      console.error(`⚠️ ${LOG_TAG} PNG upload error (non-fatal):`, pngUploadError)
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

    // 9. Update styled_products with completed status
    await updateJobStatus(jobId, 'completed', {
      pdf_url: pdfUrl,
      cover_png_url: coverPngUrl
    })

    console.log(`🎉 ${LOG_TAG} Job ${jobId} completed successfully!`)
    return { statusCode: 200, body: 'Success' }

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Fatal error:`, error)
    // Try to update job status if we have a jobId
    try {
      const body = JSON.parse(event.body || '{}')
      if (body.jobId) {
        await updateJobStatus(body.jobId, 'failed', { error: error.message })
      }
    } catch (e) {
      console.error(`❌ ${LOG_TAG} Could not update job status:`, e)
    }
    return { statusCode: 200, body: 'Error' }
  }
}

// Helper to update job status in styled_products table
async function updateJobStatus(jobId, status, data = {}) {
  console.log(`📝 ${LOG_TAG} Updating job ${jobId} to ${status}`)

  const updateData = {
    updated_at: new Date().toISOString()
  }

  if (status === 'completed') {
    updateData.pdf_url = data.pdf_url
    updateData.cover_png_url = data.cover_png_url
  } else if (status === 'failed') {
    // Store error in a way that can be retrieved
    updateData.pdf_url = `error:${data.error || 'Unknown error'}`
  }

  const { error } = await supabase
    .from('styled_products')
    .update(updateData)
    .eq('id', jobId)

  if (error) {
    console.error(`❌ ${LOG_TAG} Failed to update job status:`, error)
  }
}
