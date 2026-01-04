// /netlify/functions/utils/sanitize-json.js
// Utility to sanitize Claude API JSON responses
// Handles markdown code fences and other common issues
// RELEVANT FILES: All generate-*.js functions

/**
 * Sanitizes and parses Claude API response as JSON
 * Handles: markdown code fences, whitespace, edge cases
 * @param {string} text - Raw text from Claude API response
 * @returns {object} Parsed JSON object
 * @throws {Error} If text is empty or cannot be parsed
 */
export function parseClaudeJSON(text) {
  if (!text) {
    throw new Error('Empty response from AI');
  }

  let cleaned = text
    // Remove markdown code fences at start (```json or ```)
    .replace(/^```(?:json)?\s*/i, '')
    // Remove markdown code fences at end
    .replace(/```\s*$/g, '')
    // Remove any leading/trailing whitespace
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Log for debugging
    console.error('JSON parse failed.');
    console.error('Original text length:', text.length);
    console.error('Cleaned text (first 500 chars):', cleaned.substring(0, 500));
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
}
