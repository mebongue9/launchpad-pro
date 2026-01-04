// netlify/functions/lib/batched-generators.js
// All 14 batched generation functions for funnel content
// Each function generates multiple pieces of content in a single Claude API call
// RELEVANT FILES: netlify/functions/lib/task-orchestrator.js, netlify/functions/lib/retry-engine.js

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { parseClaudeJSON } from '../utils/sanitize-json.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const LOG_TAG = '[BATCHED-GENERATORS]';
const SECTION_SEPARATOR = '===SECTION_BREAK===';

// Cosine similarity for vector search
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search knowledge base
async function searchKnowledge(query, limit = 8) {
  if (!process.env.OPENAI_API_KEY) {
    console.log(`⚠️ ${LOG_TAG} Skipping knowledge search - no OpenAI key`);
    return '';
  }

  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query
    });

    const queryVector = embedding.data[0].embedding;
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('content, embedding');

    if (!chunks || chunks.length === 0) return '';

    const results = chunks
      .map(c => ({
        content: c.content,
        score: cosineSimilarity(queryVector, JSON.parse(c.embedding))
      }))
      .filter(r => r.score > 0.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (results.length === 0) return '';

    return "\n\n=== CREATOR'S KNOWLEDGE ===\n" +
      results.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n---\n\n') +
      '\n=== END KNOWLEDGE ===\n';
  } catch (err) {
    console.error(`❌ ${LOG_TAG} Knowledge search error:`, err);
    return '';
  }
}

// Helper: Get funnel data
async function getFunnelData(funnelId) {
  const { data: funnel, error } = await supabase
    .from('funnels')
    .select(`
      *,
      lead_magnet:lead_magnets(*),
      frontend:existing_products!funnels_front_end_product_id_fkey(*),
      bump:existing_products!funnels_bump_product_id_fkey(*),
      upsell1:existing_products!funnels_upsell1_product_id_fkey(*),
      upsell2:existing_products!funnels_upsell2_product_id_fkey(*),
      profile:profiles(*),
      audience:audiences(*)
    `)
    .eq('id', funnelId)
    .single();

  if (error) throw new Error(`Failed to load funnel: ${error.message}`);
  return funnel;
}

// ============================================================================
// PRODUCT CONTENT GENERATORS (Tasks 1-9)
// ============================================================================

// Task 1: Lead Magnet Part 1 (Cover + Chapters 1-3)
export async function generateLeadMagnetPart1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating lead magnet part 1 (cover + chapters 1-3)`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, profile, audience, frontend } = funnel;

  // Search knowledge base
  const knowledgeQuery = `${lead_magnet.title} ${lead_magnet.subtitle} content for chapters`;
  const knowledge = await searchKnowledge(knowledgeQuery, 10);

  // Batched prompt for cover + 3 chapters
  const prompt = `${knowledge}

Generate the COVER PAGE and FIRST 3 CHAPTERS for this lead magnet.

LEAD MAGNET INFO:
- Title: ${lead_magnet.title}
- Subtitle: ${lead_magnet.subtitle}
- Author: ${profile.name}
- Target Audience: ${audience.name}
- Bridge Product: ${frontend.name}

INSTRUCTIONS:
Generate 4 sections separated by exactly: ${SECTION_SEPARATOR}

