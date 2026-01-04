// /netlify/functions/generate-emails-background.js
// Background function for generating email sequences (Maria Wendt style)
// Generates 2 sequences x 3 emails = 6 emails total per funnel
// RELEVANT FILES: process-generation-background.js, src/hooks/useEmailSequences.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';

// Initialize clients
console.log('🔧 [EMAILS-BG] Initializing Supabase client...');
console.log('🔧 [EMAILS-BG] Environment check - SUPABASE_URL:', !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
console.log('🔧 [EMAILS-BG] Environment check - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('🔧 [EMAILS-BG] Environment check - ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY);

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
  console.log('🔄 [EMAILS-BG] Starting lead magnet sequence generation');

  const leadMagnet = funnel.lead_magnet || {
    name: 'Free Resource',
    keyword: 'FREEBIE',
    topic: funnel.front_end?.description || 'valuable content'
  };
  console.log('📋 [EMAILS-BG] Lead magnet:', leadMagnet.name, '| Keyword:', leadMagnet.keyword);

  const emails = [];

  // Email 1: Initial Value + Introduce Lead Magnet
  console.log('🔄 [EMAILS-BG] Generating lead magnet email 1/3 (Welcome + Value)');
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
  console.log('✅ [EMAILS-BG] Lead magnet email 1/3 generated - Subject:', emails[0].subject?.substring(0, 50));

  // Email 2: Story + Deeper Value
  console.log('🔄 [EMAILS-BG] Generating lead magnet email 2/3 (Story + Value)');
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
  console.log('✅ [EMAILS-BG] Lead magnet email 2/3 generated - Subject:', emails[1].subject?.substring(0, 50));

  // Email 3: Bridge to Front-End Product
  console.log('🔄 [EMAILS-BG] Generating lead magnet email 3/3 (Bridge to Front-End)');
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
  console.log('✅ [EMAILS-BG] Lead magnet email 3/3 generated - Subject:', emails[2].subject?.substring(0, 50));
  console.log('✅ [EMAILS-BG] Lead magnet sequence complete - 3 emails generated');

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
  console.log('🔄 [EMAILS-BG] Starting front-end sequence generation');

  const frontEnd = funnel.front_end || {
    name: 'Paid Product',
    price: 17,
    description: 'valuable resource'
  };
  console.log('📋 [EMAILS-BG] Front-end product:', frontEnd.name, '| Price: $' + frontEnd.price);

  const emails = [];

  // Email 1: Problem Agitation
  console.log('🔄 [EMAILS-BG] Generating front-end email 1/3 (Problem Agitation)');
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
  console.log('✅ [EMAILS-BG] Front-end email 1/3 generated - Subject:', emails[0].subject?.substring(0, 50));

  // Email 2: Solution Introduction
  console.log('🔄 [EMAILS-BG] Generating front-end email 2/3 (Solution Introduction)');
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
  console.log('✅ [EMAILS-BG] Front-end email 2/3 generated - Subject:', emails[1].subject?.substring(0, 50));

  // Email 3: CTA with Social Proof
  console.log('🔄 [EMAILS-BG] Generating front-end email 3/3 (CTA + Social Proof)');
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
  console.log('✅ [EMAILS-BG] Front-end email 3/3 generated - Subject:', emails[2].subject?.substring(0, 50));
  console.log('✅ [EMAILS-BG] Front-end sequence complete - 3 emails generated');

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
  console.log('🚀 [EMAILS-BG] Function invoked');
  console.log('📥 [EMAILS-BG] HTTP method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    console.log('❌ [EMAILS-BG] Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('📥 [EMAILS-BG] Parsing request body...');
    const { funnel_id, user_id, language = 'English' } = JSON.parse(event.body || '{}');
    console.log('📥 [EMAILS-BG] Received funnel_id:', funnel_id);
    console.log('📥 [EMAILS-BG] Received user_id:', user_id);
    console.log('📥 [EMAILS-BG] Received language:', language);

    if (!funnel_id || !user_id) {
      console.log('❌ [EMAILS-BG] Missing required parameters - funnel_id:', !!funnel_id, 'user_id:', !!user_id);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'funnel_id and user_id required' })
      };
    }

    console.log('🔄 [EMAILS-BG] Fetching funnel data from database...');
    // Get funnel data - verify ownership with user_id
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*, profiles(name, business_name)')
      .eq('id', funnel_id)
      .eq('user_id', user_id)
      .single();

    if (funnelError) {
      console.error('❌ [EMAILS-BG] Database error fetching funnel:', funnelError.message);
      console.error('❌ [EMAILS-BG] Error details:', JSON.stringify(funnelError));
    }

    if (funnelError || !funnel) {
      console.log('❌ [EMAILS-BG] Funnel not found or access denied for funnel_id:', funnel_id);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Funnel not found or access denied' })
      };
    }

    console.log('✅ [EMAILS-BG] Funnel loaded:', funnel.name);
    console.log('📋 [EMAILS-BG] Funnel has front_end:', !!funnel.front_end);
    console.log('📋 [EMAILS-BG] Funnel has lead_magnet:', !!funnel.lead_magnet);

    const profile = funnel.profiles || { name: 'Creator', business_name: '' };
    console.log('📋 [EMAILS-BG] Profile name:', profile.name);

    // Generate both email sequences
    console.log('🔄 [EMAILS-BG] Starting email sequence generation (2 sequences x 3 emails = 6 total)');
    const leadMagnetSequence = await generateLeadMagnetSequence(funnel, profile, language);
    const frontEndSequence = await generateFrontEndSequence(funnel, profile, language);
    console.log('✅ [EMAILS-BG] All 6 emails generated successfully');

    // Save to database
    const sequences = [
      { ...leadMagnetSequence, user_id, funnel_id },
      { ...frontEndSequence, user_id, funnel_id }
    ];

    // Delete existing sequences for this funnel first (verify ownership)
    console.log('🔄 [EMAILS-BG] Deleting existing email sequences for funnel...');
    const { error: deleteError } = await supabase
      .from('email_sequences')
      .delete()
      .eq('funnel_id', funnel_id)
      .eq('user_id', user_id);

    if (deleteError) {
      console.log('⚠️ [EMAILS-BG] Delete warning (may be no existing records):', deleteError.message);
    } else {
      console.log('✅ [EMAILS-BG] Existing sequences deleted (if any)');
    }

    // Insert new sequences
    console.log('🔄 [EMAILS-BG] Inserting new email sequences into database...');
    const { data: savedSequences, error: insertError } = await supabase
      .from('email_sequences')
      .insert(sequences)
      .select();

    if (insertError) {
      console.error('❌ [EMAILS-BG] Failed to save email sequences:', insertError.message);
      console.error('❌ [EMAILS-BG] Insert error details:', JSON.stringify(insertError));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save email sequences' })
      };
    }

    console.log('✅ [EMAILS-BG] Saved', savedSequences.length, 'sequences to database');
    console.log('✅ [EMAILS-BG] Sequence IDs:', savedSequences.map(s => s.id).join(', '));
    console.log('🏁 [EMAILS-BG] Function completed successfully for funnel:', funnel_id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        sequences: savedSequences
      })
    };

  } catch (error) {
    console.error('❌ [EMAILS-BG] Unhandled error:', error.message);
    console.error('❌ [EMAILS-BG] Error stack:', error.stack);
    console.error('❌ [EMAILS-BG] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
