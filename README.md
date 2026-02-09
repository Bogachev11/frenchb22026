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
├── env.local.js                      # API key for local dev (GITIGNORED)
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

# 2. Create env.local.js (gitignored) with your API key
echo "window.__API_KEY__ = 'YOUR_GOOGLE_API_KEY';" > env.local.js

# 3. Start local server
npx http-server . -p 3002 -c-1

# 4. Open http://127.0.0.1:3002
```

**How API key works locally vs prod:**
- **Local:** `env.local.js` sets `window.__API_KEY__` (file is gitignored, never committed)
- **Prod:** `deploy.yml` runs `sed` to replace placeholder in `index.html` with value from `GOOGLE_API_KEY` secret

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
