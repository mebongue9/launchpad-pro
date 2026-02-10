# COMPLETE DELIVERABLE: Pinterest Text Framework Integration

**Date:** January 30, 2026
**Purpose:** Full implementation details for text framework integration
**Status:** READY FOR APPROVAL

---

## DELIVERABLE 1: CURRENT SCHEMA VERIFICATION

### etsy_empire_tasks table columns (verified from migration 20260129):

```
Column             | Type      | Notes
-------------------|-----------|----------------------------------
id                 | UUID      | Primary key
project_id         | UUID      | Foreign key
task_type          | TEXT      | 'etsy_slide', 'pinterest_pin', 'etsy_video'
slide_type         | TEXT      | Category name
variation_number   | INTEGER   | 1-5
pin_text           | TEXT      | ✅ ALREADY EXISTS (added in migration 20260129)
prompt             | TEXT      | Generated prompt
status             | TEXT      | 'queued', 'processing', 'completed', 'permanent_failure'
output_url         | TEXT      | Result URL
cost               | NUMERIC   | Task cost
retry_count        | INTEGER   | Retry attempts
last_error         | TEXT      | Error message
completed_at       | TIMESTAMP | Completion time
```

**CONFIRMED:** `pin_text` column exists. No new columns needed on `etsy_empire_tasks`.

---

## DELIVERABLE 2: PINTEREST TEXT FRAMEWORKS TABLE + ALL 192 INSERT STATEMENTS

### SQL Migration File: `supabase/migrations/20260130_pinterest_text_frameworks.sql`

