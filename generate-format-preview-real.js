// Generate HTML previews using EXISTING format templates with REAL funnel data
// This uses the templates from src/templates/formats/ - NOT custom CSS
// Run: node generate-format-preview-real.js

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Import the existing format templates
// Note: These are JSX files but we'll extract the generateHTML functions
// For now we'll read them and extract the HTML generation logic

// Load env vars
const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

// Funnel IDs from task
const FUNNEL_1 = '66670305-6854-4b78-ab72-7d9167bfa808' // Small Audience Profit Pipeline
const FUNNEL_2 = '04a65423-db27-4d63-aba8-f8d917f2f99e' // Small Audience Revenue Accelerator

async function main() {
  console.log('=== GENERATING FORMAT PREVIEWS USING EXISTING TEMPLATES ===\n')

  // Create outputs directory
  const outputDir = path.join(process.cwd(), 'outputs')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  // Fetch funnel products - content is in funnels.{slot}.chapters
  console.log('1. Fetching funnels with content...')

  const { data: funnel1 } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', FUNNEL_1)
    .single()

  const { data: funnel2 } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', FUNNEL_2)
    .single()

  // Extract products from funnels - content is in the chapters field
  const allProducts = []
  const slots = ['front_end', 'bump', 'upsell_1', 'upsell_2', 'upsell_3']

  for (const funnel of [funnel1, funnel2]) {
    if (!funnel) continue
    console.log(`\n   Funnel: ${funnel.name}`)

    for (const slot of slots) {
      const product = funnel[slot]
      if (product && product.chapters && product.chapters.length > 0) {
        console.log(`   - ${slot}: ${product.name} (${product.format}) - ${product.chapters.length} chapters`)
        allProducts.push({
          ...product,
          slot,
          funnelName: funnel.name,
          // Content is in chapters, restructure for template compatibility
          content: { chapters: product.chapters }
        })
      }
    }
  }

  // Group by format to get one of each
  const formatMap = {}
  for (const product of allProducts) {
    const format = (product.format || '').toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-')
    if (!formatMap[format]) {
      formatMap[format] = product
    }
  }

  console.log(`\n   Unique formats with content: ${Object.keys(formatMap).join(', ')}`)

  // 3. Fetch profile and cover template for styling
  console.log('\n3. Fetching profile and cover template...')
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: coverTemplate } = await supabase
    .from('cover_templates')
    .select('*')
    .limit(1)
    .single()

  const style = {
    fontFamily: coverTemplate?.font_family || 'Inter, sans-serif',
    primaryColor: coverTemplate?.primary_color || '#3b82f6',
    backgroundColor: '#ffffff'
  }

  console.log(`   Profile: ${profile?.name}`)
  console.log(`   Primary Color: ${style.primaryColor}`)

  // 4. Generate previews for each format
  console.log('\n4. Generating format previews...\n')

  // Process each unique format
  for (const [format, product] of Object.entries(formatMap)) {
    console.log(`=== Processing: ${product.name} ===`)
    console.log(`   Format: ${format}`)
    console.log(`   From: ${product.funnelName} (${product.slot})`)

    // Content is already structured with chapters
    let content = product.content
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch (e) {
        console.log(`   Raw text content, will parse...`)
        content = { rawText: product.content }
      }
    }

    console.log(`   Content type: ${typeof content}`)
    if (content?.chapters) console.log(`   Chapters: ${content.chapters.length}`)
    if (content?.templates) console.log(`   Templates: ${content.templates.length}`)

    // Parse raw content into structured format for each template
    let structuredContent
    let templateHtml

    switch (format) {
      case 'swipe-file':
      case 'swipe_file':
        structuredContent = parseSwipeFileContent(content, product.name)
        templateHtml = generateSwipeFileHTML(structuredContent, style)
        break

      case 'planner':
        structuredContent = parsePlannerContent(content, product.name)
        templateHtml = generatePlannerHTML(structuredContent, style)
        break

      case 'blueprint':
        structuredContent = parseBlueprintContent(content, product.name)
        templateHtml = generateBlueprintHTML(structuredContent, style)
        break

      case 'cheat-sheet':
      case 'cheat_sheet':
        structuredContent = parseCheatSheetContent(content, product.name)
        templateHtml = generateCheatSheetHTML(structuredContent, style)
        break

      case 'checklist':
        structuredContent = parseChecklistContent(content, product.name)
        templateHtml = generateChecklistHTML(structuredContent, style)
        break

      case 'worksheet':
        structuredContent = parseWorksheetContent(content, product.name)
        templateHtml = generateWorksheetHTML(structuredContent, style)
        break

      default:
        console.log(`   Unknown format: ${format}, skipping...`)
        continue
    }

    // Wrap in full HTML document with print-friendly styles
    const fullHtml = wrapInDocument(templateHtml, product.name, style, profile)

    // Save file
    const filename = `preview-${format}-real-data.html`
    const filepath = path.join(outputDir, filename)
    fs.writeFileSync(filepath, fullHtml)
    console.log(`   Saved: outputs/${filename}\n`)
  }

  console.log('=== DONE ===')
}

