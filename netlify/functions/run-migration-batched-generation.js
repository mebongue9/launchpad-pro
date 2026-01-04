// /netlify/functions/run-migration-batched-generation.js
// Runs database migrations for batched generation system (generation_tasks + app_settings tables)
// Creates tables programmatically using Supabase client
// RELEVANT FILES: supabase/migrations/create-generation-tasks-table.sql, supabase/migrations/create-app-settings-table.sql

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[MIGRATION-BATCHED-GEN]';

// Parse Supabase URL to get database connection details
function parseSupabaseUrl(supabaseUrl) {
  // Extract project ref from URL like https://psfgnelrxzdckucvytzj.supabase.co
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

  // Use pooler connection (works for migrations with correct user)
  return {
    host: 'aws-0-us-west-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: `postgres.${projectRef}`,  // Full username for pooler
    password: process.env.SUPABASE_DB_PASSWORD || 'x0KsWuF*aAv^$OxN',
    ssl: { rejectUnauthorized: false }
  };
}

export async function handler(event) {
  console.log(`🚀 ${LOG_TAG} Starting batched generation system migrations...`);

  const { Client } = pg;
  const client = new Client(parseSupabaseUrl(process.env.SUPABASE_URL));

  try {
    await client.connect();
    console.log(`✅ ${LOG_TAG} Connected to database`);

    const results = [];

    // Migration 1: Create generation_tasks table
    console.log(`📄 ${LOG_TAG} Creating generation_tasks table...`);

    const createTasksTableSQL = `
      CREATE TABLE IF NOT EXISTS generation_tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
        task_id TEXT NOT NULL,
        task_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        attempt_count INTEGER DEFAULT 0,
        last_attempt_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_funnel_task UNIQUE(funnel_id, task_id),
        CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
        CONSTRAINT valid_task_id CHECK (task_id IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'))
      );
    `;

    await client.query(createTasksTableSQL);
    console.log(`✅ ${LOG_TAG} generation_tasks table created`);
    results.push({ step: 'create_generation_tasks_table', status: 'success' });

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_generation_tasks_funnel_id ON generation_tasks(funnel_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_generation_tasks_funnel_status ON generation_tasks(funnel_id, status);`);
    console.log(`✅ ${LOG_TAG} Indexes created`);
    results.push({ step: 'create_indexes', status: 'success' });

    // Enable RLS
    await client.query(`ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;`);
    console.log(`✅ ${LOG_TAG} RLS enabled`);

    // Create RLS policies
    await client.query(`
      CREATE POLICY IF NOT EXISTS "Users can view their own generation tasks"
      ON generation_tasks FOR SELECT
      USING (funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid()));
    `);

    await client.query(`
      CREATE POLICY IF NOT EXISTS "Users can insert their own generation tasks"
      ON generation_tasks FOR INSERT
      WITH CHECK (funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid()));
    `);

    await client.query(`
      CREATE POLICY IF NOT EXISTS "Users can update their own generation tasks"
      ON generation_tasks FOR UPDATE
      USING (funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid()));
    `);

    await client.query(`
      CREATE POLICY IF NOT EXISTS "Users can delete their own generation tasks"
      ON generation_tasks FOR DELETE
      USING (funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid()));
    `);
    console.log(`✅ ${LOG_TAG} RLS policies created`);
    results.push({ step: 'create_rls_policies', status: 'success' });

    // Create trigger function and trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_generation_tasks_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS generation_tasks_updated_at ON generation_tasks;
      CREATE TRIGGER generation_tasks_updated_at
        BEFORE UPDATE ON generation_tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_generation_tasks_updated_at();
    `);
    console.log(`✅ ${LOG_TAG} Trigger created`);
    results.push({ step: 'create_trigger', status: 'success' });

    // Migration 2: Create app_settings table
    console.log(`📄 ${LOG_TAG} Creating app_settings table...`);

    const createSettingsTableSQL = `
      CREATE TABLE IF NOT EXISTS app_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        setting_type TEXT DEFAULT 'string',
        category TEXT DEFAULT 'general',
        is_admin_only BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_setting_type CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
        CONSTRAINT valid_category CHECK (category IN ('general', 'generation', 'retry', 'ui'))
      );
    `;

    await client.query(createSettingsTableSQL);
    console.log(`✅ ${LOG_TAG} app_settings table created`);
    results.push({ step: 'create_app_settings_table', status: 'success' });

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);`);
    console.log(`✅ ${LOG_TAG} Settings indexes created`);

    // Enable RLS
    await client.query(`ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;`);

    // Create RLS policies
    await client.query(`
      CREATE POLICY IF NOT EXISTS "Anyone can read app settings"
      ON app_settings FOR SELECT
      USING (true);
    `);
    console.log(`✅ ${LOG_TAG} Settings RLS created`);

    // Insert default settings
    const defaultSettings = [
      ['retry_attempt_2_delay', '5', 'Seconds to wait before retry attempt 2', 'number', 'retry', true],
      ['retry_attempt_3_delay', '30', 'Seconds to wait before retry attempt 3', 'number', 'retry', true],
      ['retry_attempt_4_delay', '120', 'Seconds to wait before retry attempt 4 (2 minutes)', 'number', 'retry', true],
      ['retry_attempt_5_delay', '300', 'Seconds to wait before retry attempt 5 (5 minutes)', 'number', 'retry', true],
      ['retry_attempt_6_delay', '300', 'Seconds to wait before retry attempt 6 (5 minutes)', 'number', 'retry', true],
      ['retry_attempt_7_delay', '300', 'Seconds to wait before retry attempt 7 (5 minutes)', 'number', 'retry', true],
      ['max_retry_attempts', '7', 'Maximum retry attempts before failing a task', 'number', 'retry', true],
      ['enable_batched_generation', 'true', 'Use new batched generation system (14 tasks instead of 51+)', 'boolean', 'generation', true],
      ['generation_timeout_seconds', '900', 'Timeout for each generation task (15 minutes)', 'number', 'generation', true]
    ];

    for (const [key, value, description, setting_type, category, is_admin_only] of defaultSettings) {
      await client.query(`
        INSERT INTO app_settings (key, value, description, setting_type, category, is_admin_only)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (key) DO NOTHING;
      `, [key, value, description, setting_type, category, is_admin_only]);
    }
    console.log(`✅ ${LOG_TAG} Default settings inserted`);
    results.push({ step: 'insert_default_settings', status: 'success', count: defaultSettings.length });

    // Create trigger for app_settings
    await client.query(`
      CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
      CREATE TRIGGER app_settings_updated_at
        BEFORE UPDATE ON app_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_app_settings_updated_at();
    `);
    console.log(`✅ ${LOG_TAG} Settings trigger created`);

    // Verify
    const { rows: settingsRows } = await client.query('SELECT COUNT(*) as count FROM app_settings');
    console.log(`📊 ${LOG_TAG} Total settings in database: ${settingsRows[0].count}`);

    await client.end();
    console.log(`✅ ${LOG_TAG} Migration completed successfully`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Batched generation system migrations completed',
        results,
        settings_count: parseInt(settingsRows[0].count),
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error(`❌ ${LOG_TAG} Migration error:`, error);
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup error
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message,
        detail: error.detail || error.hint
      })
    };
  }
}