```sql
-- Pinterest Text Frameworks Migration
-- Source: ETSY-EMPIRE-FRAMEWORK-MASTER-v4.md
-- Total: 53 base frameworks, 192 variations (51 Pinterest + 120 YouTube + 21 Affirmation)

-- ============================================================
-- TABLE: pinterest_text_frameworks
-- ============================================================
CREATE TABLE IF NOT EXISTS pinterest_text_frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_code TEXT NOT NULL UNIQUE,     -- P1a, P1b, Y1a, A1a, etc.
  base_framework TEXT NOT NULL,            -- P1, P2, Y1, A1, etc.
  category TEXT NOT NULL,                  -- 'pinterest', 'youtube', 'affirmation'
  framework_name TEXT NOT NULL,            -- Human-readable name
  template TEXT NOT NULL,                  -- Template with [VARIABLES]
  example TEXT NOT NULL,                   -- Example output
  psychological_hook TEXT,                 -- Why it works
  variables TEXT[],                        -- Array of variable names used
  category_weight INTEGER DEFAULT 50,      -- Selection weight (P=40, Y=45, A=15)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ptf_category ON pinterest_text_frameworks(category);
CREATE INDEX IF NOT EXISTS idx_ptf_base_framework ON pinterest_text_frameworks(base_framework);
CREATE INDEX IF NOT EXISTS idx_ptf_framework_code ON pinterest_text_frameworks(framework_code);

-- ============================================================
-- PINTEREST FRAMEWORKS (P1-P14) - 51 variations
-- Category weight: 40%
-- ============================================================

-- P1: The Adjective Twist (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P1a', 'P1', 'pinterest', 'Adjective Twist', '[NUMBER] [ADJECTIVE] [DELIVERABLE] To [OUTCOME]', '18 Dirty Little DM Scripts To Close Sales', 'Unexpected/provocative adjective creates curiosity', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE', 'OUTCOME'], 40),
('P1b', 'P1', 'pinterest', 'Adjective Twist Variant', 'My [NUMBER] [ADJECTIVE] [TOPIC] [DELIVERABLE]', 'My 18-Point Sneaky Money Checklist', 'Personal ownership + provocative adjective', ARRAY['NUMBER', 'ADJECTIVE', 'TOPIC', 'DELIVERABLE'], 40),
('P1c', 'P1', 'pinterest', 'Adjective Twist Ways', 'The [ADJECTIVE] [DELIVERABLE]: [NUMBER] Ways To [OUTCOME]', 'The Lazy Swipe File: 18 Ways To Make Money', 'Adjective defines character of deliverable', ARRAY['ADJECTIVE', 'DELIVERABLE', 'NUMBER', 'OUTCOME'], 40);

-- P2: The Audience Identifier (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P2a', 'P2', 'pinterest', 'Audience Identifier', '[NUMBER] [DELIVERABLE] for [AUDIENCE] To [RESULT]', '14 Email Templates for Introverts To Land Clients', 'Targets specific audience, makes them feel seen', ARRAY['NUMBER', 'DELIVERABLE', 'AUDIENCE', 'RESULT'], 40),
('P2b', 'P2', 'pinterest', 'Audience Day Plan', 'My [NUMBER]-Day [DELIVERABLE] for [AUDIENCE] ([RESULT])', 'My 14-Day Meal Plan for Busy Moms (Lose 10 Lbs)', 'Time-bound plan for specific audience', ARRAY['NUMBER', 'DELIVERABLE', 'AUDIENCE', 'RESULT'], 40),
('P2c', 'P2', 'pinterest', 'Audience Swipe', 'The [AUDIENCE] [DELIVERABLE]: [NUMBER] [ITEMS] To [RESULT]', 'The Introvert''s Swipe File: 14 DMs To Make $2K/Month', 'Ownership by audience type', ARRAY['AUDIENCE', 'DELIVERABLE', 'NUMBER', 'ITEMS', 'RESULT'], 40);

-- P3: The Simple Numbered Promise (6 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P3a', 'P3', 'pinterest', 'Simple Numbered Promise', '[NUMBER] [DELIVERABLE] That [RESULT]', '20 Email Templates That Get Replies', 'Clear value proposition with specific number', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 40),
('P3b', 'P3', 'pinterest', 'Copy-Paste Promise', '[NUMBER] Copy-Paste [DELIVERABLE] That [RESULT]', '20 Copy-Paste DM Scripts That Close Deals', 'Emphasizes ready-to-use nature', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 40),
('P3c', 'P3', 'pinterest', 'Point Checklist Promise', 'My [NUMBER]-Point [DELIVERABLE] That [RESULT]', 'My 20-Point Sales Checklist That Converts', 'Personal + structured format', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 40),
('P3d', 'P3', 'pinterest', 'Sell Like Crazy', '[NUMBER] [DELIVERABLE] That Sell Like Crazy', '50 Digital Product Templates That Sell Like Crazy', 'Social proof through sales claim', ARRAY['NUMBER', 'DELIVERABLE'], 40),
('P3e', 'P3', 'pinterest', 'Topic Sell Like Crazy', '[NUMBER] [TOPIC] [DELIVERABLE] That Sell Like Crazy', '50 Etsy Listing Templates That Sell Like Crazy', 'Niche-specific sales claim', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 40),
('P3f', 'P3', 'pinterest', 'Adjective Sell Like Crazy', 'My [NUMBER] [ADJECTIVE] [DELIVERABLE] That Sell Like Crazy', 'My 50 Simple Templates That Sell Like Crazy', 'Personal + adjective + sales claim', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE'], 40);

-- P4: The Personal Income Reveal (5 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P4a', 'P4', 'pinterest', 'Personal Income Reveal', 'How I [RESULT] [FREQUENCY] Using These [NUMBER] [DELIVERABLE]', 'How I Make $700/Day Using These 12 Email Prompts', 'Personal proof of income creates credibility', ARRAY['RESULT', 'FREQUENCY', 'NUMBER', 'DELIVERABLE'], 40),
('P4b', 'P4', 'pinterest', 'Income Inside', 'How I [RESULT] [FREQUENCY]: My [DELIVERABLE] Inside', 'How I Lose 2 Lbs/Week: My Meal Tracker Inside', 'Personal result + deliverable reveal', ARRAY['RESULT', 'FREQUENCY', 'DELIVERABLE'], 40),
('P4c', 'P4', 'pinterest', 'Income Point Checklist', 'I [RESULT] [FREQUENCY] With This [NUMBER]-[DESCRIPTOR] [DELIVERABLE]', 'I Save 3 Hours/Day With This 5-Step Planning Checklist', 'Direct result claim with specific format', ARRAY['RESULT', 'FREQUENCY', 'NUMBER', 'DESCRIPTOR', 'DELIVERABLE'], 40),
('P4d', 'P4', 'pinterest', 'Income Time Action', 'How I [RESULT] in [TIME] [ACTION]: My [DELIVERABLE]', 'How I Made $5K in 30 Days Selling: My Launch Checklist', 'Time-bound personal result', ARRAY['RESULT', 'TIME', 'ACTION', 'DELIVERABLE'], 40),
('P4e', 'P4', 'pinterest', 'Income Time Simple', 'How I [RESULT] in [TIME] With This [DELIVERABLE]', 'How I Lost 20 Lbs in 90 Days With This Tracker', 'Simple time + result formula', ARRAY['RESULT', 'TIME', 'DELIVERABLE'], 40);

-- P5: The Platform Income Proof (5 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P5a', 'P5', 'pinterest', 'Platform Income Proof', '[ACTION]: I [RESULT] from [PLATFORM] Using These [NUMBER] [DELIVERABLE]', 'Getting Paid To Pin: I Made $335K Using These 7 Templates', 'Platform-specific proof', ARRAY['ACTION', 'RESULT', 'PLATFORM', 'NUMBER', 'DELIVERABLE'], 40),
('P5b', 'P5', 'pinterest', 'Platform Simple', 'I [RESULT] on [PLATFORM]. Here''s My [DELIVERABLE]', 'I Made $50K on Etsy. Here''s My Listing Checklist', 'Direct platform result claim', ARRAY['RESULT', 'PLATFORM', 'DELIVERABLE'], 40),
('P5c', 'P5', 'pinterest', 'Platform How', 'My [PLATFORM] [DELIVERABLE]: How I [RESULT]', 'My Etsy Launch Checklist: How I Hit $10K/Month', 'Platform-specific deliverable', ARRAY['PLATFORM', 'DELIVERABLE', 'RESULT'], 40),
('P5d', 'P5', 'pinterest', 'Platform Money Product', 'How I Make [MONEY] Per Year Selling [PRODUCT]: My [DELIVERABLE]', 'How I Make $400K Per Year Selling Printables: My Complete Checklist', 'Big income + specific product', ARRAY['MONEY', 'PRODUCT', 'DELIVERABLE'], 40),
('P5e', 'P5', 'pinterest', 'Platform Money Point', 'I Make [MONEY]/Year Selling [PRODUCT]. Here''s My [NUMBER]-Point [DELIVERABLE]', 'I Make $400K/Year Selling Planners. Here''s My 10-Point Launch Checklist', 'Income claim + structured deliverable', ARRAY['MONEY', 'PRODUCT', 'NUMBER', 'DELIVERABLE'], 40);

-- P6: The Essential Items (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P6a', 'P6', 'pinterest', 'Essential Items', '[NUMBER] [DELIVERABLE] You Need To [GOAL]', '7 Listing Templates You Need To Sell on Etsy', 'Fear of missing essentials', ARRAY['NUMBER', 'DELIVERABLE', 'GOAL'], 40),
('P6b', 'P6', 'pinterest', 'Essential Point', 'The [NUMBER]-Point [DELIVERABLE] You Need for [GOAL]', 'The 7-Point Checklist You Need for Etsy Success', 'Structured essentials', ARRAY['NUMBER', 'DELIVERABLE', 'GOAL'], 40),
('P6c', 'P6', 'pinterest', 'Must-Have', 'My [NUMBER] Must-Have [DELIVERABLE] for [GOAL]', 'My 7 Must-Have Scripts for Closing Sales', 'Personal must-haves', ARRAY['NUMBER', 'DELIVERABLE', 'GOAL'], 40);

-- P7: The Easy Way (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P7a', 'P7', 'pinterest', 'Easy Way', 'The [ADJECTIVE] [DELIVERABLE] To [OUTCOME] in [TIME]', 'The Lazy Checklist To Make $100/Day in 2025', 'Reduced effort/friction appeals to busy people', ARRAY['ADJECTIVE', 'DELIVERABLE', 'OUTCOME', 'TIME'], 40),
('P7b', 'P7', 'pinterest', 'Easy Number', '[NUMBER] [ADJECTIVE] [DELIVERABLE] for [OUTCOME] in [TIME]', '12 Simple Templates for $100/Day in 30 Days', 'Multiple easy items with time frame', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE', 'OUTCOME', 'TIME'], 40),
('P7c', 'P7', 'pinterest', 'Easy Day Plan', 'The [ADJECTIVE] [NUMBER]-Day [DELIVERABLE] To [OUTCOME]', 'The Easy 30-Day Planner To Lose 10 Lbs', 'Easy time-bound plan', ARRAY['ADJECTIVE', 'NUMBER', 'DELIVERABLE', 'OUTCOME'], 40);

-- P8: The Actually Works Promise (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P8a', 'P8', 'pinterest', 'Actually Works', '[NUMBER] [DELIVERABLE] That Actually [VERB]', '13 Email Templates That Actually Get Opens', 'Implies other solutions failed, this one works', ARRAY['NUMBER', 'DELIVERABLE', 'VERB'], 40),
('P8b', 'P8', 'pinterest', 'Actually Adjective', 'My [NUMBER] [ADJECTIVE] [DELIVERABLE] That Actually [VERB]', 'My 9 Proven Scripts That Actually Close', 'Personal + proven claim', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE', 'VERB'], 40),
('P8c', 'P8', 'pinterest', 'Actually Copy', '[NUMBER] [DELIVERABLE] That Actually [VERB] (Copy These)', '12 Headlines That Actually Convert (Copy These)', 'Actually works + copy invitation', ARRAY['NUMBER', 'DELIVERABLE', 'VERB'], 40);

-- P9: The Pattern Interrupt (5 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P9a', 'P9', 'pinterest', 'Pattern Interrupt Stop', 'Stop [WRONG ACTION]. Use This [DELIVERABLE] Instead', 'Stop Posting Daily. Use This Content Calendar Instead', 'Disrupts assumptions, creates curiosity', ARRAY['WRONG ACTION', 'DELIVERABLE'], 40),
('P9b', 'P9', 'pinterest', 'Pattern Interrupt Number', 'Stop [WRONG ACTION]. Try These [NUMBER] [DELIVERABLE]', 'Stop Guessing Meals. Try These 10 Meal Prep Templates', 'Stop action + multiple alternatives', ARRAY['WRONG ACTION', 'NUMBER', 'DELIVERABLE'], 40),
('P9c', 'P9', 'pinterest', 'Pattern Interrupt Point', 'Stop [WRONG ACTION]. Here''s My [NUMBER]-Point [DELIVERABLE]', 'Stop Wasting Time. Here''s My 7-Point Planning Checklist', 'Stop action + structured solution', ARRAY['WRONG ACTION', 'NUMBER', 'DELIVERABLE'], 40),
('P9d', 'P9', 'pinterest', 'Pattern Interrupt Audience', 'STOP [WRONG ACTION] Wrong. What [AUDIENCE] Actually Want: [DELIVERABLE]', 'STOP Pitching Wrong. What Clients Actually Want: Script Templates', 'Correct wrong behavior + reveal', ARRAY['WRONG ACTION', 'AUDIENCE', 'DELIVERABLE'], 40),
('P9e', 'P9', 'pinterest', 'Pattern Interrupt Killing', 'Why [COMMON ACTION] Is Killing Your [GOAL] (+ [DELIVERABLE] To Fix It)', 'Why Multitasking Is Killing Your Productivity (+ Planner)', 'Problem awareness + solution', ARRAY['COMMON ACTION', 'GOAL', 'DELIVERABLE'], 40);

-- P10: The Only Thing You Need (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P10a', 'P10', 'pinterest', 'Only Thing Needed', 'The Only [NUMBER] [DELIVERABLE] You Need', 'The Only 5 Email Templates You Need', 'Minimalist claim reduces overwhelm', ARRAY['NUMBER', 'DELIVERABLE'], 40),
('P10b', 'P10', 'pinterest', 'Only Point Needed', 'The Only [NUMBER]-Point [DELIVERABLE] You Need To [OUTCOME]', 'The Only 5-Point Checklist You Need To Close Sales', 'Minimal structured solution', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 40),
('P10c', 'P10', 'pinterest', 'You Only Need', 'You Only Need This [NUMBER] [ADJECTIVE] [DELIVERABLE]', 'You Only Need This 5-Step Simple Planner', 'Direct minimalist claim', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE'], 40);

-- P11: The Get Paid Command (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P11a', 'P11', 'pinterest', 'Get Paid Command', 'Get Paid To [ACTION]: [NUMBER] [DELIVERABLE] Inside', 'Get Paid To Write: 12 Pitch Templates Inside', 'Direct get paid language appeals to income seekers', ARRAY['ACTION', 'NUMBER', 'DELIVERABLE'], 40),
('P11b', 'P11', 'pinterest', 'Get Paid Money', 'Get Paid To [ACTION] ([MONEY] per [TIME]). Here''s The [DELIVERABLE]', 'Get Paid To Type ($25 per Hour). Here''s The Checklist', 'Specific income claim', ARRAY['ACTION', 'MONEY', 'TIME', 'DELIVERABLE'], 40),
('P11c', 'P11', 'pinterest', 'Get Paid Point', 'Get Paid To [ACTION]: My [NUMBER]-Point [DELIVERABLE]', 'Get Paid To Create: My 7-Point Freelance Checklist', 'Get paid + structured deliverable', ARRAY['ACTION', 'NUMBER', 'DELIVERABLE'], 40);

-- P12: The From Home Promise (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P12a', 'P12', 'pinterest', 'From Home Number', 'How To [ACTION] From Home: [NUMBER] [DELIVERABLE] Inside', 'How To Make Money From Home: 15 Income Templates Inside', 'Work-from-home appeal', ARRAY['ACTION', 'NUMBER', 'DELIVERABLE'], 40),
('P12b', 'P12', 'pinterest', 'From Home My', 'How To [ACTION] From Home (My [DELIVERABLE])', 'How To Start a Business From Home (My Launch Checklist)', 'Personal from-home solution', ARRAY['ACTION', 'DELIVERABLE'], 40),
('P12c', 'P12', 'pinterest', 'From Home Step', '[ACTION] From Home: The [NUMBER]-Step [DELIVERABLE]', 'Earn $3K/Month From Home: The 10-Step Blueprint', 'Specific steps from home', ARRAY['ACTION', 'NUMBER', 'DELIVERABLE'], 40);

-- P13: The Timing Trigger (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P13a', 'P13', 'pinterest', 'Timing Trigger', '[NUMBER] [DELIVERABLE] To [ACTION] at The [TIME]', '17 Checklists To Complete at The Beginning of Every Month', 'Action tied to specific timing creates urgency', ARRAY['NUMBER', 'DELIVERABLE', 'ACTION', 'TIME'], 40),
('P13b', 'P13', 'pinterest', 'Timing Items', '[NUMBER] [ITEMS] To [ACTION] Every [TIME]: [DELIVERABLE] Inside', '10 Things To Review Every Monday: Planner Inside', 'Regular timing + deliverable', ARRAY['NUMBER', 'ITEMS', 'ACTION', 'TIME', 'DELIVERABLE'], 40),
('P13c', 'P13', 'pinterest', 'Timing Point', 'My [NUMBER]-Point [TIME] [DELIVERABLE]', 'My 12-Point Monthly Review Checklist', 'Personal timed checklist', ARRAY['NUMBER', 'TIME', 'DELIVERABLE'], 40);

-- P14: The Step By Step Guide (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('P14a', 'P14', 'pinterest', 'Step By Step Inside', 'How To [ACTION] Step By Step: [DELIVERABLE] Inside', 'How To Launch on Etsy Step By Step: Checklist Inside', 'Clear structure reduces overwhelm', ARRAY['ACTION', 'DELIVERABLE'], 40),
('P14b', 'P14', 'pinterest', 'Step By Step Point', '[ACTION] Step By Step: My [NUMBER]-Point [DELIVERABLE]', 'Build Your Funnel Step By Step: My 14-Point Blueprint', 'Step-by-step + structured format', ARRAY['ACTION', 'NUMBER', 'DELIVERABLE'], 40),
('P14c', 'P14', 'pinterest', 'Step By Step Outcome', 'The Step By Step [DELIVERABLE] To [OUTCOME]', 'The Step By Step Checklist To Your First $1K', 'Step-by-step to specific outcome', ARRAY['DELIVERABLE', 'OUTCOME'], 40);

-- ============================================================
-- YOUTUBE FRAMEWORKS (Y1-Y32) - 120 variations
-- Category weight: 45%
-- ============================================================

-- Y1: The Boring Paradox (7 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y1a', 'Y1', 'youtube', 'Boring Paradox', '[NUMBER] "Boring" [DELIVERABLE] That [HIGH RESULT]', '5 Boring Email Templates That Make $3K/Month', 'Boring creates curiosity through contradiction', ARRAY['NUMBER', 'DELIVERABLE', 'HIGH RESULT'], 45),
('Y1b', 'Y1', 'youtube', 'Boring Point', 'My [NUMBER]-Point "Boring" [TOPIC] [DELIVERABLE] That [HIGH RESULT]', 'My 5-Point Boring Budget Checklist That Saved $10K', 'Personal boring but effective', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE', 'HIGH RESULT'], 45),
('Y1c', 'Y1', 'youtube', 'Boring But', '[NUMBER] Boring But [ADJECTIVE] [DELIVERABLE]', '5 Boring But Profitable Email Templates', 'Contrast between boring and positive result', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE'], 45),
('Y1d', 'Y1', 'youtube', 'Stupid Simple', '[NUMBER] Stupid Simple [DELIVERABLE] That [RESULT]', '6 Stupid Simple Email Scripts That Pay $3K/Month', 'Simplicity as feature', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 45),
('Y1e', 'Y1', 'youtube', 'Stupid Simple Topic', '[NUMBER] Stupid Simple [TOPIC] [DELIVERABLE]', '6 Stupid Simple Etsy Listing Templates', 'Simple niche-specific', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 45),
('Y1f', 'Y1', 'youtube', 'Stupid Simple Point', 'My [NUMBER]-Point Stupid Simple [DELIVERABLE] To [OUTCOME]', 'My 6-Point Stupid Simple Checklist To Save Money', 'Personal simple solution', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45),
('Y1g', 'Y1', 'youtube', 'Boring Price', '[NUMBER] "Boring" [DELIVERABLE] To Sell for [PRICE] Each', '7 Boring Templates To Sell for $50 Each', 'Boring items with price point', ARRAY['NUMBER', 'DELIVERABLE', 'PRICE'], 45);

-- Y2: The Identity Paradox (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y2a', 'Y2', 'youtube', 'Identity Paradox', 'If You''re [QUALITY] but [FLAW]: Try This [DELIVERABLE]', 'If You''re Ambitious but Lazy: Try This Planner', 'Quality + flaw = relatable audience', ARRAY['QUALITY', 'FLAW', 'DELIVERABLE'], 45),
('Y2b', 'Y2', 'youtube', 'Identity Number', 'If You''re [QUALITY] but [FLAW], These [NUMBER] [DELIVERABLE] Help', 'If You''re Creative but Broke, These 10 Templates Help', 'Identity + multiple solutions', ARRAY['QUALITY', 'FLAW', 'NUMBER', 'DELIVERABLE'], 45),
('Y2c', 'Y2', 'youtube', 'Identity For', 'The [DELIVERABLE] for [QUALITY] People Who [FLAW]', 'The Checklist for Smart People Who Procrastinate', 'Deliverable for paradox audience', ARRAY['DELIVERABLE', 'QUALITY', 'FLAW'], 45);

-- Y3: The Percentage Fix (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y3a', 'Y3', 'youtube', 'Percentage Fix', '[NUMBER] [DELIVERABLE] That Fix [HIGH %] of [PROBLEM]', '4 Morning Templates That Fix 90% of Productivity Issues', 'High percentage = comprehensive solution', ARRAY['NUMBER', 'DELIVERABLE', 'HIGH %', 'PROBLEM'], 45),
('Y3b', 'Y3', 'youtube', 'Percentage Point', 'My [NUMBER]-Point [DELIVERABLE] That Fixes [HIGH %] of [PROBLEM]', 'My 4-Point Checklist That Fixes 90% of Your Money Problems', 'Personal percentage fix', ARRAY['NUMBER', 'DELIVERABLE', 'HIGH %', 'PROBLEM'], 45),
('Y3c', 'Y3', 'youtube', 'Percentage Inside', 'The [HIGH %] [PROBLEM] Fix: [NUMBER] [DELIVERABLE] Inside', 'The 90% Productivity Fix: 4 Habit Trackers Inside', 'Percentage as headline', ARRAY['HIGH %', 'PROBLEM', 'NUMBER', 'DELIVERABLE'], 45);

-- Y4: The Authority Steal (5 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y4a', 'Y4', 'youtube', 'Authority Steal', 'How [AUTHORITY] [ACTION]: [DELIVERABLE] Inside (Steal This)', 'How Top Sellers Write Titles: Swipe File Inside (Steal This)', 'Borrow credibility from authority figures', ARRAY['AUTHORITY', 'ACTION', 'DELIVERABLE'], 45),
('Y4b', 'Y4', 'youtube', 'Authority Number', '[NUMBER] [DELIVERABLE] [AUTHORITY] Use To [ACTION] (Steal These)', '12 Scripts Top Closers Use To Land Clients (Steal These)', 'Multiple authority items', ARRAY['NUMBER', 'DELIVERABLE', 'AUTHORITY', 'ACTION'], 45),
('Y4c', 'Y4', 'youtube', 'Authority How', 'The [AUTHORITY] [DELIVERABLE]: How They [ACTION]', 'The CEO Checklist: How They Get Things Done', 'Authority-branded deliverable', ARRAY['AUTHORITY', 'DELIVERABLE', 'ACTION'], 45),
('Y4d', 'Y4', 'youtube', 'Authority Too', 'How [AUTHORITY] [OUTCOME] (and How You Can Too): [DELIVERABLE]', 'How Top Sellers Get Reviews (and How You Can Too): Checklist', 'Authority + you can too', ARRAY['AUTHORITY', 'OUTCOME', 'DELIVERABLE'], 45),
('Y4e', 'Y4', 'youtube', 'Authority Same', 'How [AUTHORITY] [ACTION]: [NUMBER] [DELIVERABLE] to Do the Same', 'How 7-Figure Sellers List Products: 10 Templates to Do the Same', 'Authority + replication', ARRAY['AUTHORITY', 'ACTION', 'NUMBER', 'DELIVERABLE'], 45);

-- Y5: The Brutal Truth (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y5a', 'Y5', 'youtube', 'Brutal Truth Fix', '[NUMBER] Brutal Truths About [TOPIC] (+ The [DELIVERABLE] To Fix Them)', '7 Brutal Truths About Etsy (+ The Checklist To Fix Them)', 'Harsh reality creates trust', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 45),
('Y5b', 'Y5', 'youtube', 'Brutal Truth Help', '[NUMBER] Brutal [TOPIC] Truths + The [DELIVERABLE] That Helps', '7 Brutal Money Truths + The Budget Planner That Helps', 'Truths + solution', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 45),
('Y5c', 'Y5', 'youtube', 'Brutal Point', 'My [NUMBER]-Point Brutal [TOPIC] [DELIVERABLE]', 'My 7-Point Brutal Etsy Success Checklist', 'Personal brutal checklist', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 45),
('Y5d', 'Y5', 'youtube', 'Brutal Wish', '[NUMBER] Brutal Truths I Wish I Knew [EARLIER]: [DELIVERABLE]', '10 Brutal Truths I Wish I Knew Before Starting: Checklist', 'Regret-based truths', ARRAY['NUMBER', 'EARLIER', 'DELIVERABLE'], 45);

-- Y6: The Time Compression (5 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y6a', 'Y6', 'youtube', 'Time Compression', '[TIME] of [TOPIC] Tips in 1 [DELIVERABLE]', '3 Years of Pinterest Tips in 1 Checklist', 'Years of knowledge compressed = high value', ARRAY['TIME', 'TOPIC', 'DELIVERABLE'], 45),
('Y6b', 'Y6', 'youtube', 'Time Lessons', '[TIME] of [TOPIC] Lessons: The Complete [DELIVERABLE]', '5 Years of Business Lessons: The Complete Checklist', 'Lessons over time', ARRAY['TIME', 'TOPIC', 'DELIVERABLE'], 45),
('Y6c', 'Y6', 'youtube', 'Time Spent', 'I Spent [TIME] on [TOPIC]. Here''s The [NUMBER]-Point [DELIVERABLE]', 'I Spent 3 Years on Etsy. Here''s The 10-Point Checklist', 'Personal time investment', ARRAY['TIME', 'TOPIC', 'NUMBER', 'DELIVERABLE'], 45),
('Y6d', 'Y6', 'youtube', 'Percentage Compression', '[PERCENTAGE] of [TOPIC] in 1 [DELIVERABLE]', '80% of Etsy Success in 1 Checklist', 'Percentage of knowledge', ARRAY['PERCENTAGE', 'TOPIC', 'DELIVERABLE'], 45),
('Y6e', 'Y6', 'youtube', 'Time Number', '[TIME] of [TOPIC] in [NUMBER] [DELIVERABLE]', '5 Years of Sales Lessons in 10 Templates', 'Time compressed to number', ARRAY['TIME', 'TOPIC', 'NUMBER', 'DELIVERABLE'], 45);

-- Y7: The No BS Promise (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y7a', 'Y7', 'youtube', 'No BS', '[NUMBER] No BS [DELIVERABLE] To [OUTCOME]', '6 No BS Email Scripts To Get Sales', 'Direct, no-nonsense approach builds trust', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45),
('Y7b', 'Y7', 'youtube', 'No BS Point', 'My [NUMBER]-Point No BS [DELIVERABLE] To [OUTCOME]', 'My 6-Point No BS Checklist To Close Clients', 'Personal no BS solution', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45),
('Y7c', 'Y7', 'youtube', 'No BS Ways', 'The No BS [DELIVERABLE]: [NUMBER] Ways To [OUTCOME]', 'The No BS Checklist: 6 Ways To Get Clients', 'No BS with multiple approaches', ARRAY['DELIVERABLE', 'NUMBER', 'OUTCOME'], 45),
('Y7d', 'Y7', 'youtube', 'Proven', 'The Proven [DELIVERABLE] To [OUTCOME] [CIRCUMSTANCE]', 'The Proven Checklist To Get Clients From Home', 'Proven claim', ARRAY['DELIVERABLE', 'OUTCOME', 'CIRCUMSTANCE'], 45);

-- Y8: The Copy Invitation (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y8a', 'Y8', 'youtube', 'Copy These', '[NUMBER] [DELIVERABLE] That [RESULT] (Copy These)', '9 Product Descriptions That Sell (Copy These)', 'Permission to copy = instant value', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 45),
('Y8b', 'Y8', 'youtube', 'Copy-Paste', '[NUMBER] Copy-Paste [DELIVERABLE] That [RESULT]', '9 Copy-Paste Email Templates That Convert', 'Ready to use format', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 45),
('Y8c', 'Y8', 'youtube', 'Copy Them', 'My [NUMBER] [ADJECTIVE] [DELIVERABLE] That [RESULT]: Copy Them', 'My 9 Best Scripts That Close Sales: Copy Them', 'Personal + copy invitation', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE', 'RESULT'], 45),
('Y8d', 'Y8', 'youtube', 'Use Today', '[NUMBER] [DELIVERABLE] You Can Use Today for [OUTCOME] (Copy)', '7 Email Templates You Can Use Today for Sales (Copy)', 'Immediate use + copy', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45);

-- Y9: The Easier Than You Think (5 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y9a', 'Y9', 'youtube', 'Easier Than Think', '[OUTCOME] Is Easier Than You Think. Here''s The [DELIVERABLE]', 'Making $500/Day Is Easier Than You Think. Here''s The Checklist', 'Reduces perceived difficulty', ARRAY['OUTCOME', 'DELIVERABLE'], 45),
('Y9b', 'Y9', 'youtube', 'Easier Point', '[OUTCOME] Is Easier With This [NUMBER]-Point [DELIVERABLE]', 'Getting Clients Is Easier With This 7-Point Checklist', 'Easier + structured solution', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 45),
('Y9c', 'Y9', 'youtube', 'Makes Easy', 'The [DELIVERABLE] That Makes [OUTCOME] Easy', 'The Planner That Makes Productivity Easy', 'Deliverable makes it easy', ARRAY['DELIVERABLE', 'OUTCOME'], 45),
('Y9d', 'Y9', 'youtube', 'Can In Time', 'You Can [OUTCOME] in [TIME], Here''s The [DELIVERABLE]', 'You Can Get Clients in 30 Days, Here''s The Checklist', 'Achievable timeframe', ARRAY['OUTCOME', 'TIME', 'DELIVERABLE'], 45),
('Y9e', 'Y9', 'youtube', 'Do This Even', 'Do This To [OUTCOME] (Even [CIRCUMSTANCE]): [DELIVERABLE]', 'Do This To Get Clients (Even as a Beginner): Templates Inside', 'Even circumstance claim', ARRAY['OUTCOME', 'CIRCUMSTANCE', 'DELIVERABLE'], 45);

-- Y10: The Hidden Truth (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y10a', 'Y10', 'youtube', 'Hidden Truth', 'What [EXPERTS] Don''t Tell You About [TOPIC]: [DELIVERABLE] Inside', 'What Gurus Don''t Tell You About Etsy: Checklist Inside', 'Secrets experts hide = exclusive knowledge', ARRAY['EXPERTS', 'TOPIC', 'DELIVERABLE'], 45),
('Y10b', 'Y10', 'youtube', 'Hidden My', 'What [EXPERTS] Hide About [TOPIC]. My [DELIVERABLE]', 'What Coaches Hide About Sales. My Script Templates', 'Personal reveal of hidden info', ARRAY['EXPERTS', 'TOPIC', 'DELIVERABLE'], 45),
('Y10c', 'Y10', 'youtube', 'Hidden Want', 'The [TOPIC] [DELIVERABLE] [EXPERTS] Don''t Want You To Have', 'The Sales Scripts Coaches Don''t Want You To Have', 'Forbidden knowledge claim', ARRAY['TOPIC', 'DELIVERABLE', 'EXPERTS'], 45),
('Y10d', 'Y10', 'youtube', 'Untold Truth', 'The Untold Truth About [TOPIC]: [DELIVERABLE] Inside', 'The Untold Truth About Etsy Ranking: Checklist Inside', 'Untold truth reveal', ARRAY['TOPIC', 'DELIVERABLE'], 45);

-- Y11: The Real Reason (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y11a', 'Y11', 'youtube', 'Real Reason', 'The Real Reason You''re Not [GETTING RESULT] (And The [DELIVERABLE] That Fixes It)', 'The Real Reason You''re Not Getting Sales (And The Checklist That Fixes It)', 'Root cause revelation creates aha moment', ARRAY['GETTING RESULT', 'DELIVERABLE'], 45),
('Y11b', 'Y11', 'youtube', 'Real Reason Point', 'Why You''re Not [GETTING RESULT] + The [NUMBER]-Point [DELIVERABLE]', 'Why You''re Not Closing Clients + The 7-Point Script Pack', 'Why + structured solution', ARRAY['GETTING RESULT', 'NUMBER', 'DELIVERABLE'], 45),
('Y11c', 'Y11', 'youtube', 'Not Getting Try', 'Not [GETTING RESULT]? Try This [DELIVERABLE]', 'Not Getting Clients? Try This Outreach Checklist', 'Direct problem + solution', ARRAY['GETTING RESULT', 'DELIVERABLE'], 45),
('Y11d', 'Y11', 'youtube', 'Stop Wrong', 'STOP [BEHAVIOR] Wrong. What [AUDIENCE] Actually Want: [DELIVERABLE]', 'STOP Pitching Wrong. What Clients Actually Want: Script Templates', 'Stop behavior + actual want', ARRAY['BEHAVIOR', 'AUDIENCE', 'DELIVERABLE'], 45);

-- Y12: The Tested Results (5 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y12a', 'Y12', 'youtube', 'Tested Results', 'I Tried [NUMBER] [ITEMS]. These [X] [DELIVERABLE] Work', 'I Tried 50 Hooks. These 7 Headline Templates Work', 'Large-scale testing = proven results', ARRAY['NUMBER', 'ITEMS', 'X', 'DELIVERABLE'], 45),
('Y12b', 'Y12', 'youtube', 'Tested Here', 'I Tested [NUMBER] [ITEMS]. Here''s The [X] That Work ([DELIVERABLE])', 'I Tested 100 Emails. Here''s The 5 That Work (Templates)', 'Testing + specific winners', ARRAY['NUMBER', 'ITEMS', 'X', 'DELIVERABLE'], 45),
('Y12c', 'Y12', 'youtube', 'Tested Cut', '[NUMBER] [ITEMS] Tested. Only [X] [DELIVERABLE] Made The Cut', '50 Strategies Tested. Only 7 Templates Made The Cut', 'Selectivity through testing', ARRAY['NUMBER', 'ITEMS', 'X', 'DELIVERABLE'], 45),
('Y12d', 'Y12', 'youtube', 'Studied Works', 'I Studied [NUMBER] [ITEMS]. Here''s What Works: [DELIVERABLE]', 'I Studied 200 Top Listings. Here''s What Works: Checklist', 'Study-based findings', ARRAY['NUMBER', 'ITEMS', 'DELIVERABLE'], 45),
('Y12e', 'Y12', 'youtube', 'Studied Will', 'I Read/Studied [NUMBER] [ITEMS]. These [X] [DELIVERABLE] Will [OUTCOME]', 'I Read 50 Sales Books. These 7 Scripts Will Get Clients', 'Study + outcome promise', ARRAY['NUMBER', 'ITEMS', 'X', 'DELIVERABLE', 'OUTCOME'], 45);

-- Y13: The Research Authority (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y13a', 'Y13', 'youtube', 'Research Authority', 'I Asked [NUMBER] [STATUS] How They [OUTCOME]. Here''s The [DELIVERABLE]', 'I Asked 500 Top Sellers How They Get Sales. Here''s The Checklist', 'Large sample research = credibility', ARRAY['NUMBER', 'STATUS', 'OUTCOME', 'DELIVERABLE'], 45),
('Y13b', 'Y13', 'youtube', 'Research Number', 'I Asked [NUMBER] [STATUS]: [NUMBER] [DELIVERABLE] That Actually Work', 'I Asked 500 Top Sellers: 7 Templates That Actually Work', 'Research + proven items', ARRAY['NUMBER', 'STATUS', 'NUMBER', 'DELIVERABLE'], 45),
('Y13c', 'Y13', 'youtube', 'Research Exposed', '[NUMBER] [STATUS] Exposed Their [TOPIC] [DELIVERABLE]', '500 Six-Figure Sellers Exposed Their Pricing Templates', 'Exposed secrets from many', ARRAY['NUMBER', 'STATUS', 'TOPIC', 'DELIVERABLE'], 45);

-- Y14: The Skills Requirement (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y14a', 'Y14', 'youtube', 'Skills Requirement', '[NUMBER] Skills You Need To [OUTCOME]: My [DELIVERABLE]', '7 Skills You Need To Make $10K/Month: My Training Checklist', 'Fear of missing essential skills', ARRAY['NUMBER', 'OUTCOME', 'DELIVERABLE'], 45),
('Y14b', 'Y14', 'youtube', 'Skills Deliverable', 'The [NUMBER] Skills [DELIVERABLE] for [OUTCOME]', 'The 7 Skills Checklist for Closing Sales', 'Skills as deliverable', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45),
('Y14c', 'Y14', 'youtube', 'Skills Have', 'Do You Have These [NUMBER] [TOPIC] Skills? ([DELIVERABLE])', 'Do You Have These 5 Sales Skills? (Assessment Checklist)', 'Skills question + assessment', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 45),
('Y14d', 'Y14', 'youtube', 'Skills Must', '[NUMBER] [TOPIC] Skills You Must Have To [OUTCOME]: [DELIVERABLE]', '5 Sales Skills You Must Have To Close Deals: Assessment Checklist', 'Must-have skills', ARRAY['NUMBER', 'TOPIC', 'OUTCOME', 'DELIVERABLE'], 45);

-- Y15: The Forever Shift (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y15a', 'Y15', 'youtube', 'Forever Shift', '[NUMBER] [TOPIC] Trends That Will Change [THING] Forever: [DELIVERABLE] Inside', '8 Marketing Trends That Will Change Sales Forever: Checklist Inside', 'Urgency through permanent change', ARRAY['NUMBER', 'TOPIC', 'THING', 'DELIVERABLE'], 45),
('Y15b', 'Y15', 'youtube', 'Forever Items', 'These [NUMBER] [ITEMS] Will Change [TOPIC] Forever (Get My [DELIVERABLE])', 'These 8 AI Tools Will Change Marketing Forever (Get My Checklist)', 'Change + deliverable offer', ARRAY['NUMBER', 'ITEMS', 'TOPIC', 'DELIVERABLE'], 45),
('Y15c', 'Y15', 'youtube', 'Forever Ahead', '[TOPIC] Is Changing Forever. My [NUMBER]-Point [DELIVERABLE] To Stay Ahead', 'E-commerce Is Changing Forever. My 10-Point Survival Checklist', 'Stay ahead of change', ARRAY['TOPIC', 'NUMBER', 'DELIVERABLE'], 45);

-- Y16: The Simple Generator (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y16a', 'Y16', 'youtube', 'Simple Generator', 'This Simple [DELIVERABLE] Generates [MONEY]/[TIME]', 'This Simple Email Sequence Generates $5K/Month', 'Simplicity + specific income proof', ARRAY['DELIVERABLE', 'MONEY', 'TIME'], 45),
('Y16b', 'Y16', 'youtube', 'Simple Platform', 'My Simple [DELIVERABLE] That Generates [MONEY] on [PLATFORM]', 'My Simple Listing Template That Generates $3K/Month on Etsy', 'Simple + platform income', ARRAY['DELIVERABLE', 'MONEY', 'PLATFORM'], 45),
('Y16c', 'Y16', 'youtube', 'Simple Number', '[NUMBER] Simple [DELIVERABLE] That Generate [MONEY]', '5 Simple Templates That Generate $10K/Month', 'Multiple simple generators', ARRAY['NUMBER', 'DELIVERABLE', 'MONEY'], 45),
('Y16d', 'Y16', 'youtube', 'New Fast', 'New [DELIVERABLE] That [RESULT] Fast', 'New Email Template That Gets Replies Fast', 'New + fast results', ARRAY['DELIVERABLE', 'RESULT'], 45);

-- Y17: The Multiplier (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y17a', 'Y17', 'youtube', 'Multiplier', 'Turn [SMALL RESULT] Into [BIG RESULT]: My [DELIVERABLE]', 'Turn $100 Into $1,000: My Investment Checklist', 'Transformation/multiplication of value', ARRAY['SMALL RESULT', 'BIG RESULT', 'DELIVERABLE'], 45),
('Y17b', 'Y17', 'youtube', 'Multiplier Number', 'How To Turn [SMALL] Into [BIG]: [NUMBER] [DELIVERABLE] Inside', 'How To Turn $500 Into $5,000: 7 Templates Inside', 'How to multiply + templates', ARRAY['SMALL', 'BIG', 'NUMBER', 'DELIVERABLE'], 45),
('Y17c', 'Y17', 'youtube', 'Multiplier The', 'The [DELIVERABLE] That Turns [SMALL] Into [BIG]', 'The Checklist That Turns Side Hustles Into Full-Time Income', 'Deliverable as multiplier', ARRAY['DELIVERABLE', 'SMALL', 'BIG'], 45);

-- Y18: The Actually Works (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y18a', 'Y18', 'youtube', 'Actually How', 'How To Actually [OUTCOME]: My [NUMBER]-Point [DELIVERABLE]', 'How To Actually Get Clients: My 7-Point Checklist', 'Actually implies others failed', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 45),
('Y18b', 'Y18', 'youtube', 'Actually Number', '[NUMBER] [DELIVERABLE] That Actually [RESULT]', '7 Scripts That Actually Close Sales', 'Number + actually works', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 45),
('Y18c', 'Y18', 'youtube', 'Actually Proven', 'The [DELIVERABLE] That Actually [RESULT] (Proven)', 'The Email Template That Actually Gets Opens (Proven)', 'Actually + proven claim', ARRAY['DELIVERABLE', 'RESULT'], 45),
('Y18d', 'Y18', 'youtube', 'Better Than', 'How To [OUTCOME] Better Than [PERCENTAGE] of People: [DELIVERABLE]', 'How To Sell Better Than 95% of Etsy Shops: My Checklist', 'Better than percentage', ARRAY['OUTCOME', 'PERCENTAGE', 'DELIVERABLE'], 45);

-- Y19: The Quit List (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y19a', 'Y19', 'youtube', 'Quit List', '[NUMBER] Things To Quit To [OUTCOME]: My [DELIVERABLE]', '7 Things To Quit To Save Money: My Audit Checklist', 'Counterintuitive success through subtraction', ARRAY['NUMBER', 'OUTCOME', 'DELIVERABLE'], 45),
('Y19b', 'Y19', 'youtube', 'Quit These', 'I Quit These [NUMBER] Things To [OUTCOME]. Here''s The [DELIVERABLE]', 'I Quit These 7 Things To Get Rich. Here''s The Checklist', 'Personal quit story', ARRAY['NUMBER', 'OUTCOME', 'DELIVERABLE'], 45),
('Y19c', 'Y19', 'youtube', 'What To Quit', 'The [NUMBER]-Point "What To Quit" [DELIVERABLE] for [OUTCOME]', 'The 7-Point "What To Quit" Checklist for Financial Freedom', 'Structured quit list', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45);

-- Y20: The Free Percentage Boost (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y20a', 'Y20', 'youtube', 'Free Percentage', '[NUMBER] [DELIVERABLE] To Be [PERCENTAGE] More [STATE] (Free)', '10 Templates To Be 90% More Productive (Free)', 'Free + extreme improvement', ARRAY['NUMBER', 'DELIVERABLE', 'PERCENTAGE', 'STATE'], 45),
('Y20b', 'Y20', 'youtube', 'Percentage Free', '[PERCENTAGE] More [STATE] With These Free [DELIVERABLE]', '80% More Focused With These Free Planners', 'Percentage + free', ARRAY['PERCENTAGE', 'STATE', 'DELIVERABLE'], 45),
('Y20c', 'Y20', 'youtube', 'Free Makes', 'The Free [DELIVERABLE] That Makes You [PERCENTAGE] More [STATE]', 'The Free Planner That Makes You 80% More Focused', 'Free deliverable + percentage boost', ARRAY['DELIVERABLE', 'PERCENTAGE', 'STATE'], 45);

-- Y21: The Without Objection (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y21a', 'Y21', 'youtube', 'Without Objection', '[NUMBER] [DELIVERABLE] That [OUTCOME] Without [OBJECTION]', '5 Templates That Make Sales Without Cold Calling', 'Removes main barrier/objection', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME', 'OBJECTION'], 45),
('Y21b', 'Y21', 'youtube', 'Without Point', '[OUTCOME] Without [OBJECTION]: My [NUMBER]-Point [DELIVERABLE]', 'Get Clients Without Pitching: My 5-Point Checklist', 'Outcome without barrier + structure', ARRAY['OUTCOME', 'OBJECTION', 'NUMBER', 'DELIVERABLE'], 45),
('Y21c', 'Y21', 'youtube', 'No Objection', 'The No-[OBJECTION] [DELIVERABLE] for [OUTCOME]', 'The No-Cold-Call Checklist for Getting Clients', 'No-barrier deliverable', ARRAY['OBJECTION', 'DELIVERABLE', 'OUTCOME'], 45),
('Y21d', 'Y21', 'youtube', 'With Low', '[OUTCOME] With [RIDICULOUSLY LOW RESOURCE]: [DELIVERABLE]', 'Start Selling With $0: My Free Launch Checklist', 'Low resource entry point', ARRAY['OUTCOME', 'RIDICULOUSLY LOW RESOURCE', 'DELIVERABLE'], 45);

-- Y22: The Discovery Secret (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y22a', 'Y22', 'youtube', 'Discovery Secret', '[NUMBER] [TOPIC] [DELIVERABLE] You Didn''t Know Existed', '15 Etsy Listing Templates You Didn''t Know Existed', 'Hidden knowledge revealed', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 45),
('Y22b', 'Y22', 'youtube', 'Didn''t Know Need', 'The [DELIVERABLE] You Didn''t Know You Needed for [OUTCOME]', 'The Checklist You Didn''t Know You Needed for Etsy Success', 'Unknown need revealed', ARRAY['DELIVERABLE', 'OUTCOME'], 45),
('Y22c', 'Y22', 'youtube', 'Hidden', '[NUMBER] Hidden [DELIVERABLE] for [OUTCOME]', '7 Hidden Email Scripts for Getting Replies', 'Hidden items revealed', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45);

-- Y23: The Underrated Gem (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y23a', 'Y23', 'youtube', 'Underrated Gem', 'The Most Underrated [DELIVERABLE] To [OUTCOME]', 'The Most Underrated Checklist To Double Your Sales', 'Hidden gem others overlook', ARRAY['DELIVERABLE', 'OUTCOME'], 45),
('Y23b', 'Y23', 'youtube', 'Underrated Number', '[NUMBER] Underrated [DELIVERABLE] for [OUTCOME]', '5 Underrated Templates for Getting Clients', 'Multiple underrated items', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45),
('Y23c', 'Y23', 'youtube', 'This Underrated', 'This Underrated [DELIVERABLE] [RESULT]', 'This Underrated Planner Saved Me 10 Hours/Week', 'Personal underrated find', ARRAY['DELIVERABLE', 'RESULT'], 45);

-- Y24: The Impossible to Fail (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y24a', 'Y24', 'youtube', 'Impossible Fail', '[AUTHORITY] [DELIVERABLE] That Make It Impossible To [FAIL]', 'CEO Checklists That Make It Impossible To Miss Deadlines', 'Certainty/guaranteed success', ARRAY['AUTHORITY', 'DELIVERABLE', 'FAIL'], 45),
('Y24b', 'Y24', 'youtube', 'Makes Impossible', 'The [DELIVERABLE] That Makes [FAILURE] Impossible', 'The Budget Planner That Makes Overspending Impossible', 'Deliverable prevents failure', ARRAY['DELIVERABLE', 'FAILURE'], 45),
('Y24c', 'Y24', 'youtube', 'Fail-Proof', '[NUMBER] Fail-Proof [DELIVERABLE] for [OUTCOME]', '7 Fail-Proof Templates for Landing Clients', 'Fail-proof items', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 45);

-- Y25: The Trade-Off Promise (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y25a', 'Y25', 'youtube', 'Trade-Off', 'Spend [SMALL TIME] on This [DELIVERABLE], Save [BIG VALUE]', 'Spend 10 Minutes on This Checklist, Save 10 Hours/Week', 'Small investment for massive return', ARRAY['SMALL TIME', 'DELIVERABLE', 'BIG VALUE'], 45),
('Y25b', 'Y25', 'youtube', 'Trade-Off Took', 'This [DELIVERABLE] Took Me [SMALL TIME] to Make. It''ll Save You [BIG VALUE]', 'This Checklist Took Me 2 Hours to Make. It''ll Save You 100 Hours', 'Personal investment + your savings', ARRAY['DELIVERABLE', 'SMALL TIME', 'BIG VALUE'], 45),
('Y25c', 'Y25', 'youtube', 'Now Later', '[SMALL INVESTMENT] Now = [BIG RESULT] Later: My [DELIVERABLE]', '$7 Now = $7,000 Later: My Investment Checklist', 'Investment equation', ARRAY['SMALL INVESTMENT', 'BIG RESULT', 'DELIVERABLE'], 45);

-- Y26: The Elite Association (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y26a', 'Y26', 'youtube', 'Elite Association', 'The [NUMBER] [DELIVERABLE] of The Top [PERCENTAGE]', 'The 10 Habits Checklist of The Top 1%', 'Association with top performers', ARRAY['NUMBER', 'DELIVERABLE', 'PERCENTAGE'], 45),
('Y26b', 'Y26', 'youtube', 'Elite Topic', '[NUMBER] [TOPIC] [DELIVERABLE] Used By The Top [PERCENTAGE]', '10 Productivity Templates Used By The Top 5%', 'Topic-specific elite items', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE', 'PERCENTAGE'], 45),
('Y26c', 'Y26', 'youtube', 'What Top Use', 'What The Top [PERCENTAGE] Use: [NUMBER] [DELIVERABLE]', 'What The Top 1% Use: 7 Planning Templates', 'What elite uses', ARRAY['PERCENTAGE', 'NUMBER', 'DELIVERABLE'], 45),
('Y26d', 'Y26', 'youtube', 'Elite State', '[NUMBER] [DESIRED STATE] [DELIVERABLE] of The Top [PERCENTAGE]', '7 High-Productivity Templates of The Top 5%', 'Desired state + elite', ARRAY['NUMBER', 'DESIRED STATE', 'DELIVERABLE', 'PERCENTAGE'], 45);

-- Y27: The Problem Killer (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y27a', 'Y27', 'youtube', 'Problem Killer', 'Why [COMMON BEHAVIOR] Is Killing Your [GOAL] (+ The [DELIVERABLE] To Fix It)', 'Why Random Posting Is Killing Your Sales (+ The Content Calendar To Fix It)', 'Problem awareness + solution', ARRAY['COMMON BEHAVIOR', 'GOAL', 'DELIVERABLE'], 45),
('Y27b', 'Y27', 'youtube', 'Killers No One', '[NUMBER] [TOPIC] Killers No One Talks About (+ [DELIVERABLE])', '7 Productivity Killers No One Talks About (+ Audit Checklist)', 'Hidden killers revealed', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 45),
('Y27c', 'Y27', 'youtube', 'Stop Killer', 'Stop [KILLER BEHAVIOR]: The [DELIVERABLE] That Saves Your [GOAL]', 'Stop Multitasking: The Planner That Saves Your Productivity', 'Stop killer + saving solution', ARRAY['KILLER BEHAVIOR', 'DELIVERABLE', 'GOAL'], 45);

-- Y28: The Authority Explains (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y28a', 'Y28', 'youtube', 'Authority Approved', '[AUTHORITY] Approved: [NUMBER] [DELIVERABLE] To [OUTCOME]', 'CFO Approved: 5 Budget Templates To Save $10K', 'Borrowed authority/credibility', ARRAY['AUTHORITY', 'NUMBER', 'DELIVERABLE', 'OUTCOME'], 45),
('Y28b', 'Y28', 'youtube', 'How Authority', 'How [AUTHORITY]s [OUTCOME]: [NUMBER] [DELIVERABLE] Inside', 'How CEOs Get Organized: 7 Checklists Inside', 'How authority achieves + items', ARRAY['AUTHORITY', 'OUTCOME', 'NUMBER', 'DELIVERABLE'], 45),
('Y28c', 'Y28', 'youtube', 'Authority For', 'The [AUTHORITY] [DELIVERABLE] for [OUTCOME]', 'The CEO Planner for Maximum Productivity', 'Authority-branded deliverable', ARRAY['AUTHORITY', 'DELIVERABLE', 'OUTCOME'], 45),
('Y28d', 'Y28', 'youtube', 'Amount Expert', '$[AMOUNT] [EXPERT] Shares Their [DELIVERABLE]', '$500K Seller Shares Their Listing Templates', 'Income expert sharing', ARRAY['AMOUNT', 'EXPERT', 'DELIVERABLE'], 45);

-- Y29: The Easier Thanks To (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y29a', 'Y29', 'youtube', 'Just Got Easier', '[OUTCOME] Just Got Easier: The [DELIVERABLE] That Changes Everything', 'Getting Clients Just Got Easier: The Outreach Checklist That Changes Everything', 'Friction reduction, accessibility', ARRAY['OUTCOME', 'DELIVERABLE'], 45),
('Y29b', 'Y29', 'youtube', 'Easier Now', '[OUTCOME] Is Easier Now. Here''s My [NUMBER]-Point [DELIVERABLE]', 'Selling on Etsy Is Easier Now. Here''s My 10-Point Checklist', 'Easier now + structure', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 45),
('Y29c', 'Y29', 'youtube', 'Made Easy', 'The [DELIVERABLE] That Made [OUTCOME] Easy', 'The Checklist That Made Mornings Easy', 'Deliverable made it easy', ARRAY['DELIVERABLE', 'OUTCOME'], 45),
('Y29d', 'Y29', 'youtube', 'Teach Beginner', 'How I''d Teach [BEGINNER] To [OUTCOME]: [DELIVERABLE]', 'How I''d Teach My Mom To Sell on Etsy: Beginner Checklist', 'Beginner-friendly approach', ARRAY['BEGINNER', 'OUTCOME', 'DELIVERABLE'], 45);

-- Y30: The Transformation Proof (4 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y30a', 'Y30', 'youtube', 'Made Me Status', 'These [NUMBER] [DELIVERABLE] Made Me [STATUS]', 'These 7 Morning Templates Made Me a Productive CEO', 'Specific items led to transformation', ARRAY['NUMBER', 'DELIVERABLE', 'STATUS'], 45),
('Y30b', 'Y30', 'youtube', 'Made Me Transformation', 'The [NUMBER] [DELIVERABLE] That Made Me [TRANSFORMATION]', 'The 7 Templates That Made Me Debt-Free', 'Deliverables + transformation', ARRAY['NUMBER', 'DELIVERABLE', 'TRANSFORMATION'], 45),
('Y30c', 'Y30', 'youtube', 'Turned Me', '[NUMBER] [DELIVERABLE] That Turned Me Into [STATUS]', '7 Habits Checklists That Turned Me Into a Morning Person', 'Turned into status', ARRAY['NUMBER', 'DELIVERABLE', 'STATUS'], 45),
('Y30d', 'Y30', 'youtube', 'Only Need Huge', 'The Only [NUMBER] [DELIVERABLE] You Need To [HUGE OUTCOME]', 'The Only 5 Templates You Need To Make $10K/Month', 'Only items for huge outcome', ARRAY['NUMBER', 'DELIVERABLE', 'HUGE OUTCOME'], 45);

-- Y31: The Conditional Promise (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y31a', 'Y31', 'youtube', 'Conditional Promise', 'If You Want [OUTCOME] in [TIME], Get This [DELIVERABLE]', 'If You Want $5K/Month in 90 Days, Get This Checklist', 'Targeted promise for specific goal', ARRAY['OUTCOME', 'TIME', 'DELIVERABLE'], 45),
('Y31b', 'Y31', 'youtube', 'Starting Year', 'Starting [TOPIC] in [YEAR]? Here''s My [DELIVERABLE]', 'Starting Etsy in 2026? Here''s My Launch Checklist', 'Year-specific starting point', ARRAY['TOPIC', 'YEAR', 'DELIVERABLE'], 45),
('Y31c', 'Y31', 'youtube', 'If Started', 'If I Started [TOPIC] Today, I''d Use This [DELIVERABLE]', 'If I Started Etsy Today, I''d Use This Checklist', 'If I started again', ARRAY['TOPIC', 'DELIVERABLE'], 45);

-- Y32: The Beginner Path (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('Y32a', 'Y32', 'youtube', 'Beginner Path', 'The Best [DELIVERABLE] for Beginners To [OUTCOME] in [YEAR]', 'The Best Checklist for Beginners To Start Selling in 2026', 'Clear starting point for beginners', ARRAY['DELIVERABLE', 'OUTCOME', 'YEAR'], 45),
('Y32b', 'Y32', 'youtube', 'What To Do First', 'What To Do First: The [TOPIC] Starter [DELIVERABLE]', 'What To Do First: The Etsy Starter Checklist', 'First action starter', ARRAY['TOPIC', 'DELIVERABLE'], 45),
('Y32c', 'Y32', 'youtube', 'For Real', '[TOPIC] for People Who Want Real [RESULT]: [DELIVERABLE]', 'Email Marketing for People Who Want Real Sales: Template Pack', 'For people who want real results', ARRAY['TOPIC', 'RESULT', 'DELIVERABLE'], 45);

-- ============================================================
-- AFFIRMATION FRAMEWORKS (A1-A7) - 21 variations
-- Category weight: 15%
-- ============================================================

-- A1: The "I Can" Declaration (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('A1a', 'A1', 'affirmation', 'I Can Declaration', 'I Can [POSITIVE STATE]. (This [DELIVERABLE] Helped)', 'I Can Afford Anything. (This Budget Planner Helped)', 'Empowerment through I can statement', ARRAY['POSITIVE STATE', 'DELIVERABLE'], 15),
('A1b', 'A1', 'affirmation', 'I Can Number', 'I Can [POSITIVE STATE]: [NUMBER] [DELIVERABLE] Inside', 'I Can Save Money: 12 Budget Templates Inside', 'I can + multiple items', ARRAY['POSITIVE STATE', 'NUMBER', 'DELIVERABLE'], 15),
('A1c', 'A1', 'affirmation', 'I Can Made True', '"I Can [POSITIVE STATE]" + The [DELIVERABLE] That Made It True', '"I Can Quit My Job" + The Checklist That Made It True', 'Quote + deliverable that enabled', ARRAY['POSITIVE STATE', 'DELIVERABLE'], 15);

-- A2: The "Stepping Into" Transformation (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('A2a', 'A2', 'affirmation', 'Stepping Into', 'I Am Stepping Into [POSITIVE STATE]. Here''s My [DELIVERABLE]', 'I Am Stepping Into My Richest Year. Here''s My Planner', 'Forward-looking transformation', ARRAY['POSITIVE STATE', 'DELIVERABLE'], 15),
('A2b', 'A2', 'affirmation', 'Stepping Using', 'Stepping Into [POSITIVE STATE]: The [DELIVERABLE] I''m Using', 'Stepping Into Success: The Planner I''m Using', 'Stepping + current tool', ARRAY['POSITIVE STATE', 'DELIVERABLE'], 15),
('A2c', 'A2', 'affirmation', 'Year Stepping', '[YEAR]: I''m Stepping Into [POSITIVE STATE] (My [DELIVERABLE])', '2026: I''m Stepping Into Success (My Goal Planner)', 'Year + stepping into', ARRAY['YEAR', 'POSITIVE STATE', 'DELIVERABLE'], 15);

-- A3: The "I Have The Power" Statement (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('A3a', 'A3', 'affirmation', 'I Have Power', 'I Have The Power To [OUTCOME]. [DELIVERABLE] Inside', 'I Have The Power To Change My Life. Planner Inside', 'Agency and empowerment', ARRAY['OUTCOME', 'DELIVERABLE'], 15),
('A3b', 'A3', 'affirmation', 'Power Number', 'I Have The Power To [OUTCOME]: [NUMBER] [DELIVERABLE] To Help', 'I Have The Power To Get Rich: 10 Budget Templates To Help', 'Power + multiple helps', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 15),
('A3c', 'A3', 'affirmation', 'You Have Power', 'You Have The Power To [OUTCOME]. Here''s The [DELIVERABLE]', 'You Have The Power To Get Organized. Here''s The Checklist', 'You empowerment', ARRAY['OUTCOME', 'DELIVERABLE'], 15);

-- A4: The "I Will" Commitment (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('A4a', 'A4', 'affirmation', 'I Will', 'I Will [POSITIVE OUTCOME]. (My [DELIVERABLE])', 'I Will Hit My Goals. (My Tracker)', 'Future commitment declaration', ARRAY['POSITIVE OUTCOME', 'DELIVERABLE'], 15),
('A4b', 'A4', 'affirmation', 'I Will Helping', 'I Will [POSITIVE OUTCOME]: The [DELIVERABLE] Helping Me', 'I Will Get Rich: The Budget Planner Helping Me', 'I will + helping tool', ARRAY['POSITIVE OUTCOME', 'DELIVERABLE'], 15),
('A4c', 'A4', 'affirmation', 'Year I Will', '[YEAR]: I Will [POSITIVE OUTCOME]. [NUMBER] [DELIVERABLE] Inside', '2026: I Will Get Rich. 15 Wealth Templates Inside', 'Year commitment + items', ARRAY['YEAR', 'POSITIVE OUTCOME', 'NUMBER', 'DELIVERABLE'], 15);

-- A5: The "She's Building" Third Person (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('A5a', 'A5', 'affirmation', 'She''s Building', 'She''s [POSITIVE ACTION]. (Her [DELIVERABLE])', 'She''s Building Her Empire. (Her Business Planner)', 'Aspirational third person perspective', ARRAY['POSITIVE ACTION', 'DELIVERABLE'], 15),
('A5b', 'A5', 'affirmation', 'She''s Number', 'She''s [POSITIVE ACTION] With These [NUMBER] [DELIVERABLE]', 'She''s Getting Rich With These 12 Money Templates', 'She''s + multiple items', ARRAY['POSITIVE ACTION', 'NUMBER', 'DELIVERABLE'], 15),
('A5c', 'A5', 'affirmation', 'She''s Uses', 'She''s [POSITIVE ACTION]: The [DELIVERABLE] She Uses', 'She''s Crushing Goals: The Planner She Uses', 'She''s + her tool', ARRAY['POSITIVE ACTION', 'DELIVERABLE'], 15);

-- A6: The "I Am A" Identity (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('A6a', 'A6', 'affirmation', 'I Am A', 'I Am A [POSITIVE IDENTITY]. (My [DELIVERABLE] Helped)', 'I Am A Six-Figure Earner. (My Sales Checklist Helped)', 'Identity statement in present tense', ARRAY['POSITIVE IDENTITY', 'DELIVERABLE'], 15),
('A6b', 'A6', 'affirmation', 'I Am A Use', 'I Am A [POSITIVE IDENTITY]: [NUMBER] [DELIVERABLE] I Use', 'I Am A Morning Person: 7 Routine Templates I Use', 'Identity + items used', ARRAY['POSITIVE IDENTITY', 'NUMBER', 'DELIVERABLE'], 15),
('A6c', 'A6', 'affirmation', 'Become A', 'Become A [POSITIVE IDENTITY] With This [DELIVERABLE]', 'Become A Morning Person With This Routine Planner', 'Become identity with tool', ARRAY['POSITIVE IDENTITY', 'DELIVERABLE'], 15);

-- A7: The "A [Type] Who" Identity Story (3 variations)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, psychological_hook, variables, category_weight) VALUES
('A7a', 'A7', 'affirmation', 'Type Who Her', 'A [ADJECTIVE] [IDENTITY] Who [POSITIVE ACTION]. Here''s Her [DELIVERABLE]', 'A Debt-Free Woman Who Saved $10K. Here''s Her Budget Tracker', 'Aspirational identity with specific action', ARRAY['ADJECTIVE', 'IDENTITY', 'POSITIVE ACTION', 'DELIVERABLE'], 15),
('A7b', 'A7', 'affirmation', 'Be A Who', 'Be A [ADJECTIVE] [IDENTITY] Who [POSITIVE ACTION]: [DELIVERABLE] Inside', 'Be A Smart Woman Who Saves Money: Budget Planner Inside', 'Be the identity + tool', ARRAY['ADJECTIVE', 'IDENTITY', 'POSITIVE ACTION', 'DELIVERABLE'], 15),
('A7c', 'A7', 'affirmation', 'For Type Who', 'The [DELIVERABLE] for [ADJECTIVE] [IDENTITY] Who [POSITIVE ACTION]', 'The Budget Planner for Smart Women Who Save Every Month', 'Deliverable for identity type', ARRAY['DELIVERABLE', 'ADJECTIVE', 'IDENTITY', 'POSITIVE ACTION'], 15);

-- ============================================================
-- FUNCTION: select_text_framework
-- Selects a random framework based on category weights
-- ============================================================
CREATE OR REPLACE FUNCTION select_text_framework(
  p_exclude_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  framework_code TEXT,
  category TEXT,
  template TEXT,
  example TEXT,
  variables TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ptf.framework_code,
    ptf.category,
    ptf.template,
    ptf.example,
    ptf.variables
  FROM pinterest_text_frameworks ptf
  WHERE (p_exclude_code IS NULL OR ptf.framework_code != p_exclude_code)
  ORDER BY RANDOM() * (ptf.category_weight::float / 100)
  LIMIT 1;
END;
$$;

-- ============================================================
-- FUNCTION: select_text_framework_by_category
-- Selects a random framework from a specific category
-- ============================================================
CREATE OR REPLACE FUNCTION select_text_framework_by_category(
  p_category TEXT,
  p_exclude_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  framework_code TEXT,
  template TEXT,
  example TEXT,
  variables TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ptf.framework_code,
    ptf.template,
    ptf.example,
    ptf.variables
  FROM pinterest_text_frameworks ptf
  WHERE ptf.category = p_category
    AND (p_exclude_code IS NULL OR ptf.framework_code != p_exclude_code)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE pinterest_text_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users"
  ON pinterest_text_frameworks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access"
  ON pinterest_text_frameworks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION select_text_framework(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION select_text_framework(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION select_text_framework_by_category(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION select_text_framework_by_category(TEXT, TEXT) TO service_role;
```

