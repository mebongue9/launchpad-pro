// netlify/functions/lib/pdf-renderer.js
// High-quality PDF generation using Puppeteer + Chromium
// RELEVANT FILES: netlify/functions/visual-builder-generate.js

import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const LOG_TAG = '[PDF-RENDERER]'

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH = 794   // 210mm
const A4_HEIGHT = 1123 // 297mm

/**
 * Initialize Puppeteer browser with Chromium
 * Optimized for serverless environment (Netlify Functions)
 */
async function getBrowser() {
  console.log(`🚀 ${LOG_TAG} Launching browser...`)

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: {
      width: A4_WIDTH,
      height: A4_HEIGHT,
      deviceScaleFactor: 2 // 2x for high-quality rendering
    },
    executablePath: await chromium.executablePath(),
    headless: chromium.headless
  })

  console.log(`✅ ${LOG_TAG} Browser launched`)
  return browser
}

/**
 * Render HTML to high-quality PDF
 * @param {string} html - Complete HTML document
 * @param {Object} options - PDF options
 * @returns {Promise<Buffer>} PDF as Buffer
 */
export async function renderPdf(html, options = {}) {
  const {
    format = 'A4',
    landscape = false,
    printBackground = true,
    margin = { top: '0', right: '0', bottom: '0', left: '0' }
  } = options

  let browser = null

  try {
    browser = await getBrowser()
    const page = await browser.newPage()

    // Set content with wait for fonts and images
    console.log(`📄 ${LOG_TAG} Setting page content...`)
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    })

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready)

    // Small delay to ensure complete rendering
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate PDF
    console.log(`📝 ${LOG_TAG} Generating PDF...`)
    const pdfBuffer = await page.pdf({
      format,
      landscape,
      printBackground,
      margin,
      preferCSSPageSize: true
    })

    console.log(`✅ ${LOG_TAG} PDF generated: ${pdfBuffer.length} bytes`)
    return pdfBuffer

  } finally {
    if (browser) {
      await browser.close()
      console.log(`🔒 ${LOG_TAG} Browser closed`)
    }
  }
}

/**
 * Render HTML to high-quality PNG screenshot
 * @param {string} html - Complete HTML document
 * @param {Object} options - Screenshot options
 * @returns {Promise<Buffer>} PNG as Buffer
 */
export async function renderPng(html, options = {}) {
  const {
    width = A4_WIDTH,
    height = A4_HEIGHT,
    deviceScaleFactor = 2,
    fullPage = false
  } = options

  let browser = null

  try {
    browser = await getBrowser()
    const page = await browser.newPage()

    // Override viewport for screenshot
    await page.setViewport({
      width,
      height,
      deviceScaleFactor
    })

    // Set content with wait for fonts and images
    console.log(`📄 ${LOG_TAG} Setting page content for PNG...`)
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    })

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready)

    // Small delay to ensure complete rendering
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate PNG
    console.log(`📸 ${LOG_TAG} Taking screenshot...`)
    const pngBuffer = await page.screenshot({
      type: 'png',
      fullPage,
      omitBackground: false
    })

    console.log(`✅ ${LOG_TAG} PNG generated: ${pngBuffer.length} bytes`)
    return pngBuffer

  } finally {
    if (browser) {
      await browser.close()
      console.log(`🔒 ${LOG_TAG} Browser closed`)
    }
  }
}

/**
 * Combine cover and interior HTML into single document for PDF
 * @param {string} coverHtml - Cover page HTML
 * @param {string} interiorHtml - Interior pages HTML
 * @returns {string} Combined HTML document
 */
export function combineHtmlForPdf(coverHtml, interiorHtml) {
  // Extract body content from cover
  const coverBodyMatch = coverHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const coverBody = coverBodyMatch ? coverBodyMatch[1] : coverHtml

  // Extract body content from interior
  const interiorBodyMatch = interiorHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const interiorBody = interiorBodyMatch ? interiorBodyMatch[1] : interiorHtml

  // Extract styles from both
  const coverStyleMatch = coverHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
  const interiorStyleMatch = interiorHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []

  // Extract font links
  const coverFontMatch = coverHtml.match(/<link[^>]*fonts\.googleapis[^>]*>/gi) || []
  const interiorFontMatch = interiorHtml.match(/<link[^>]*fonts\.googleapis[^>]*>/gi) || []

  // Combine unique font links
  const allFonts = [...new Set([...coverFontMatch, ...interiorFontMatch])]

  // Build combined document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${allFonts.join('\n  ')}
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
    }
  </style>
  ${coverStyleMatch.join('\n')}
  ${interiorStyleMatch.join('\n')}
</head>
<body>
  <div class="cover-page">
    ${coverBody}
  </div>
  ${interiorBody}
</body>
</html>`
}

export default {
  renderPdf,
  renderPng,
  combineHtmlForPdf
}
