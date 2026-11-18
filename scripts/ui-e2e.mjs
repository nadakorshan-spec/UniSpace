/**
 * Browser end-to-end check of the UniSpace MVP UI.
 * Requires the frontend dev server on http://localhost:5173 and a reachable API.
 * Run with: npm run test:ui
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(EDGE) ? EDGE : fs.existsSync(CHROME) ? CHROME : undefined;

if (!executablePath) {
  console.error('No local Chromium-based browser found.');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function localDateTime(daysFromNow) {
  const d = new Date(Date.now() + daysFromNow * 86400000);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const email = `ui-e2e-${randomUUID()}@unispase.test`;
  console.log(`UniSpace UI E2E against ${BASE}\n`);

  // --- Register through the UI ---
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.locator('input[autocomplete="name"]').fill('UI Test Student');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[autocomplete="new-password"]').fill('StudyHard123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  check('Register and land on dashboard', page.url().endsWith('/dashboard'));
  await page.getByText(/Good (morning|afternoon|evening)/).waitFor({ timeout: 10000 });

  // --- Courses CRUD (create + list + edit + delete) ---
  await page.getByRole('link', { name: 'Courses', exact: true }).first().click();
  await page.waitForURL('**/courses');
  await page.getByRole('button', { name: 'Add course' }).first().click();
  await page.getByPlaceholder('CS 301').fill('UI 101');
  await page.getByPlaceholder('Data Structures').fill('UI Testing Lab');
  await page.getByRole('button', { name: 'Create course' }).click();
  await page.getByText('UI Testing Lab').waitFor({ timeout: 10000 });
  check('Create course via UI', await page.getByText('UI Testing Lab').isVisible());

  const courseCard = page.locator('div.group').filter({ hasText: 'UI Testing Lab' }).first();
  await courseCard.getByTitle('').count(); // no-op keeps locator warm
  await courseCard.locator('button').first().click(); // edit pencil
  await page.getByPlaceholder('Data Structures').fill('UI Testing Lab Updated');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('UI Testing Lab Updated').waitFor({ timeout: 10000 });
  check('Edit course via UI', await page.getByText('UI Testing Lab Updated').isVisible());

  // --- Tasks CRUD (create + toggle complete) ---
  await page.getByRole('link', { name: 'Tasks', exact: true }).first().click();
  await page.waitForURL('**/tasks');
  await page.getByRole('button', { name: 'New task' }).first().click();
  await page.getByPlaceholder('Submit assignment draft').fill('UI E2E assignment');
  await page.locator('input[type="datetime-local"]').fill(await localDateTime(2));
  await page.getByRole('button', { name: 'Create task' }).click();
  await page.getByText('UI E2E assignment').waitFor({ timeout: 10000 });
  check('Create task with deadline via UI', await page.getByText('UI E2E assignment').isVisible());

  await page.locator('button[aria-label="Toggle complete"]').first().click();
  await page.waitForTimeout(700);
  check('Toggle task completion via UI', (await page.getByText('COMPLETED').count()) > 0);

  // --- Exams CRUD (create) ---
  await page.getByRole('link', { name: 'Exams', exact: true }).first().click();
  await page.waitForURL('**/exams');
  await page.getByRole('button', { name: 'Add exam' }).first().click();
  await page.getByPlaceholder('Data Structures Midterm').fill('UI E2E midterm');
  await page.locator('input[type="datetime-local"]').first().fill(await localDateTime(5));
  await page.getByRole('button', { name: 'Add exam' }).last().click();
  await page.getByText('UI E2E midterm').waitFor({ timeout: 10000 });
  check('Create exam via UI', await page.getByText('UI E2E midterm').isVisible());

  // --- Calendar aggregate ---
  await page.getByRole('link', { name: 'Calendar', exact: true }).first().click();
  await page.waitForURL('**/calendar');
  await page.getByText('All scheduled items').waitFor({ timeout: 10000 });
  await page.getByText('UI E2E assignment').first().waitFor({ timeout: 10000 });
  await page.getByText('UI E2E midterm').first().waitFor({ timeout: 10000 });
  const calendarText = await page.locator('body').innerText();
  check(
    'Calendar shows task and exam',
    calendarText.includes('UI E2E assignment') && calendarText.includes('UI E2E midterm'),
    `calendar body: ${calendarText.slice(-900).replace(/\n/g, ' | ')}`,
  );

  // --- AI planner failure path (no key configured) ---
  await page.getByRole('link', { name: 'AI Study Planner', exact: true }).first().click();
  await page.waitForURL('**/planner');
  await page.getByRole('button', { name: 'Generate study plan' }).click();
  await page.waitForTimeout(2000);
  const plannerText = await page.locator('body').innerText();
  check(
    'AI planner reports missing key (no fake plan)',
    plannerText.includes('OPENAI_API_KEY') || plannerText.includes('AI_NOT_CONFIGURED'),
  );

  // --- Logout ---
  await page.locator('button[title="Log out"]').click();
  await page.waitForURL('**/login', { timeout: 10000 });
  check('Logout returns to login', page.url().endsWith('/login'));

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  await page.close();
  process.exit(failed === 0 ? 0 : 1);
} catch (error) {
  console.error('UI E2E crashed:', error);
  process.exit(1);
} finally {
  await browser.close();
}
