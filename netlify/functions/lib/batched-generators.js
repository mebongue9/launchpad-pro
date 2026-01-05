// netlify/functions/lib/batched-generators.js
// All 14 batched generation functions for funnel content
// Each function generates multiple pieces of content in a single Claude API call
// CROSS-PROMO: Embedded in last chapter of each product (not separate bridge/cta)
//   - Lead Magnet → promotes Front-End
//   - Front-End, Bump, Upsell 1, Upsell 2 → promote Main Product (from existing_product_id)
//   - Uses main_product.mention_price flag (defaults to false if not set)
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

// Helper: Get funnel data (including Main Product for cross-promo)
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
      main_product:existing_products!funnels_existing_product_id_fkey(*),
      profile:profiles(*),
      audience:audiences(*)
    `)
    .eq('id', funnelId)
    .single();

  if (error) throw new Error(`Failed to load funnel: ${error.message}`);
  return funnel;
}

// Helper: Build cross-promo paragraph to embed in content
// For Lead Magnet: promotes Front-End
// For paid products (Front-End, Bump, Upsell 1, Upsell 2): promotes Main Product
function buildCrossPromoParagraph(promotedProduct, mentionPrice = false) {
  if (!promotedProduct) return '';

  const name = promotedProduct.name || 'our premium product';
  const tldr = promotedProduct.tldr || promotedProduct.description || '';
  const url = promotedProduct.url || '';
  const price = promotedProduct.price;

  let promo = `\n\n---\n\n**Want to take this further?**\n\n`;
  promo += `If you found this valuable, you'll love "${name}". `;

  if (tldr) {
    promo += `${tldr} `;
  }

  if (mentionPrice && price) {
    promo += `Get it now for just $${price}. `;
  }

  if (url) {
    promo += `\n\n[Learn more about ${name}](${url})`;
  }

  return promo;
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

