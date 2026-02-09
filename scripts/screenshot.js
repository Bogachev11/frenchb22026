const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL = 'https://frenchb22026.bogachev.fr';

async function takeScreenshot() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

    let loaded = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForSelector('.recharts-cartesian-axis', { timeout: 15000 });
            await page.waitForFunction(() =>
                document.querySelectorAll('.recharts-cartesian-axis-tick-value').length > 0,
                { timeout: 10000 }
            );
            await new Promise(r => setTimeout(r, 5000));
            loaded = true;
            break;
        } catch (e) {
            console.log(`Attempt ${attempt} failed: ${e.message}`);
            if (attempt < 3) await new Promise(r => setTimeout(r, 5000));
        }
    }
    if (!loaded) throw new Error('Failed to load page after 3 attempts');

    const dir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const today = new Date().toISOString().split('T')[0];
    const filePath = path.join(dir, `dashboard_${today}.png`);

    const el = await page.$('div.max-w-md');
    if (el) {
        await el.screenshot({ path: filePath, type: 'png' });
    } else {
        await page.screenshot({ path: filePath, fullPage: true, type: 'png' });
    }

    console.log(`Screenshot saved: ${filePath}`);
    await browser.close();
}

takeScreenshot().catch(e => { console.error(e); process.exit(1); });
