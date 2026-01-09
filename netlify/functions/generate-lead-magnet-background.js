// /netlify/functions/generate-lead-magnet-background.js
// Background function that generates lead magnet content SECTION BY SECTION
// Prevents token limit issues by generating: Cover → Chapter 1 → Chapter 2 → etc.
// RELEVANT FILES: generate-lead-magnet-content.js, check-job-status.js

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';

const LOG_TAG = '[LEAD-MAGNET-BG]';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Update job status
async function updateJobStatus(jobId, updates) {
  const { error } = await supabase
    .from('generation_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error(`❌ ${LOG_TAG} Failed to update job:`, error);
  }
}

// RAG FIX: Using shared searchKnowledgeWithMetrics from ./lib/knowledge-search.js
// Threshold 0.3, pgvector server-side search, automatic RAG logging

// Generate a single section
async function generateSection(sectionType, context) {
  const { leadMagnet, profile, audience, frontEnd, language, previousSections } = context;

  let prompt = '';

  if (sectionType === 'cover') {
    prompt = `Create a cover page for this lead magnet:

Title: ${leadMagnet.title}
Subtitle: ${leadMagnet.subtitle}
Author: ${profile.name}

Return ONLY valid JSON:
{
  "type": "cover",
  "title": "${leadMagnet.title}",
  "subtitle": "${leadMagnet.subtitle}",
  "author": "By ${profile.name}",
  "tagline": "Short tagline (5-8 words)"
}`;
  } else if (sectionType.startsWith('chapter_')) {
    const chapterNum = parseInt(sectionType.split('_')[1]);
    prompt = `Write Chapter ${chapterNum} for this lead magnet:

Lead Magnet: ${leadMagnet.title} - ${leadMagnet.subtitle}
Target Audience: ${audience.name}
Front-End Product: ${frontEnd.name}

Write a complete, valuable chapter that teaches ONE specific concept or framework. Include examples, steps, and actionable tips.

Return ONLY valid JSON:
{
  "type": "chapter",
  "number": ${chapterNum},
  "title": "Chapter ${chapterNum}: [Compelling Title]",
  "content": "Full chapter content with multiple paragraphs, examples, and steps..."
}`;
  } else if (sectionType === 'bridge') {
    prompt = `Write a bridge section that transitions from the lead magnet to the front-end product:

Lead Magnet: ${leadMagnet.title}
Front-End Product: ${frontEnd.name} - ${frontEnd.description}

Create a natural transition that:
1. Summarizes what they learned
2. Introduces the next step (the front-end product)
3. NO hard sell - just a natural bridge

Return ONLY valid JSON:
{
  "type": "bridge",
  "title": "What Happens Next...",
  "content": "Bridge content..."
}`;
  } else if (sectionType === 'cta') {
    prompt = `Write a clear call-to-action for this front-end product:

Product: ${frontEnd.name}
Price: $${frontEnd.price}
Description: ${frontEnd.description}

Return ONLY valid JSON:
{
  "type": "cta",
  "title": "Ready to [Desired Outcome]?",
  "content": "CTA text...",
  "button_text": "Get [Product Name] Now"
}`;
  }

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(prompt, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'generate-lead-magnet-background'
  });
  const fullPrompt = knowledge + '\n\n' + prompt;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: 'You are a lead magnet content writer. Create high-value content. Return ONLY valid JSON.',
    messages: [{ role: 'user', content: fullPrompt }]
  });

  // Return both the section and RAG metrics for logging
  return { section: parseClaudeJSON(response.content[0].text), ragMetrics };
}

export async function handler(event) {
  console.log(`🚀 ${LOG_TAG} Background function started`);

  try {
    const { job_id, lead_magnet, profile, audience, front_end, language } = JSON.parse(event.body || '{}');

    if (!job_id) {
      return { statusCode: 400, body: 'Missing job_id' };
    }

    await updateJobStatus(job_id, {
      status: 'processing',
      current_chunk_name: 'Starting generation...'
    });

    const sections = [];
    const sectionTypes = ['cover', 'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4', 'chapter_5', 'bridge', 'cta'];
    const totalSections = sectionTypes.length;

    for (let i = 0; i < sectionTypes.length; i++) {
      const sectionType = sectionTypes[i];
      const sectionName = sectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

      console.log(`🎯 ${LOG_TAG} Generating ${sectionName}...`);
      await updateJobStatus(job_id, {
        current_chunk_name: `Generating ${sectionName}...`,
        completed_chunks: i,
        total_chunks: totalSections
      });

      try {
        const { section, ragMetrics } = await generateSection(sectionType, {
          leadMagnet: lead_magnet,
          profile,
          audience,
          frontEnd: front_end,
          language,
          previousSections: sections
        });

        sections.push(section);
        console.log(`✅ ${LOG_TAG} ${sectionName} complete`);
        
        // Log RAG metrics
        if (ragMetrics) {
          await logRagRetrieval({
            userId: null,
            profileId: profile?.id || null,
            audienceId: audience?.id || null,
            funnelId: null,
            leadMagnetId: lead_magnet?.id || null,
            sourceFunction: 'generate-lead-magnet-background',
            generationType: sectionType,
            metrics: ragMetrics,
            freshnessCheck: { performed: false, count: 0, names: [] },
            generationSuccessful: true,
            errorMessage: null
          });
        }
      } catch (err) {
        console.error(`❌ ${LOG_TAG} ${sectionName} failed:`, err);
        await updateJobStatus(job_id, {
          status: 'failed',
          error_message: `Failed to generate ${sectionName}: ${err.message}`
        });
        return { statusCode: 500, body: 'Generation failed' };
      }
    }

    // Combine all sections
    const result = {
      title: lead_magnet.title,
      subtitle: lead_magnet.subtitle,
      keyword: lead_magnet.keyword || 'LEAD_MAGNET',
      sections,
      promotion_kit: {
        instagram_caption: `Free guide: ${lead_magnet.title}. Get it now!`,
        social_posts: [`🎁 New free resource: ${lead_magnet.title}`]
      }
    };

    console.log(`✅ ${LOG_TAG} All sections complete!`);
    await updateJobStatus(job_id, {
      status: 'complete',
      completed_chunks: totalSections,
      current_chunk_name: 'Complete!',
      result,
      completed_at: new Date().toISOString()
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error:`, error);
    return { statusCode: 500, body: error.message };
  }
}
