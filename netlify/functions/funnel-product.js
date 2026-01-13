// netlify/functions/funnel-product.js
// Returns product data + profile data for Visual Builder
// GET /api/funnel-product?funnelId=xxx&productType=front_end
// OR GET /api/funnel-product?leadMagnetId=xxx
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/PreviewPanel.jsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[FUNNEL-PRODUCT]';

export async function handler(event) {
  console.log(`📦 ${LOG_TAG} Function invoked`);

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const { funnelId, productType, leadMagnetId } = params;

    let productData = null;
    let profileData = null;
    let contentData = null;

    // Handle lead magnet request
    if (leadMagnetId) {
      console.log(`📥 ${LOG_TAG} Fetching lead magnet: ${leadMagnetId}`);

      const { data: leadMagnet, error } = await supabase
        .from('lead_magnets')
        .select(`
          id, name, format, topic, content, tldr,
          profile_id,
          profiles:profile_id (
            id, name, tagline, social_handle, photo_url, logo_url, business_name
          )
        `)
        .eq('id', leadMagnetId)
        .single();

      if (error) {
        console.error(`❌ ${LOG_TAG} Error fetching lead magnet:`, error);
        throw error;
      }

      productData = {
        type: 'lead_magnet',
        name: leadMagnet.name,
        format: leadMagnet.format,
        topic: leadMagnet.topic
      };

      contentData = leadMagnet.content || {};
      profileData = leadMagnet.profiles || null;

      // Get TLDR if available
      if (leadMagnet.tldr) {
        productData.tldr = leadMagnet.tldr;
      }
    }
    // Handle funnel product request
    else if (funnelId && productType) {
      console.log(`📥 ${LOG_TAG} Fetching funnel product: ${funnelId} / ${productType}`);

      const validTypes = ['front_end', 'bump', 'upsell_1', 'upsell_2'];
      if (!validTypes.includes(productType)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Invalid product type. Must be one of: ${validTypes.join(', ')}` })
        };
      }

      // Build select fields dynamically based on product type
      const tldrField = `${productType}_tldr`;

      const { data: funnel, error } = await supabase
        .from('funnels')
        .select(`
          id, name, ${productType}, ${tldrField},
          profile_id,
          profiles:profile_id (
            id, name, tagline, social_handle, photo_url, logo_url, business_name
          )
        `)
        .eq('id', funnelId)
        .single();

      if (error) {
        console.error(`❌ ${LOG_TAG} Error fetching funnel:`, error);
        throw error;
      }

      const product = funnel[productType];
      if (!product) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Product ${productType} not found in funnel` })
        };
      }

      productData = {
        type: productType,
        name: product.name,
        format: product.format,
        price: product.price,
        description: product.description
      };

      // Get content from product
      contentData = product.content ?
        (typeof product.content === 'string' ? { raw: product.content } : product.content) :
        {};

      // Get TLDR
      if (funnel[tldrField]) {
        productData.tldr = funnel[tldrField];
      }

      profileData = funnel.profiles || null;
    }
    else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters: either leadMagnetId OR (funnelId + productType)' })
      };
    }

    console.log(`✅ ${LOG_TAG} Returning product data for: ${productData.name}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: productData,
        content: contentData,
        profile: profileData,
        year: new Date().getFullYear()
      })
    };

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
