import { test, expect } from '@playwright/test';

const LIVE_URL = 'https://launchpad-pro-app.netlify.app';
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

test.describe('Lead Magnet Generation - LIVE', () => {
  let apiCalls = [];

  test('full flow with RAG verification', async ({ page }) => {
    // Track API calls
    page.on('request', req => {
      if (req.url().includes('/.netlify/functions/')) {
        const fn = req.url().split('functions/')[1]?.split('?')[0];
        apiCalls.push({ url: req.url(), method: req.method(), fn });
        console.log('[API]', req.method(), fn);
      }
    });

    // Go to live app
    console.log('Opening:', LIVE_URL);
    await page.goto(LIVE_URL);
    await page.waitForLoadState('networkidle');
    
    // Login - use label-based selectors
    console.log('Looking for email field...');
    const emailField = page.getByLabel('Email');
    await emailField.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('Filling email:', TEST_EMAIL);
    await emailField.click();
    await emailField.fill(TEST_EMAIL);
    
    console.log('Filling password...');
    const passwordField = page.getByLabel('Password');
    await passwordField.click();
    await passwordField.fill(TEST_PASSWORD);
    
    console.log('Clicking Sign In...');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for navigation away from login
    console.log('Waiting for login to complete...');
    await page.waitForURL('**/dashboard**', { timeout: 20000 });
    console.log('Login successful! URL:', page.url());

    // Go to Lead Magnet Builder
    console.log('Navigating to Lead Magnet Builder...');
    await page.goto(`${LIVE_URL}/lead-magnets`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('Lead Magnet', { timeout: 10000 });
    console.log('On Lead Magnet Builder page!');

    // Select profile
    console.log('Selecting profile...');
    await page.locator('select').first().selectOption({ index: 1 });

    // Select funnel
    console.log('Selecting funnel...');
    await page.waitForTimeout(500);
    const funnelSelect = page.locator('select').nth(2);
    const optionCount = await funnelSelect.locator('option').count();
    await funnelSelect.selectOption({ index: optionCount - 1 });

    // Generate ideas
    console.log('\n=== GENERATING IDEAS ===');
    apiCalls = [];
    await page.click('button:has-text("Generate 3 Ideas")');
    
    await page.waitForSelector('.cursor-pointer', { timeout: 90000 });
    console.log('Ideas ready!');

    // Select idea
    console.log('\n=== SELECTING IDEA ===');
    await page.click('.cursor-pointer >> nth=0');

    // Generate content
    console.log('\n=== GENERATING CONTENT ===');
    await page.click('button:has-text("Generate") >> nth=-1');
    
    await page.waitForSelector('text=Review Your Lead Magnet', { timeout: 120000 });
    console.log('Content generated!');

    // Verify
    console.log('\n=== API CALLS ===');
    const grouped = {};
    apiCalls.forEach(c => grouped[c.fn] = (grouped[c.fn] || 0) + 1);
    Object.entries(grouped).forEach(([fn, n]) => console.log(`  ${fn}: ${n}`));

    const startGen = apiCalls.filter(c => c.fn === 'start-generation').length;
    const checkStatus = apiCalls.filter(c => c.fn === 'check-job-status').length;
    const batched = apiCalls.filter(c => c.fn === 'generate-funnel-content-batched').length;

    console.log('\n=== VERIFICATION ===');
    console.log('start-generation:', startGen, startGen > 0 ? '✓' : '✗');
    console.log('check-job-status:', checkStatus, checkStatus > 0 ? '✓' : '✗');
    console.log('batched (should be 0):', batched, batched === 0 ? '✓' : '✗ BAD!');

    expect(startGen).toBeGreaterThan(0);
    expect(checkStatus).toBeGreaterThan(0);
    expect(batched).toBe(0);

    console.log('\n=== TEST PASSED ===');
  });
});
