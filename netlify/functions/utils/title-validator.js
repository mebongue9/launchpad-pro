// /netlify/functions/utils/title-validator.js
// Title validation utilities for Maria Wendt naming formula enforcement
// Used by: generate-funnel.js, generate-lead-magnet-ideas.js
// RELEVANT FILES: lib/knowledge-search.js, docs/03-DATABASE-SCHEMA.md

import { searchKnowledgeWithMetrics } from '../lib/knowledge-search.js';

const LOG_TAG = '[TITLE-VALIDATOR]';

// Outcome words that indicate a specific result/transformation
const OUTCOME_WORDS = [
  'convert', 'attract', 'book', 'generate', 'grow', 'build', 'create', 'get', 'make',
  'scale', 'launch', 'close', 'sell', 'win', 'land', 'sign', 'fill', 'double', 'triple',
  'increase', 'boost', 'maximize', 'transform', 'master', 'dominate', 'crush', 'nail',
  'automate', 'streamline', 'simplify', 'unlock', 'discover', 'reveal', 'proven',
  'high-converting', 'viral', 'magnetic', 'irresistible', 'profitable', 'passive'
];

// Time/effort qualifiers that add urgency or specificity
const TIME_QUALIFIERS = [
  'day', 'days', 'week', 'weeks', 'month', 'months', 'hour', 'hours', 'minute', 'minutes',
  'step', 'steps', 'phase', 'phases', 'stage', 'stages',
  'fast', 'quick', 'simple', 'easy', 'instant', 'immediate', 'rapid',
  'without', 'before', 'after', 'while', 'during',
  'first', 'next', 'daily', 'weekly', 'monthly'
];

// Generic patterns to reject (these are too vague)
const GENERIC_PATTERNS = [
  /complete\s+(guide|system|toolkit|manual|course)/i,
  /ultimate\s+(guide|system|toolkit|manual|blueprint)/i,
  /success\s+(blueprint|system|formula|secrets)/i,
  /the\s+secrets?\s+(to|of|for)/i,
  /everything\s+you\s+need/i,
  /all\s+you\s+need/i,
  /master\s+class/i,
  /^the\s+(guide|system|blueprint|toolkit)$/i,
  /comprehensive\s+(guide|system)/i,
  /^business\s+(growth|success)\s+(system|blueprint)$/i
];

/**
 * Extract topic keywords from a title for vector search
 * Removes numbers, articles, common words
 * @param {string} title - The title to extract keywords from
 * @returns {string} Cleaned topic query
 */
function extractTopicKeywords(title) {
  if (!title) return '';

  // Common words to remove
  const stopWords = [
    'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from',
    'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'and', 'or', 'but', 'if',
    'your', 'my', 'our', 'their', 'its', 'his', 'her', 'how', 'what', 'when', 'where', 'why'
  ];

  return title
    .toLowerCase()
    // Remove numbers
    .replace(/\b\d+\b/g, '')
    // Remove special characters except spaces
    .replace(/[^\w\s]/g, ' ')
    // Split into words
    .split(/\s+/)
    // Remove stop words
    .filter(word => word.length > 2 && !stopWords.includes(word))
    // Rejoin
    .join(' ')
    .trim();
}

/**
 * Validate a title against the Maria Wendt naming formula
 * Formula: [NUMBER] + [FORMAT] + [DESIRED OUTCOME] + [TIME/EFFORT QUALIFIER]
 *
 * @param {string} title - The title to validate
 * @returns {Object} Validation result
 */
export function validateNamingFormula(title) {
  const result = {
    isValid: false,
    hasNumber: false,
    hasOutcome: false,
    hasTimeQualifier: false,
    issues: []
  };

  if (!title || typeof title !== 'string') {
    result.issues.push('Title is empty or invalid');
    return result;
  }

  const titleLower = title.toLowerCase();

  // Check for number (required)
  const hasNumber = /\b\d+\b/.test(title);
  result.hasNumber = hasNumber;
  if (!hasNumber) {
    result.issues.push('Missing number (e.g., "7 Steps", "21 Templates")');
  }

  // Check for outcome word (required)
  const hasOutcome = OUTCOME_WORDS.some(word => titleLower.includes(word.toLowerCase()));
  result.hasOutcome = hasOutcome;
  if (!hasOutcome) {
    result.issues.push('Missing outcome word (e.g., convert, attract, book, grow)');
  }

  // Check for time qualifier (recommended but not required for pass)
  const hasTimeQualifier = TIME_QUALIFIERS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(title);
  });
  result.hasTimeQualifier = hasTimeQualifier;
  if (!hasTimeQualifier) {
    result.issues.push('Consider adding time qualifier (e.g., "in 7 days", "5-minute")');
  }

  // Check for generic patterns (automatic fail)
  const matchesGeneric = GENERIC_PATTERNS.some(pattern => pattern.test(title));
  if (matchesGeneric) {
    result.issues.push('Generic pattern detected - be more specific');
  }

  // Title is valid if it has a number AND outcome AND is not generic
  result.isValid = hasNumber && hasOutcome && !matchesGeneric;

  return result;
}

/**
 * Verify a title against the vector database
 * Checks if we have content that matches the title's topic
 *
 * USES: searchKnowledgeWithMetrics from lib/knowledge-search.js
 *
 * @param {string} title - The title to verify
 * @param {Object} options - Options for verification
 * @returns {Object} Verification result
 */
