// netlify/functions/lib/content-format-corrector.js
// Safety net that converts non-string chapter content to markdown strings
// Runs AFTER AI generation, BEFORE validation and DB save
// RELEVANT FILES: batched-generators.js, visual-builder-generate.js, content-parser.js, interior-renderer.js

const LOG_TAG = '[FORMAT-CORRECTOR]';

/**
 * Convert a JS object/array to readable markdown text
 * @param {*} obj - Object, array, or primitive to convert
 * @param {number} depth - Current nesting depth (for heading levels)
 * @returns {string} Markdown text representation
 */
function objectToMarkdown(obj, depth = 0) {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        return `- ${String(item)}`;
      }
      return objectToMarkdown(item, depth + 1);
    }).join('\n');
  }

  if (typeof obj === 'object') {
    const lines = [];
    for (const [key, value] of Object.entries(obj)) {
      const heading = depth === 0 ? `## ${key}` : `### ${key}`;
      lines.push(heading);

      if (typeof value === 'string') {
        lines.push(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        lines.push(String(value));
      } else if (Array.isArray(value)) {
        lines.push(objectToMarkdown(value, depth + 1));
      } else if (typeof value === 'object' && value !== null) {
        lines.push(objectToMarkdown(value, depth + 1));
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  return String(obj);
}

/**
 * Fix a single chapter's content field
 * @param {*} content - The content value (should be string, might be object/array/null)
 * @param {string} chapterTitle - Chapter title for logging
 * @returns {string} Guaranteed string content
 */
export function correctChapterContent(content, chapterTitle = 'Unknown') {
  if (typeof content === 'string') return content;
  if (content === null || content === undefined) {
    console.warn(`${LOG_TAG} Chapter "${chapterTitle}" has null/undefined content, returning empty string`);
    return '';
  }

  const originalType = typeof content;
  const converted = objectToMarkdown(content, 0);
  console.warn(`${LOG_TAG} Fixed non-string content in chapter "${chapterTitle}" (was ${originalType}). Converted ${JSON.stringify(content).substring(0, 200)} to markdown.`);
  return converted;
}

/**
 * Correct all chapter content fields in a product data structure
 * Handles multiple data shapes:
 * 1. { chapters: [{ title, content }, ...] }
 * 2. { chapter1: { title, content }, chapter2: {...} }
 * 3. { type: "chapter", content: {...} } (single chapter)
 * @param {Object} data - Product data with chapters
 * @returns {Object} Same structure with all content fields guaranteed to be strings
 */
export function correctProductContent(data) {
  if (!data) return data;

  // Shape 1: chapters array
  if (data.chapters && Array.isArray(data.chapters)) {
    data.chapters = data.chapters.map(chapter => {
      if (chapter && chapter.content !== undefined) {
        chapter.content = correctChapterContent(chapter.content, chapter.title || 'Unknown Chapter');
      }
      return chapter;
    });
    return data;
  }

  // Shape 2: named chapters (chapter1, chapter2, ...)
  const chapterKeys = Object.keys(data).filter(k => /^chapter\d+$/.test(k));
  if (chapterKeys.length > 0) {
    for (const key of chapterKeys) {
      if (data[key] && data[key].content !== undefined) {
        data[key].content = correctChapterContent(data[key].content, data[key].title || key);
      }
    }
    return data;
  }

  // Shape 3: single chapter
  if (data.type === 'chapter' && data.content !== undefined) {
    data.content = correctChapterContent(data.content, data.title || 'Single Chapter');
    return data;
  }

  return data;
}
