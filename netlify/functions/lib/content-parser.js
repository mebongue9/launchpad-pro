// netlify/functions/lib/content-parser.js
// Parses raw content into structured HTML with proper CSS classes
// RELEVANT FILES: interior-renderer.js, visual-builder-generate.js

/**
 * Simple markdown parser fallback (if marked library not available)
 * Handles **bold** and *italic* syntax
 */
function simpleMarkdownParse(text) {
  if (!text) return ''
  return text
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Bold: **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_ (but not inside bold)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
}

/**
 * Parse markdown to HTML
 * Uses marked library if available, falls back to simple parser
 */
export function parseMarkdown(text) {
  if (!text) return ''

  try {
    // Try to use marked library
    const { marked } = require('marked')
    // Configure marked for inline parsing only (no block elements)
    return marked.parseInline(text)
  } catch (e) {
    // Fallback to simple parser
    return simpleMarkdownParse(text)
  }
}

/**
 * Detect content structure patterns
 * Patterns handle optional markdown bold markers (**) around text
 */
const PATTERNS = {
  // Match **PHASE 1:** or PHASE 1: with optional bold markers
  PHASE_HEADER: /^\*{0,2}(PHASE\s+\d+):\*{0,2}\s*(.+)$/im,
  // Match **STEP 1.1:** or STEP 1.1: with optional bold markers
  STEP_HEADER: /^\*{0,2}(STEP\s+\d+\.\d+):\*{0,2}\s*(.+)$/im,
  WHAT_YOU_NEED: /^What you need:\s*(.+)$/im,
  EXPECTED_OUTCOME: /^Expected outcome:\s*(.+)$/im,
  BULLET_ARROW: /^→\s*(.+)$/m,
  BULLET_DOT: /^[•·]\s*(.+)$/m,
  CHAPTER_HEADER: /^(Chapter\s+\d+):\s*(.+)$/im,
}

/**
 * Strip markdown bold markers from text
 */
function stripMarkdown(text) {
  if (!text) return ''
  return text.replace(/^\*{1,2}|\*{1,2}$/g, '').trim()
}

/**
 * Parse a single content block and detect its type
 */
function detectBlockType(line) {
  const trimmed = line.trim()

  if (PATTERNS.PHASE_HEADER.test(trimmed)) {
    const match = trimmed.match(PATTERNS.PHASE_HEADER)
    return { type: 'phase', label: match[1], text: stripMarkdown(match[2]) }
  }

  if (PATTERNS.STEP_HEADER.test(trimmed)) {
    const match = trimmed.match(PATTERNS.STEP_HEADER)
    return { type: 'step', label: match[1], text: stripMarkdown(match[2]) }
  }

  if (PATTERNS.WHAT_YOU_NEED.test(trimmed)) {
    const match = trimmed.match(PATTERNS.WHAT_YOU_NEED)
    return { type: 'what_you_need', text: match[1] }
  }

  if (PATTERNS.EXPECTED_OUTCOME.test(trimmed)) {
    const match = trimmed.match(PATTERNS.EXPECTED_OUTCOME)
    return { type: 'expected_outcome', text: match[1] }
  }

  if (PATTERNS.BULLET_ARROW.test(trimmed)) {
    const match = trimmed.match(PATTERNS.BULLET_ARROW)
    return { type: 'bullet', text: match[1] }
  }

  if (PATTERNS.BULLET_DOT.test(trimmed)) {
    const match = trimmed.match(PATTERNS.BULLET_DOT)
    return { type: 'bullet', text: match[1] }
  }

  if (PATTERNS.CHAPTER_HEADER.test(trimmed)) {
    const match = trimmed.match(PATTERNS.CHAPTER_HEADER)
    return { type: 'chapter', label: match[1], text: match[2] }
  }

  // Default: body text
  if (trimmed.length > 0) {
    return { type: 'body', text: trimmed }
  }

  return { type: 'empty' }
}

/**
 * Parse content string into structured blocks
 */
export function parseContentStructure(content) {
  if (!content) return []

  // Split by lines, preserving paragraph breaks
  const lines = content.split('\n')
  const blocks = []
  let currentParagraph = []

  for (const line of lines) {
    const block = detectBlockType(line)

    if (block.type === 'empty') {
      // End of paragraph - flush accumulated body text
      if (currentParagraph.length > 0) {
        blocks.push({
          type: 'paragraph',
          text: currentParagraph.join(' ')
        })
        currentParagraph = []
      }
    } else if (block.type === 'body') {
      // Accumulate body text into paragraphs
      currentParagraph.push(block.text)
    } else {
      // Flush any accumulated paragraph first
      if (currentParagraph.length > 0) {
        blocks.push({
          type: 'paragraph',
          text: currentParagraph.join(' ')
        })
        currentParagraph = []
      }
      blocks.push(block)
    }
  }

  // Flush final paragraph
  if (currentParagraph.length > 0) {
    blocks.push({
      type: 'paragraph',
      text: currentParagraph.join(' ')
    })
  }

  return blocks
}

/**
 * Convert structured blocks to HTML with proper CSS classes
 */
export function blocksToHtml(blocks) {
  const html = []
  let inStep = false
  let stepMeta = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const parsedText = block.text ? parseMarkdown(block.text) : ''

    switch (block.type) {
      case 'phase':
        // Close any open step
        if (inStep) {
          if (stepMeta.length > 0) {
            html.push(`<div class="step-meta">${stepMeta.join('<br>')}</div>`)
            stepMeta = []
          }
          html.push('</div>') // close step-item
          inStep = false
        }
        html.push(`<div class="phase-header">${escapeHtml(block.label)}: ${parsedText}</div>`)
        break

      case 'step':
        // Close previous step if open
        if (inStep) {
          if (stepMeta.length > 0) {
            html.push(`<div class="step-meta">${stepMeta.join('<br>')}</div>`)
            stepMeta = []
          }
          html.push('</div>') // close step-item
        }
        html.push('<div class="step-item">')
        html.push(`<div class="step-title">${escapeHtml(block.label)}: ${parsedText}</div>`)
        inStep = true
        break

      case 'bullet':
        html.push(`<div class="step-bullet"><span class="bullet-arrow">→</span> ${parsedText}</div>`)
        break

      case 'what_you_need':
        stepMeta.push(`<strong>What you need:</strong> ${parsedText}`)
        break

      case 'expected_outcome':
        stepMeta.push(`<strong>Expected outcome:</strong> ${parsedText}`)
        break

      case 'paragraph':
        html.push(`<p class="body-text">${parsedText}</p>`)
        break

      case 'chapter':
        // Chapter headers are handled at page level, not inline
        break
    }
  }

  // Close any open step
  if (inStep) {
    if (stepMeta.length > 0) {
      html.push(`<div class="step-meta">${stepMeta.join('<br>')}</div>`)
    }
    html.push('</div>') // close step-item
  }

  return html.join('\n')
}

/**
 * Main function: Parse chapter content and return HTML
 */
export function parseChapterContent(content) {
  const blocks = parseContentStructure(content)
  return blocksToHtml(blocks)
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default {
  parseMarkdown,
  parseContentStructure,
  blocksToHtml,
  parseChapterContent
}
