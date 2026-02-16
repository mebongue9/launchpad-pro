// netlify/functions/lib/content-validator.js
// Validates generated content has substance after correction
// Runs AFTER corrector, BEFORE DB save. Throws on invalid content (triggers retry).
// RELEVANT FILES: batched-generators.js, content-format-corrector.js

const LOG_TAG = '[CONTENT-VALIDATOR]';

/**
 * Validate generated content has substance
 * Checks:
 * 1. data exists and has chapters
 * 2. Each chapter has a non-empty title (string)
 * 3. Each chapter has content that is a string
 * 4. Each chapter content has minimum 50 words
 * @param {Object} data - Product data with chapters array
 * @param {string} taskName - Name of the generation task (for logging)
 * @throws {Error} If validation fails (triggers retry in caller)
 */
export function validateGeneratedContent(data, taskName) {
  if (!data) {
    throw new Error(`${taskName}: Generated data is null/undefined`);
  }

  // Determine chapters array
  let chapters = [];
  if (data.chapters && Array.isArray(data.chapters)) {
    chapters = data.chapters;
  } else {
    // Try named chapters
    const chapterKeys = Object.keys(data).filter(k => /^chapter\d+$/.test(k));
    if (chapterKeys.length > 0) {
      chapters = chapterKeys.map(k => data[k]);
    }
  }

  if (chapters.length === 0) {
    console.warn(`${LOG_TAG} ${taskName}: No chapters found in data, skipping validation`);
    return;
  }

  let passCount = 0;
  let failCount = 0;
  const failures = [];

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const label = chapter?.title || `Chapter ${i + 1}`;

    // Skip non-chapter entries (like cover)
    if (chapter?.type === 'cover') {
      passCount++;
      continue;
    }

    // Check title
    if (!chapter?.title || typeof chapter.title !== 'string' || chapter.title.trim().length === 0) {
      failCount++;
      failures.push(`${label}: Missing or empty title`);
      continue;
    }

    // Check content is a string (should always be after corrector runs)
    if (typeof chapter.content !== 'string') {
      failCount++;
      failures.push(`${label}: Content is ${typeof chapter.content}, expected string`);
      continue;
    }

    // Check minimum word count (50 words is generous threshold)
    const wordCount = chapter.content.trim().split(/\s+/).length;
    if (wordCount < 50) {
      failCount++;
      failures.push(`${label}: Content too short (${wordCount} words, minimum 50)`);
      continue;
    }

    passCount++;
  }

  console.log(`${LOG_TAG} ${taskName}: Validation complete - ${passCount} passed, ${failCount} failed out of ${chapters.length} chapters`);

  if (failCount > 0) {
    const errorMsg = `${taskName}: Content validation failed for ${failCount} chapter(s):\n${failures.join('\n')}`;
    console.error(`${LOG_TAG} ${errorMsg}`);
    throw new Error(errorMsg);
  }
}
