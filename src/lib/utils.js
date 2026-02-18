// /src/lib/utils.js
// Helper utility functions used throughout the app
// Contains formatting, validation, common operations, and funnel text parsing (FIX 3)
// RELEVANT FILES: src/pages/FunnelBuilder.jsx, src/components/profiles/ProfileForm.jsx

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function truncate(str, length = 50) {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

// ============================================================================
// FUNNEL TEXT PARSER (FIX 3)
// Parses pasted funnel text into structured data
// Handles formats with or without emojis (💰 FRONT-END, BUMP, UPSELL 1, etc.)
// ============================================================================

// Known product formats
const KNOWN_FORMATS = [
  'Cheat Sheet', 'Checklist', 'Planner', 'Swipe File', 'Blueprint',
  'Worksheet', 'Template', 'Templates', 'Guide', 'Ebook', 'Video Course',
  'Course', 'Toolkit', 'Resource Kit', 'Workbook', 'Calendar', 'Script',
  'Scripts', 'Framework', 'Roadmap', 'Mini-Course', 'Masterclass'
]

// Product type mapping (handles variations)
const PRODUCT_TYPE_MAP = {
  'FRONT-END': 'front_end', 'FRONTEND': 'front_end', 'FRONT END': 'front_end', 'FE': 'front_end',
  'BUMP': 'bump', 'ORDER BUMP': 'bump',
  'UPSELL 1': 'upsell_1', 'UPSELL1': 'upsell_1', 'UPSELL ONE': 'upsell_1', 'US1': 'upsell_1',
  'UPSELL 2': 'upsell_2', 'UPSELL2': 'upsell_2', 'UPSELL TWO': 'upsell_2', 'US2': 'upsell_2',
  'LEAD MAGNET': 'lead_magnet', 'LEADMAGNET': 'lead_magnet', 'LEAD-MAGNET': 'lead_magnet',
  'LM': 'lead_magnet', 'FREEBIE': 'lead_magnet'
}

// Strip emojis from text
function stripEmojis(text) {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .trim()
}

// Extract price from text like "($17)" or "$17"
function extractPrice(text) {
  const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/i)
  if (priceMatch) return parseFloat(priceMatch[1])
  if (text.toLowerCase().includes('free')) return 0
  return null
}

// Extract format from product name
function extractFormat(text) {
  const lowerText = text.toLowerCase()
  for (const format of KNOWN_FORMATS) {
    if (lowerText.includes(format.toLowerCase())) return format
  }
  if (lowerText.includes('template')) return 'Templates'
  if (lowerText.includes('script')) return 'Scripts'
  if (lowerText.includes('email')) return 'Swipe File'
  return 'Digital Product'
}

// Get default price for product type (accepts optional overrides from app_settings)
export function getDefaultPrice(type, overrides = null) {
  if (overrides && overrides[type] != null) return overrides[type]
  const prices = { lead_magnet: 0, front_end: 9.99, bump: 6.99, upsell_1: 12.99, upsell_2: 19.99 }
  return prices[type] || 9.99
}

// Parse single line of funnel text
function parseFunnelLine(line, priceOverrides = null) {
  let cleanLine = stripEmojis(line).trim()
  if (!cleanLine) return null

  // Find product type
  let productType = null
  let restOfLine = cleanLine

  for (const [pattern, type] of Object.entries(PRODUCT_TYPE_MAP)) {
    const regex = new RegExp(`^${pattern}\\s*[:–-]\\s*`, 'i')
    if (regex.test(cleanLine)) {
      productType = type
      restOfLine = cleanLine.replace(regex, '').trim()
      break
    }
  }

  if (!productType) return null

  const price = extractPrice(restOfLine)
  let nameText = restOfLine
    .replace(/\s*\(\$[\d.]+\)\s*/g, '')
    .replace(/\s*\$[\d.]+\s*/g, '')
    .replace(/\s*\(FREE\)\s*/gi, '')
    .replace(/\s*FREE\s*/gi, '')
    .trim()

  const format = extractFormat(nameText)

  // Clean up name (remove format suffix)
  let name = nameText
  for (const fmt of KNOWN_FORMATS) {
    const fmtRegex = new RegExp(`\\s*[-–]\\s*${fmt}\\s*$`, 'i')
    name = name.replace(fmtRegex, '')
  }
  name = name.trim() || nameText

  return {
    type: productType,
    name,
    price: price !== null ? price : getDefaultPrice(productType, priceOverrides),
    format,
    description: `${format} - ${name}`
  }
}

/**
 * Main parser function - converts pasted text into funnel data structure
 * @param {string} text - The pasted funnel text
 * @param {object} [priceOverrides] - Optional price overrides from app_settings
 * @returns {object} Parsed funnel data with success flag
 */
export function parseFunnelText(text, priceOverrides = null) {
  if (!text || typeof text !== 'string') {
    return { success: false, error: 'No text provided' }
  }

  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return { success: false, error: 'No content found in pasted text' }
  }

  const parsed = {
    lead_magnet: null,
    front_end: null,
    bump: null,
    upsell_1: null,
    upsell_2: null
  }

  let foundProducts = 0
  for (const line of lines) {
    const result = parseFunnelLine(line, priceOverrides)
    if (result) {
      parsed[result.type] = {
        name: result.name,
        price: result.price,
        format: result.format,
        description: result.description
      }
      foundProducts++
    }
  }

  if (foundProducts === 0) {
    return {
      success: false,
      error: 'Could not parse any products. Format each line as:\nFRONT-END: Product Name - Format ($17)'
    }
  }

  if (!parsed.front_end) {
    return {
      success: false,
      error: 'Front-End product is required. Add a line like:\nFRONT-END: Your Product Name - Format ($17)'
    }
  }

  return {
    success: true,
    data: {
      funnel_name: `${parsed.front_end.name} Funnel`,
      ...parsed
    },
    summary: {
      productsFound: foundProducts,
      hasLeadMagnet: !!parsed.lead_magnet,
      hasFrontEnd: !!parsed.front_end,
      hasBump: !!parsed.bump,
      hasUpsell1: !!parsed.upsell_1,
      hasUpsell2: !!parsed.upsell_2
    }
  }
}

/**
 * Example paste format for user reference
 */
export function getExamplePasteFormat() {
  return `💰 FRONT-END: The Complete FB Group Lead Machine - Cheat Sheet ($9.99)
⚡ BUMP: 7 Welcome Sequences That Convert Cold Members - Checklist ($6.99)
🚀 UPSELL 1: Done-For-You FB Group Content Calendar - Planner ($12.99)
🚀 UPSELL 2: 30-Day Content Calendar + Captions - Swipe File ($19.99)`
}

/**
 * Check if text looks like funnel format
 */
export function looksLikeFunnelFormat(text) {
  if (!text) return false
  const lowerText = text.toLowerCase()
  const hasProductType = lowerText.includes('front-end') || lowerText.includes('frontend') ||
                         lowerText.includes('bump') || lowerText.includes('upsell')
  const hasPrice = /\$\d+/.test(text)
  return hasProductType && hasPrice
}