export async function verifyTitleAgainstVectorDB(title, options = {}) {
  const result = {
    isVerified: false,
    topSimilarityScore: 0,
    matchingChunks: 0,
    warning: null
  };

  if (!title) {
    result.warning = 'Empty title';
    return result;
  }

  try {
    // Extract topic keywords for search
    const topicQuery = extractTopicKeywords(title);

    if (!topicQuery || topicQuery.length < 3) {
      result.warning = 'Could not extract meaningful topic from title';
      return result;
    }

    console.log(`${LOG_TAG} Verifying title against vector DB: "${title}"`);
    console.log(`${LOG_TAG} Topic query: "${topicQuery}"`);

    // Use EXISTING vector search function for consistency
    const { context, metrics } = await searchKnowledgeWithMetrics(topicQuery, {
      threshold: 0.3,
      limit: 5,
      sourceFunction: 'title-validator'
    });

    // Get top similarity score
    const topScore = metrics.top5Scores?.[0]?.score || 0;

    result.topSimilarityScore = topScore;
    result.matchingChunks = metrics.chunksRetrieved || 0;

    // Determine verification status based on thresholds
    if (topScore >= 0.5) {
      result.isVerified = true;
      console.log(`${LOG_TAG} Title VERIFIED (score: ${topScore.toFixed(3)})`);
    } else if (topScore >= 0.3) {
      result.isVerified = false;
      result.warning = 'Borderline match - may lack depth';
      console.log(`${LOG_TAG} Title WARNING (score: ${topScore.toFixed(3)})`);
    } else {
      result.isVerified = false;
      console.log(`${LOG_TAG} Title REJECTED (score: ${topScore.toFixed(3)})`);
    }

    return result;

  } catch (error) {
    console.error(`${LOG_TAG} Vector verification error:`, error.message);
    result.warning = `Verification failed: ${error.message}`;
    return result;
  }
}

/**
 * Validate an array of generated titles
 * Combines formula validation and vector verification
 *
 * @param {string[]} titles - Array of titles to validate
 * @param {Object} options - Validation options
 * @returns {Object} Batch validation results
 */
export async function validateGeneratedTitles(titles, options = {}) {
  const { threshold = 0.5 } = options;

  console.log(`${LOG_TAG} Validating ${titles.length} titles in PARALLEL...`);

  // Run all validations in PARALLEL to avoid timeout
  const validationPromises = titles.map(async (title) => {
    // Formula validation (synchronous)
    const formulaValidation = validateNamingFormula(title);

    // Vector verification (async) - runs in parallel with other titles
    const vectorValidation = await verifyTitleAgainstVectorDB(title, options);

    // Determine overall status
    let overallStatus;

    if (!formulaValidation.isValid) {
      overallStatus = 'FAIL';
    } else if (!vectorValidation.isVerified && vectorValidation.topSimilarityScore < 0.3) {
      overallStatus = 'FAIL';
    } else if (vectorValidation.warning || !formulaValidation.hasTimeQualifier) {
      overallStatus = 'WARNING';
    } else {
      overallStatus = 'PASS';
    }

    console.log(`${LOG_TAG} "${title.substring(0, 40)}..." => ${overallStatus}`);

    return {
      title,
      formulaValidation,
      vectorValidation,
      overallStatus
    };
  });

  // Wait for all validations to complete in parallel
  const results = await Promise.all(validationPromises);

  // Count results
  let passed = 0;
  let warnings = 0;
  let failed = 0;

  for (const result of results) {
    if (result.overallStatus === 'PASS') passed++;
    else if (result.overallStatus === 'WARNING') warnings++;
    else if (result.overallStatus === 'FAIL') failed++;
  }

  const allValid = failed === 0;

  console.log(`${LOG_TAG} Validation complete: ${passed} passed, ${warnings} warnings, ${failed} failed`);

  return {
    allValid,
    results,
    summary: {
      passed,
      warnings,
      failed
    }
  };
}

/**
 * Build additional prompt text for retry attempts
 * Provides feedback on what went wrong and how to fix it
 *
 * @param {Object[]} failedTitles - Array of failed validation results
 * @returns {string} Additional prompt text to append
 */
export function buildRetryPromptAddition(failedTitles) {
  if (!failedTitles || failedTitles.length === 0) {
    return '';
  }

  const rejectedList = failedTitles.map(result => {
    const issues = [];

    // Collect formula issues
    if (result.formulaValidation?.issues) {
      issues.push(...result.formulaValidation.issues);
    }

    // Collect vector issues
    if (result.vectorValidation?.topSimilarityScore < 0.3) {
      issues.push('No matching content in knowledge base');
    } else if (result.vectorValidation?.warning) {
      issues.push(result.vectorValidation.warning);
    }

    return `- "${result.title}" — Issues: ${issues.join('; ')}`;
  }).join('\n');

  return `

## VALIDATION FAILURE - RETRY REQUIRED

Your previous titles were REJECTED:
${rejectedList}

Requirements you MUST follow:
1. Include a NUMBER (3, 5, 7, 21, etc.) in EVERY title
2. Include a specific OUTCOME word (convert, attract, book, grow, build, create, etc.)
3. Avoid generic patterns (no "Complete Guide", "Ultimate System", "Success Blueprint")
4. ONLY use topics that match content from the knowledge base provided above

Generate COMPLETELY DIFFERENT titles that pass ALL requirements.
`;
}

// Export for CommonJS compatibility
export default {
  validateNamingFormula,
  verifyTitleAgainstVectorDB,
  validateGeneratedTitles,
  buildRetryPromptAddition,
  extractTopicKeywords
};
