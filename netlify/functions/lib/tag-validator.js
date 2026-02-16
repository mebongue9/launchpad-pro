// netlify/functions/lib/tag-validator.js
// Validates and enforces Etsy tag requirements after AI generation
// Ensures: exactly 13 tags, each ≤20 chars, no duplicates, tag 1 = "digital download"
// RELEVANT FILES: generate-marketplace-listings.js, generate-bundle-listings.js, lib/batched-generators.js

const LOG_TAG = '[TAG-VALIDATOR]';

/**
 * Validates and fixes tags to meet Etsy requirements:
 * - Exactly 13 tags
 * - Each tag ≤ 20 characters
 * - No duplicates
 * - Tag 1 is always "digital download"
 */
export function enforceTagRules(tags) {
  if (!tags) return getDefaultTags();

  // Handle both string and array input
  let tagArray;
  if (typeof tags === 'string') {
    tagArray = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
  } else if (Array.isArray(tags)) {
    tagArray = tags.map(t => (typeof t === 'string' ? t.trim().toLowerCase() : '')).filter(t => t.length > 0);
  } else {
    console.warn(`${LOG_TAG} Invalid tags input type: ${typeof tags}, using defaults`);
    return getDefaultTags();
  }

  if (tagArray.length === 0) {
    console.warn(`${LOG_TAG} Empty tags array, using defaults`);
    return getDefaultTags();
  }

  // Step 1: Truncate any tag over 20 characters (try word boundary first)
  let truncatedCount = 0;
  tagArray = tagArray.map(tag => {
    if (tag.length <= 20) return tag;
    truncatedCount++;
    const truncated = tag.substring(0, 20);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 10) return truncated.substring(0, lastSpace).trim();
    return truncated.trim();
  });

  if (truncatedCount > 0) {
    console.log(`${LOG_TAG} Truncated ${truncatedCount} tags that exceeded 20 characters`);
  }

  // Step 2: Remove empty strings and duplicates
  tagArray = [...new Set(tagArray)].filter(t => t.length > 0);

  // Step 3: Ensure tag 1 is "digital download"
  tagArray = tagArray.filter(t => t !== 'digital download');
  tagArray.unshift('digital download');

  // Step 4: Pad to 13 if under, truncate if over
  const padTags = [
    'instant pdf', 'pdf template', 'printable', 'digital product',
    'online business', 'small business', 'entrepreneur', 'passive income',
    'pdf download', 'ebook template', 'business tools', 'coaching tools'
  ];
  while (tagArray.length < 13) {
    const pad = padTags.find(p => !tagArray.includes(p));
    if (pad) tagArray.push(pad);
    else break;
  }
  tagArray = tagArray.slice(0, 13);

  console.log(`${LOG_TAG} Final tags: ${tagArray.length} tags, all ≤20 chars`);

  return tagArray;
}

function getDefaultTags() {
  return [
    'digital download', 'instant pdf', 'pdf template', 'online business',
    'small business', 'entrepreneur', 'passive income', 'business tools',
    'digital product', 'coaching tools', 'pdf download', 'printable',
    'ebook template'
  ];
}
