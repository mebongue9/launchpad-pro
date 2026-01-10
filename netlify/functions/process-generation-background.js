// /netlify/functions/process-generation-background.js
// Background function for AI content generation (up to 15 minutes)
// Implements chunked generation with automatic retry and progress tracking
// The "-background" suffix tells Netlify this is a background function
// RELEVANT FILES: start-generation.js, check-job-status.js, src/hooks/useGenerationJob.jsx

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';

// ============================================
// LANGUAGE SUPPORT
// ============================================

function getLanguagePromptSuffix(language) {
  if (!language || language === 'English') {
    return '';
  }

  return `
---
OUTPUT LANGUAGE: ${language}
All content must be written entirely in ${language}.
Do not include any English unless the user's language is English.
`;
}

// ============================================
// CONFIGURATION
// ============================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 5000,      // 5 seconds
  maxDelay: 60000,         // 60 seconds max
  backoffMultiplier: 2,    // Double delay each retry
  retryableCodes: [429, 500, 529],
  permanentFailureCodes: [400, 401, 403, 404, 413]
};

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ============================================
// DATABASE HELPERS
// ============================================

async function updateJobStatus(jobId, updates) {
  console.log('🔄 [PROCESS-GENERATION-BG] Updating job status:', {
    jobId,
    updates: Object.keys(updates)
  });

  const { error } = await supabase
    .from('generation_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error('❌ [PROCESS-GENERATION-BG] Failed to update job status:', error.message);
  }
}

async function saveChunkToJob(jobId, chunkIndex, chunkData, currentChunks) {
  console.log('💾 [PROCESS-GENERATION-BG] Saving chunk to job:', {
    jobId,
    chunkIndex,
    chunkTitle: chunkData?.title || 'unknown'
  });

  const updatedChunks = [...currentChunks];
  updatedChunks[chunkIndex] = chunkData;

  await updateJobStatus(jobId, {
    chunks_data: updatedChunks,
    completed_chunks: chunkIndex + 1
  });

  return updatedChunks;
}

// ============================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

