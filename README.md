# French B2 in 1 Year — Year Tracker 2026

Personal dashboard for tracking progress toward French B2 level over one year (52 weeks).

**Live:** https://frenchb22026.bogachev.fr

---

## Goal

Track daily French language activities and visualize weekly progress across the entire year. The dashboard shows:
- **Podcasts & Films** — listening hours per week (stacked bar chart, target: 4h/week)
- **Tutor & Homework** — study hours per week (stacked bar chart)
- **Mood / Language perception** — daily self-assessment 1–5 with weekly average line
- **KPI cards** — current week, total hours, daily average, 4h streaks count

---

## Tech Stack

Zero build system. Static files + CDN.

| Technology | Version | Source |
|---|---|---|
| React | 18.2.0 | CDN (cdnjs) |
| ReactDOM | 18.2.0 | CDN (cdnjs) |
| Recharts | 2.x | Local file `recharts.js` |
| Tailwind CSS | 3.x | CDN (`cdn.tailwindcss.com`) |
| Google Fonts (Barlow) | — | CDN |
| prop-types | 15.8.1 | CDN (unpkg) |

---

## Project Structure

```
├── index.html                        # Entry point, loads all libraries and scripts
├── styles.css                        # Custom CSS for Recharts axis/grid styling
├── recharts.js                       # Recharts library (local, committed to repo)
├── env.local.example.js              # Stub copied to env.local.js on deploy; locally use npm run env:local
├── update-log.json                   # Last update timestamp + cached data (auto-generated)
├── CNAME                             # Custom domain: frenchb22026.bogachev.fr
├── js/
│   ├── config.js                     # Sheet ID, API key reference, deployed URL
│   ├── utils.js                      # Date utils, formatters, constants
│   ├── data.js                       # Fetch Google Sheets → group by ISO week
│   └── app.js                        # Main React component (KPIs, charts, layout)
├── scripts/
│   └── screenshot.js                 # Puppeteer script for daily screenshots
├── screenshots/                      # Auto-generated daily screenshots
├── .github/workflows/
│   ├── deploy.yml                    # Deploy to GitHub Pages on push
│   ├── auto-update-log.yml           # Poll Google Sheets every 30 min
│   └── daily-screenshot.yml          # Screenshot at 22:30 UTC daily
└── .gitignore
```

---

## Data Source

**Google Sheets** via Google Sheets API v4 (read-only, public sheet).

| Column | Content | Example |
|---|---|---|
| A | Date (YYYY-MM-DD) | `2026-01-15` |
| B | Podcasts (minutes) | `30` |
| C | Films (minutes) | `60` |
| D | Tutor (minutes) | `60` |
| E | Homework (minutes) | `40` |
| F | Mood (1–5) | `3.5` |

- **Sheet ID:** `1z75gGNB8sLFZpUo81WEigIRgyuH6qnuzdKmvaWnOxus`
- **Range:** `main!A2:F`
- Daily rows are grouped by ISO week number (Monday = start of week)
- Minutes are converted to hours for display

---

## How Data Flows

```
Google Sheets (you edit manually)
  │
  ├──→ [Browser] Direct API call (real-time data for charts)
  │      js/data.js → fetchData() → Google Sheets API
  │
  └──→ [GitHub Action: auto-update-log] Every 30 min
         Fetches data, compares with update-log.json
         If changed → commit new update-log.json → push → triggers deploy
         │
         └──→ [Browser] fetch('./update-log.json')
                Reads lastUpdateTime → displays "upd Xm ago"
```

---

## GitHub Actions (3 workflows)

### 1. `deploy.yml` — Deploy to GitHub Pages
- **Trigger:** push to `main`
- **What it does:** Injects API key from secret, uploads all files, deploys to Pages
- **Key step:** `sed` replaces `window.__API_KEY__` placeholder with real key from `GOOGLE_API_KEY` secret

### 2. `auto-update-log.yml` — Auto Update Log
- **Trigger:** cron `*/30 * * * *` (every 30 min) + manual
- **What it does:**
  1. Fetches current data from Google Sheets
  2. Compares with `update-log.json` in repo (via `jq`)
  3. If data changed → writes new `update-log.json` with timestamp → commits → pushes
  4. Push triggers `deploy.yml` → site updates
- **If data unchanged → exits, no commit**