// Task 2: Lead Magnet Part 2 (Chapters 4-5 with embedded cross-promo promoting Front-End)
export async function generateLeadMagnetPart2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating lead magnet part 2 (chapters 4-5 with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, profile, audience, frontend } = funnel;

  // Get existing chapters for context
  const { data: existingData } = await supabase
    .from('lead_magnets')
    .select('chapters')
    .eq('id', lead_magnet.id)
    .single();

  const previousChapters = existingData?.chapters || [];

  const knowledge = await searchKnowledge(`${lead_magnet.title} final chapters`, 10);

  // Build cross-promo paragraph for Front-End product
  // Lead Magnet always promotes Front-End (not Main Product)
  const crossPromo = buildCrossPromoParagraph(frontend, false);

  const prompt = `${knowledge}

Generate the FINAL 2 CHAPTERS for this lead magnet.

LEAD MAGNET INFO:
- Title: ${lead_magnet.title}
- Subtitle: ${lead_magnet.subtitle}
- Front-End Product: ${frontend.name} ($${frontend.price})

PREVIOUS CHAPTERS:
${previousChapters.map(c => `- ${c.title}`).join('\n')}

IMPORTANT: Chapter 5 (the final chapter) MUST end with a natural cross-promotion paragraph that promotes "${frontend.name}".
The cross-promo should feel like a natural conclusion, not a hard sell. Something like:
"If you enjoyed this and want to take it further, check out [product name] which [brief benefit]..."

Generate 2 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[400-600 words of valuable content]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[400-600 words - wrap up content AND include a natural cross-promo paragraph at the end promoting ${frontend.name}]"
}

Use creator's knowledge. Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());

  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);

  // Ensure cross-promo is embedded in chapter 5 content if AI didn't include it
  if (chapter5.content && !chapter5.content.toLowerCase().includes(frontend.name.toLowerCase())) {
    chapter5.content += crossPromo;
  }

  // Update with all chapters (no separate bridge/cta - cross-promo is embedded)
  const allChapters = [...previousChapters, chapter4, chapter5];

  await supabase
    .from('lead_magnets')
    .update({
      chapters: allChapters,
      updated_at: new Date().toISOString()
    })
    .eq('id', lead_magnet.id);

  console.log(`✅ ${LOG_TAG} Lead magnet part 2 saved (cross-promo embedded in chapter 5)`);

  return { chapter4, chapter5 };
}

// Task 3: Front-End Part 1 (Cover + Chapters 1-3)
export async function generateFrontendPart1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating front-end part 1 (cover + chapters 1-3)`);

  const funnel = await getFunnelData(funnelId);
  const { frontend, profile, audience, bump } = funnel;

  const knowledge = await searchKnowledge(`${frontend.name} ${frontend.description} content chapters`, 10);

  const prompt = `${knowledge}

Generate COVER PAGE and FIRST 3 CHAPTERS for this front-end product.

PRODUCT INFO:
- Name: ${frontend.name}
- Price: $${frontend.price}
- Description: ${frontend.description}
- Target Audience: ${audience.name}

Generate 4 sections separated by: ${SECTION_SEPARATOR}

Section 1 - COVER (JSON):
{
  "type": "cover",
  "title": "${frontend.name}",
  "subtitle": "${frontend.description}",
  "author": "By ${profile.name}",
  "price": "$${frontend.price}"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 1 (JSON):
{
  "type": "chapter",
  "number": 1,
  "title": "Chapter 1: [Title]",
  "content": "[500-800 words of valuable content]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 2 (JSON):
{
  "type": "chapter",
  "number": 2,
  "title": "Chapter 2: [Title]",
  "content": "[500-800 words]"
}

${SECTION_SEPARATOR}

Section 4 - CHAPTER 3 (JSON):
{
  "type": "chapter",
  "number": 3,
  "title": "Chapter 3: [Title]",
  "content": "[500-800 words]"
}

Use creator's knowledge. Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());

  const cover = parseClaudeJSON(sections[0]);
  const chapter1 = parseClaudeJSON(sections[1]);
  const chapter2 = parseClaudeJSON(sections[2]);
  const chapter3 = parseClaudeJSON(sections[3]);

  await supabase
    .from('existing_products')
    .update({
      cover_data: cover,
      chapters: [chapter1, chapter2, chapter3],
      updated_at: new Date().toISOString()
    })
    .eq('id', frontend.id);

  console.log(`✅ ${LOG_TAG} Front-end part 1 saved`);

  return { cover, chapter1, chapter2, chapter3 };
}

// Task 4: Front-End Part 2 (Chapters 4-6 with embedded cross-promo promoting Main Product)
export async function generateFrontendPart2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating front-end part 2 (chapters 4-6 with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { frontend, main_product } = funnel;

  const { data: existingData } = await supabase
    .from('existing_products')
    .select('chapters')
    .eq('id', frontend.id)
    .single();

  const previousChapters = existingData?.chapters || [];

  const knowledge = await searchKnowledge(`${frontend.name} final chapters`, 10);

  // Cross-promo promotes Main Product (user's flagship product)
  // mention_price defaults to false if not set
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);

  const promoProductName = main_product?.name || 'our premium offering';

  const prompt = `${knowledge}

Generate FINAL 3 CHAPTERS for this front-end product.

PRODUCT: ${frontend.name} - ${frontend.description}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

PREVIOUS CHAPTERS:
${previousChapters.map(c => `- ${c.title}`).join('\n')}

IMPORTANT: Chapter 6 (the final chapter) MUST end with a natural cross-promotion paragraph that promotes "${promoProductName}".
The cross-promo should feel like a natural next step, not a hard sell.

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[500-800 words]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[500-800 words]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 6 (JSON):
{
  "type": "chapter",
  "number": 6,
  "title": "Chapter 6: [Title]",
  "content": "[500-800 words - wrap up AND include cross-promo paragraph at the end promoting ${promoProductName}]"
}

Use creator's knowledge. Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 14000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());

  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);
  const chapter6 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter6.content && main_product && !chapter6.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter6.content += crossPromo;
  }

  const allChapters = [...previousChapters, chapter4, chapter5, chapter6];

  await supabase
    .from('existing_products')
    .update({
      chapters: allChapters,
      updated_at: new Date().toISOString()
    })
    .eq('id', frontend.id);

  console.log(`✅ ${LOG_TAG} Front-end part 2 saved (cross-promo embedded promoting Main Product)`);

  return { chapter4, chapter5, chapter6 };
}