async function generateWithRetry(prompt, systemPrompt, jobId, chunkName, maxTokens = 2000) {
  console.log('🔄 [PROCESS-GENERATION-BG] generateWithRetry called:', {
    jobId,
    chunkName,
    maxTokens,
    promptLength: prompt?.length || 0
  });

  let lastError = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 [PROCESS-GENERATION-BG] Attempt ${attempt}/${RETRY_CONFIG.maxRetries} for: ${chunkName}`);

      // Update status to show current attempt
      await updateJobStatus(jobId, {
        current_chunk_name: attempt > 1
          ? `${chunkName} (Retry ${attempt}/${RETRY_CONFIG.maxRetries})`
          : chunkName
      });

      // Make API call
      console.log('🔄 [PROCESS-GENERATION-BG] Calling Claude API...');
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      console.log('✅ [PROCESS-GENERATION-BG] Claude API success:', {
        outputTokens: response.usage?.output_tokens || 'unknown',
        responseLength: response.content[0]?.text?.length || 0
      });

      // Success!
      const parsed = parseClaudeJSON(response.content[0].text);
      console.log('✅ [PROCESS-GENERATION-BG] JSON parsed successfully for:', chunkName);
      return parsed;

    } catch (error) {
      lastError = error;
      const statusCode = error.status || 500;

      console.error(`❌ [PROCESS-GENERATION-BG] Attempt ${attempt} failed (${statusCode}):`, error.message);

      // Check if error is retryable
      if (RETRY_CONFIG.permanentFailureCodes.includes(statusCode)) {
        console.error('❌ [PROCESS-GENERATION-BG] Permanent failure - not retrying');
        throw error;
      }

      // Check if we have retries left
      if (attempt === RETRY_CONFIG.maxRetries) {
        console.error('❌ [PROCESS-GENERATION-BG] Max retries exhausted');
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
        RETRY_CONFIG.maxDelay
      );

      console.log(`⏳ [PROCESS-GENERATION-BG] Waiting ${delay/1000}s before retry ${attempt + 1}...`);
      await updateJobStatus(jobId, {
        current_chunk_name: `${chunkName} - Rate limited, retrying in ${delay/1000}s...`,
        last_error_code: statusCode,
        retry_count: attempt
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================
// CONTENT GENERATION PROMPTS
// ============================================

const OUTLINE_PROMPT = `Generate a content outline. Return ONLY valid JSON with this structure:
{
  "title": "Product Title",
  "subtitle": "Subtitle",
  "chapters": [
    { "type": "cover", "title": "Cover" },
    { "type": "introduction", "title": "Introduction Title" },
    { "type": "chapter", "number": 1, "title": "Chapter 1 Title" },
    { "type": "chapter", "number": 2, "title": "Chapter 2 Title" },
    { "type": "bridge", "title": "What's Next" },
    { "type": "cta", "title": "Call to Action" }
  ]
}`;

const CHAPTER_SYSTEM_PROMPT = `You are a content writer creating a single chapter/section of a digital product.
Write engaging, actionable content. Output ONLY valid JSON with this structure:
{
  "type": "chapter|introduction|bridge|cta|cover",
  "number": 1,
  "title": "Chapter Title",
  "content": "Full chapter content (200-400 words for chapters, shorter for intro/bridge/cta)"
}`;

// ============================================
// CHUNKED GENERATION FOR PRODUCTS
// ============================================

async function generateProductContent(jobId, inputData) {
  console.log('📦 [PROCESS-GENERATION-BG] generateProductContent started:', {
    jobId,
    product: inputData?.product?.name,
    profile: inputData?.profile?.name,
    audience: inputData?.audience?.name
  });

  const { product, profile, audience, next_product } = inputData;

  // Step 1: Generate outline
  console.log('🔄 [PROCESS-GENERATION-BG] Step 1: Generating outline for product:', product?.name);
  await updateJobStatus(jobId, {
    status: 'processing',
    current_chunk_name: 'Generating outline...'
  });

  const outlinePrompt = `
Create a content outline for this product:
Name: ${product.name}
Format: ${product.format}
Price: $${product.price}
Description: ${product.description}

Creator: ${profile.name} (${profile.business_name || profile.name})
Audience: ${audience?.name || 'General'}

Guidelines:
- Front-End ($7-17): 8-15 pages total (5-8 chapters)
- Bump ($7-17): 3-5 pages total (3-4 chapters)
- Upsells ($27-97+): 10-20 pages total (8-12 chapters)

Based on the price ($${product.price}), create an appropriate outline.
`;

  const outline = await generateWithRetry(
    outlinePrompt,
    OUTLINE_PROMPT,
    jobId,
    'Generating outline',
    1000
  );

  console.log('✅ [PROCESS-GENERATION-BG] Outline generated:', {
    title: outline?.title,
    chaptersCount: outline?.chapters?.length || 0
  });

  // Update with outline info
  const totalChunks = outline.chapters.length;
  await updateJobStatus(jobId, {
    total_chunks: totalChunks,
    completed_chunks: 0,
    chunks_data: []
  });

  // Step 2: Generate each chapter
  console.log('🔄 [PROCESS-GENERATION-BG] Step 2: Generating', totalChunks, 'chapters...');
  let chunks = [];
  for (let i = 0; i < outline.chapters.length; i++) {
    const chapter = outline.chapters[i];
    const chunkName = `Generating ${chapter.title} (${i + 1}/${totalChunks})`;

    await updateJobStatus(jobId, {
      current_chunk_name: chunkName,
      completed_chunks: i
    });

    // Build context from previous chapters
    const previousContent = chunks.map(c => `${c.title}: ${(c.content || '').substring(0, 200)}...`).join('\n');

    const chapterPrompt = `
Write the "${chapter.title}" section for "${product.name}".

Product: ${product.name} - ${product.description}
Creator: ${profile.name}
${audience ? `Audience: ${audience.name}` : ''}
${next_product ? `This should naturally lead to: ${next_product.name}` : ''}

Section type: ${chapter.type}
${chapter.number ? `Chapter number: ${chapter.number}` : ''}

${previousContent ? `Previous sections (for context):\n${previousContent}` : ''}

Write 200-400 words of engaging, actionable content.
`;

    const chapterContent = await generateWithRetry(
      chapterPrompt,
      CHAPTER_SYSTEM_PROMPT,
      jobId,
      chunkName,
      1500
    );

    // Save immediately after each chapter
    chunks = await saveChunkToJob(jobId, i, {
      ...chapter,
      ...chapterContent
    }, chunks);
  }

  // Step 3: Assemble final result
  console.log('✅ [PROCESS-GENERATION-BG] Product content generation complete:', {
    title: outline.title,
    sectionsCount: chunks.length
  });

  return {
    title: outline.title,
    subtitle: outline.subtitle,
    sections: chunks
  };
}

// ============================================
// LEAD MAGNET CONTENT GENERATION
// ============================================

async function generateLeadMagnetContent(jobId, inputData) {
  console.log('📄 [PROCESS-GENERATION-BG] generateLeadMagnetContent started:', {
    jobId,
    lead_magnet: inputData?.lead_magnet?.title,
    profile: inputData?.profile?.name,
    audience: inputData?.audience?.name,
    language: inputData?.language || 'English'
  });

  const { lead_magnet, profile, audience, front_end_product, language = 'English' } = inputData;

  // Step 1: Generate outline
  console.log('🔄 [PROCESS-GENERATION-BG] Step 1: Generating outline for lead magnet:', lead_magnet?.title);
  await updateJobStatus(jobId, {
    status: 'processing',
    current_chunk_name: 'Generating outline...'
  });

  const outlinePrompt = `
Create a lead magnet content outline:
Title: ${lead_magnet.title}
Format: ${lead_magnet.format}
Topic: ${lead_magnet.topic}
Keyword: ${lead_magnet.keyword}

Creator: ${profile.name}
Leads to: ${front_end_product.name} ($${front_end_product.price})

Structure:
- Cover
- 5-6 value chapters (200-300 words each)
- Bridge chapter (creates desire for front-end)
- CTA

Output JSON outline with chapters array.
`;

  const outline = await generateWithRetry(
    outlinePrompt,
    OUTLINE_PROMPT,
    jobId,
    'Generating outline',
    1000
  );

  console.log('✅ [PROCESS-GENERATION-BG] Outline generated:', {
    title: outline?.title,
    chaptersCount: outline?.chapters?.length || 0
  });

  const totalChunks = outline.chapters.length;
  await updateJobStatus(jobId, {
    total_chunks: totalChunks,
    completed_chunks: 0,
    chunks_data: []
  });

  // Step 2: Generate each chapter
  console.log('🔄 [PROCESS-GENERATION-BG] Step 2: Generating', totalChunks, 'chapters...');
  let chunks = [];
  for (let i = 0; i < outline.chapters.length; i++) {
    const chapter = outline.chapters[i];
    const chunkName = `Generating ${chapter.title} (${i + 1}/${totalChunks})`;

    console.log('🔄 [PROCESS-GENERATION-BG] Generating chapter:', chunkName);

    await updateJobStatus(jobId, {
      current_chunk_name: chunkName,
      completed_chunks: i
    });

    const previousContent = chunks.map(c => `${c.title}: ${(c.content || '').substring(0, 200)}...`).join('\n');

    const chapterPrompt = `
Write the "${chapter.title}" section for lead magnet "${lead_magnet.title}".

Lead Magnet: ${lead_magnet.title}
Topic: ${lead_magnet.topic}
Keyword: ${lead_magnet.keyword}
Creator: ${profile.name}
${audience ? `Audience: ${audience.name}` : ''}

This should create desire for: ${front_end_product.name} ($${front_end_product.price})

Section type: ${chapter.type}
${chapter.number ? `Chapter number: ${chapter.number}` : ''}

${previousContent ? `Previous sections:\n${previousContent}` : ''}

Write 200-300 words of valuable, actionable content.
${getLanguagePromptSuffix(language)}`;

    const chapterContent = await generateWithRetry(
      chapterPrompt,
      CHAPTER_SYSTEM_PROMPT,
      jobId,
      chunkName,
      1200
    );

    chunks = await saveChunkToJob(jobId, i, {
      ...chapter,
      ...chapterContent
    }, chunks);
  }

  // Step 3: Generate promotion kit
  console.log('🔄 [PROCESS-GENERATION-BG] Step 3: Generating promotion kit...');
  await updateJobStatus(jobId, {
    current_chunk_name: 'Generating promotion kit...'
  });

  const promotionPrompt = `
Create a promotion kit for lead magnet "${lead_magnet.title}" with keyword "${lead_magnet.keyword}".

Return JSON:
{
  "video_script": {
    "hook": "Opening line",
    "value": "Key points",
    "cta": "Comment ${lead_magnet.keyword} below!"
  },
  "captions": {
    "comment_version": "Caption ending with 'comment ${lead_magnet.keyword} below'",
    "dm_version": "Caption ending with 'DM me ${lead_magnet.keyword}'"
  },
  "keyword": "${lead_magnet.keyword}"
}
`;

  const promotionKit = await generateWithRetry(
    promotionPrompt,
    'Generate a social media promotion kit. Return ONLY valid JSON.',
    jobId,
    'Generating promotion kit',
    800
  );

  console.log('✅ [PROCESS-GENERATION-BG] Lead magnet content generation complete:', {
    title: outline.title || lead_magnet.title,
    sectionsCount: chunks.length,
    hasPromotionKit: !!promotionKit
  });

  return {
    title: outline.title || lead_magnet.title,
    subtitle: outline.subtitle,
    keyword: lead_magnet.keyword,
    sections: chunks,
    promotion_kit: promotionKit
  };
}

// ============================================
// FUNNEL GENERATION (Non-chunked) - PDF Only + Anti-Cannibalization
// ============================================

async function generateFunnel(jobId, inputData) {
  console.log('🎯 [PROCESS-GENERATION-BG] generateFunnel started:', {
    jobId,
    profile: inputData?.profile?.name,
    audience: inputData?.audience?.name,
    existingProduct: inputData?.existing_product?.name || 'none',
    language: inputData?.language || 'English'
  });

  const { profile, audience, existing_product, language = 'English' } = inputData;

  console.log('🔄 [PROCESS-GENERATION-BG] Generating funnel architecture...');
  await updateJobStatus(jobId, {
    status: 'processing',
    total_chunks: 1,
    completed_chunks: 0,
    current_chunk_name: 'Generating funnel architecture...'
  });

  const funnelPrompt = `
Create a complete product funnel:

## PROFILE
Name: ${profile.name}
Business: ${profile.business_name || 'Not specified'}
Niche: ${profile.niche || 'Not specified'}
Vibe: ${profile.vibe || 'Professional'}

## AUDIENCE
Name: ${audience?.name || 'General'}
Pain Points: ${(audience?.pain_points || []).join(', ') || 'Not specified'}
Desires: ${(audience?.desires || []).join(', ') || 'Not specified'}

${existing_product ? `## EXISTING PRODUCT (This is the FINAL destination - Upsell 2 bridges to this)
Name: ${existing_product.name}
Price: $${existing_product.price}
Description: ${existing_product.description || 'Not specified'}

IMPORTANT: Upsell 2 should create desire for this existing product as the ultimate solution.` : '## No existing product - create complete standalone funnel'}

Return JSON with: funnel_name, front_end, bump, upsell_1, upsell_2
Each product needs: name, format, price, description, bridges_to
NOTE: Only 4 products (NO upsell_3) - the user's existing product is the final destination.
${getLanguagePromptSuffix(language)}`;

  // PDF-Only Funnel Architect with Anti-Cannibalization Principle
  const funnelSystemPrompt = `You are an elite funnel architect. Create product funnels using PROVEN formats from Maria Wendt analysis.

## PDF-ONLY PRODUCTS (MANDATORY)
Every product in the funnel MUST be a PDF-based deliverable:
- Multi-Page Guide/PDF (The X-Page Guide to...)
- Checklist/Steps (X Steps to... / X-Day Checklist)
- Cheat Sheet (The Topic Cheat Sheet)
- Swipe File (X Ready-to-Use Templates)
- Blueprint (The Outcome Blueprint)
- Workbook (The Action Planner)

## FORBIDDEN (NEVER suggest):
- Video courses, mini-courses, training modules
- Anything with "hours" or time commitments
- Anything requiring video production
- Masterclass, workshop, or any video format

## ANTI-CANNIBALIZATION PRINCIPLE (CRITICAL)
Each funnel level serves a SPECIFIC purpose. NEVER let a lower tier fully satisfy the need:

- **Front-End ($7-17)**: Solves ONE IMMEDIATE NEED partially. Quick win, but leaves them wanting more.
- **Bump ($7-17)**: Makes the front-end FASTER or EASIER to implement. Shortcut/accelerator.
- **Upsell 1 ($27-47)**: Goes DEEPER into implementation. More advanced strategies.
- **Upsell 2 ($47-97)**: Provides DONE-FOR-YOU elements. Templates, scripts, ready-to-use assets.

The user's EXISTING PRODUCT is the final destination (like a signature course or premium offer).
Upsell 2 bridges directly to that existing product.

Each product CREATES DESIRE for the next. They complement, not compete.

## NAMING FORMULA (REQUIRED)
[SPECIFIC NUMBER] + [FORMAT] + [DESIRED OUTCOME]

IMPORTANT: Keep numbers REALISTIC for PDF products!
- Use numbers like: 7, 12, 15, 21, 27, 30, 47 for item counts
- For page counts: NEVER exceed 25 pages
- For template/script counts: 15-50 max

Good Examples:
- "The 7-Day Client Acquisition Checklist" (Front-end, ~8 pages)
- "21 Done-For-You Email Templates" (Bump, ~5 pages)
- "The 15-Page Advanced Strategy Guide" (Upsell 1, 15 pages)
- "47 Ready-to-Use Scripts Bundle" (Upsell 2, ~20 pages)

BAD Examples (NEVER DO THIS):
- "The 127-Page Guide..." - WAY too long!
- "365 Templates..." - Unrealistic for a PDF
- "88-Page Complete Blueprint..." - Too long!

## CONTENT LENGTH GUIDELINES (STRICT)
- Front-End: 5-10 pages MAX
- Bump: 3-5 pages MAX
- Upsell 1: 10-15 pages MAX
- Upsell 2: 15-20 pages MAX (includes templates/assets)

## OUTPUT FORMAT
Return ONLY valid JSON with 4 products (NO upsell_3):
{
  "funnel_name": "Descriptive Funnel Name",
  "front_end": {
    "name": "The [X] [Format] to [Outcome]",
    "format": "PDF format from allowed list",
    "price": 7-17,
    "description": "What problem it solves",
    "bridges_to": "How it creates desire for bump"
  },
  "bump": { ... },
  "upsell_1": { ... },
  "upsell_2": { ... }
}

## RULES
1. ALL products must be PDF-deliverable (NO video)
2. Product names MUST include REALISTIC specific numbers
3. NEVER suggest page counts over 25 pages
4. Each product bridges naturally to the next
5. Apply anti-cannibalization - each level creates desire for next
6. Only 4 products: front_end, bump, upsell_1, upsell_2 (NO upsell_3)
7. ONLY output JSON, no other text`;

  const funnel = await generateWithRetry(
    funnelPrompt,
    funnelSystemPrompt,
    jobId,
    'Generating funnel',
    3000
  );

  console.log('✅ [PROCESS-GENERATION-BG] Funnel generated:', {
    funnelName: funnel?.funnel_name,
    frontEnd: funnel?.front_end?.name,
    bump: funnel?.bump?.name,
    upsell1: funnel?.upsell_1?.name,
    upsell2: funnel?.upsell_2?.name
  });

  await updateJobStatus(jobId, { completed_chunks: 1 });

  // NOTE: TLDRs and cross-promos are now generated AFTER the user saves the funnel
  // This saves tokens when the user decides not to keep the generated funnel
  // See: generate-supplementary-content.js for post-save generation

  return funnel;
}

// ============================================
// LEAD MAGNET IDEAS (Non-chunked) - PDF Only + Maria Wendt Data
// ============================================

async function generateLeadMagnetIdeas(jobId, inputData) {
  console.log('💡 [PROCESS-GENERATION-BG] generateLeadMagnetIdeas started:', {
    jobId,
    profile: inputData?.profile?.name,
    audience: inputData?.audience?.name,
    frontEndProduct: inputData?.front_end_product?.name,
    excludedTopicsCount: inputData?.excluded_topics?.length || 0,
    language: inputData?.language || 'English'
  });

  const { profile, audience, front_end_product, excluded_topics, language = 'English' } = inputData;

  console.log('🔄 [PROCESS-GENERATION-BG] Generating lead magnet ideas with RAG...');
  await updateJobStatus(jobId, {
    status: 'processing',
    total_chunks: 1,
    completed_chunks: 0,
    current_chunk_name: 'Searching knowledge base...'
  });

  // RAG: Vector database search per Vision Doc requirement
  const knowledgeQuery = `${profile.niche || ''} ${audience?.name || ''} lead magnet topics`;
  let ragMetrics = null;
  let knowledgeContext = '';
  try {
    const ragResult = await searchKnowledgeWithMetrics(knowledgeQuery, { threshold: 0.3, limit: 40, sourceFunction: 'generate-lead-magnet-ideas-bg' });
    knowledgeContext = ragResult.context;
    ragMetrics = ragResult.metrics;
    console.log('✅ RAG: ' + ragMetrics.chunksRetrieved + ' chunks');
  } catch (e) {
    console.error('❌ [PROCESS-GENERATION-BG] RAG search FAILED:', {
      message: e.message,
      name: e.name,
      stack: e.stack?.substring(0, 500)
    });
    ragMetrics = { chunksRetrieved: 0, knowledgeContextPassed: false, error: e.message };
  }
  await updateJobStatus(jobId, { current_chunk_name: 'Generating ideas...' });

  const knowledgeSection = knowledgeContext ? `\n## KNOWLEDGE\n${knowledgeContext}\n` : '';

  const ideasPrompt = `
Generate 3 lead magnet ideas:

## PROFILE
Name: ${profile.name}
Niche: ${profile.niche || 'Not specified'}

## AUDIENCE
${audience ? `Name: ${audience.name}
Pain Points: ${(audience?.pain_points || []).join(', ') || 'Not specified'}
Desires: ${(audience?.desires || []).join(', ') || 'Not specified'}` : 'General audience'}

## TARGET PRODUCT (Lead magnet creates desire for this)
Name: ${front_end_product.name}
Price: $${front_end_product.price}
Description: ${front_end_product.description || 'Not specified'}

## EXCLUDED TOPICS (Do NOT suggest these)
${(excluded_topics || []).join(', ') || 'None'}
${knowledgeSection}
Remember:
- PDF ONLY formats (no video, no courses, no "hours")
- Use the specificity formula with numbers
- Each idea bridges to the target product
${getLanguagePromptSuffix(language)}`;

  // Maria Wendt-based PDF-only Lead Magnet Strategist Prompt - SMALL = FAST RESULTS
  const ideasSystemPrompt = `You are an elite lead magnet strategist. Your recommendations are based on PROVEN data from 1,153 high-performing Instagram posts (Maria Wendt analysis).

## CORE PHILOSOPHY: SMALL = FAST RESULTS
People don't want to read 40+ pages. They want QUICK WINS.
- A 1-page guide is MORE appealing than a 50-page guide
- "Get results in 3 simple steps" beats "comprehensive 100-page manual"
- Short = Easy to consume = Higher completion rate = More desire for paid product

## FORMAT PERFORMANCE (by average comments - PROVEN DATA)
1. Strategy/System: 1,729 avg - "my exact strategy for..."
2. Checklist/Steps: 808 avg - X steps to achieve Y
3. Cheat Sheet: Quick reference one-pager

## LEAD MAGNET LENGTH (CRITICAL)
Lead magnets MUST be SHORT:
- 1-5 pages MAXIMUM
- 3-7 steps/items MAXIMUM
- Consumable in 5-10 minutes

## PDF-ONLY FORMATS (MANDATORY)
- Strategy/System (my exact strategy for...)
- Checklist (X Simple Steps to...)
- Cheat Sheet (The 1-Page Cheat Sheet)
- Blueprint (The Simple Blueprint)
- Swipe File (X Ready-to-Use Templates)

## FORBIDDEN (NEVER suggest):
- Video courses, mini-courses, training modules
- Multi-page guides over 5 pages for a lead magnet
- "Comprehensive" or "Complete" guides
- Big numbers for LONG items (e.g., "50-Page Guide", "88 Full Scripts")

## CRITICAL: NUMBER × ITEM LENGTH RULE
The number depends on what type of item it is:

**SHORT ITEMS (one-liners) = BIG numbers OK:**
- "100 Instagram Reel Ideas" ✓ (just 100 short lines)
- "50 Email Subject Lines" ✓ (50 short lines)
- "75 Hooks That Stop Scroll" ✓ (75 short hooks)
- "50 ChatGPT Prompts" ✓ (each prompt is 1-2 lines)

**LONG ITEMS (pages, detailed content) = SMALL numbers:**
- "The 3-Page Blueprint" ✓ (only 3 pages)
- "5 Email Templates" ✓ (5 detailed templates)
- "7 Scripts" ✓ (7 scripts)

**BAD (big numbers for long items):**
- "42-Page Guide" ❌ - TOO MANY PAGES!
- "88 Full Email Sequences" ❌ - Each is LONG!

| Item Type | Max Number | Example |
|-----------|------------|---------|
| Ideas/Titles | 100-365 | "100 Reel Ideas" |
| Hooks/One-liners | 50-100 | "75 Hooks" |
| Subject Lines | 50-100 | "50 Subject Lines" |
| Prompts | 30-50 | "50 ChatGPT Prompts" |
| Pages/Guides | 1-5 | "3-Page Blueprint" |
| Full Templates | 5-15 | "7 Email Templates" |
| Scripts | 5-10 | "5 Sales Scripts" |

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "ideas": [
    {
      "title": "Short title with SMALL number (1, 3, 5, 7)",
      "format": "One of the allowed PDF formats",
      "topic": "Brief topic description",
      "keyword": "MEMORABLE_KEYWORD",
      "why_it_works": "Data-backed reasoning",
      "bridges_to_product": "How this leads to target product"
    }
  ]
}

## RULES
1. All 3 ideas must be DIFFERENT approaches
2. All ideas must be 1-5 pages MAX
3. Numbers should be SMALL (1, 3, 5, 7 - not 42, 88, 127)
4. Focus on QUICK WINS
5. ONLY output JSON, no other text`;

  const ideas = await generateWithRetry(
    ideasPrompt,
    ideasSystemPrompt,
    jobId,
    'Generating ideas',
    2000
  );

  console.log('✅ [PROCESS-GENERATION-BG] Lead magnet ideas generated:', {
    ideasCount: ideas?.ideas?.length || 0,
    titles: ideas?.ideas?.map(i => i.title) || []
  });

  await updateJobStatus(jobId, { completed_chunks: 1 });

  // Log RAG retrieval to database for audit (per Vision Doc compliance)
  if (ragMetrics) {
    try {
      await logRagRetrieval({
        userId: inputData.user_id || null,
        profileId: profile?.id || null,
        audienceId: audience?.id || null,
        sourceFunction: 'generate-lead-magnet-ideas-bg',
        generationType: 'lead-magnet-ideas',
        metrics: ragMetrics,
        generationSuccessful: true
      });
      console.log('✅ RAG logged to rag_retrieval_logs');
    } catch (logErr) {
      console.error('⚠️ RAG log failed:', logErr.message);
    }
  }

  return ideas;
}

