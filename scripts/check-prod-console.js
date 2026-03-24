// Run: node scripts/check-prod-console.js
// Captures console, failed requests, and 4xx responses on prod.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const logs = [];
  const errors = [];
  const badResponses = [];

  context.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text });
    if (type === 'error' || type === 'warning') errors.push({ type, text });
  });

  const page = await context.newPage();
  page.on('pageerror', err =>
    errors.push({ type: 'pageerror', text: err.message, stack: err.stack })
  );
  page.on('response', r => {
    const s = r.status();
    if (s >= 400) badResponses.push({ status: s, url: r.url() });
  });

  const url = process.env.PROD_URL || 'https://frenchb22026.bogachev.fr/';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});

  await page.waitForSelector('text=French B2 in 1 year', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const rootContent = await page.locator('#root').innerHTML().catch(() => '');
  const loading = await page.locator('text=Loading...').count();
  const hasDashboard = await page.locator('text=French B2 in 1 year').count();

  await browser.close();

  console.log('=== HTTP 4xx ===');
  console.log(badResponses.length ? JSON.stringify(badResponses, null, 2) : '(none)');

  console.log('=== PAGEERROR / console error+warning ===');
  errors.forEach(e => console.log(JSON.stringify(e)));

  console.log('=== ALL CONSOLE ===');
  logs.forEach(l => console.log(l.type + ':', l.text));

  console.log('=== CHECKS ===');
  console.log('Loading... still visible:', loading > 0);
  console.log('Dashboard title visible:', hasDashboard > 0);
  console.log('BODY length:', bodyText.length);
  console.log('ROOT HTML length:', rootContent.length);

  const ok =
    hasDashboard > 0 &&
    loading === 0 &&
    rootContent.length > 1000 &&
    badResponses.filter(b => !b.url.includes('favicon')).length === 0;

  if (!ok) {
    console.error('\nFAIL: page did not load as expected.');
    process.exit(1);
  }
  console.log('\nOK: prod page loaded.');
})();
