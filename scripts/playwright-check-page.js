/**
 * Playwright: открыть страницу (локально или прод), собрать ответы сети и консоль.
 *
 * Запуск (сервер локально должен быть уже поднят: npm run dev:noopen):
 *   node scripts/playwright-check-page.js http://127.0.0.1:3045/
 *
 * Прод:
 *   node scripts/playwright-check-page.js https://frenchb22026.bogachev.fr/
 *
 * Переменная PAGE_URL — то же, что первый аргумент.
 */
const { chromium } = require('playwright');

const IGNORE_CONSOLE_SUBSTR = [
  'Download the React DevTools',
  'cdn.tailwindcss.com should not be used in production'
];

function shouldIgnoreConsole(text) {
  return IGNORE_CONSOLE_SUBSTR.some(s => text.includes(s));
}

(async () => {
  const pageUrl = process.argv[2] || process.env.PAGE_URL || 'http://127.0.0.1:3045/';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const logs = [];
  const sheetsResponses = [];
  const badHttp = [];

  context.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text });
  });

  const page = await context.newPage();
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));

  page.on('response', r => {
    const u = r.url();
    const s = r.status();
    if (u.includes('sheets.googleapis.com')) {
      sheetsResponses.push({ status: s, path: u.split('?')[0] });
    }
    if (s >= 400 && !u.includes('favicon')) {
      badHttp.push({ status: s, url: u.split('?')[0] });
    }
  });

  await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 90000 }).catch(e => {
    logs.push({ type: 'navigation', text: String(e) });
  });

  await page.waitForSelector('text=French B2 in 1 year', { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const loading = await page.locator('text=Loading...').count();
  const hasTitle = await page.locator('text=French B2 in 1 year').count();
  const rootLen = (await page.locator('#root').innerHTML().catch(() => '')).length;

  await browser.close();

  console.log('URL:', pageUrl);
  console.log('\n=== Google Sheets API ===');
  if (sheetsResponses.length === 0) {
    console.log('(no request to sheets.googleapis.com — key missing or fetch not run)');
  } else {
    sheetsResponses.forEach(x => {
      console.log(JSON.stringify(x, null, 2));
    });
  }

  const sheets403 = sheetsResponses.some(x => x.status === 403);
  const sheetsOk = sheetsResponses.some(x => x.status === 200);
  const sheetsBad = sheetsResponses.some(x => x.status >= 400);

  console.log('\n=== Other HTTP 4xx (no favicon) ===');
  const other = badHttp.filter(b => !b.url.includes('sheets.googleapis.com'));
  console.log(other.length ? JSON.stringify(other, null, 2) : '(none)');

  console.log('\n=== Console (app-related; tailwind/react noise filtered) ===');
  logs.forEach(l => {
    if (shouldIgnoreConsole(l.text)) return;
    console.log(l.type + ':', l.text);
  });

  console.log('\n=== UI ===');
  console.log('Dashboard title:', hasTitle > 0);
  console.log('Still "Loading...":', loading > 0);
  console.log('#root HTML length:', rootLen);

  console.log('\n=== Notes ===');
  console.log('- "runtime.lastError" / "message port" в обычном Chrome — от расширений, не от этого сайта. Playwright их чаще не показывает.');
  console.log('- Предупреждение Tailwind CDN — ожидаемо для этого проекта без сборки.');
  console.log('- 403 на sheets.googleapis.com локально: в env.local.js задайте ключ; в Google Cloud → ключ → ограничения по HTTP referrer добавьте http://127.0.0.1:3045/* и http://localhost:3045/*');

  if (hasTitle === 0 || rootLen < 500) {
    console.error('\nFAIL: страница не отрисовалась (нет заголовка или пустой #root).');
    process.exit(1);
  }
  if (sheets403) {
    console.error('\nFAIL: Google Sheets API вернул 403. Локально: задайте ключ в env.local.js; в Google Cloud → Credentials → ваш API key → «Websites» добавьте http://127.0.0.1:3045/* и http://localhost:3045/*');
    process.exit(1);
  }
  if (sheetsResponses.length > 0 && sheetsBad && !sheetsOk) {
    console.error('\nFAIL: запрос к Sheets не удался (не 200). См. блок Google Sheets API выше.');
    process.exit(1);
  }

  console.log('\nOK: UI загружен; Sheets API — 200 или запрос не уходил.');
  process.exit(0);
})();