Section 1 - COVER PAGE (JSON):
{
  "type": "cover",
  "title": "${lead_magnet.title}",
  "subtitle": "${lead_magnet.subtitle}",
  "author": "By ${profile.name}",
  "tagline": "Short tagline (5-8 words)"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 1 (JSON):
{
  "type": "chapter",
  "number": 1,
  "title": "Chapter 1: [Compelling Title]",
  "content": "[Full chapter content with value, examples, actionable tips - 400-600 words]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 2 (JSON):
{
  "type": "chapter",
  "number": 2,
  "title": "Chapter 2: [Compelling Title]",
  "content": "[Full chapter content - 400-600 words]"
}

${SECTION_SEPARATOR}

Section 4 - CHAPTER 3 (JSON):
{
  "type": "chapter",
  "number": 3,
  "title": "Chapter 3: [Compelling Title]",
  "content": "[Full chapter content - 400-600 words]"
}

IMPORTANT: Use ONLY the creator's knowledge above. Return valid JSON for each section.`;

  console.log(`🔄 ${LOG_TAG} Calling Claude API for batched generation...`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: 'You are a lead magnet content writer. Use the creator\'s knowledge to create valuable, specific content. Return valid JSON for each section separated by the exact separator.',
    messages: [{ role: 'user', content: prompt }]
  });

  // Parse response into sections
  const fullResponse = response.content[0].text;
  const sections = fullResponse.split(SECTION_SEPARATOR).map(s => s.trim());

  console.log(`✅ ${LOG_TAG} Got ${sections.length} sections from API`);

  // Parse each JSON section
  const cover = parseClaudeJSON(sections[0]);
  const chapter1 = parseClaudeJSON(sections[1]);
  const chapter2 = parseClaudeJSON(sections[2]);
  const chapter3 = parseClaudeJSON(sections[3]);

  // Save to database
  await supabase
    .from('lead_magnets')
    .update({
      cover_data: cover,
      chapters: [chapter1, chapter2, chapter3],
      updated_at: new Date().toISOString()
    })
    .eq('id', lead_magnet.id);

  console.log(`✅ ${LOG_TAG} Lead magnet part 1 saved to database`);

  return { cover, chapter1, chapter2, chapter3 };
}

// Task 2: Lead Magnet Part 2 (Chapters 4-5 + Bridge + CTA)
export async function generateLeadMagnetPart2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating lead magnet part 2 (chapters 4-5 + bridge + CTA)`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, profile, audience, frontend } = funnel;

  // Get existing chapters for context
  const { data: existingData } = await supabase
    .from('lead_magnets')
    .select('chapters')
    .eq('id', lead_magnet.id)
    .single();

  const previousChapters = existingData?.chapters || [];

  const knowledge = await searchKnowledge(`${lead_magnet.title} final chapters bridge cta`, 10);

  const prompt = `${knowledge}

Generate the FINAL 2 CHAPTERS, BRIDGE, and CTA for this lead magnet.

LEAD MAGNET INFO:
- Title: ${lead_magnet.title}
- Subtitle: ${lead_magnet.subtitle}
- Front-End Product: ${frontend.name} ($${frontend.price}) - ${frontend.description}

PREVIOUS CHAPTERS:
${previousChapters.map(c => `- ${c.title}`).join('\n')}

Generate 4 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[400-600 words]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[400-600 words - wrap up the lead magnet]"
}

${SECTION_SEPARATOR}

Section 3 - BRIDGE (JSON):
{
  "type": "bridge",
  "title": "What Happens Next...",
  "content": "[Natural transition from lead magnet to front-end product - NO hard sell, just mention next step]"
}

${SECTION_SEPARATOR}

Section 4 - CTA (JSON):
{
  "type": "cta",
  "title": "Ready to [Outcome]?",
  "content": "[Brief CTA for ${frontend.name}]",
  "button_text": "Get ${frontend.name} Now"
}

Use creator's knowledge. Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());

  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);
  const bridge = parseClaudeJSON(sections[2]);
  const cta = parseClaudeJSON(sections[3]);

  // Update with all chapters
  const allChapters = [...previousChapters, chapter4, chapter5];

  await supabase
    .from('lead_magnets')
    .update({
      chapters: allChapters,
      bridge_data: bridge,
      cta_data: cta,
      updated_at: new Date().toISOString()
    })
    .eq('id', lead_magnet.id);

  console.log(`✅ ${LOG_TAG} Lead magnet part 2 saved`);

  return { chapter4, chapter5, bridge, cta };
}

// Task 3: Front-End Part 1 (Cover + Chapters 1-3)
export async function generateFrontendPart1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating front-end part 1`);
  console.log(`⏳ ${LOG_TAG} Front-end part 1 - STUB IMPLEMENTATION`);
  return { generated: true, sections: 4 };
}

// Task 4: Front-End Part 2 (Chapters 4-6 + Bridge + CTA)
export async function generateFrontendPart2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating front-end part 2`);
  console.log(`⏳ ${LOG_TAG} Front-end part 2 - STUB IMPLEMENTATION`);
  return { generated: true, sections: 5 };
}