// Task 5: Bump Full Product (short format with embedded cross-promo promoting Main Product)
export async function generateBumpFull(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating bump product (short format with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { bump, profile, audience, main_product } = funnel;

  const knowledge = await searchKnowledge(`${bump.name} ${bump.description} quick actionable`, 8);

  // Cross-promo promotes Main Product (user's flagship product)
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);
  const promoProductName = main_product?.name || 'our premium offering';

  const prompt = `${knowledge}

Generate COMPLETE BUMP PRODUCT (short format - quick wins).

PRODUCT: ${bump.name}
Price: $${bump.price}
Description: ${bump.description}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

This is a BUMP OFFER - keep it SHORT and ACTIONABLE (3 sections total).

IMPORTANT: Chapter 2 (the final chapter) MUST end with a brief cross-promotion paragraph promoting "${promoProductName}".

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - COVER (JSON):
{
  "type": "cover",
  "title": "${bump.name}",
  "subtitle": "${bump.description}",
  "author": "By ${profile.name}",
  "price": "$${bump.price}"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 1 (JSON):
{
  "type": "chapter",
  "number": 1,
  "title": "Chapter 1: [Quick Win Title]",
  "content": "[300-400 words - immediate value]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 2 (JSON):
{
  "type": "chapter",
  "number": 2,
  "title": "Chapter 2: [Actionable Title]",
  "content": "[300-400 words - actionable steps AND end with brief cross-promo for ${promoProductName}]"
}

Keep it SHORT and ACTIONABLE. Use creator's knowledge. Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());

  const cover = parseClaudeJSON(sections[0]);
  const chapter1 = parseClaudeJSON(sections[1]);
  const chapter2 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter2.content && main_product && !chapter2.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter2.content += crossPromo;
  }

  await supabase
    .from('existing_products')
    .update({
      cover_data: cover,
      chapters: [chapter1, chapter2],
      updated_at: new Date().toISOString()
    })
    .eq('id', bump.id);

  console.log(`✅ ${LOG_TAG} Bump product saved (cross-promo embedded promoting Main Product)`);

  return { cover, chapter1, chapter2 };
}

// Task 6: Upsell 1 Part 1 (Cover + First Half)
export async function generateUpsell1Part1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 1 part 1`);

  const funnel = await getFunnelData(funnelId);
  const { upsell1, profile, audience } = funnel;

  const knowledge = await searchKnowledge(`${upsell1.name} ${upsell1.description}`, 10);

  const prompt = `${knowledge}

Generate COVER and FIRST HALF for this upsell product.

PRODUCT: ${upsell1.name} ($${upsell1.price})
Description: ${upsell1.description}

Generate 4 sections separated by: ${SECTION_SEPARATOR}

Section 1 - COVER (JSON), Section 2-4 - CHAPTERS 1-3 (JSON)

Use 600-800 words per chapter. Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const cover = parseClaudeJSON(sections[0]);
  const chapters = [parseClaudeJSON(sections[1]), parseClaudeJSON(sections[2]), parseClaudeJSON(sections[3])];

  await supabase.from('existing_products').update({
    cover_data: cover,
    chapters,
    updated_at: new Date().toISOString()
  }).eq('id', upsell1.id);

  console.log(`✅ ${LOG_TAG} Upsell 1 part 1 saved`);
  return { cover, chapters };
}

// Task 7: Upsell 1 Part 2 (Second Half with embedded cross-promo promoting Main Product)
export async function generateUpsell1Part2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 1 part 2 (with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { upsell1, main_product } = funnel;

  const { data: existingData } = await supabase.from('existing_products').select('chapters').eq('id', upsell1.id).single();
  const previousChapters = existingData?.chapters || [];

  const knowledge = await searchKnowledge(`${upsell1.name} final chapters`, 10);

  // Cross-promo promotes Main Product (user's flagship product)
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);
  const promoProductName = main_product?.name || 'our premium offering';

  const prompt = `${knowledge}

Generate FINAL 3 CHAPTERS for upsell 1.

PRODUCT: ${upsell1.name}
PREVIOUS CHAPTERS: ${previousChapters.map(c => c.title).join(', ')}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

IMPORTANT: Chapter 6 (the final chapter) MUST end with a natural cross-promotion paragraph promoting "${promoProductName}".

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[600-800 words]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[600-800 words]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 6 (JSON):
{
  "type": "chapter",
  "number": 6,
  "title": "Chapter 6: [Title]",
  "content": "[600-800 words - wrap up AND include cross-promo paragraph at the end promoting ${promoProductName}]"
}

Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 14000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);
  const chapter6 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter6.content && main_product && !chapter6.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter6.content += crossPromo;
  }

  await supabase.from('existing_products').update({
    chapters: [...previousChapters, chapter4, chapter5, chapter6],
    updated_at: new Date().toISOString()
  }).eq('id', upsell1.id);

  console.log(`✅ ${LOG_TAG} Upsell 1 part 2 saved (cross-promo embedded promoting Main Product)`);
  return { chapter4, chapter5, chapter6 };
}