### 3. `daily-screenshot.yml` — Daily Dashboard Screenshot
- **Trigger:** cron `30 22 * * *` (22:30 UTC daily) + manual
- **What it does:**
  1. Installs Puppeteer
  2. Opens deployed URL in headless Chrome
  3. Waits for charts to render
  4. Screenshots the dashboard container → `screenshots/dashboard_YYYY-MM-DD.png`
  5. Commits and pushes

---

## GitHub Secrets (required)

| Secret | Purpose | Where to create |
|---|---|---|
| `GOOGLE_API_KEY` | Google Sheets API key (browser-restricted) | Google Cloud Console → APIs & Services → Credentials |
| `API_TOKEN` | Personal Access Token with `repo` scope | GitHub → Settings → Developer settings → Personal access tokens (classic) |

- `GOOGLE_API_KEY` is used by `deploy.yml` (injected into HTML) and `auto-update-log.yml` (API calls)
- `API_TOKEN` is used by `auto-update-log.yml` and `daily-screenshot.yml` to push commits back to repo

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/Bogachev11/frenchb22026.git
cd frenchb22026

# 2. Same API key as on GitHub (Settings → Secrets → GOOGLE_API_KEY). Writes gitignored env.local.js:
#    PowerShell: $env:GOOGLE_API_KEY="paste-your-key-here" ; npm run env:local

# 3. Install deps (once), then start local server (opens browser on http://127.0.0.1:3045 )
npm install
npm run dev

# If the browser does not open, go manually to: http://127.0.0.1:3045/
# If `localhost` fails, always use `127.0.0.1` (Windows sometimes resolves localhost oddly).
# Without auto-open: npm run dev:noopen
```

**Playwright-проверка** (пока в другом терминале запущен `npm run dev:noopen`):

```bash
npm run check:page
# или: node scripts/playwright-check-page.js http://127.0.0.1:3045/
```

Скрипт выводит статус ответа Google Sheets. **403 локально** — как правило пустой ключ в `env.local.js` или в Google Cloud для ключа с ограничением по сайтам не указаны referrers `http://127.0.0.1:3045/*` и `http://localhost:3045/*`. Если сменили порт dev-сервера (например с 3000 на 3045), **referrer в списке должен совпадать с тем, что в адресной строке** — иначе Google отдаёт 403, хотя раньше «всё работало».

Сообщения **`runtime.lastError` / message port** в консоли обычного Chrome обычно от **расширений**, не от кода сайта; в Playwright (чистый Chromium) их нет.

**How API key works locally vs prod:**
- **Local:** `npm run env:local` (with `GOOGLE_API_KEY` in the environment) writes `env.local.js` (gitignored) with `window.__API_KEY__`.
- **Prod:** `deploy.yml` copies `env.local.example.js` → `env.local.js` (avoids 404) and runs `sed` to inject the key into `index.html` from the `GOOGLE_API_KEY` secret.

---

## Key Design Decisions

- **No build system** — pure HTML/JS/CSS, CDN libraries, zero npm build step
- **ISO week numbering** — Monday = first day of week, consistent with European convention
- **Weekly aggregation** — daily data grouped by ISO week for bar charts
- **Font: Barlow** — primary text; Barlow Semi Condensed for KPI numbers
- **Compact vertical layout** — designed for mobile-first viewing, room for future modules
- **Recharts local file** — `recharts.js` committed to repo (CDN version requires prop-types loaded first)

---

## Update Indicator Logic

The "upd Xm ago" badge in the top-right corner:
1. On page load, fetches `./update-log.json`
2. Reads `lastUpdateTime` (ISO 8601 string)
3. Calculates diff from `now` and displays: `just now` / `Xm ago` / `Xh ago` / `yesterday` / `2+ days ago`
4. Refreshes every 30 seconds
5. Pulsing blue dot indicates the dashboard is live

---

## Custom Domain Setup

- **Domain:** `frenchb22026.bogachev.fr`
- **DNS:** CNAME record `frenchb22026` → `bogachev11.github.io` (at DNS provider)
- **GitHub:** Settings → Pages → Custom domain → `frenchb22026.bogachev.fr` → Enforce HTTPS
- **Repo:** `CNAME` file in root with `frenchb22026.bogachev.fr`

---

## Author

Aleksandr Bogachev — [@bogachev_al](https://x.com/bogachev_al)
