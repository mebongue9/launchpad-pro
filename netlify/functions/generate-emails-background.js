// /netlify/functions/generate-emails-background.js
// Background function for generating email sequences (Maria Wendt style)
// Generates 2 sequences × 3 emails = 6 emails total per funnel
// RELEVANT FILES: process-generation-background.js, src/hooks/useEmailSequences.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Language support
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

// Maria Wendt Email Style System Prompt
const EMAIL_SYSTEM_PROMPT = `You are an elite email copywriter trained in the Maria Wendt style.

## MARIA WENDT EMAIL CHARACTERISTICS
1. **Conversational Tone**: Write like talking to a friend over coffee
2. **Short Paragraphs**: 1-3 sentences max per paragraph
3. **Curiosity Gaps**: Create intrigue without revealing everything
4. **Soft Selling**: Value-first approach, CTA feels natural
5. **Relatable Stories**: Use quick anecdotes and examples
6. **Emotional Connection**: Tap into desires and frustrations
7. **Scannable Format**: Easy to read on mobile

## EMAIL STRUCTURE
- Subject Line: 6-10 words, curiosity or benefit-driven
- Preview Text: 40-60 characters, complements subject
- Body: 150-250 words
- Single CTA: Clear, benefit-focused

## WHAT TO AVOID
- Long paragraphs
- Corporate/formal language
- Multiple CTAs
- Hard selling
- Fake urgency

Return ONLY valid JSON with the requested structure.`;

// Generate Lead Magnet Email Sequence (promotes the free lead magnet)
async function generateLeadMagnetSequence(funnel, profile, language) {
  const leadMagnet = funnel.lead_magnet || {
    name: 'Free Resource',
    keyword: 'FREEBIE',
    topic: funnel.front_end?.description || 'valuable content'
  };

  const emails = [];

  // Email 1: Initial Value + Introduce Lead Magnet
  const email1Prompt = `
Write Email 1 of a 3-email lead magnet sequence.

LEAD MAGNET: ${leadMagnet.name}
KEYWORD: ${leadMagnet.keyword}
CREATOR: ${profile.name} (${profile.business_name || profile.name})

PURPOSE: Welcome subscriber, deliver immediate value, introduce the lead magnet

Return JSON:
{
  "subject": "Subject line (curiosity-driven)",
  "preview": "Preview text (40-60 chars)",
  "body": "Email body (150-250 words)"
}
${getLanguagePromptSuffix(language)}`;

  const email1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: email1Prompt }]
  });
  emails.push(parseClaudeJSON(email1.content[0].text));

  // Email 2: Story + Deeper Value
  const email2Prompt = `
Write Email 2 of a 3-email lead magnet sequence.

LEAD MAGNET: ${leadMagnet.name}
KEYWORD: ${leadMagnet.keyword}
CREATOR: ${profile.name}

PURPOSE: Share a relatable story, provide more value, build connection

Return JSON:
{
  "subject": "Subject line (story-driven)",
  "preview": "Preview text (40-60 chars)",
  "body": "Email body (150-250 words)"
}
${getLanguagePromptSuffix(language)}`;

  const email2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: email2Prompt }]
  });
  emails.push(parseClaudeJSON(email2.content[0].text));

  // Email 3: Bridge to Front-End Product
  const email3Prompt = `
Write Email 3 of a 3-email lead magnet sequence.

LEAD MAGNET: ${leadMagnet.name}
FRONT-END PRODUCT: ${funnel.front_end?.name || 'Next Level Product'} ($${funnel.front_end?.price || '17'})
CREATOR: ${profile.name}

PURPOSE: Create desire for the paid product, soft CTA

Return JSON:
{
  "subject": "Subject line (benefit-driven)",
  "preview": "Preview text (40-60 chars)",
  "body": "Email body (150-250 words with soft CTA)"
}
${getLanguagePromptSuffix(language)}`;

  const email3 = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: email3Prompt }]
  });
  emails.push(parseClaudeJSON(email3.content[0].text));

  return {
    sequence_type: 'lead_magnet',
    email_1_subject: emails[0].subject,
    email_1_preview: emails[0].preview,
    email_1_body: emails[0].body,
    email_2_subject: emails[1].subject,
    email_2_preview: emails[1].preview,
    email_2_body: emails[1].body,
    email_3_subject: emails[2].subject,
    email_3_preview: emails[2].preview,
    email_3_body: emails[2].body
  };
}