// Task 8: Upsell 2 Part 1 (Cover + First Half)
export async function generateUpsell2Part1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 2 part 1`);

  const funnel = await getFunnelData(funnelId);
  const { upsell2, profile } = funnel;

  const knowledge = await searchKnowledge(`${upsell2.name} ${upsell2.description}`, 10);

  const prompt = `${knowledge}

Generate COVER and FIRST HALF for final upsell.

PRODUCT: ${upsell2.name} ($${upsell2.price})

Generate 4 sections separated by: ${SECTION_SEPARATOR}

Section 1: COVER, Sections 2-4: CHAPTERS 1-3

600-800 words per chapter. Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const cover = parseClaudeJSON(sections[0]);
  const chapters = [parseClaudeJSON(sections[1]), parseClaudeJSON(sections[2]), parseClaudeJSON(sections[3])];

  await supabase.from('existing_products').update({
    cover_data: cover,
    chapters,
    updated_at: new Date().toISOString()
  }).eq('id', upsell2.id);

  console.log(`✅ ${LOG_TAG} Upsell 2 part 1 saved`);
  return { cover, chapters };
}

// Task 9: Upsell 2 Part 2 (Second Half with embedded cross-promo promoting Main Product)
export async function generateUpsell2Part2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 2 part 2 (with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { upsell2, main_product } = funnel;

  const { data: existingData } = await supabase.from('existing_products').select('chapters').eq('id', upsell2.id).single();
  const previousChapters = existingData?.chapters || [];

  const knowledge = await searchKnowledge(`${upsell2.name} final chapters conclusion`, 10);

  // Cross-promo promotes Main Product (user's flagship product)
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);
  const promoProductName = main_product?.name || 'our premium offering';

  const prompt = `${knowledge}

Generate FINAL 3 CHAPTERS for final upsell.

PRODUCT: ${upsell2.name}
PREVIOUS CHAPTERS: ${previousChapters.map(c => c.title).join(', ')}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

IMPORTANT: Chapter 6 (the final chapter) MUST end with a natural cross-promotion paragraph promoting "${promoProductName}".
This is the final product in the funnel, so the cross-promo should feel like a "complete your journey" recommendation.

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[600-800 words]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[600-800 words]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 6 (JSON):
{
  "type": "chapter",
  "number": 6,
  "title": "Chapter 6: [Title]",
  "content": "[600-800 words - conclusion AND include cross-promo paragraph at the end promoting ${promoProductName}]"
}

Return valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 14000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);
  const chapter6 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter6.content && main_product && !chapter6.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter6.content += crossPromo;
  }

  await supabase.from('existing_products').update({
    chapters: [...previousChapters, chapter4, chapter5, chapter6],
    updated_at: new Date().toISOString()
  }).eq('id', upsell2.id);

  console.log(`✅ ${LOG_TAG} Upsell 2 part 2 saved (cross-promo embedded promoting Main Product)`);
  return { chapter4, chapter5, chapter6 };
}

// ============================================================================
// MARKETING MATERIALS GENERATORS (Tasks 10-14)
// ============================================================================

// Task 10: All TLDRs (5 products)
export async function generateAllTldrs(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 10: Generating all 5 TLDRs in 1 batched call`);

  const { funnel, lead_magnet, frontend, bump, upsell1, upsell2 } = await getFunnelData(funnelId);
  const knowledge = await searchKnowledge(`${funnel.audience} products summary`, 8);

  const prompt = `${knowledge}

Generate SHORT SUMMARIES (TLDRs) for ALL 5 products.

PRODUCTS:
1. Lead Magnet: "${lead_magnet.title}"
2. Front-End: "${frontend.name}"
3. Bump: "${bump.name}"
4. Upsell 1: "${upsell1.name}"
5. Upsell 2: "${upsell2.name}"

Generate 5 sections separated by: ${SECTION_SEPARATOR}

Each TLDR: 2-3 sentences, highlight key benefit and transformation. Return valid JSON:
{
  "tldr": "Short compelling summary..."
}

Section 1: Lead Magnet TLDR
${SECTION_SEPARATOR}
Section 2: Front-End TLDR
${SECTION_SEPARATOR}
Section 3: Bump TLDR
${SECTION_SEPARATOR}
Section 4: Upsell 1 TLDR
${SECTION_SEPARATOR}
Section 5: Upsell 2 TLDR`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const tldrs = sections.map(s => parseClaudeJSON(s));

  // Save TLDRs to respective products
  await supabase.from('lead_magnets').update({ tldr: tldrs[0].tldr }).eq('id', lead_magnet.id);
  await supabase.from('existing_products').update({ tldr: tldrs[1].tldr }).eq('id', frontend.id);
  await supabase.from('existing_products').update({ tldr: tldrs[2].tldr }).eq('id', bump.id);
  await supabase.from('existing_products').update({ tldr: tldrs[3].tldr }).eq('id', upsell1.id);
  await supabase.from('existing_products').update({ tldr: tldrs[4].tldr }).eq('id', upsell2.id);

  console.log(`✅ ${LOG_TAG} All 5 TLDRs saved`);
  return tldrs;
}