// ============================================
// TLDR GENERATION
// ============================================

async function generateTLDR(jobId, productData, language = 'English') {
  console.log('📝 [PROCESS-GENERATION-BG] generateTLDR called:', {
    jobId,
    productName: productData?.name,
    price: productData?.price,
    language
  });

  const { name, description, format, price } = productData;

  const tldrPrompt = `
Create a TLDR summary for this product:

Product Name: ${name}
Description: ${description || 'Not provided'}
Format: ${format}
Price: $${price}

Return ONLY valid JSON with this exact structure:
{
  "what_it_is": "One clear sentence describing what this product is",
  "who_its_for": "One sentence describing the ideal customer",
  "problem_solved": "One sentence about the main problem it solves",
  "whats_inside": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
  "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "cta": "A compelling call to action"
}
${getLanguagePromptSuffix(language)}`;

  const tldrSystemPrompt = `You are a marketing copywriter. Create concise, compelling TLDR summaries that help customers quickly understand product value. Be specific and benefit-focused. Return ONLY valid JSON.`;

  const tldr = await generateWithRetry(
    tldrPrompt,
    tldrSystemPrompt,
    jobId,
    'Generating TLDR',
    1000
  );

  console.log('✅ [PROCESS-GENERATION-BG] TLDR generated for:', productData?.name);
  return tldr;
}

