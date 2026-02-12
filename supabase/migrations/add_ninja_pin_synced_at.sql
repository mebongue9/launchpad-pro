-- Add ninja_pin_synced_at column to lead_magnets for duplicate sync protection
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS ninja_pin_synced_at TIMESTAMPTZ DEFAULT NULL;
