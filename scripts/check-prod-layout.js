// Check prod layout: switch to D mode, screenshot, dump structure
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1000, height: 1200 });

  let url = process.env.LAYOUT_URL || 'https://frenchb22026.bogachev.fr/';
  if (url.includes('localhost')) url += (url.includes('?') ? '&' : '?') + 't=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Switch to D mode
  await page.click('button:has-text("D")').catch(() => {});
  await page.waitForTimeout(1500);

  const outDir = path.join(__dirname, '..');
  await page.screenshot({ path: path.join(outDir, 'prod-d-mode.png'), fullPage: true });
  console.log('Screenshot saved: prod-d-mode.png');

  // Dump structure: main containers and their children count
  const structure = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return { error: 'no root' };
    const first = root.firstElementChild;
    if (!first) return { error: 'no first child', innerHTML: root.innerHTML.slice(0, 500) };
    const walk = (el, depth) => {
      if (depth > 6) return null;
      const cls = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
      const tag = el.tagName.toLowerCase();
      const kids = Array.from(el.children);
      return {
        tag,
        class: cls.slice(0, 80),
        childCount: kids.length,
        children: kids.slice(0, 8).map(c => walk(c, depth + 1))
      };
    };
    return walk(first, 0);
  });
  console.log(JSON.stringify(structure, null, 2));

  await browser.close();
})();