// Task 11: Marketplace Batch 1 (Lead Magnet + Front-End + Bump)
export async function generateMarketplaceBatch1(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 11: Generating marketplace listings for Lead Magnet + Front-End + Bump`);

  const { funnel, lead_magnet, frontend, bump } = await getFunnelData(funnelId);
  const knowledge = await searchKnowledge(`${funnel.audience} marketplace product listings`, 10);

  const prompt = `${knowledge}

Generate MARKETPLACE LISTINGS for 3 products.

AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

PRODUCTS:
1. Lead Magnet: "${lead_magnet.title}" (FREE - entry point)
2. Front-End: "${frontend.name}" (Low-ticket paid product)
3. Bump: "${bump.name}" (Order bump - quick win)

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Each listing includes: catchy title, compelling description (2-3 paragraphs), 5-7 benefit bullets, 3-5 tags. Return valid JSON:
{
  "marketplace_title": "Catchy marketplace title",
  "marketplace_description": "Compelling 2-3 paragraph description...",
  "marketplace_bullets": ["Benefit 1", "Benefit 2", ...],
  "marketplace_tags": ["tag1", "tag2", ...]
}

Section 1: Lead Magnet Marketplace Listing
${SECTION_SEPARATOR}
Section 2: Front-End Marketplace Listing
${SECTION_SEPARATOR}
Section 3: Bump Marketplace Listing`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const listings = sections.map(s => parseClaudeJSON(s));

  // Save marketplace listings
  await supabase.from('lead_magnets').update({
    marketplace_listing: listings[0]
  }).eq('id', lead_magnet.id);

  await supabase.from('existing_products').update({
    marketplace_listing: listings[1]
  }).eq('id', frontend.id);

  await supabase.from('existing_products').update({
    marketplace_listing: listings[2]
  }).eq('id', bump.id);

  console.log(`✅ ${LOG_TAG} Marketplace batch 1 saved (3 listings)`);
  return listings;
}

// Task 12: Marketplace Batch 2 (Upsell 1 + Upsell 2)
export async function generateMarketplaceBatch2(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 12: Generating marketplace listings for Upsell 1 + Upsell 2`);

  const { funnel, upsell1, upsell2 } = await getFunnelData(funnelId);
  const knowledge = await searchKnowledge(`${funnel.audience} premium upsell products`, 10);

  const prompt = `${knowledge}

Generate MARKETPLACE LISTINGS for 2 PREMIUM UPSELLS.

AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

PRODUCTS:
1. Upsell 1: "${upsell1.name}" (Premium upgrade - higher value)
2. Upsell 2: "${upsell2.name}" (Ultimate solution - complete transformation)

Generate 2 sections separated by: ${SECTION_SEPARATOR}

Each listing includes: premium-positioned title, compelling description (3-4 paragraphs emphasizing transformation), 7-10 benefit bullets, 5-7 tags. Return valid JSON:
{
  "marketplace_title": "Premium marketplace title",
  "marketplace_description": "Compelling 3-4 paragraph description highlighting complete transformation...",
  "marketplace_bullets": ["Benefit 1", "Benefit 2", ...],
  "marketplace_tags": ["tag1", "tag2", ...]
}

Section 1: Upsell 1 Marketplace Listing
${SECTION_SEPARATOR}
Section 2: Upsell 2 Marketplace Listing`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const listings = sections.map(s => parseClaudeJSON(s));

  // Save marketplace listings
  await supabase.from('existing_products').update({
    marketplace_listing: listings[0]
  }).eq('id', upsell1.id);

  await supabase.from('existing_products').update({
    marketplace_listing: listings[1]
  }).eq('id', upsell2.id);

  console.log(`✅ ${LOG_TAG} Marketplace batch 2 saved (2 listings)`);
  return listings;
}