**TOTAL INSERT COUNT:**
- Pinterest (P1-P14): 51 variations
- YouTube (Y1-Y32): 120 variations
- Affirmation (A1-A7): 21 variations
- **TOTAL: 192 INSERT statements**

---

## DELIVERABLE 3: UPDATE ALL 30 VISUAL PROMPTS WITH {HOOK_TEXT}

### SQL Migration File: `supabase/migrations/20260130_add_hook_text_to_visual_prompts.sql`

```sql
-- Add {HOOK_TEXT} placeholder to all 30 visual prompts
-- Each category has text placement in different locations

-- ============================================================
-- LIFESTYLE_HANDS: Text appears on the pages being held
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree lifestyle shot of hands with light skin tone holding open {FORMAT} pages with visible heading "{HOOK_TEXT}", cream-colored paper with visible text and sections, soft natural lighting from top-left, warm wood surface beneath #E3DCC9, soft diffused shadows falling right, fingers gently holding pages open, professional product photography, cozy productive aesthetic, 2:3 vertical Pinterest format. CRITICAL: The {FORMAT} pages must show the text "{HOOK_TEXT}" prominently.'
WHERE variation_code = 'LH-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree lifestyle shot of feminine hands flipping through {FORMAT} pages mid-motion with visible text "{HOOK_TEXT}" on pages, cream paper with pastel section tabs visible, soft window light from left side, warm beige linen surface beneath #D9CFC1, motion blur on turning page edge, gold ring on finger catching light, cozy morning planning aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format. CRITICAL: Pages must display the text "{HOOK_TEXT}".'
WHERE variation_code = 'LH-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye view of hands with natural manicure writing with black pen in open {FORMAT} with heading "{HOOK_TEXT}" visible, cream pages showing lined sections and checkboxes, warm oak desk surface #A08060, small potted succulent upper right corner, soft diffused overhead lighting, journaling session aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be visible on the pages.'
WHERE variation_code = 'LH-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of hands presenting closed {FORMAT} with visible cover text "{HOOK_TEXT}", cream cardstock cover with elegant typography, soft natural lighting from right, warm terracotta surface beneath #C4A484, shallow depth of field with soft background bokeh, product reveal moment, professional photography, 2:3 vertical Pinterest format. CRITICAL: Cover must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'LH-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree cozy lifestyle shot of hands holding white ceramic mug near open {FORMAT} pages displaying "{HOOK_TEXT}", steam rising from coffee, cream pages with visible content, warm chunky knit blanket visible, soft morning window light from left, hygge planning aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format. CRITICAL: The pages must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'LH-5';

-- ============================================================
-- TYPOGRAPHY_QUOTE: Text is the main focus, product at bottom
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on typography pin with bold black sans-serif text "{HOOK_TEXT}" prominently displayed in upper portion, {FORMAT} pages displayed at bottom third of frame, smooth cream background #F5F0E8, clean minimal composition, product pages slightly angled showing content structure, even diffused lighting, no shadows, professional and clean aesthetic, warm color temperature, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be the main visual focus.'
WHERE variation_code = 'TQ-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on motivational typography "{HOOK_TEXT}" on cream textured linen paper background #F5F0E8 with subtle fabric texture, elegant black serif text centered, thin gold foil accent line beneath text, {FORMAT} corner visible bottom right, generous negative space, soft even lighting, premium stationery aesthetic, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must be prominently displayed.'
WHERE variation_code = 'TQ-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on pin with handwritten-style black script text "{HOOK_TEXT}" in upper half, {FORMAT} pages fanned out lower portion showing multiple sections, warm cream background #EDE5D8, authentic hand-lettered aesthetic, soft diffused lighting, Pinterest typography style matching 25K+ repin patterns, 2:3 vertical Pinterest format. CRITICAL: The handwritten text "{HOOK_TEXT}" must be clearly legible.'
WHERE variation_code = 'TQ-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on minimalist typography design with bold dark text "{HOOK_TEXT}" in clean sans-serif font, {FORMAT} displayed at angle beneath text, light gray background #E8E4E0, geometric minimal composition, even studio lighting, modern professional aesthetic, warm undertones, 2:3 vertical Pinterest format. CRITICAL: Text "{HOOK_TEXT}" must be the dominant element.'
WHERE variation_code = 'TQ-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on quote card design with black text "{HOOK_TEXT}" on cream paper card #F5F0E8, soft drop shadow beneath card, {FORMAT} pages partially visible behind, clean white background, layered paper aesthetic, even diffused lighting, premium stationery brand feel, 2:3 vertical Pinterest format. CRITICAL: The quote card must display "{HOOK_TEXT}" clearly.'
WHERE variation_code = 'TQ-5';

-- ============================================================
-- DESK_SETUP: Text as overlay or on visible product
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages with visible title "{HOOK_TEXT}" on clean white desk surface, gold paperclips scattered naturally, small succulent in white pot upper corner, wireless keyboard edge visible, soft diffused overhead lighting, minimal shadows, aspirational home office aesthetic, professional product photography, 2:3 vertical Pinterest format. CRITICAL: The {FORMAT} must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DS-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of {FORMAT} open on warm oak wood desk #A57C55 showing page with "{HOOK_TEXT}" heading, MacBook corner visible, white ceramic mug with latte art, small notepad with gold pen, natural window light from left, soft shadows falling right, productive workspace aesthetic, professional photography, 2:3 vertical Pinterest format. CRITICAL: Pages must display "{HOOK_TEXT}".'
WHERE variation_code = 'DS-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree lifestyle shot of {FORMAT} on cream desk surface with visible "{HOOK_TEXT}" title, desk lamp providing warm glow, small framed artwork in background, potted plant adding greenery, soft ambient lighting, cozy productive home office aesthetic, shallow depth of field, professional photography, 2:3 vertical Pinterest format. CRITICAL: The product must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DS-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} with cover displaying "{HOOK_TEXT}" on white marble surface with subtle gray veins, gold scissors and washi tape rolls arranged naturally, dried eucalyptus stem, even overhead lighting, minimal shadows, luxury stationery brand aesthetic, professional product photography, 2:3 vertical Pinterest format. CRITICAL: The cover text "{HOOK_TEXT}" must be visible.'
WHERE variation_code = 'DS-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages showing "{HOOK_TEXT}" on burgundy leather desk pad #800020, silver pen placed diagonally, small white candle upper left, beige ceramic dish with gold jewelry, warm diffused overhead lighting, executive workspace aesthetic, professional photography, 2:3 vertical Pinterest format. CRITICAL: Pages must display "{HOOK_TEXT}" text.'
WHERE variation_code = 'DS-5';

-- ============================================================
-- FLATLAY: Text visible on the pages spread out
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages cascading diagonally across frame with visible title "{HOOK_TEXT}" on top page, cream-colored pages #F5F5DC fanning from top-left to bottom-right, each page showing different section or content, slight overlapping creating depth and volume, smooth light gray surface beneath #E0E0E0, soft diffused overhead lighting, minimal shadows, showing the breadth of content included, professional product photography, warm color temperature, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be visible on the pages.'
WHERE variation_code = 'FL-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages with "{HOOK_TEXT}" visible center frame on cream linen background #F5F0E8, gold binder clips securing corners, dried lavender sprigs arranged naturally, small ceramic dish with gold rings, soft diffused overhead lighting, feminine editorial aesthetic, professional styled photography, 2:3 vertical Pinterest format. CRITICAL: The "{HOOK_TEXT}" text must appear prominently.'
WHERE variation_code = 'FL-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages showing "{HOOK_TEXT}" heading arranged in neat grid pattern, cream pages with consistent margins between each, showing variety of content types across pages, clean white surface beneath, even overhead lighting, no shadows, organized and comprehensive product showcase, professional photography, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must be visible on pages.'
WHERE variation_code = 'FL-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages with "{HOOK_TEXT}" title scattered creatively on warm wood surface #C4A077, pages at various angles showing different content, small potted succulent corner, gold paperclips scattered naturally, soft natural lighting from above, creative workspace aesthetic, professional photography, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must appear on the pages.'
WHERE variation_code = 'FL-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of single {FORMAT} page with "{HOOK_TEXT}" centered on smooth cream background #F5F0E6, generous negative space all sides, slight natural paper texture visible, soft even diffused lighting, no shadows, ultra minimal composition highlighting content design, professional product photography, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must be prominently displayed on the page.'
WHERE variation_code = 'FL-5';

-- ============================================================
-- GRID_PREVIEW: Text as header/title above grid
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on grid layout with bold header text "{HOOK_TEXT}" at top, showing 16 {FORMAT} page thumbnails in 4x4 arrangement below, cream background #F5F0E6, consistent sage green and cream color scheme across all pages, slight drop shadow beneath each thumbnail, clean white borders between grid items, soft diffused lighting, product catalog overview style, 2:3 vertical Pinterest format. CRITICAL: The header "{HOOK_TEXT}" must be prominently displayed above the grid.'
WHERE variation_code = 'GP-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on grid layout with title text "{HOOK_TEXT}" at top, showing 12 {FORMAT} page thumbnails in 3x4 arrangement, light gray background #E8E4E0, each page showing different content section, thin white borders between items, even lighting across all thumbnails, comprehensive content preview style, professional layout, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must appear as header text.'
WHERE variation_code = 'GP-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on staggered grid with heading "{HOOK_TEXT}" showing {FORMAT} pages at varied sizes, larger feature pages mixed with smaller thumbnails, cream background #F5F0E8, creating visual hierarchy and interest, soft consistent lighting, modern magazine layout aesthetic, professional design, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be the heading.'
WHERE variation_code = 'GP-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on view with title "{HOOK_TEXT}" above {FORMAT} pages slightly overlapping in cascading arrangement, showing depth and volume of content, cream pages with visible section headers, light background, soft drop shadows creating dimension, content-rich product showcase, professional photography, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must appear as the title.'
WHERE variation_code = 'GP-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on grid with bold header "{HOOK_TEXT}" and one large {FORMAT} page center surrounded by 8 smaller thumbnails, cream background #F5F0E6, highlighting key feature page while showing variety, thin borders and consistent spacing, even diffused lighting, premium product catalog style, 2:3 vertical Pinterest format. CRITICAL: The header text "{HOOK_TEXT}" must be prominent.'
WHERE variation_code = 'GP-5';

-- ============================================================
-- DEVICE_MOCKUP: Text on screen display
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye shot of iPad Pro in space gray displaying {FORMAT} interface with text "{HOOK_TEXT}" visible on screen, warm wood desk surface #A08060 beneath, small succulent in white pot corner, gold paperclips scattered, soft natural lighting from above, professional product mockup aesthetic, device screen clearly showing content, 2:3 vertical Pinterest format. CRITICAL: The screen must display "{HOOK_TEXT}" text.'
WHERE variation_code = 'DM-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of feminine hands holding iPad displaying {FORMAT} content with "{HOOK_TEXT}" visible on screen, cozy setting with cream blanket visible, soft natural window light from left, shallow depth of field with soft bokeh background, lifestyle product mockup, device screen clearly legible, 2:3 vertical Pinterest format. CRITICAL: Screen must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DM-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of iPad and iPhone both displaying {FORMAT} pages with "{HOOK_TEXT}" visible on screens, cream desk surface beneath, showing cross-device compatibility, small notepad and pen beside, soft diffused overhead lighting, modern digital product aesthetic, screens clearly visible, 2:3 vertical Pinterest format. CRITICAL: Both device screens must show "{HOOK_TEXT}".'
WHERE variation_code = 'DM-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of MacBook Pro displaying {FORMAT} on screen with "{HOOK_TEXT}" text visible, warm wood desk surface, small plant and coffee mug in background, natural window lighting from left, shallow depth of field, professional workspace mockup, screen content clearly visible, 2:3 vertical Pinterest format. CRITICAL: The laptop screen must display "{HOOK_TEXT}".'
WHERE variation_code = 'DM-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye shot of smartphone displaying {FORMAT} interface with "{HOOK_TEXT}" on screen, sheer brown organza ribbon #8B4513 tied in bow around phone, cream surface beneath #F5F0E8, soft natural lighting from top-right, gift presentation aesthetic, device screen clearly showing content, 2:3 vertical Pinterest format. CRITICAL: Phone screen must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DM-5';
```

