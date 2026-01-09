// netlify/functions/generate-lead-magnet-content-batched.js
// NEW batched lead magnet generation - 2 API calls instead of 8
// Part 1: Cover + Chapters 1-3 | Part 2: Chapters 4-5 + Bridge + CTA
// RELEVANT FILES: lib/batched-generators.js, lib/retry-engine.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { parseClaudeJSON } from './utils/sanitize-json.js';
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});


const LOG_TAG = '[LEAD-MAGNET-BATCHED]';
const SECTION_SEPARATOR = '===SECTION_BREAK===';

// RAG FIX: Using shared searchKnowledgeWithMetrics from ./lib/knowledge-search.js
// Threshold 0.3, pgvector server-side search, automatic RAG logging


// BATCHED GENERATION: Part 1 - Cover + Chapters 1-3 (1 API call)
async function generatePart1(leadMagnet, profile, audience, frontEnd, language) {
  console.log(`📝 ${LOG_TAG} Generating Part 1: Cover + Chapters 1-3`);

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(
    `${leadMagnet.title} ${leadMagnet.subtitle}`,
    { limit: 40, threshold: 0.3, sourceFunction: 'generate-lead-magnet-content-batched' }
  );

  const prompt = `You are generating a lead magnet in ${language || 'English'}.

**Lead Magnet:** ${leadMagnet.title}
**Subtitle:** ${leadMagnet.subtitle}
**Format:** ${leadMagnet.format || 'guide'}
**Author:** ${profile.name}
**Niche:** ${profile.niche}
**Audience:** ${audience.name}
**Front-End Product:** ${frontEnd.name}

Generate the following sections in a SINGLE response. Separate each section with exactly this marker on its own line:
${SECTION_SEPARATOR}

**Section 1: Cover Page**
Return JSON: {"type": "cover", "title": "${leadMagnet.title}", "subtitle": "${leadMagnet.subtitle}", "author": "${profile.name}"}

**Section 2: Chapter 1 - ${leadMagnet.chapters?.[0]?.title || 'Introduction'}**
Return JSON: {"type": "chapter", "number": 1, "title": "...", "content": "..."}

**Section 3: Chapter 2 - ${leadMagnet.chapters?.[1]?.title || 'Main Concept'}**
Return JSON: {"type": "chapter", "number": 2, "title": "...", "content": "..."}

**Section 4: Chapter 3 - ${leadMagnet.chapters?.[2]?.title || 'Implementation'}**
Return JSON: {"type": "chapter", "number": 3, "title": "...", "content": "..."}${knowledge}

Respond with 4 JSON objects separated by ${SECTION_SEPARATOR}. Each section must be valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const fullText = response.content[0].text;
  const sections = fullText.split(SECTION_SEPARATOR).map(s => s.trim());

  if (sections.length < 4) {
    throw new Error(`Expected 4 sections, got ${sections.length}`);
  }

  return {
    data: {
      cover: parseClaudeJSON(sections[0]),
      chapter1: parseClaudeJSON(sections[1]),
      chapter2: parseClaudeJSON(sections[2]),
      chapter3: parseClaudeJSON(sections[3])
    },
    ragMetrics
  };
}

// BATCHED GENERATION: Part 2 - Chapters 4-5 + Bridge + CTA (1 API call)
async function generatePart2(leadMagnet, profile, audience, frontEnd, language, part1Data) {
  console.log(`📝 ${LOG_TAG} Generating Part 2: Chapters 4-5 + Bridge + CTA`);

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(
    `${leadMagnet.title} next steps action`,
    { limit: 40, threshold: 0.3, sourceFunction: 'generate-lead-magnet-content-batched' }
  );

  const prompt = `You are generating a lead magnet in ${language || 'English'}.

**Context from Part 1:**
- Chapter 1: ${part1Data.chapter1.title}
- Chapter 2: ${part1Data.chapter2.title}
- Chapter 3: ${part1Data.chapter3.title}

**Lead Magnet:** ${leadMagnet.title}
**Author:** ${profile.name}
**Front-End Product:** ${frontEnd.name} ($${frontEnd.price})

Generate the following sections. Separate each with:
${SECTION_SEPARATOR}

**Section 1: Chapter 4 - ${leadMagnet.chapters?.[3]?.title || 'Advanced Strategy'}**
Return JSON: {"type": "chapter", "number": 4, "title": "...", "content": "..."}

**Section 2: Chapter 5 - ${leadMagnet.chapters?.[4]?.title || 'Putting It All Together'}**
Return JSON: {"type": "chapter", "number": 5, "title": "...", "content": "..."}

**Section 3: Bridge to Front-End Product**
Return JSON: {"type": "bridge", "content": "Transition that creates desire for ${frontEnd.name}"}

**Section 4: Call to Action**
Return JSON: {"type": "cta", "content": "Compelling CTA for ${frontEnd.name}"}${knowledge}

Respond with 4 JSON objects separated by ${SECTION_SEPARATOR}.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  const fullText = response.content[0].text;
  const sections = fullText.split(SECTION_SEPARATOR).map(s => s.trim());

  if (sections.length < 4) {
    throw new Error(`Expected 4 sections, got ${sections.length}`);
  }

  return {
    data: {
      chapter4: parseClaudeJSON(sections[0]),
      chapter5: parseClaudeJSON(sections[1]),
      bridge: parseClaudeJSON(sections[2]),
      cta: parseClaudeJSON(sections[3])
    },
    ragMetrics
  };
}