// ============================================
// CONTENT PARSERS (raw text -> structured)
// ============================================

function parseSwipeFileContent(content, title) {
  // Extract templates from raw content
  const templates = []

  if (content.templates) {
    // Already structured
    return { title, templates: content.templates }
  }

  if (content.chapters) {
    // Convert chapters to templates
    for (const chapter of content.chapters) {
      templates.push({
        title: chapter.title,
        category: 'Template',
        content: chapter.content
      })
    }
    return { title, templates }
  }

  // Parse raw text for templates
  const rawText = content.rawText || JSON.stringify(content)
  const templateBlocks = rawText.split(/(?=Template\s*#?\d+:|Script\s*#?\d+:)/i)

  templateBlocks.forEach((block, i) => {
    if (block.trim()) {
      const titleMatch = block.match(/^(Template|Script)\s*#?(\d+):\s*(.+?)(?:\n|$)/i)
      templates.push({
        title: titleMatch ? titleMatch[3].trim() : `Template ${i + 1}`,
        category: 'Swipe Template',
        content: titleMatch ? block.replace(titleMatch[0], '').trim() : block.trim()
      })
    }
  })

  return { title, templates: templates.length > 0 ? templates : [{ title: 'Template 1', content: rawText }] }
}

function parsePlannerContent(content, title) {
  const days = []

  if (content.days) {
    return { title, days: content.days, columns: content.columns || 2 }
  }

  if (content.chapters) {
    for (const chapter of content.chapters) {
      days.push({ label: chapter.title })
    }
    return { title, days, columns: Math.min(days.length, 3) }
  }

  // Default 7-day planner
  return {
    title,
    days: [
      { label: 'Day 1' },
      { label: 'Day 2' },
      { label: 'Day 3' },
      { label: 'Day 4' },
      { label: 'Day 5' },
      { label: 'Day 6' },
      { label: 'Day 7' }
    ],
    columns: 2
  }
}

function parseBlueprintContent(content, title) {
  const steps = []

  if (content.steps) {
    return { title, steps: content.steps }
  }

  if (content.chapters) {
    for (const chapter of content.chapters) {
      // Parse chapter content for phases/steps
      const chapterSteps = parseStepsFromText(chapter.content)
      if (chapterSteps.length > 0) {
        steps.push(...chapterSteps)
      } else {
        steps.push({
          title: chapter.title,
          description: chapter.content?.substring(0, 200) || '',
          tips: ''
        })
      }
    }
    return { title, subtitle: content.subtitle || '', steps }
  }

  return { title, steps: [{ title: 'Step 1', description: 'Content not available' }] }
}

function parseStepsFromText(text) {
  if (!text) return []

  const steps = []
  const stepMatches = text.matchAll(/(?:STEP|Step)\s*(\d+(?:\.\d+)?):?\s*(.+?)(?=(?:STEP|Step)\s*\d|$)/gis)

  for (const match of stepMatches) {
    const [_, number, content] = match
    const lines = content.trim().split('\n')
    const title = lines[0]?.trim() || `Step ${number}`
    const description = lines.slice(1).join('\n').trim()

    steps.push({
      title: title.replace(/^\*+|\*+$/g, ''), // Remove markdown bold
      description: description.substring(0, 300),
      tips: ''
    })
  }

  return steps
}

function parseCheatSheetContent(content, title) {
  const sections = []

  if (content.sections) {
    return { title, sections: content.sections, columns: content.columns || 2 }
  }

  if (content.chapters) {
    for (const chapter of content.chapters) {
      // Parse bullets from chapter content
      const items = parseBulletsFromText(chapter.content)
      sections.push({
        title: chapter.title,
        items: items.length > 0 ? items : ['Key point from this section']
      })
    }
    return { title, sections, columns: Math.min(sections.length, 2) }
  }

  return {
    title,
    sections: [{ title: 'Quick Reference', items: ['Content available in full document'] }],
    columns: 2
  }
}

function parseBulletsFromText(text) {
  if (!text) return []

  const items = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    // Match bullet points: →, •, -, *
    const bulletMatch = trimmed.match(/^[→•·\-\*]\s*(.+)$/)
    if (bulletMatch) {
      items.push(bulletMatch[1].replace(/^\*+|\*+$/g, '')) // Remove markdown bold
    }
  }

  return items
}

function parseChecklistContent(content, title) {
  const items = []

  if (content.items) {
    return { title, items: content.items }
  }

  if (content.chapters) {
    for (const chapter of content.chapters) {
      // Each chapter becomes a checklist item
      items.push({
        text: chapter.title,
        note: ''
      })
      // Also parse bullets within chapters
      const bullets = parseBulletsFromText(chapter.content)
      for (const bullet of bullets) {
        items.push({ text: bullet, note: '' })
      }
    }
    return { title, items }
  }

  return { title, items: [{ text: 'Action item 1', note: '' }] }
}

function parseWorksheetContent(content, title) {
  const sections = []

  if (content.sections) {
    return { title, sections: content.sections }
  }

  if (content.chapters) {
    for (const chapter of content.chapters) {
      sections.push({
        title: chapter.title,
        prompt: 'Write your thoughts below:',
        lines: 4
      })
    }
    return { title, sections }
  }

  return {
    title,
    sections: [{ title: 'Reflection', prompt: 'Write your thoughts:', lines: 6 }]
  }
}

// ============================================
// EXISTING TEMPLATE HTML GENERATORS
// (Copied from src/templates/formats/*.jsx)
// ============================================

function generateSwipeFileHTML(content, style) {
  const templates = content.templates || []
  const { fontFamily, primaryColor, backgroundColor } = style

  return `
    <div class="swipe-file-page" style="
      font-family: ${fontFamily || 'system-ui, sans-serif'};
      background: ${backgroundColor || '#ffffff'};
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    ">
      <h1 style="
        color: ${primaryColor || '#1a1a1a'};
        font-size: 28px;
        margin-bottom: 8px;
      ">${escapeHtml(content.title) || 'Swipe File'}</h1>

      ${content.subtitle ? `
        <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
          ${escapeHtml(content.subtitle)}
        </p>
      ` : ''}

      <div class="templates" style="display: flex; flex-direction: column; gap: 24px;">
        ${templates.map((template, i) => `
          <div class="template-card" style="
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          ">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px 20px;
              background: linear-gradient(90deg, ${primaryColor || '#3b82f6'}10, transparent);
              border-bottom: 1px solid #e5e7eb;
            ">
              <div>
                <span style="
                  font-size: 12px;
                  color: ${primaryColor || '#3b82f6'};
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                ">Template #${i + 1}</span>
                <h3 style="
                  font-size: 16px;
                  font-weight: 600;
                  color: #1a1a1a;
                  margin-top: 4px;
                ">${escapeHtml(template.title) || `Template ${i + 1}`}</h3>
              </div>
            </div>
            <div style="padding: 20px;">
              ${template.category ? `
                <span style="
                  display: inline-block;
                  padding: 4px 8px;
                  background: #f3f4f6;
                  color: #6b7280;
                  font-size: 12px;
                  border-radius: 4px;
                  margin-bottom: 12px;
                ">${escapeHtml(template.category)}</span>
              ` : ''}
              <div style="
                background: #f9fafb;
                border-radius: 8px;
                padding: 16px;
                font-size: 14px;
                line-height: 1.6;
                color: #374151;
                white-space: pre-wrap;
              ">${escapeHtml(template.content || template.text)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function generatePlannerHTML(content, style) {
  const days = content.days || []
  const { fontFamily, primaryColor, backgroundColor } = style

  return `
    <div class="planner-page" style="
      font-family: ${fontFamily || 'system-ui, sans-serif'};
      background: ${backgroundColor || '#ffffff'};
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    ">
      <h1 style="
        color: ${primaryColor || '#1a1a1a'};
        font-size: 28px;
        margin-bottom: 8px;
      ">${escapeHtml(content.title) || 'Weekly Planner'}</h1>

      ${content.subtitle ? `
        <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
          ${escapeHtml(content.subtitle)}
        </p>
      ` : ''}

      <div class="planner-grid" style="
        display: grid;
        grid-template-columns: repeat(${content.columns || 2}, 1fr);
        gap: 16px;
      ">
        ${days.map((day, i) => `
          <div class="day-block" style="
            border: 2px solid ${primaryColor || '#e5e7eb'};
            border-radius: 12px;
            overflow: hidden;
          ">
            <div style="
              background: ${primaryColor || '#f3f4f6'};
              color: ${primaryColor ? '#ffffff' : '#374151'};
              padding: 12px 16px;
              font-weight: 600;
            ">
              ${escapeHtml(day.label) || `Day ${i + 1}`}
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  Focus:
                </label>
                <div style="
                  height: 28px;
                  border-bottom: 1px solid #d1d5db;
                "></div>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  Tasks:
                </label>
                ${Array(3).fill().map(() => `
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    height: 28px;
                    border-bottom: 1px solid #e5e7eb;
                  ">
                    <input type="checkbox" style="width: 14px; height: 14px;" />
                    <div style="flex: 1;"></div>
                  </div>
                `).join('')}
              </div>
              <div>
                <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  Notes:
                </label>
                <div style="
                  min-height: 48px;
                  border: 1px dashed #d1d5db;
                  border-radius: 4px;
                "></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function generateBlueprintHTML(content, style) {
  const steps = content.steps || []
  const { fontFamily, primaryColor, backgroundColor } = style

  return `
    <div class="blueprint-page" style="
      font-family: ${fontFamily || 'system-ui, sans-serif'};
      background: ${backgroundColor || '#ffffff'};
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    ">
      <h1 style="
        color: ${primaryColor || '#1a1a1a'};
        font-size: 28px;
        margin-bottom: 8px;
        text-align: center;
      ">${escapeHtml(content.title) || 'Blueprint'}</h1>

      ${content.subtitle ? `
        <p style="color: #666; font-size: 16px; margin-bottom: 48px; text-align: center;">
          ${escapeHtml(content.subtitle)}
        </p>
      ` : ''}

      <div class="blueprint-flow" style="position: relative;">
        ${steps.map((step, i) => `
          <div class="step" style="
            display: flex;
            gap: 24px;
            margin-bottom: ${i < steps.length - 1 ? '48px' : '0'};
            position: relative;
          ">
            <!-- Number Circle -->
            <div style="
              flex-shrink: 0;
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background: ${primaryColor || '#3b82f6'};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              box-shadow: 0 4px 12px ${primaryColor || '#3b82f6'}40;
            ">${i + 1}</div>

            <!-- Connector Line -->
            ${i < steps.length - 1 ? `
              <div style="
                position: absolute;
                left: 27px;
                top: 56px;
                width: 2px;
                height: calc(100% - 8px);
                background: linear-gradient(to bottom, ${primaryColor || '#3b82f6'}, ${primaryColor || '#3b82f6'}40);
              "></div>
            ` : ''}

            <!-- Content -->
            <div style="flex: 1; padding-top: 8px;">
              <h3 style="
                font-size: 20px;
                font-weight: 600;
                color: #1a1a1a;
                margin-bottom: 8px;
              ">${escapeHtml(step.title) || `Step ${i + 1}`}</h3>
              <p style="
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 12px;
              ">${escapeHtml(step.description) || ''}</p>

              ${step.tips ? `
                <div style="
                  background: #f9fafb;
                  border-left: 3px solid ${primaryColor || '#3b82f6'};
                  padding: 12px 16px;
                  border-radius: 0 8px 8px 0;
                ">
                  <span style="font-size: 12px; color: ${primaryColor || '#3b82f6'}; font-weight: 600;">
                    Pro Tip:
                  </span>
                  <p style="color: #4b5563; margin-top: 4px; font-size: 14px;">
                    ${escapeHtml(step.tips)}
                  </p>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function generateCheatSheetHTML(content, style) {
  const sections = content.sections || []
  const { fontFamily, primaryColor, backgroundColor } = style

  return `
    <div class="cheat-sheet-page" style="
      font-family: ${fontFamily || 'system-ui, sans-serif'};
      background: ${backgroundColor || '#ffffff'};
      padding: 32px;
      max-width: 900px;
      margin: 0 auto;
    ">
      <div style="
        text-align: center;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 3px solid ${primaryColor || '#3b82f6'};
      ">
        <h1 style="
          color: ${primaryColor || '#1a1a1a'};
          font-size: 32px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        ">${escapeHtml(content.title) || 'Cheat Sheet'}</h1>
        ${content.subtitle ? `
          <p style="color: #666; font-size: 16px;">
            ${escapeHtml(content.subtitle)}
          </p>
        ` : ''}
      </div>

      <div style="
        display: grid;
        grid-template-columns: repeat(${content.columns || 2}, 1fr);
        gap: 24px;
      ">
        ${sections.map((section, i) => `
          <div class="section" style="
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            border-top: 4px solid ${section.color || primaryColor || '#3b82f6'};
          ">
            <h3 style="
              font-size: 16px;
              font-weight: 700;
              color: ${section.color || primaryColor || '#3b82f6'};
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            ">${escapeHtml(section.title) || `Section ${i + 1}`}</h3>

            <ul style="
              list-style: none;
              padding: 0;
              margin: 0;
            ">
              ${(section.items || []).map(item => `
                <li style="
                  display: flex;
                  align-items: flex-start;
                  gap: 8px;
                  margin-bottom: 8px;
                  color: #374151;
                  font-size: 14px;
                  line-height: 1.5;
                ">
                  <span style="color: ${section.color || primaryColor || '#3b82f6'};">•</span>
                  ${escapeHtml(typeof item === 'string' ? item : item.text)}
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      ${content.footer ? `
        <div style="
          margin-top: 32px;
          padding: 20px;
          background: linear-gradient(90deg, ${primaryColor || '#3b82f6'}10, ${primaryColor || '#3b82f6'}05);
          border-radius: 12px;
          text-align: center;
        ">
          <p style="color: #4b5563; font-size: 14px;">
            ${escapeHtml(content.footer)}
          </p>
        </div>
      ` : ''}
    </div>
  `
}

function generateChecklistHTML(content, style) {
  const items = content.items || []
  const { fontFamily, primaryColor, backgroundColor } = style

  return `
    <div class="checklist-page" style="
      font-family: ${fontFamily || 'system-ui, sans-serif'};
      background: ${backgroundColor || '#ffffff'};
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    ">
      <h1 style="
        color: ${primaryColor || '#1a1a1a'};
        font-size: 28px;
        margin-bottom: 8px;
      ">${escapeHtml(content.title) || 'Checklist'}</h1>

      ${content.subtitle ? `
        <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
          ${escapeHtml(content.subtitle)}
        </p>
      ` : ''}

      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="
              text-align: left;
              padding: 12px 16px;
              background: ${primaryColor || '#f3f4f6'};
              color: ${primaryColor ? '#fff' : '#374151'};
              font-weight: 600;
              width: 60%;
            ">Action Item</th>
            <th style="
              text-align: left;
              padding: 12px 16px;
              background: ${primaryColor || '#f3f4f6'};
              color: ${primaryColor ? '#fff' : '#374151'};
              font-weight: 600;
              width: 40%;
            ">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 16px;">
                <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
                  <input type="checkbox" style="
                    width: 20px;
                    height: 20px;
                    margin-top: 2px;
                    accent-color: ${primaryColor || '#3b82f6'};
                  " />
                  <span style="color: #374151; line-height: 1.5;">
                    ${escapeHtml(item.text || item)}
                  </span>
                </label>
              </td>
              <td style="padding: 16px;">
                <div style="
                  min-height: 24px;
                  border-bottom: 1px dashed #d1d5db;
                  color: #9ca3af;
                  font-style: italic;
                ">${escapeHtml(item.note || '')}</div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateWorksheetHTML(content, style) {
  const sections = content.sections || []
  const { fontFamily, primaryColor, backgroundColor } = style

  return `
    <div class="worksheet-page" style="
      font-family: ${fontFamily || 'system-ui, sans-serif'};
      background: ${backgroundColor || '#ffffff'};
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    ">
      <h1 style="
        color: ${primaryColor || '#1a1a1a'};
        font-size: 28px;
        margin-bottom: 8px;
      ">${escapeHtml(content.title) || 'Worksheet'}</h1>

      ${content.subtitle ? `
        <p style="color: #666; font-size: 16px; margin-bottom: 32px;">
          ${escapeHtml(content.subtitle)}
        </p>
      ` : ''}

      <div class="sections" style="display: flex; flex-direction: column; gap: 32px;">
        ${sections.map((section, i) => `
          <div class="section" style="
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            background: #fafafa;
          ">
            <h3 style="
              color: ${primaryColor || '#1a1a1a'};
              font-size: 18px;
              margin-bottom: 8px;
            ">${escapeHtml(section.title) || `Section ${i + 1}`}</h3>

            ${section.prompt ? `
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px; font-style: italic;">
                ${escapeHtml(section.prompt)}
              </p>
            ` : ''}

            <div style="
              min-height: ${section.lines ? section.lines * 32 : 120}px;
              background: #ffffff;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 16px;
            ">
              ${Array(section.lines || 4).fill().map(() => `
                <div style="
                  height: 28px;
                  border-bottom: 1px solid #e5e7eb;
                "></div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/â†'/g, '→')
    .replace(/â€"/g, '—')
    .replace(/â€™/g, "'")
}

function wrapInDocument(templateHtml, title, style, profile) {
  const { fontFamily, primaryColor } = style
  const author = profile?.name || 'Author'
  const handle = profile?.social_handle?.replace(/^@/, '') || ''
  const photoUrl = profile?.photo_url || getPlaceholderPhoto()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      font-family: '${fontFamily}', Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #e0e0e0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .document-wrapper {
      width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      position: relative;
      overflow: hidden;
    }

    .header-bar {
      height: 8px;
      background: ${primaryColor};
    }

    .footer-area {
      position: absolute;
      bottom: 10mm;
      left: 20mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid ${primaryColor}30;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .footer-photo {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${primaryColor};
    }

    .footer-handle {
      font-size: 10px;
      color: #666;
    }

    @media print {
      .document-wrapper {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="document-wrapper">
    <div class="header-bar"></div>
    ${templateHtml}
    <div class="footer-area">
      <div class="footer-left">
        <img src="${photoUrl}" class="footer-photo" alt="" onerror="this.style.background='#ddd'">
        <span class="footer-handle">${handle ? '@' + escapeHtml(handle) : ''}</span>
      </div>
    </div>
  </div>
</body>
</html>`
}

function getPlaceholderPhoto() {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23ddd"/%3E%3Ccircle cx="50" cy="40" r="18" fill="%23999"/%3E%3Cellipse cx="50" cy="85" rx="30" ry="25" fill="%23999"/%3E%3C/svg%3E'
}

main().catch(console.error)