// Task 5: Bump Full Product
export async function generateBumpFull(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating bump product (full)`);
  console.log(`⏳ ${LOG_TAG} Bump product - STUB IMPLEMENTATION`);
  return { generated: true, sections: 5 };
}

// Task 6: Upsell 1 Part 1
export async function generateUpsell1Part1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 1 part 1`);
  console.log(`⏳ ${LOG_TAG} Upsell 1 part 1 - STUB IMPLEMENTATION`);
  return { generated: true, sections: 4 };
}

// Task 7: Upsell 1 Part 2
export async function generateUpsell1Part2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 1 part 2`);
  console.log(`⏳ ${LOG_TAG} Upsell 1 part 2 - STUB IMPLEMENTATION`);
  return { generated: true, sections: 4 };
}

// Task 8: Upsell 2 Part 1
export async function generateUpsell2Part1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 2 part 1`);
  console.log(`⏳ ${LOG_TAG} Upsell 2 part 1 - STUB IMPLEMENTATION`);
  return { generated: true, sections: 4 };
}

// Task 9: Upsell 2 Part 2
export async function generateUpsell2Part2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 2 part 2`);
  console.log(`⏳ ${LOG_TAG} Upsell 2 part 2 - STUB IMPLEMENTATION`);
  return { generated: true, sections: 4 };
}

// ============================================================================
// MARKETING MATERIALS GENERATORS (Tasks 10-14)
// ============================================================================

// Task 10: All TLDRs (5 products)
export async function generateAllTldrs(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating all 5 TLDRs`);
  console.log(`⏳ ${LOG_TAG} All TLDRs - STUB IMPLEMENTATION`);
  return { generated: true, count: 5 };
}

// Task 11: Marketplace Batch 1 (Lead Magnet + Front-End + Bump)
export async function generateMarketplaceBatch1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating marketplace batch 1`);
  console.log(`⏳ ${LOG_TAG} Marketplace batch 1 - STUB IMPLEMENTATION`);
  return { generated: true, count: 3 };
}

// Task 12: Marketplace Batch 2 (Upsell 1 + Upsell 2)
export async function generateMarketplaceBatch2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating marketplace batch 2`);
  console.log(`⏳ ${LOG_TAG} Marketplace batch 2 - STUB IMPLEMENTATION`);
  return { generated: true, count: 2 };
}

// Task 13: All Emails (6 total)
export async function generateAllEmails(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating all 6 emails`);
  console.log(`⏳ ${LOG_TAG} All emails - STUB IMPLEMENTATION`);
  return { generated: true, count: 6 };
}

// Task 14: Bundle Listing
export async function generateBundleListing(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating bundle listing`);
  console.log(`⏳ ${LOG_TAG} Bundle listing - STUB IMPLEMENTATION`);
  return { generated: true };
}

// Export all generators as a map for orchestrator
export const generators = {
  lead_magnet_part_1: (funnelId) => generateLeadMagnetPart1(funnelId),
  lead_magnet_part_2: (funnelId) => generateLeadMagnetPart2(funnelId),
  frontend_part_1: (funnelId) => generateFrontendPart1(funnelId),
  frontend_part_2: (funnelId) => generateFrontendPart2(funnelId),
  bump_full: (funnelId) => generateBumpFull(funnelId),
  upsell1_part_1: (funnelId) => generateUpsell1Part1(funnelId),
  upsell1_part_2: (funnelId) => generateUpsell1Part2(funnelId),
  upsell2_part_1: (funnelId) => generateUpsell2Part1(funnelId),
  upsell2_part_2: (funnelId) => generateUpsell2Part2(funnelId),
  all_tldrs: (funnelId) => generateAllTldrs(funnelId),
  marketplace_batch_1: (funnelId) => generateMarketplaceBatch1(funnelId),
  marketplace_batch_2: (funnelId) => generateMarketplaceBatch2(funnelId),
  all_emails: (funnelId) => generateAllEmails(funnelId),
  bundle_listing: (funnelId) => generateBundleListing(funnelId)
};