// Task 13: All Emails (6 total)
export async function generateAllEmails(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 13: Generating all 6 emails in 1 batched call`);

  const { funnel, lead_magnet, frontend } = await getFunnelData(funnelId);
  const knowledge = await searchKnowledge(`${funnel.audience} email sequences nurture sales`, 12);

  const prompt = `${knowledge}

Generate EMAIL SEQUENCES for lead magnet nurture + front-end sales.

AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

LEAD MAGNET: "${lead_magnet.title}"
FRONT-END PRODUCT: "${frontend.name}"

Generate 6 sections separated by: ${SECTION_SEPARATOR}

LEAD MAGNET SEQUENCE (3 emails):
- Email 1: Welcome + deliver lead magnet (warm, helpful)
- Email 2: Value-add content + build trust (share insights)
- Email 3: Bridge to front-end offer (soft pitch)

FRONT-END SEQUENCE (3 emails):
- Email 4: Introduce front-end product (benefits focus)
- Email 5: Handle objections + social proof (overcome resistance)
- Email 6: Urgency + final CTA (close the sale)

Each email JSON:
{
  "subject": "Compelling subject line",
  "preview_text": "Email preview text...",
  "body": "Full email body with clear structure and CTA..."
}

Section 1: Lead Magnet Email 1
${SECTION_SEPARATOR}
Section 2: Lead Magnet Email 2
${SECTION_SEPARATOR}
Section 3: Lead Magnet Email 3 (Bridge)
${SECTION_SEPARATOR}
Section 4: Front-End Email 1
${SECTION_SEPARATOR}
Section 5: Front-End Email 2
${SECTION_SEPARATOR}
Section 6: Front-End Email 3 (Close)`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());
  const emails = sections.map(s => parseClaudeJSON(s));

  // Save lead magnet emails (first 3)
  await supabase.from('lead_magnets').update({
    email_sequence: emails.slice(0, 3)
  }).eq('id', lead_magnet.id);

  // Save front-end emails (last 3)
  await supabase.from('existing_products').update({
    email_sequence: emails.slice(3, 6)
  }).eq('id', frontend.id);

  console.log(`✅ ${LOG_TAG} All 6 emails saved (3 lead magnet + 3 front-end)`);
  return emails;
}

// Task 14: Bundle Listing
export async function generateBundleListing(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 14: Generating bundle listing for complete funnel`);

  const { funnel, lead_magnet, frontend, bump, upsell1, upsell2 } = await getFunnelData(funnelId);
  const knowledge = await searchKnowledge(`${funnel.audience} complete bundle package`, 10);

  const prompt = `${knowledge}

Generate BUNDLE LISTING for complete funnel package.

AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

COMPLETE BUNDLE INCLUDES:
1. Lead Magnet: "${lead_magnet.title}"
2. Front-End: "${frontend.name}"
3. Bump: "${bump.name}"
4. Upsell 1: "${upsell1.name}"
5. Upsell 2: "${upsell2.name}"

Generate bundle listing that positions this as COMPLETE TRANSFORMATION package. Return valid JSON:
{
  "bundle_title": "Compelling bundle name",
  "bundle_subtitle": "Short tagline describing complete value",
  "bundle_description": "4-5 paragraph description highlighting complete journey and transformation across all products",
  "bundle_bullets": [
    "What's included item 1",
    "What's included item 2",
    ...10-12 bullets covering all products
  ],
  "bundle_tags": ["tag1", "tag2", ...5-7 tags],
  "value_proposition": "Why this bundle is better than buying separately (2-3 sentences)"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });

  const bundleListing = parseClaudeJSON(response.content[0].text);

  // Save bundle listing to funnel
  await supabase.from('funnels').update({
    bundle_listing: bundleListing,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Bundle listing saved`);
  return bundleListing;
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