export async function handler(event) {
  console.log(`🚀 ${LOG_TAG} Starting batched lead magnet generation (2 API calls)`);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { lead_magnet, profile, audience, front_end, language } = JSON.parse(event.body || '{}');

    if (!lead_magnet || !profile || !audience || !front_end) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create job
    const jobId = crypto.randomUUID();
    const { error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        id: jobId,
        user_id: profile.user_id || profile.id,
        job_type: 'lead_magnet_content',
        status: 'processing',
        total_chunks: 2, // 2 batched API calls
        completed_chunks: 0,
        current_chunk_name: 'Part 1: Cover + Chapters 1-3',
        input_data: { lead_magnet, profile, audience, front_end, language }
      });

    if (jobError) throw jobError;

    // BATCHED CALL 1: Cover + Chapters 1-3
    console.log(`📞 ${LOG_TAG} API Call 1/2: Cover + Chapters 1-3`);
    const { data: part1, ragMetrics: part1Metrics } = await generatePart1(lead_magnet, profile, audience, front_end, language);

    // Log RAG metrics for Part 1
    if (part1Metrics) {
      await logRagRetrieval({
        userId: profile.user_id || profile.id || null,
        profileId: profile?.id || null,
        audienceId: audience?.id || null,
        funnelId: null,
        leadMagnetId: lead_magnet?.id || null,
        sourceFunction: 'generate-lead-magnet-content-batched',
        generationType: 'part1_cover_chapters1-3',
        metrics: part1Metrics,
        freshnessCheck: { performed: false, count: 0, names: [] },
        generationSuccessful: true,
        errorMessage: null
      });
    }

    await supabase
      .from('generation_jobs')
      .update({
        completed_chunks: 1,
        current_chunk_name: 'Part 2: Chapters 4-5 + Bridge + CTA',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // BATCHED CALL 2: Chapters 4-5 + Bridge + CTA
    console.log(`📞 ${LOG_TAG} API Call 2/2: Chapters 4-5 + Bridge + CTA`);
    const { data: part2, ragMetrics: part2Metrics } = await generatePart2(lead_magnet, profile, audience, front_end, language, part1);

    // Log RAG metrics for Part 2
    if (part2Metrics) {
      await logRagRetrieval({
        userId: profile.user_id || profile.id || null,
        profileId: profile?.id || null,
        audienceId: audience?.id || null,
        funnelId: null,
        leadMagnetId: lead_magnet?.id || null,
        sourceFunction: 'generate-lead-magnet-content-batched',
        generationType: 'part2_chapters4-5_bridge_cta',
        metrics: part2Metrics,
        freshnessCheck: { performed: false, count: 0, names: [] },
        generationSuccessful: true,
        errorMessage: null
      });
    }

    // Combine results
    const sections = [
      part1.cover,
      part1.chapter1,
      part1.chapter2,
      part1.chapter3,
      part2.chapter4,
      part2.chapter5,
      part2.bridge,
      part2.cta
    ];

    const result = {
      title: lead_magnet.title,
      subtitle: lead_magnet.subtitle,
      keyword: lead_magnet.keyword || 'LEAD_MAGNET',
      format: lead_magnet.format || 'guide',
      sections,
      promotion_kit: {
        keyword: lead_magnet.keyword,
        captions: {
          comment_version: `Free ${lead_magnet.format || 'guide'}: ${lead_magnet.title}. Get it now!`,
          dm_version: `Hey! I just released a free ${lead_magnet.format || 'guide'}: "${lead_magnet.title}". Want it?`
        }
      }
    };

    await supabase
      .from('generation_jobs')
      .update({
        status: 'complete',
        completed_chunks: 2,
        current_chunk_name: 'Complete!',
        result,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`✅ ${LOG_TAG} Generation complete (2 API calls)`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        job_id: jobId,
        message: 'Lead magnet generated with 2 batched API calls'
      })
    };

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
