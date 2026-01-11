# Testing Patterns

**Analysis Date:** 2026-01-11

## Test Framework

**Runner:**
- Playwright 1.57.0
- Config: `playwright.config.js` in project root

**Assertion Library:**
- Playwright built-in `expect`
- Matchers: `toBe`, `toEqual`, `toContainText`, `toBeGreaterThan`

**Run Commands:**
```bash
npx playwright test                    # Run all tests
npx playwright test --ui               # Open UI mode
npx playwright test e2e/file.spec.js   # Single file
npx playwright show-report             # View HTML report
```

## Test File Organization

**Location:**
- `e2e/` directory for all E2E tests
- Separate from source code

**Naming:**
- `*.spec.js` for test files
- Descriptive names: `lead-magnet-test.spec.js`

**Structure:**
```
e2e/
  lead-magnet-test.spec.js    # Single E2E test file
```

## Test Structure

**Suite Organization:**
```javascript
import { test, expect } from '@playwright/test';

test.describe('Lead Magnet Generation - LIVE', () => {
  let apiCalls = [];

  test('full flow with RAG verification', async ({ page }) => {
    // Test logic here
    expect(startGen).toBeGreaterThan(0);
    expect(checkStatus).toBeGreaterThan(0);
  });
});
```

**Patterns:**
- `test.describe()` for grouping related tests
- `test()` for individual test cases
- Variables outside test for shared state (like apiCalls tracking)
- Assertions at end of test

## Mocking

**Framework:**
- No mocking framework configured
- Tests run against live environment

**Patterns:**
```javascript
// API call interception for verification
page.on('request', request => {
  const url = request.url();
  if (url.includes('netlify/functions')) {
    apiCalls.push({
      url,
      method: request.method()
    });
  }
});
```

**What to Mock:**
- Currently nothing mocked (tests against live app)

**What NOT to Mock:**
- Full user flows (authentication, navigation, API calls)

## Fixtures and Factories

**Test Data:**
- Uses environment variables for credentials
- `TEST_EMAIL` and `TEST_PASSWORD` from `.env`

**Location:**
- No dedicated fixtures directory
- Test data inline in test files

## Coverage

**Requirements:**
- No coverage targets defined
- No coverage tooling configured

**Current State:**
- 1 E2E test file (107 lines)
- No unit tests
- No integration tests
- Severely under-tested (1 test file : 117 source files)

## Test Types

**Unit Tests:**
- Not implemented
- No Jest, Vitest, or other unit test framework

**Integration Tests:**
- Not implemented
- No API-level testing

**E2E Tests:**
- Playwright for browser automation
- Tests full user flows against live deployment
- Single test covers lead magnet generation flow

## Common Patterns

**Async Testing:**
```javascript
test('should complete flow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

**Wait Strategies:**
```javascript
await page.waitForLoadState('networkidle');   // Network idle
await page.waitForURL('/dashboard');           // URL navigation
await page.waitForSelector('.element');        // DOM element
await page.waitForTimeout(5000);               // Fixed wait (use sparingly)
```

**API Verification:**
```javascript
// Count API calls to specific endpoints
const startGen = apiCalls.filter(c =>
  c.url.includes('start-generation')
).length;
expect(startGen).toBeGreaterThan(0);
```

## Configuration Details

**playwright.config.js:**
```javascript
{
  testDir: './e2e',
  timeout: 180000,              // 3 minutes per test
  expect: { timeout: 15000 },   // 15s for assertions
  fullyParallel: false,         // Sequential execution
  retries: 0,                   // No retries
  workers: 1,                   // Single worker
  reporter: 'list',             // Simple list output
  use: {
    baseURL: 'https://launchpad-pro-app.netlify.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }
}
```

## Test Gaps

**Critical Functions Without Tests:**
- `netlify/functions/lib/batched-generators.js` - 14 generation functions (1,466 lines)
- `netlify/functions/lib/retry-engine.js` - 197 lines
- `netlify/functions/lib/task-orchestrator.js` - 201 lines
- `netlify/functions/lib/knowledge-search.js` - RAG search logic

**Missing Test Types:**
- Unit tests for utilities (`src/lib/utils.js`, `src/lib/pdf-generator.js`)
- Component tests for React components
- API integration tests for Netlify functions
- Error handling tests
- Edge case coverage

**Recommended Additions:**
1. Add Vitest for unit testing
2. Add tests for batched-generators.js (highest risk)
3. Add tests for retry-engine.js
4. Add more E2E scenarios (funnel generation, settings, admin)

---

*Testing analysis: 2026-01-11*
*Update when test patterns change*
