// /src/templates/formats/index.js
// Export all format templates for use in Visual Builder
// Each format has HTML generation and React preview components
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/lib/pdf-generator.js

import { checklistTemplate } from './checklist';
import { worksheetTemplate } from './worksheet';
import { plannerTemplate } from './planner';
import { swipeFileTemplate } from './swipe-file';
import { blueprintTemplate } from './blueprint';
import { cheatSheetTemplate } from './cheat-sheet';

// All available format templates
export const formatTemplates = {
  checklist: checklistTemplate,
  worksheet: worksheetTemplate,
  planner: plannerTemplate,
  'swipe-file': swipeFileTemplate,
  blueprint: blueprintTemplate,
  'cheat-sheet': cheatSheetTemplate
};

// Array of templates for selection UI
export const formatTemplateList = [
  checklistTemplate,
  worksheetTemplate,
  plannerTemplate,
  swipeFileTemplate,
  blueprintTemplate,
  cheatSheetTemplate
];

// Get template by ID
export function getFormatTemplate(id) {
  return formatTemplates[id] || null;
}

// Get all template options for dropdown/selector
export function getFormatOptions() {
  return formatTemplateList.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon
  }));
}

// Generate HTML for a specific format
export function generateFormatHTML(formatId, content, style = {}) {
  const template = getFormatTemplate(formatId);
  if (!template) {
    console.error(`Format template not found: ${formatId}`);
    return '';
  }
  return template.generateHTML(content, style);
}

// Export individual templates
export {
  checklistTemplate,
  worksheetTemplate,
  plannerTemplate,
  swipeFileTemplate,
  blueprintTemplate,
  cheatSheetTemplate
};

export default formatTemplates;
