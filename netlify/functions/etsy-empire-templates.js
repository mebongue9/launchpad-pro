// netlify/functions/etsy-empire-templates.js
// Template CRUD API for Slide 10 branding templates
// PART OF: Etsy Empire visual generation system
// RELEVANT FILES: create-etsy-empire-project.js, process-etsy-empire-background.js

import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';

const LOG_TAG = '[ETSY-EMPIRE-TEMPLATES]';

// Parse multipart/form-data
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type']
      }
    });

    const fields = {};
    let fileData = null;
    let fileName = null;
    let fileMimeType = null;

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      fileName = filename;
      fileMimeType = mimeType;

      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        fileData = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, fileData, fileName, fileMimeType });
    });

    busboy.on('error', reject);

    // Handle base64 encoded body from API Gateway
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;

    busboy.end(body);
  });
}

// Get image dimensions from buffer (basic PNG/JPEG parsing)
function getImageDimensions(buffer, mimeType) {
  try {
    if (mimeType === 'image/png') {
      // PNG: width at bytes 16-19, height at bytes 20-23 (big endian)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      // JPEG: Find SOF0 marker (0xFF 0xC0) and read dimensions
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
  } catch (e) {
    console.error(`${LOG_TAG} Error parsing image dimensions:`, e.message);
  }
  // Default dimensions if parsing fails
  return { width: 1080, height: 1350 };
}

export async function handler(event) {
  const { httpMethod, queryStringParameters } = event;

  console.log(`${LOG_TAG} ${httpMethod} request received`);

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ============================================
  // GET: List user's templates
  // ============================================
  if (httpMethod === 'GET') {
    const user_id = queryStringParameters?.user_id;

    if (!user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    try {
      const { data: templates, error } = await supabase
        .from('etsy_empire_templates')
        .select('id, name, public_url, width, height, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`${LOG_TAG} Error fetching templates:`, error);
        throw error;
      }

      console.log(`${LOG_TAG} Found ${templates.length} templates for user`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates })
      };
    } catch (error) {
      console.error(`${LOG_TAG} GET error:`, error.message);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // ============================================
  // POST: Upload new template
  // ============================================
  if (httpMethod === 'POST') {
    try {
      const { fields, fileData, fileName, fileMimeType } = await parseMultipartForm(event);

      const user_id = fields.user_id;
      const name = fields.name;

      // Validate required fields
      if (!user_id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'user_id is required' })
        };
      }

      if (!name || !name.trim()) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'name is required' })
        };
      }

      if (!fileData) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'image file is required' })
        };
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(fileMimeType)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid file type. Only PNG and JPG are allowed.' })
        };
      }

      // Get image dimensions
      const dimensions = getImageDimensions(fileData, fileMimeType);

      // Generate storage path
      const fileExt = fileMimeType === 'image/png' ? 'png' : 'jpg';
      const timestamp = Date.now();
      const storagePath = `${user_id}/${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

      console.log(`${LOG_TAG} Uploading template to: ${storagePath}`);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('etsy-empire-templates')
        .upload(storagePath, fileData, {
          contentType: fileMimeType,
          upsert: false
        });

      if (uploadError) {
        console.error(`${LOG_TAG} Upload error:`, uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('etsy-empire-templates')
        .getPublicUrl(storagePath);

      // Create database record
      const { data: template, error: dbError } = await supabase
        .from('etsy_empire_templates')
        .insert({
          user_id,
          name: name.trim(),
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          width: dimensions.width,
          height: dimensions.height
        })
        .select()
        .single();

      if (dbError) {
        console.error(`${LOG_TAG} Database error:`, dbError);
        // Clean up uploaded file
        await supabase.storage.from('etsy-empire-templates').remove([storagePath]);
        throw dbError;
      }

      console.log(`${LOG_TAG} Template created: ${template.id}`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          template: {
            id: template.id,
            name: template.name,
            public_url: template.public_url,
            width: template.width,
            height: template.height,
            created_at: template.created_at
          }
        })
      };
    } catch (error) {
      console.error(`${LOG_TAG} POST error:`, error.message);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // ============================================
  // DELETE: Remove template
  // ============================================
  if (httpMethod === 'DELETE') {
    const template_id = queryStringParameters?.id;
    const user_id = queryStringParameters?.user_id;

    if (!template_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'id is required' })
      };
    }

    if (!user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    try {
      // Get template record (verify ownership)
      const { data: template, error: fetchError } = await supabase
        .from('etsy_empire_templates')
        .select('id, storage_path, user_id')
        .eq('id', template_id)
        .single();

      if (fetchError || !template) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Template not found' })
        };
      }

      // Verify ownership
      if (template.user_id !== user_id) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Access denied' })
        };
      }

      // Check if template is in use by any project
      const { data: projectsUsingTemplate, error: checkError } = await supabase
        .from('etsy_empire_projects')
        .select('id')
        .eq('slide10_template_id', template_id)
        .limit(1);

      if (checkError) {
        console.error(`${LOG_TAG} Error checking template usage:`, checkError);
        throw checkError;
      }

      if (projectsUsingTemplate && projectsUsingTemplate.length > 0) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Template is in use by one or more projects and cannot be deleted' })
        };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('etsy-empire-templates')
        .remove([template.storage_path]);

      if (storageError) {
        console.warn(`${LOG_TAG} Storage delete warning:`, storageError.message);
        // Continue even if storage delete fails
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from('etsy_empire_templates')
        .delete()
        .eq('id', template_id);

      if (deleteError) {
        console.error(`${LOG_TAG} Delete error:`, deleteError);
        throw deleteError;
      }

      console.log(`${LOG_TAG} Template deleted: ${template_id}`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error(`${LOG_TAG} DELETE error:`, error.message);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // Method not allowed
  return {
    statusCode: 405,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}
