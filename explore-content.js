// Explore database to find where content is stored
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

const FUNNEL_1 = '66670305-6854-4b78-ab72-7d9167bfa808'
const FUNNEL_2 = '04a65423-db27-4d63-aba8-f8d917f2f99e'

async function explore() {
  // 1. Check styled_products table
  console.log('=== STYLED_PRODUCTS TABLE ===')
  const { data: styledProducts, error: spError } = await supabase
    .from('styled_products')
    .select('*')
    .limit(10)

  if (spError) {
    console.log('Error:', spError.message)
  } else if (styledProducts && styledProducts.length > 0) {
    console.log('Columns:', Object.keys(styledProducts[0]).join(', '))
    console.log('Found', styledProducts.length, 'records')
    styledProducts.forEach((sp, i) => {
      console.log(`\n--- Record ${i+1} ---`)
      for (const [key, value] of Object.entries(sp)) {
        if (value !== null && value !== undefined) {
          const preview = typeof value === 'object'
            ? JSON.stringify(value).substring(0, 200)
            : String(value).substring(0, 200)
          console.log(`${key}: ${preview}`)
        }
      }
    })
  }

  // 2. Check funnels JSONB content for Funnel 1
  console.log('\n\n=== FUNNEL 1 JSONB CONTENT ===')
  const { data: funnel1 } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', FUNNEL_1)
    .single()

  if (funnel1) {
    console.log('Funnel name:', funnel1.name)

    for (const slot of ['front_end', 'bump', 'upsell_1', 'upsell_2', 'upsell_3']) {
      const product = funnel1[slot]
      if (product) {
        console.log(`\n${slot}:`)
        console.log('  name:', product.name)
        console.log('  format:', product.format)
        console.log('  keys:', Object.keys(product).join(', '))

        // Check chapters field - this is where actual content is stored!
        if (product.chapters) {
          console.log('  HAS CHAPTERS:', Array.isArray(product.chapters) ? product.chapters.length + ' chapters' : 'yes')
          if (Array.isArray(product.chapters) && product.chapters.length > 0) {
            console.log('  First chapter keys:', Object.keys(product.chapters[0]).join(', '))
            console.log('  First chapter title:', product.chapters[0].title)
            const firstContent = product.chapters[0].content || product.chapters[0].body
            if (firstContent) {
              console.log('  First chapter content preview:', String(firstContent).substring(0, 200))
            }
          }
        } else {
          console.log('  chapters: NULL')
        }
      }
    }
  }

  // 3. Check funnels JSONB content for Funnel 2
  console.log('\n\n=== FUNNEL 2 JSONB CONTENT ===')
  const { data: funnel2 } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', FUNNEL_2)
    .single()

  if (funnel2) {
    console.log('Funnel name:', funnel2.name)

    for (const slot of ['front_end', 'bump', 'upsell_1', 'upsell_2', 'upsell_3']) {
      const product = funnel2[slot]
      if (product) {
        console.log(`\n${slot}:`)
        console.log('  name:', product.name)
        console.log('  format:', product.format)
        console.log('  keys:', Object.keys(product).join(', '))

        // Check chapters field - this is where actual content is stored!
        if (product.chapters) {
          console.log('  HAS CHAPTERS:', Array.isArray(product.chapters) ? product.chapters.length + ' chapters' : 'yes')
          if (Array.isArray(product.chapters) && product.chapters.length > 0) {
            console.log('  First chapter keys:', Object.keys(product.chapters[0]).join(', '))
            console.log('  First chapter title:', product.chapters[0].title)
            const firstContent = product.chapters[0].content || product.chapters[0].body
            if (firstContent) {
              console.log('  First chapter content preview:', String(firstContent).substring(0, 200))
            }
          }
        } else {
          console.log('  chapters: NULL')
        }
      }
    }
  }

  // 4. Check generation_jobs table
  console.log('\n\n=== GENERATION_JOBS TABLE ===')
  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('*')
    .limit(5)

  if (jobs && jobs.length > 0) {
    console.log('Columns:', Object.keys(jobs[0]).join(', '))
    jobs.forEach((job, i) => {
      console.log(`\nJob ${i+1}:`)
      console.log('  id:', job.id)
      console.log('  status:', job.status)
      console.log('  funnel_id:', job.funnel_id)
      if (job.result) {
        console.log('  result keys:', Object.keys(job.result).join(', '))
      }
    })
  }

  // 5. Look for content in any table with funnel_id matching our targets
  console.log('\n\n=== SEARCHING ALL TABLES FOR FUNNEL IDs ===')

  // Check if there's a products table
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(5)

  if (!prodError && products) {
    console.log('\nproducts table found:', products.length, 'records')
    console.log('Columns:', Object.keys(products[0] || {}).join(', '))
  } else if (prodError) {
    console.log('\nproducts table:', prodError.message)
  }
}

explore().catch(console.error)
