/**
 * Captures UI evidence for the UniSpace lab submission.
 * Requires the frontend dev server on http://localhost:5173 and demo seed data.
 * Run with: npm run screenshots
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('screenshots');

const executablePath = fs.existsSync(EDGE) ? EDGE : fs.existsSync(CHROME) ? CHROME : undefined;
if (!executablePath) {
  console.error('No local Chromium-based browser found. Install Edge or Chrome, or set a browser path.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function shot(page, name, fullPage = false) {
  await page.waitForTimeout(700);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage });
  console.log(`  saved screenshots/${name}`);
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log(`Capturing UI evidence from ${BASE}`);

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await shot(page, '01-login.png');

  await page.locator('input[type="email"]').fill('demo@unispase.test');
  await page.locator('input[type="password"]').fill('StudyHard123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await page.getByText(/Good (morning|afternoon|evening)/).waitFor({ timeout: 20000 });
  await shot(page, '02-dashboard.png', true);

  const pages = [
    ['/courses', '03-courses.png'],
    ['/tasks', '04-tasks.png'],
    ['/exams', '05-exams.png'],
    ['/calendar', '06-calendar.png'],
    ['/planner', '07-ai-planner.png'],
  ];
  for (const [route, name] of pages) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await shot(page, name, true);
  }

  // Responsive evidence
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await mobilePage.locator('input[type="email"]').fill('demo@unispase.test');
  await mobilePage.locator('input[type="password"]').fill('StudyHard123');
  await mobilePage.locator('button[type="submit"]').click();
  await mobilePage.waitForURL('**/dashboard', { timeout: 20000 });
  await shot(mobilePage, '08-mobile-dashboard.png', true);

  console.log('Screenshot capture complete.');
} finally {
  await browser.close();
}