---

## DELIVERABLE 4: CODE CHANGES WITH LINE NUMBERS

### File: `netlify/functions/process-etsy-empire-background.js`

**Current State:**
- Line 38: `const categoryVariationState = new Map();`
- Line 320-371: `async function selectVisualFramework(supabase, slideType)`
- Line 373-402: `async function buildPrompt(supabase, task, project)`
- Line 674: `const prompt = await buildPrompt(supabase, task, project);`

**Changes Required:**

#### ADD at Line 39 (after categoryVariationState):
```javascript
// Text framework rotation state (tracks last used framework code)
let lastTextFrameworkCode = null;
```

#### ADD at Line 315 (before selectVisualFramework):
```javascript
/**
 * Select a text framework from the database
 * Rotates through frameworks, never repeating the same one back-to-back
 */
async function selectTextFramework(supabase) {
  try {
    const { data, error } = await supabase
      .rpc('select_text_framework', {
        p_exclude_code: lastTextFrameworkCode
      });

    if (error) throw error;

    if (data && data.length > 0) {
      const framework = data[0];
      lastTextFrameworkCode = framework.framework_code;
      console.log(`${LOG_TAG} Selected text framework: ${framework.framework_code}`);
      return framework;
    }

    throw new Error('No text framework returned');
  } catch (err) {
    console.warn(`${LOG_TAG} Text framework selection failed: ${err.message}`);
    // Fallback: return a simple template
    return {
      framework_code: 'FALLBACK',
      template: '[NUMBER] [DELIVERABLE] That [RESULT]',
      variables: ['NUMBER', 'DELIVERABLE', 'RESULT']
    };
  }
}

/**
 * Generate hook text by filling in framework variables
 * @param {Object} framework - Text framework with template and variables
 * @param {Object} project - Project with product_title, tldr_text, product_format
 * @returns {string} Generated hook text
 */
function generateHookText(framework, project) {
  const { product_title, product_format, tldr_text } = project;

  // Extract number from title or use default
  const numberMatch = product_title.match(/\d+/);
  const number = numberMatch ? numberMatch[0] : '7';

  // Map product format to deliverable type
  const formatToDeliverable = {
    'checklist': 'Checklist',
    'planner': 'Planner',
    'tracker': 'Tracker',
    'template': 'Templates',
    'templates': 'Templates',
    'swipe file': 'Scripts',
    'workbook': 'Workbook',
    'guide': 'Guide',
    'blueprint': 'Blueprint'
  };
  const deliverable = formatToDeliverable[product_format?.toLowerCase()] || 'Templates';

  // Extract outcome from TLDR or use generic
  const outcome = tldr_text?.split('.')[0]?.substring(0, 30) || 'Get Results';

  // Replace variables in template
  let hookText = framework.template
    .replace(/\[NUMBER\]/g, number)
    .replace(/\[DELIVERABLE\]/g, deliverable)
    .replace(/\[RESULT\]/g, outcome)
    .replace(/\[OUTCOME\]/g, outcome)
    .replace(/\[TOPIC\]/g, product_format || 'productivity')
    .replace(/\[ADJECTIVE\]/g, 'Proven')
    .replace(/\[AUDIENCE\]/g, 'busy professionals')
    .replace(/\[PLATFORM\]/g, 'Etsy')
    .replace(/\[MONEY\]/g, '$500/day')
    .replace(/\[TIME\]/g, '30 days')
    .replace(/\[POSITIVE STATE\]/g, 'achieve my goals')
    .replace(/\[POSITIVE ACTION\]/g, 'building wealth')
    .replace(/\[POSITIVE IDENTITY\]/g, 'successful entrepreneur');

  // Clean up any remaining brackets
  hookText = hookText.replace(/\[[^\]]+\]/g, '');

  console.log(`${LOG_TAG} Generated hook text: "${hookText}"`);
  return hookText;
}
```

