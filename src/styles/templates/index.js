// /src/styles/templates/index.js
// Exports all style templates for the Visual Builder
// Each template provides styling and HTML generation
// RELEVANT FILES: src/pages/VisualBuilder.jsx, netlify/functions/generate-visual.js

import { appleMinimal, generateHTML as appleMinimalHTML } from './apple-minimal'
import { minimalistClean, generateHTML as minimalistCleanHTML } from './minimalist-clean'
import { swissDesign, generateHTML as swissDesignHTML } from './swiss-design'
import { editorialMagazine, generateHTML as editorialMagazineHTML } from './editorial-magazine'
import { cluelyStyle, generateHTML as cluelyStyleHTML } from './cluely-style'
import { memphisDesign, generateHTML as memphisDesignHTML } from './memphis-design'
import { handDrawnSketch, generateHTML as handDrawnSketchHTML } from './hand-drawn-sketch'
import { brutalist, generateHTML as brutalistHTML } from './brutalist'
import { darkGlowing, generateHTML as darkGlowingHTML } from './dark-glowing'
import { blackNeonGlow, generateHTML as blackNeonGlowHTML } from './black-neon-glow'

// All templates with their generators
export const templates = {
  'apple-minimal': { template: appleMinimal, generateHTML: appleMinimalHTML },
  'minimalist-clean': { template: minimalistClean, generateHTML: minimalistCleanHTML },
  'swiss-design': { template: swissDesign, generateHTML: swissDesignHTML },
  'editorial-magazine': { template: editorialMagazine, generateHTML: editorialMagazineHTML },
  'cluely-style': { template: cluelyStyle, generateHTML: cluelyStyleHTML },
  'memphis-design': { template: memphisDesign, generateHTML: memphisDesignHTML },
  'hand-drawn-sketch': { template: handDrawnSketch, generateHTML: handDrawnSketchHTML },
  'brutalist': { template: brutalist, generateHTML: brutalistHTML },
  'dark-glowing': { template: darkGlowing, generateHTML: darkGlowingHTML },
  'black-neon-glow': { template: blackNeonGlow, generateHTML: blackNeonGlowHTML }
}

// Template list for UI selection
export const templateList = [
  appleMinimal,
  minimalistClean,
  swissDesign,
  editorialMagazine,
  cluelyStyle,
  memphisDesign,
  handDrawnSketch,
  brutalist,
  darkGlowing,
  blackNeonGlow
]

// Get template by ID
export function getTemplate(id) {
  return templates[id] || templates['apple-minimal']
}

// Generate HTML for content using specified template
export function generateVisualHTML(templateId, content, branding) {
  const { generateHTML } = getTemplate(templateId)
  return generateHTML(content, branding)
}

// Export individual templates
export {
  appleMinimal,
  minimalistClean,
  swissDesign,
  editorialMagazine,
  cluelyStyle,
  memphisDesign,
  handDrawnSketch,
  brutalist,
  darkGlowing,
  blackNeonGlow
}