// ============================================
// CROSS-PROMO GENERATION
// ============================================

async function generateCrossPromo(jobId, productData, existingProduct, profile, language = 'English') {
  console.log('🔗 [PROCESS-GENERATION-BG] generateCrossPromo called:', {
    jobId,
    productName: productData?.name,
    existingProduct: existingProduct?.name || 'none',
    profile: profile?.name,
    language
  });

  if (!existingProduct) {
    console.log('⚠️ [PROCESS-GENERATION-BG] No existing product, skipping cross-promo');
    return null; // No cross-promo without destination product
  }

  const crossPromoPrompt = `
Write a cross-promotion paragraph for the end of a product:

CURRENT PRODUCT:
Name: ${productData.name}
Price: $${productData.price}

DESTINATION PRODUCT (what we're promoting):
Name: ${existingProduct.name}
Price: $${existingProduct.price}
Description: ${existingProduct.description || 'Premium offering'}

CREATOR: ${profile.name}

Write a 150-200 word promotional paragraph that:
1. Acknowledges the value they just got from the current product
2. Creates curiosity about the destination product
3. Positions the destination product as the next logical step
4. Includes a soft CTA (no aggressive sales language)

Keep it conversational and authentic to the creator's voice.
Do NOT include the destination product URL - that will be added separately.
${getLanguagePromptSuffix(language)}`;

  const crossPromoSystemPrompt = `You are a conversion copywriter specializing in natural, non-pushy cross-promotions. Write promotional copy that feels like a helpful recommendation from a friend, not a sales pitch. Output only the promotional paragraph text, no JSON.`;

  try {
    console.log('🔄 [PROCESS-GENERATION-BG] Calling Claude API for cross-promo...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: crossPromoSystemPrompt,
      messages: [{ role: 'user', content: crossPromoPrompt }]
    });

    console.log('✅ [PROCESS-GENERATION-BG] Cross-promo generated:', {
      length: response.content[0]?.text?.length || 0
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error('❌ [PROCESS-GENERATION-BG] Cross-promo generation failed:', error.message);
    return null;
  }
}

// ============================================
// MAIN HANDLER
// ============================================

export async function handler(event) {
  console.log('🚀 [PROCESS-GENERATION-BG] Function invoked');
  // Background functions should return quickly
  // The actual work happens async

  console.log('🔧 [PROCESS-GENERATION-BG] Environment check:', {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  try {
    const { job_id } = JSON.parse(event.body || '{}');

    console.log('📥 [PROCESS-GENERATION-BG] Received job_id:', job_id);

    if (!job_id) {
      console.log('❌ [PROCESS-GENERATION-BG] Missing job_id');
      return { statusCode: 400, body: JSON.stringify({ error: 'job_id required' }) };
    }

    console.log('🔄 [PROCESS-GENERATION-BG] Fetching job from database:', job_id);

    // Get job from database
    const { data: job, error: fetchError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (fetchError || !job) {
      console.error('❌ [PROCESS-GENERATION-BG] Job not found:', fetchError?.message);
      return { statusCode: 404, body: JSON.stringify({ error: 'Job not found' }) };
    }

    console.log('✅ [PROCESS-GENERATION-BG] Job fetched:', {
      job_id: job.id,
      job_type: job.job_type,
      status: job.status,
      user_id: job.user_id
    });

    // Skip if already processing or complete
    if (job.status === 'processing' || job.status === 'complete') {
      console.log(`⚠️ [PROCESS-GENERATION-BG] Job ${job_id} is already ${job.status}, skipping`);
      return { statusCode: 200, body: JSON.stringify({ status: job.status }) };
    }

    // Process based on job type
    try {
      let result;

      console.log('🔄 [PROCESS-GENERATION-BG] Starting processing for job_type:', job.job_type);

      switch (job.job_type) {
        case 'lead_magnet_content':
          console.log('📄 [PROCESS-GENERATION-BG] Generating lead magnet content...');
          result = await generateLeadMagnetContent(job_id, job.input_data);
          break;

        case 'funnel_product':
          console.log('📦 [PROCESS-GENERATION-BG] Generating funnel product...');
          result = await generateProductContent(job_id, job.input_data);
          break;

        case 'funnel':
          console.log('🎯 [PROCESS-GENERATION-BG] Generating funnel...');
          result = await generateFunnel(job_id, job.input_data);
          break;

        case 'lead_magnet_ideas':
          console.log('💡 [PROCESS-GENERATION-BG] Generating lead magnet ideas...');
          result = await generateLeadMagnetIdeas(job_id, job.input_data);
          break;

        default:
          console.error('❌ [PROCESS-GENERATION-BG] Unknown job type:', job.job_type);
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Mark complete
      console.log('🔄 [PROCESS-GENERATION-BG] Marking job as complete...');
      await updateJobStatus(job_id, {
        status: 'complete',
        result,
        completed_at: new Date().toISOString(),
        current_chunk_name: 'Complete!'
      });

      console.log('✅ [PROCESS-GENERATION-BG] Job completed successfully:', job_id);
      return { statusCode: 200, body: JSON.stringify({ status: 'complete' }) };

    } catch (error) {
      console.error('❌ [PROCESS-GENERATION-BG] Job failed:', {
        job_id,
        error: error.message,
        stack: error.stack,
        status: error.status || 'N/A'
      });

      // Get current state for partial progress
      console.log('🔄 [PROCESS-GENERATION-BG] Fetching current job state for partial progress...');
      const { data: currentJob } = await supabase
        .from('generation_jobs')
        .select('completed_chunks, chunks_data')
        .eq('id', job_id)
        .single();

      console.log('📊 [PROCESS-GENERATION-BG] Partial progress:', {
        completed_chunks: currentJob?.completed_chunks || 0,
        chunks_count: currentJob?.chunks_data?.length || 0
      });

      await updateJobStatus(job_id, {
        status: 'failed',
        error_message: error.message,
        failed_at_chunk: currentJob?.completed_chunks || 0,
        last_error_code: error.status || 500
      });

      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

  } catch (error) {
    console.error('❌ [PROCESS-GENERATION-BG] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