#### MODIFY buildPrompt at Line 373:
```javascript
async function buildPrompt(supabase, task, project) {
  const { task_type, slide_type, pin_text } = task;
  const { product_title, tldr_text, product_format, detected_language } = project;

  const format = product_format || 'digital product';
  const langSuffix = getLanguagePromptSuffix(detected_language);

  let template;
  let hookText = pin_text || product_title; // Default to pin_text or product_title

  if (task_type === 'pinterest_pin') {
    // Select text framework and generate hook text if pin_text is generic
    if (!pin_text || pin_text === product_title) {
      const textFramework = await selectTextFramework(supabase);
      hookText = generateHookText(textFramework, project);
    }

    // Use Visual Framework system for Pinterest pins
    const framework = await selectVisualFramework(supabase, slide_type);
    template = framework.prompt_template;
    console.log(`${LOG_TAG} Using visual: ${framework.variation_code}, text: "${hookText}"`);
  } else {
    // Etsy slides use existing hardcoded prompts (UNCHANGED)
    template = ETSY_SLIDE_PROMPTS[slide_type];
  }

  if (!template) {
    return `Professional product mockup for "${product_title}" ${format}. 2:3 format.${langSuffix}`;
  }

  return template
    .replace(/{PRODUCT_TITLE}/g, product_title)
    .replace(/{FORMAT}/g, format)
    .replace(/{TLDR}/g, tldr_text || '')
    .replace(/{PIN_TEXT}/g, hookText)
    .replace(/{HOOK_TEXT}/g, hookText) + langSuffix;
}
```

### File: `netlify/functions/create-etsy-empire-project.js`

**No changes required.** The pin_text is already being passed to tasks and will be used or enhanced by generateHookText() in the background processor.

---

## SUMMARY

| Deliverable | Status | Count |
|-------------|--------|-------|
| Schema Verification | ✅ Complete | pin_text column exists |
| Text Framework INSERT Statements | ✅ Complete | 192 statements |
| Visual Prompt UPDATE Statements | ✅ Complete | 30 statements |
| Code Changes with Line Numbers | ✅ Complete | Lines 38, 315, 373 |

**Total Framework Breakdown:**
- Pinterest (P1-P14): 51 variations
- YouTube (Y1-Y32): 120 variations
- Affirmation (A1-A7): 21 variations
- **TOTAL: 192 text framework variations**

---

## IMPLEMENTATION ORDER

1. Run migration: `20260130_pinterest_text_frameworks.sql` (creates table + 192 rows)
2. Run migration: `20260130_add_hook_text_to_visual_prompts.sql` (updates 30 rows)
3. Modify `process-etsy-empire-background.js` as specified above
4. Deploy to Netlify
5. Test with project generation

---

**READY FOR USER APPROVAL**
