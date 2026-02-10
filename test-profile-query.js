// Test script to verify profile query WITHOUT using DocRaptor API
// Run with: node test-profile-query.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test values - these should match what frontend sends
const testUserId = '10391013-6e2e-4b9d-9abc-208f7668df56' // Auth user ID from console logs

async function testProfileQuery() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  console.log('=== PROFILE QUERY TEST ===\n')

  // Test 1: Query by user_id (fallback case when no profileId)
  console.log('Test 1: Query by user_id column...')
  const { data: profileByUserId, error: error1 } = await supabase
    .from('profiles')
    .select('id, user_id, name, social_handle, photo_url, logo_url, tagline, niche')
    .eq('user_id', testUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error1) {
    console.log('  ERROR:', error1.message)
    results.tests.push({ name: 'Query by user_id', success: false, error: error1.message })
  } else {
    console.log('  SUCCESS!')
    console.log('  Profile ID:', profileByUserId.id)
    console.log('  User ID:', profileByUserId.user_id)
    console.log('  Name:', profileByUserId.name)
    console.log('  Handle:', profileByUserId.social_handle)
    console.log('  Photo URL:', profileByUserId.photo_url ? '(set)' : '(not set)')
    console.log('  Tagline:', profileByUserId.tagline)
    console.log('  Niche:', profileByUserId.niche)
    results.tests.push({
      name: 'Query by user_id',
      success: true,
      data: profileByUserId
    })

    // Test 2: Query by id (primary case when profileId is provided)
    const profileId = profileByUserId.id
    console.log('\nTest 2: Query by id column using:', profileId)
    const { data: profileById, error: error2 } = await supabase
      .from('profiles')
      .select('name, social_handle, photo_url, logo_url, tagline, niche')
      .eq('id', profileId)
      .single()

    if (error2) {
      console.log('  ERROR:', error2.message)
      results.tests.push({ name: 'Query by id', success: false, error: error2.message })
    } else {
      console.log('  SUCCESS!')
      console.log('  Name:', profileById.name)
      console.log('  Handle:', profileById.social_handle)
      console.log('  Photo URL:', profileById.photo_url ? '(set)' : '(not set)')
      console.log('  Tagline:', profileById.tagline)
      console.log('  Niche:', profileById.niche)
      results.tests.push({
        name: 'Query by id',
        success: true,
        data: profileById
      })
    }
  }

  // Write results to file
  fs.writeFileSync('test-profile-results.json', JSON.stringify(results, null, 2))
  console.log('\n=== Results written to test-profile-results.json ===')
}

testProfileQuery().catch(console.error)
