// netlify/functions/visual-builder-generate.js
// Generates high-quality PDF using DocRaptor API (PrinceXML engine)
// POST /api/visual-builder-generate
// RELEVANT FILES: lib/cover-renderer.js, lib/interior-renderer.js

import { createClient } from '@supabase/supabase-js'
import { renderCover } from './lib/cover-renderer.js'
import { renderInterior } from './lib/interior-renderer.js'

const LOG_TAG = '[VISUAL-BUILDER-GENERATE]'

// Create supabase client lazily to ensure env vars are available
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Timeout helper - Netlify free tier has 10s limit, we use 9s to return graceful error
const FUNCTION_TIMEOUT = 9000

function withTimeout(promise, ms, operation) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
    )
  ])
}

export async function handler(event) {
  const startTime = Date.now()
  console.log(`${LOG_TAG} Function invoked at ${new Date().toISOString()}`)

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
      profileId,
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

    console.log(`${LOG_TAG} Request:`, { funnelId, leadMagnetId, productType, coverTemplateId })
    console.log(`${LOG_TAG} Parse complete at +${Date.now() - startTime}ms`)

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

    // Get supabase client (lazy initialization)
    const supabase = getSupabase()
    console.log(`${LOG_TAG} Supabase client created at +${Date.now() - startTime}ms`)

    // 1. Load cover template
    console.log(`${LOG_TAG} Loading cover template...`)
    const { data: template, error: templateError } = await withTimeout(
      supabase
        .from('cover_templates')
        .select('*')
        .eq('id', coverTemplateId)
        .single(),
      3000,
      'Template query'
    )
    console.log(`${LOG_TAG} Template loaded at +${Date.now() - startTime}ms`)

    if (templateError || !template) {
      console.error(`${LOG_TAG} Template error:`, templateError)
      return errorResponse(404, 'Cover template not found')
    }

    // 2. Load content based on product type
    console.log(`${LOG_TAG} Loading content...`)
    let content = null
    if (funnelId) {
      // Funnel products are stored in JSONB columns: front_end, bump, upsell_1, upsell_2
      const { data: funnel } = await withTimeout(
        supabase
          .from('funnels')
          .select('front_end, bump, upsell_1, upsell_2, user_id')
          .eq('id', funnelId)
          .single(),
        3000,
        'Funnel query'
      )
      // Get content from the specific product JSONB column
      if (funnel && productType) {
        const productData = funnel[productType]
        if (productData) {
          content = productData // Already an object with chapters array
          console.log(`${LOG_TAG} Found ${productType} content with ${productData.chapters?.length || 0} chapters`)
        }
      }

      // Safety net: ensure paid products have a clickable cross-promo link
      if (content?.chapters?.length > 0 && productType !== 'lead_magnet') {
        const lastChapter = content.chapters[content.chapters.length - 1]
        const hasLink = /\[.*?\]\(https?:\/\/.*?\)/.test(lastChapter.content || '')
        if (!hasLink && funnel?.user_id) {
          // Fetch main product URL from existing_products
          const { data: mainProduct } = await withTimeout(
            supabase
              .from('existing_products')
              .select('name, url')
              .eq('user_id', funnel.user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single(),
            2000,
            'Main product URL query'
          )
          if (mainProduct?.url) {
            const linkText = mainProduct.name
              ? `\n\n---\n\nIf you enjoyed this guide, you'll love what comes next.\n\n[Learn more about ${mainProduct.name}](${mainProduct.url})`
              : `\n\n---\n\nReady for the next step?\n\n[Learn more](${mainProduct.url})`
            lastChapter.content = (lastChapter.content || '') + linkText
            console.log(`${LOG_TAG} Injected main product URL into ${productType} cross-promo: ${mainProduct.url}`)
          }
        }
      }
    } else if (leadMagnetId) {
      // Lead magnet content is stored in 'content' column as JSON string
      const { data: leadMagnet } = await withTimeout(
        supabase
          .from('lead_magnets')
          .select('content, funnel_id')
          .eq('id', leadMagnetId)
          .single(),
        3000,
        'Lead magnet query'
      )
      if (leadMagnet?.content) {
        // Parse JSON string to object
        try {
          content = typeof leadMagnet.content === 'string'
            ? JSON.parse(leadMagnet.content)
            : leadMagnet.content
          console.log(`${LOG_TAG} Found lead magnet content with ${content.chapters?.length || 0} chapters`)
        } catch (parseError) {
          console.error(`${LOG_TAG} Failed to parse lead magnet content:`, parseError)
        }
      }

      // Ensure lead magnet bridge section has a clickable link to Front-End product
      // The front_end_link is stored on the funnel record, not the lead magnet
      if (content?.chapters?.length > 0) {
        const lastChapter = content.chapters[content.chapters.length - 1]
        const hasLink = /\[.*?\]\(https?:\/\/.*?\)/.test(lastChapter.content || '')
        if (!hasLink) {
          // Fetch front_end_link and front-end product name from the funnel
          const lmFunnelId = leadMagnet?.funnel_id || funnelId
          if (lmFunnelId) {
            const { data: lmFunnel } = await withTimeout(
              supabase
                .from('funnels')
                .select('front_end_link, front_end')
                .eq('id', lmFunnelId)
                .single(),
              2000,
              'Lead magnet funnel link query'
            )
            const feLink = lmFunnel?.front_end_link
            const feName = lmFunnel?.front_end?.name
            if (feLink) {
              const linkText = feName
                ? `\n\n---\n\nIf you enjoyed this guide, you'll love what comes next.\n\n[Learn more about ${feName}](${feLink})`
                : `\n\n---\n\nReady for the next step?\n\n[Get started here](${feLink})`
              lastChapter.content = (lastChapter.content || '') + linkText
              console.log(`${LOG_TAG} Injected front_end_link into lead magnet bridge: ${feLink}`)
            }
          }
        }
      }
    }
    console.log(`${LOG_TAG} Content loaded at +${Date.now() - startTime}ms`)

    // 3. Load user profile for interior pages
    // Schema: profiles.id = profile UUID, profiles.user_id = auth user UUID
    // If profileId provided: query by profiles.id
    // If only userId provided: query by profiles.user_id
    console.log(`${LOG_TAG} Loading profile for profileId: ${profileId}, userId: ${userId}`)
    let profile = null
    if (profileId) {
      // Query by profile's primary key
      const { data: profileData, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('name, social_handle, photo_url, logo_url, tagline, niche, promo_image_url, promo_image_link, promo_image_cta')
          .eq('id', profileId)
          .single(),
        2000,
        'Profile query by id'
      )
      if (profileError) {
        console.error(`${LOG_TAG} Profile query by id error:`, profileError)
      }
      profile = profileData
    } else if (userId) {
      // Query by auth user's ID (stored in user_id column)
      const { data: profileData, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('name, social_handle, photo_url, logo_url, tagline, niche, promo_image_url, promo_image_link, promo_image_cta')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        2000,
        'Profile query by user_id'
      )
      if (profileError) {
        console.error(`${LOG_TAG} Profile query by user_id error:`, profileError)
      }
      profile = profileData
    } else {
      console.warn(`${LOG_TAG} No profileId or userId provided - profile data will use defaults`)
    }

    if (profile) {
      console.log(`${LOG_TAG} Profile loaded:`, JSON.stringify({
        name: profile.name || '(not set)',
        social_handle: profile.social_handle || '(not set)',
        photo_url: profile.photo_url ? '(set)' : '(not set)',
        tagline: profile.tagline || '(not set)',
        niche: profile.niche || '(not set)'
      }))
    } else {
      console.warn(`${LOG_TAG} No profile found`)
    }
    console.log(`${LOG_TAG} Profile loaded at +${Date.now() - startTime}ms`)

    // 4. Render HTML
    console.log(`${LOG_TAG} Rendering HTML...`)
    console.log(`${LOG_TAG} Content structure: ${content?.chapters?.length || 0} chapters`)
    if (content?.chapters?.[0]) {
      console.log(`${LOG_TAG} First chapter title: ${content.chapters[0].title || '(no title)'}`)
      console.log(`${LOG_TAG} First chapter content length: ${content.chapters[0].content?.length || 0} chars`)
    }
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

    // Build running header and footer HTML for DocRaptor/PrinceXML
    const runningHeaderHtml = buildRunningHeader(template)
    const runningFooterHtml = buildRunningFooter(template, profile)

    // Combine cover and interior into single document
    const combinedHtml = combineDocuments(coverHtml, interiorHtml, runningHeaderHtml, runningFooterHtml)
    console.log(`${LOG_TAG} HTML rendered at +${Date.now() - startTime}ms (${combinedHtml.length} chars)`)

    // Check remaining time before calling DocRaptor
    const elapsed = Date.now() - startTime
    if (elapsed > 7000) {
      console.error(`${LOG_TAG} Not enough time for DocRaptor, elapsed: ${elapsed}ms`)
      return errorResponse(504, `Function timeout - data loading took ${elapsed}ms. Try again.`)
    }

    // 5. Call DocRaptor API
    console.log(`${LOG_TAG} Calling DocRaptor API...`)
    const pdfBuffer = await generatePdfWithDocRaptor(combinedHtml, startTime)

    if (!pdfBuffer) {
      return errorResponse(500, 'Failed to generate PDF')
    }

    console.log(`${LOG_TAG} PDF generated at +${Date.now() - startTime}ms, size: ${pdfBuffer.length} bytes`)

    // 6. Upload to Supabase Storage
    console.log(`${LOG_TAG} Uploading to storage...`)
    const fileName = `visual-builder/${funnelId || leadMagnetId}/${Date.now()}-styled.pdf`

    const { error: uploadError } = await withTimeout(
      supabase.storage
        .from('generated-pdfs')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        }),
      5000,
      'Storage upload'
    )

    if (uploadError) {
      console.error(`${LOG_TAG} Upload error:`, uploadError)
      return errorResponse(500, `Failed to upload PDF: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-pdfs')
      .getPublicUrl(fileName)

    const pdfUrl = urlData.publicUrl
    console.log(`${LOG_TAG} PDF uploaded at +${Date.now() - startTime}ms:`, pdfUrl)

    // 7. Create/update styled_products record (non-blocking, don't wait)
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

    // Fire and forget - don't wait for this
    supabase
      .from('styled_products')
      .insert(styledProductData)
      .then(({ error: insertError }) => {
        if (insertError) {
          console.error(`${LOG_TAG} styled_products insert error (non-fatal):`, insertError)
        }
      })

    // 8. Return success with PDF URL
    console.log(`${LOG_TAG} Complete at +${Date.now() - startTime}ms!`)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        pdfUrl,
        styledProductId: null // Will be created async
      })
    }

  } catch (error) {
    console.error(`${LOG_TAG} Error at +${Date.now() - startTime}ms:`, error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    }
  }
}

/**
 * Build running header HTML for PrinceXML (accent color bar at top of every page)
 * Placed at top of <body>, flow: static(header-flow) pulls it into @page @top margin box
 */
function buildRunningHeader(template) {
  const headerGradient = template.is_gradient
    ? `linear-gradient(90deg, ${template.secondary_color} 0%, ${template.primary_color} 50%, ${template.tertiary_color} 100%)`
    : template.primary_color

  return `<div class="running-header">
  <div style="height: 6px; background: ${headerGradient}; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
</div>`
}

/**
 * Build running footer HTML for PrinceXML (accent line + photo + handle)
 * Placed at top of <body>, flow: static(footer-flow) pulls it into @page @bottom margin box
 * Page number is handled separately via @bottom-right { content: counter(page) } in CSS
 */
function buildRunningFooter(template, profile) {
  const primaryColor = template.primary_color || '#333'
  const photoUrl = profile?.photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ddd"/%3E%3C/svg%3E'
  const handle = profile?.social_handle ? `@${profile.social_handle}` : ''

  return `<div class="running-footer">
  <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 2px solid ${primaryColor}; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <img src="${photoUrl}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid ${primaryColor};" alt="" />
      <span style="font-family: 'Inter', sans-serif; font-size: 8pt; color: #888;">${handle}</span>
    </div>
    <span class="page-num" style="font-family: 'Inter', sans-serif; font-size: 9pt; color: #666; font-weight: 600;"></span>
  </div>
</div>`
}

/**
 * Combine cover and interior HTML into single multi-page document for DocRaptor
 * Running header/footer HTML placed at top of body (PrinceXML requirement)
 */
function combineDocuments(coverHtml, interiorHtml, runningHeaderHtml, runningFooterHtml) {
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

  // Extract font links from both cover and interior
  const coverFontMatch = coverHtml.match(/<link href="([^"]+)" rel="stylesheet">/)
  const coverFontLink = coverFontMatch ? coverFontMatch[1] : ''
  const interiorFontMatch = interiorHtml.match(/<link href="([^"]+)" rel="stylesheet">/)
  const interiorFontLink = interiorFontMatch ? interiorFontMatch[1] : ''

  // Build font link tags (deduplicate if same)
  let fontLinks = ''
  if (coverFontLink) fontLinks += `<link href="${coverFontLink}" rel="stylesheet">\n  `
  if (interiorFontLink && interiorFontLink !== coverFontLink) fontLinks += `<link href="${interiorFontLink}" rel="stylesheet">\n  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontLinks}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover-page {
      page: cover-page;
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
      background: white;
    }
    /* Force inner template container to also clip content */
    .cover-page > .cover {
      overflow: hidden !important;
      max-height: 100% !important;
      height: 100% !important;
    }
    ${coverStyles}
    ${interiorStyles}
  </style>
</head>
<body>
  ${runningHeaderHtml}
  ${runningFooterHtml}
  <div class="cover-page">
    ${coverBody}
  </div>
  <div class="content-start">
    ${interiorBody}
  </div>
</body>
</html>`
}

/**
 * Generate PDF using DocRaptor API (PrinceXML engine)
 */
async function generatePdfWithDocRaptor(html, startTime) {
  const apiKey = process.env.DOCRAPTOR_API_KEY

  if (!apiKey) {
    console.error(`${LOG_TAG} DOCRAPTOR_API_KEY not configured`)
    throw new Error('DOCRAPTOR_API_KEY environment variable not set')
  }

  // Always use production mode — test mode adds an unusable "TEST DOCUMENT" watermark
  console.log(`${LOG_TAG} DocRaptor API key found, production mode`)
  console.log(`${LOG_TAG} Sending ${html.length} chars to DocRaptor at +${Date.now() - startTime}ms`)

  const response = await fetch('https://api.docraptor.com/docs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_credentials: apiKey,
      doc: {
        test: false,
        document_type: 'pdf',
        document_content: html,
        javascript: false,
        prince_options: {
          media: 'print',
        },
      },
    }),
  })

  console.log(`${LOG_TAG} DocRaptor response status: ${response.status} at +${Date.now() - startTime}ms`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`${LOG_TAG} DocRaptor error:`, response.status, errorText)

    if (response.status === 422) {
      throw new Error(`PDF generation failed: Invalid HTML/CSS. Details: ${errorText}`)
    } else if (response.status === 401) {
      throw new Error('PDF generation failed: Invalid API key')
    } else if (response.status === 429) {
      throw new Error('PDF generation failed: Rate limited. Try again shortly.')
    }
    throw new Error(`DocRaptor API error: ${response.status} - ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const pageCount = response.headers.get('X-DocRaptor-Num-Pages')
  console.log(`${LOG_TAG} DocRaptor returned ${arrayBuffer.byteLength} bytes, ${pageCount || '?'} pages at +${Date.now() - startTime}ms`)
  return Buffer.from(arrayBuffer)
}

function errorResponse(statusCode, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message })
  }
}