// Generate Front-End Email Sequence (promotes the paid front-end product)
async function generateFrontEndSequence(funnel, profile, language) {
  const frontEnd = funnel.front_end || {
    name: 'Paid Product',
    price: 17,
    description: 'valuable resource'
  };

  const emails = [];

  // Email 1: Problem Agitation
  const email1Prompt = `
Write Email 1 of a 3-email front-end product sequence.

PRODUCT: ${frontEnd.name} ($${frontEnd.price})
DESCRIPTION: ${frontEnd.description}
CREATOR: ${profile.name} (${profile.business_name || profile.name})

PURPOSE: Agitate the problem the product solves, create awareness

Return JSON:
{
  "subject": "Subject line (problem-focused)",
  "preview": "Preview text (40-60 chars)",
  "body": "Email body (150-250 words)"
}
${getLanguagePromptSuffix(language)}`;

  const email1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: email1Prompt }]
  });
  emails.push(parseClaudeJSON(email1.content[0].text));

  // Email 2: Solution Introduction
  const email2Prompt = `
Write Email 2 of a 3-email front-end product sequence.

PRODUCT: ${frontEnd.name} ($${frontEnd.price})
DESCRIPTION: ${frontEnd.description}
CREATOR: ${profile.name}

PURPOSE: Introduce the solution, share benefits without hard selling

Return JSON:
{
  "subject": "Subject line (solution-focused)",
  "preview": "Preview text (40-60 chars)",
  "body": "Email body (150-250 words)"
}
${getLanguagePromptSuffix(language)}`;

  const email2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: email2Prompt }]
  });
  emails.push(parseClaudeJSON(email2.content[0].text));

  // Email 3: CTA with Social Proof
  const email3Prompt = `
Write Email 3 of a 3-email front-end product sequence.

PRODUCT: ${frontEnd.name} ($${frontEnd.price})
DESCRIPTION: ${frontEnd.description}
CREATOR: ${profile.name}

PURPOSE: Final pitch with soft CTA, include transformation/benefit

Return JSON:
{
  "subject": "Subject line (transformation-focused)",
  "preview": "Preview text (40-60 chars)",
  "body": "Email body (150-250 words with clear CTA)"
}
${getLanguagePromptSuffix(language)}`;

  const email3 = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: email3Prompt }]
  });
  emails.push(parseClaudeJSON(email3.content[0].text));

  return {
    sequence_type: 'front_end',
    email_1_subject: emails[0].subject,
    email_1_preview: emails[0].preview,
    email_1_body: emails[0].body,
    email_2_subject: emails[1].subject,
    email_2_preview: emails[1].preview,
    email_2_body: emails[1].body,
    email_3_subject: emails[2].subject,
    email_3_preview: emails[2].preview,
    email_3_body: emails[2].body
  };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { funnel_id, user_id, language = 'English' } = JSON.parse(event.body || '{}');

    if (!funnel_id || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'funnel_id and user_id required' })
      };
    }

    console.log(`[Emails] Generating for funnel: ${funnel_id}`);

    // Get funnel data
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*, profiles(name, business_name)')
      .eq('id', funnel_id)
      .single();

    if (funnelError || !funnel) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Funnel not found' })
      };
    }

    const profile = funnel.profiles || { name: 'Creator', business_name: '' };

    // Generate both email sequences
    const leadMagnetSequence = await generateLeadMagnetSequence(funnel, profile, language);
    const frontEndSequence = await generateFrontEndSequence(funnel, profile, language);

    // Save to database
    const sequences = [
      { ...leadMagnetSequence, user_id, funnel_id },
      { ...frontEndSequence, user_id, funnel_id }
    ];

    // Delete existing sequences for this funnel first
    await supabase
      .from('email_sequences')
      .delete()
      .eq('funnel_id', funnel_id);

    // Insert new sequences
    const { data: savedSequences, error: insertError } = await supabase
      .from('email_sequences')
      .insert(sequences)
      .select();

    if (insertError) {
      console.error('Failed to save email sequences:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save email sequences' })
      };
    }

    console.log(`[Emails] Generated ${savedSequences.length} sequences for funnel ${funnel_id}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        sequences: savedSequences
      })
    };

  } catch (error) {
    console.error('[Emails] Generation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
