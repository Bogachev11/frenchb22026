# Инструкции для нового проекта: Personal Dashboard

Инструкции для создания нового дашборда на базе french-challenge. Передать в новый проект целиком.

---

## 1. Обзор проекта

**Что это:** Персональный дашборд с несколькими модулями трекинга:
- Трекинг изучения французского языка (уроки, время по категориям, настроение)
- Трекинг привычек (streak, ежедневные чекбоксы)
- Трекинг избегания соцсетей
- Трекинг постинга в LinkedIn

**Автор:** Aleksandr Bogachev (GitHub: bogachev11)

---

## 2. Технический стек

Без сборки. Статические файлы, подключение через CDN.

| Технология | Версия | Подключение |
|---|---|---|
| React | 18.2.0 | CDN: `https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.js` |
| ReactDOM | 18.2.0 | CDN: `https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.js` |
| Recharts | 2.x | Локальный файл `recharts.js` (скачать с `https://unpkg.com/recharts@2.10.3/umd/Recharts.js`) |
| Tailwind CSS | 3.x | CDN: `https://cdn.tailwindcss.com` |
| Google Fonts Inter | — | `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap` |
| prop-types | 15.8.1 | CDN: `https://unpkg.com/prop-types@15.8.1/prop-types.min.js` |

**Важно:** Tailwind через CDN — только для разработки. Для продакшна можно оставить так (работает), но не рекомендуется для больших проектов.

---

## 3. Структура файлов нового проекта

В отличие от старого проекта (где всё в одном `app.js`), разбиваем на файлы:

```
project/
├── index.html                    # Главная страница, подключение библиотек
├── styles.css                    # Стили для графиков Recharts
├── recharts.js                   # Библиотека Recharts (скачанная)
├── js/
│   ├── app.js                    # Главный компонент, рендеринг
│   ├── config.js                 # Константы: SHEET_ID, API_KEY, RANGE
│   ├── utils.js                  # Утилиты: formatTime, getMoodColor и т.п.
│   ├── data.js                   # Загрузка и обработка данных из Google Sheets
│   ├── components/
│   │   ├── Header.js             # Заголовок с метриками
│   │   ├── FrenchModule.js       # Модуль трекинга французского
│   │   ├── HabitsModule.js       # Модуль привычек
│   │   ├── SocialModule.js       # Модуль соцсетей
│   │   ├── LinkedInModule.js     # Модуль LinkedIn
│   │   └── Footer.js             # Подвал
│   └── charts/
│       ├── LineChartComponent.js  # Линейный график
│       ├── BarChartComponent.js   # Столбчатый график
│       ├── StackedBarChart.js     # Stacked bar chart
│       ├── MoodChart.js           # График настроения
│       └── CustomAxisTick.js      # Кастомный тик оси X
├── scripts/
│   └── screenshot.js             # Скрипт для скриншотов (Puppeteer)
├── screenshots/                  # Папка для скриншотов
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Деплой на GitHub Pages
│       ├── daily-screenshot.yml  # Ежедневные скриншоты
│       └── auto-update-log.yml   # Автообновление данных
├── update-log.json               # Лог обновлений (создаётся автоматически)
├── package.json
├── .gitignore
└── README.md
```

**Как подключать файлы без сборки:**

В `index.html` подключаем через `<script>`:
```html
<!-- Библиотеки -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.js"></script>
<script src="recharts.js"></script>

<!-- Свои файлы (порядок важен!) -->
<script src="js/config.js"></script>
<script src="js/utils.js"></script>
<script src="js/charts/CustomAxisTick.js"></script>
<script src="js/charts/LineChartComponent.js"></script>
<script src="js/charts/BarChartComponent.js"></script>
<script src="js/charts/StackedBarChart.js"></script>
<script src="js/charts/MoodChart.js"></script>
<script src="js/data.js"></script>
<script src="js/components/Header.js"></script>
<script src="js/components/FrenchModule.js"></script>
<script src="js/components/HabitsModule.js"></script>
<script src="js/components/SocialModule.js"></script>
<script src="js/components/LinkedInModule.js"></script>
<script src="js/components/Footer.js"></script>
<script src="js/app.js"></script>
```

Все компоненты — глобальные функции (без import/export). Пример:
```javascript
// js/components/Header.js
const Header = ({ displayCurrentDay, completedLessons, avgTime, totalTime }) => {
  return React.createElement('div', { ... }, ...);
};
```

---

## 4. Дизайн-система

### 4.1. Верстка

Основной контейнер: вертикальная колонка по центру.
```javascript
React.createElement('div', { 
  className: "max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1" 
}, ...)
```

Ключевые классы:
- `max-w-md` — ширина 448px
- `mx-auto` — центрирование
- `min-h-screen` — минимальная высота на весь экран
- `bg-white` — белый фон
- `border border-gray-300` — серая рамка
- `px-1` — минимальные горизонтальные отступы

### 4.2. Шрифт

Inter через Google Fonts. Все размеры:
- Заголовок: `text-3xl font-bold` (30px, жирный)
- Подзаголовок: `text-base opacity-70` (16px, полупрозрачный)
- Метрики: `text-xl font-bold` (20px, жирный)
- Подписи метрик: `text-sm text-gray-600` (14px, серый)
- Заголовки секций: `text-base font-medium text-gray-700` (16px, средний)
- Оси графиков: 12px, чёрный (#000000)

### 4.3. Цвета

Tailwind конфиг (внутри `<script>` в index.html):
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        data_categories: {
          negative: '#e91e63',
          neutral: '#03a9f4',
          positive: '#4caf50',
          suspended: '#673ab7'
        },
        neutral: {
          white: '#ffffff',
          gray_50: '#f9fafb',
          gray_200: '#e5e7eb',
          gray_400: '#9ca3af',
          gray_600: '#4b5563',
          gray_800: '#1f2937',
          black: '#000000'
        }
      },
      fontFamily: {
        'primary': ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  }
}
```

Палитра для графиков (французский модуль, пример):
- Grammar: `#F72585`
- Write: `#4CC9F0`
- Listen: `#5189E9`
- Speak: `#4A2CF5`
- Read: `#9378FF`
- Legacy (старые категории): `#D5DAE3`

### 4.4. Метрики (карточки)

4 карточки в ряд:
```javascript
React.createElement('div', { className: "grid grid-cols-4 gap-2 p-4" },
  React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg" },
    React.createElement('div', { className: "text-xl font-bold text-gray-800" }, "42"),
    React.createElement('div', { className: "text-sm text-gray-600" }, "metric")
  ),
  // ...ещё 3 карточки
)
```

---

## 5. Стили для графиков (styles.css)

Полный CSS для оформления графиков Recharts:

```css
/* Основные стили */
* { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

/* Оси */
.recharts-cartesian-axis-tick-value {
    font-size: 12px !important;
    fill: #000000 !important;
    font-weight: normal !important;
}
.recharts-cartesian-axis-tick-line { stroke: #000000; stroke-width: 1; }
.recharts-cartesian-axis-line { stroke: #000000; stroke-width: 1; }

/* Скрыть линию оси Y */
.recharts-cartesian-axis-y .recharts-cartesian-axis-line { display: none !important; }
.recharts-cartesian-axis-y line { display: none !important; }

/* Центрирование лейблов оси Y */
.recharts-cartesian-axis-y .recharts-cartesian-axis-tick-value {
    text-anchor: middle !important;
    dominant-baseline: middle !important;
}

/* Позиционирование графиков */
.recharts-wrapper {
    margin-left: 25px !important;
    padding-left: 0 !important;
    transform: translateX(-15%) !important;
}
.recharts-surface { margin-left: 25px !important; }
.recharts-cartesian-axis { margin-left: 25px !important; }

/* Сетка */
.recharts-cartesian-grid-horizontal line { stroke: #f9fafb; stroke-width: 1; }
.recharts-cartesian-grid-vertical line { stroke: #f9fafb; stroke-width: 1; }

/* Линии и столбцы */
.recharts-line { stroke-linecap: round; stroke-linejoin: round; }
.recharts-bar { stroke-width: 0; }
.recharts-dot { stroke-width: 0; }
```

---

## 6. Паттерны графиков

### 6.1. Ось X с кастомным тиком

На оси X отображаются фиксированные дни (1, 10, 30, 60, 90) плюс текущий день. Текущий день выделяется жирным. Если текущий день ближе 4 дней к фиксированному — фиксированный скрывается.

```javascript
const CustomXAxisTick = (props) => {
  const { x, y, payload, currentDay, hideLabels } = props;
  const isCurrentDay = payload.value === currentDay;
  
  if (hideLabels && !isCurrentDay) {
    return React.createElement('g', { transform: `translate(${x},${y})` });
  }
  
  const specialDays = [1, 10, 30, 60, 90];
  const shouldHide = specialDays.includes(payload.value) && 
    payload.value !== 90 &&
    Math.abs(payload.value - currentDay) <= 3;
  
  if (shouldHide) {
    return React.createElement('g', { transform: `translate(${x},${y})` });
  }
  
  return React.createElement('g', { transform: `translate(${x},${y})` },
    React.createElement('text', {
      x: 0, y: 0, dy: 10,
      textAnchor: "middle",
      fill: isCurrentDay ? '#000000' : '#666666',
      fontWeight: isCurrentDay ? 'bold' : 'normal',
      fontSize: 12
    }, payload.value)
  );
};
```

### 6.2. Линейный график (кумулятивный прогресс)

```javascript
React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
  React.createElement(ComposedChart, { 
    data: allData, 
    margin: { left: 5, right: 10, top: 9, bottom: 0 }
  },
    React.createElement(XAxis, { 
      type: "number", dataKey: "day", domain: [0, 90],
      ticks: [1, 10, 30, 60, 90, currentDay],
      tick: (props) => React.createElement(CustomXAxisTick, { ...props, currentDay, hideLabels: true })
    }),
    React.createElement(YAxis, { domain: [0, 40], ticks: [0, 10, 20, 30, 40], axisLine: false, fontSize: 12 }),
    React.createElement(Line, { type: "step", dataKey: "lessons", stroke: "#3b82f6", strokeWidth: 3, isAnimationActive: false })
  )
)
```

### 6.3. Stacked Bar Chart (время по категориям)

```javascript
React.createElement(ComposedChart, { data: timeChartData, barCategoryGap: 0, margin: { left: 5, right: 10, top: 9, bottom: 0 } },
  React.createElement(XAxis, { type: "number", dataKey: "day", domain: [0, 90] }),
  React.createElement(YAxis, { tickFormatter: (v) => v < 60 ? `${v}m` : `${Math.floor(v/60)}h`, axisLine: false }),
  React.createElement(Bar, { dataKey: "grammarTime", stackId: "time", fill: "#F72585" }),
  React.createElement(Bar, { dataKey: "writingTime", stackId: "time", fill: "#4CC9F0" }),
  // ...остальные категории
  React.createElement(Line, { type: "monotone", dataKey: "movingAvgTime", stroke: "#002F7F", strokeWidth: 3, dot: false })
)
```

### 6.4. График настроения (точки + скользящее среднее)

Точки раскрашены по значению (1-5), линия — градиент от красного к синему.

```javascript
// Градиент
React.createElement('defs', null,
  React.createElement('linearGradient', { id: "moodGradient", x1: "0", y1: "0", x2: "0", y2: "1" },
    React.createElement('stop', { offset: "0%", stopColor: "#3b82f6" }),
    React.createElement('stop', { offset: "50%", stopColor: "#8b5cf6" }),
    React.createElement('stop', { offset: "100%", stopColor: "#ef4444" })
  )
),
// Точки
React.createElement(Line, { dataKey: "mood", stroke: "transparent", dot: MoodDot }),
// Скользящее среднее
React.createElement(Line, { dataKey: "movingAvg", stroke: "url(#moodGradient)", strokeWidth: 4, dot: false })
```

---

## 7. Источник данных: Google Sheets API

### 7.1. Настройка

- Google Sheets ID и API Key хранятся в `js/config.js`
- API Key создаётся в Google Cloud Console → APIs & Services → Credentials
- Google Sheets API нужно включить в Google Cloud Console
- Таблица должна быть публичной (Anyone with the link) ИЛИ доступ через API Key
- Диапазон данных: `SheetName!A2:O` (расширяемый)

### 7.2. Запрос данных

```javascript
// js/config.js
const CONFIG = {
  SHEET_ID: 'YOUR_SHEET_ID_HERE',
  API_KEY: 'YOUR_API_KEY_HERE',
  RANGE: 'Sheet1!A2:O',
  DEPLOYED_URL: 'https://bogachev11.github.io/NEW_REPO_NAME'
};
```

```javascript
// js/data.js
const fetchSheetData = async () => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.RANGE}?key=${CONFIG.API_KEY}&t=${Date.now()}`;
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
  });
  const data = await response.json();
  return data.values; // массив строк [["2025-09-22","1","0",...], ...]
};
```

### 7.3. Структура таблицы (старый проект — для справки)

| Колонка | Индекс | Содержимое |
|---|---|---|
| A | 0 | Дата (YYYY-MM-DD) |
| B | 1 | Номер дня (1, 2, 3...) |
| C | 2 | Завершённые уроки (через запятую: "1,2,3") |
| D | 3 | Попытки уроков |
| E-H | 4-7 | Старые категории времени (theory, homework, prolingvo, other) |
| I | 8 | Настроение (1-5) |
| J | 9 | Заметки |
| K-O | 10-14 | Новые категории (read, write, speak, listen, grammar) |

**Для нового проекта:** Создать новую таблицу с нужной структурой. Каждый модуль может читать данные из отдельного листа или диапазона.

---

## 8. GitHub Actions

### 8.1. Деплой на GitHub Pages (`deploy.yml`)

Триггер: push в main. Деплоит все статические файлы.

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
    - uses: actions/checkout@v4
    - uses: actions/configure-pages@v4
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: '.'
    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4
```

**Настройка в GitHub:**
1. Settings → Pages → Source: "GitHub Actions"
2. Если нужна инъекция API-токена при деплое, добавить step:
```yaml
    - name: Inject API token
      run: |
        sed -i "s/window.API_TOKEN = undefined/window.API_TOKEN = '${{ secrets.API_TOKEN }}'/g" index.html
```

### 8.2. Ежедневные скриншоты (`daily-screenshot.yml`)

Триггер: cron каждый день в 22:30 UTC. Использует Puppeteer.

```yaml
name: Daily Dashboard Screenshot
on:
  schedule:
    - cron: '30 22 * * *'
  workflow_dispatch:

jobs:
  screenshot:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - name: Cache Puppeteer
      uses: actions/cache@v3
      with:
        path: ~/.cache/puppeteer
        key: ${{ runner.os }}-puppeteer-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-puppeteer-
    - run: npm install puppeteer
    - run: node scripts/screenshot.js
    - run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add screenshots/
        git commit -m "Daily screenshot $(date '+%Y-%m-%d')" || exit 0
        git push origin main
```

**Скрипт скриншота (`scripts/screenshot.js`):**
- Открывает deployed URL через Puppeteer headless
- Ждёт загрузки графиков (`.recharts-cartesian-axis`)
- Находит контейнер `div.max-w-md.mx-auto.bg-white.min-h-screen.border.border-gray-300.px-1`
- Делает скриншот именно контейнера (не всей страницы)
- Сохраняет в `screenshots/dashboard_YYYY-MM-DD.png`
- deviceScaleFactor: 2 (для чёткости Retina)
- Viewport: 1200x800
- 3 попытки загрузки с таймаутами по 30 сек
- Дожидается данных в графиках + ещё 5 сек для анимации

Полный скрипт:
```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
      await page.goto(CONFIG_DEPLOYED_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      try {
        await page.waitForSelector('.recharts-cartesian-axis', { timeout: 15000 });
        await page.waitForFunction(() => {
          return document.querySelectorAll('.recharts-cartesian-axis-tick-value').length > 0;
        }, { timeout: 10000 });
        await page.waitForTimeout(5000);
      } catch (e) { /* графики не найдены, но продолжаем */ }
      loaded = true;
      break;
    } catch (error) {
      if (attempt < 3) await new Promise(r => setTimeout(r, 5000));
    }
  }
  if (!loaded) throw new Error('Failed to load page after 3 attempts');

  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const today = new Date().toISOString().split('T')[0];
  const screenshotPath = path.join(screenshotsDir, `dashboard_${today}.png`);

  const el = await page.$('div.max-w-md.mx-auto.bg-white.min-h-screen.border.border-gray-300.px-1');
  if (el) {
    await el.screenshot({ path: screenshotPath, type: 'png' });
  } else {
    await page.screenshot({ path: screenshotPath, fullPage: true, type: 'png' });
  }
  await browser.close();
  return screenshotPath;
}

if (require.main === module) takeScreenshot().catch(console.error);
module.exports = takeScreenshot;
```

### 8.3. Автообновление данных (`auto-update-log.yml`)

Триггер: каждые 30 минут. Проверяет Google Sheets на изменения, обновляет `update-log.json` только если данные изменились.

```yaml
name: Auto Update Log
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  update-log:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        token: ${{ secrets.API_TOKEN }}
    - name: Update log file
      run: |
        UPDATE_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
        
        SHEET_ID="YOUR_SHEET_ID"
        API_KEY="YOUR_API_KEY"
        RANGE="Sheet1!A2:O1000"
        
        RESPONSE=$(curl -s "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID/values/$RANGE?key=$API_KEY")
        CURRENT_DATA=$(echo "$RESPONSE" | jq -c '.values // []')
        
        if [ -f "update-log.json" ]; then
          OLD_DATA=$(jq -c '.data // []' update-log.json)
          if [ "$CURRENT_DATA" = "$OLD_DATA" ]; then
            echo "No changes - skipping"
            exit 0
          fi
        fi
        
        cat > update-log.json << EOF
        {
          "lastUpdateTime": "$UPDATE_TIME",
          "commitMessage": "Auto-updated at $(date)",
          "location": "GitHub repository",
          "data": $CURRENT_DATA
        }
        EOF
        
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add update-log.json
        git diff --staged --quiet || (git commit -m "Auto-update log: $UPDATE_TIME" && git push)
```

**Зачем `update-log.json`:**
На фронтенде загружаем данные оттуда вместо прямого вызова Google Sheets API (экономит квоту, работает быстрее, кешируется GitHub CDN). Фронтенд:
```javascript
// Пробуем загрузить из update-log.json (кеш GitHub Actions)
const logResponse = await fetch('update-log.json?t=' + Date.now());
const logData = await logResponse.json();
if (logData.data && logData.data.length > 0) {
  // Используем данные из update-log.json
  return processData(logData.data);
}
// Fallback: прямой запрос к Google Sheets API
return fetchFromGoogleSheets();
```

**Необходимые GitHub Secrets:**
- `API_TOKEN` — Personal Access Token (Settings → Developer settings → Personal access tokens → Fine-grained tokens) с правами на запись в репозиторий. Нужен для auto-update-log и для инъекции в deploy (если используется).

---

## 9. Локальная разработка

```bash
# Клонировать
git clone https://github.com/bogachev11/NEW_REPO_NAME.git
cd NEW_REPO_NAME

# Установить зависимости (для скриншотов)
npm install

# Запустить локальный сервер
python -m http.server 3000
# или
npx http-server -p 3000

# Открыть: http://localhost:3000
```

### package.json (минимальный)

```json
{
  "name": "personal-dashboard",
  "version": "1.0.0",
  "description": "Personal tracking dashboard",
  "main": "index.html",
  "scripts": {
    "start": "python -m http.server 3000",
    "dev": "python -m http.server 3000",
    "deploy": "gh-pages -d .",
    "screenshot": "node scripts/screenshot.js"
  },
  "author": "Aleksandr Bogachev",
  "license": "MIT",
  "devDependencies": {
    "gh-pages": "^6.1.1",
    "puppeteer": "^21.11.0"
  }
}
```

### .gitignore

```
node_modules/
.env
.env.local
.vscode/
.idea/
.DS_Store
Thumbs.db
*.log
tmp/
temp/
```

---

## 10. Скрипт для создания видео из скриншотов

Python-скрипт `create_video.py` (требует ffmpeg):

```python
import os, subprocess
from pathlib import Path

def create_video():
    screenshots = sorted(Path("screenshots").glob("dashboard_*.png"))
    if not screenshots:
        print("No screenshots found")
        return
    
    with open("image_list.txt", "w") as f:
        for img in screenshots:
            f.write(f"file '{img.absolute()}'\nduration 0.1667\n")
        f.write(f"file '{screenshots[-1].absolute()}'\n")
    
    subprocess.run([
        "ffmpeg", "-f", "concat", "-safe", "0", "-i", "image_list.txt",
        "-vf", "fps=6", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-y", "dashboard_timelapse.mp4"
    ], check=True)
    
    os.remove("image_list.txt")
    print("Video created: dashboard_timelapse.mp4")

if __name__ == "__main__":
    create_video()
```

---

## 11. Интерактивные функции (из старого проекта)

### 11.1. Подсветка при наведении на столбцы

При наведении мыши на bar chart — все столбцы, кроме текущего дня, становятся полупрозрачными:

```javascript
React.createElement(ComposedChart, {
  data: timeChartData,
  onMouseMove: (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setHoveredDay(data.activePayload[0].payload.day);
    }
  },
  onMouseLeave: () => setHoveredDay(null)
}, ...)
```

На каждом Bar:
```javascript
fillOpacity: (entry, index) => {
  const day = timeChartData[index]?.day;
  if (hoveredDay !== null) return hoveredDay === day ? 1 : 0.2;
  if (hoveredCategory !== null) return hoveredCategory === thisKey ? 1 : 0.3;
  return 1;
}
```

### 11.2. Подсветка при наведении на легенду

При наведении на категорию в легенде — все другие категории полупрозрачны:
```javascript
React.createElement('span', {
  onMouseEnter: () => setHoveredCategory('grammarTime'),
  onMouseLeave: () => setHoveredCategory(null),
  style: { cursor: 'pointer' }
}, ...)
```

### 11.3. Тултип (текст над столбцом)

Кастомный тултип — только текст, без фона/рамки:
```javascript
const DailyTimeTooltip = ({ active, payload, coordinate }) => {
  if (!active || !payload) return null;
  const totalTime = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return React.createElement('div', {
    style: {
      position: 'absolute',
      left: `${coordinate.x}px`,
      top: '-5px',
      transform: 'translateX(-50%)',
      fontSize: '12px',
      color: '#000000',
      pointerEvents: 'none',
      whiteSpace: 'nowrap'
    }
  }, formatTime(totalTime));
};
```

---

## 12. Полезные утилиты

### formatTime — минуты в человекочитаемый формат
```javascript
const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};
```

### Скользящее среднее
```javascript
const calculateMovingAverage = (data, key, windowSize = 7) => {
  return data.map((item, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = data.slice(start, index + 1);
    const validValues = window.map(d => d[key]).filter(v => v !== null && v !== undefined);
    return validValues.length > 0 
      ? validValues.reduce((a, b) => a + b, 0) / validValues.length 
      : null;
  });
};
```

### Цвет настроения
```javascript
const getMoodColor = (mood) => {
  if (mood >= 4) return '#3b82f6'; // blue
  if (mood >= 3) return '#8b5cf6'; // purple
  if (mood >= 2) return '#f59e0b'; // amber
  return '#ef4444'; // red
};
```

---

## 13. Чеклист для запуска нового проекта

1. [ ] Создать репозиторий на GitHub
2. [ ] Создать `index.html` с подключением библиотек
3. [ ] Скачать `recharts.js` в корень проекта
4. [ ] Создать `styles.css` со стилями для графиков
5. [ ] Создать структуру `js/` с компонентами
6. [ ] Создать Google Sheets таблицу с нужной структурой
7. [ ] Настроить `js/config.js` с ID таблицы и API ключом
8. [ ] Создать `.github/workflows/deploy.yml`
9. [ ] Создать `.github/workflows/daily-screenshot.yml`
10. [ ] Создать `.github/workflows/auto-update-log.yml`
11. [ ] Создать `scripts/screenshot.js` (обновить URL на новый)
12. [ ] Добавить GitHub Secret `API_TOKEN`
13. [ ] Настроить GitHub Pages (Settings → Pages → Source: GitHub Actions)
14. [ ] Первый push и проверка деплоя
15. [ ] Проверить работу скриншотов (запустить workflow вручную)
16. [ ] Проверить работу auto-update-log

---

## 14. Что НЕ переносить из старого проекта

- `env-check.js` — не нужен (всё в config.js)
- `daily_screenshot.py` — заменён на `scripts/screenshot.js`
- `daily_screenshot.ps1`, `setup_scheduler.bat`, `setup.sh` — не нужны
- `data-hash.json` — не нужен
- `DEPLOYMENT.md`, `GIT_SETUP.md`, `GITHUB_DEPLOY.md`, `DEVELOPMENT_NOTES.md` — заменены этим файлом
- `dashboard-template/` — не нужен
- Логика `ForecastDot` — перенести только если нужна прогнозная линия
- Все отладочные `console.log` — убрать

---

## 15. Важные уроки из старого проекта (ошибки, которых нужно избежать)

1. **Не удалять `dot` prop из `Line` в Recharts**, если он используется — это ломает отображение линии. Вместо удаления — вернуть `null` из компонента dot.
2. **`ComposedChart` обязателен**, если внутри одного графика и `Line`, и `Bar`. Для одного `Line` можно использовать `LineChart`.
3. **Recharts из CDN** требует prop-types. Подключать `prop-types.min.js` ПЕРЕД `recharts.js`.
4. **GitHub Actions конфликтуют** при одновременных push (скриншот + update-log). Всегда делать `git pull` перед `git push`, или настроить concurrency groups.
5. **CSS стили для Recharts** работают только через `!important`, потому что Recharts инлайнит свои стили на SVG-элементы.
6. **Скриншоты через Puppeteer** — обязательно ждать загрузку данных (`.recharts-cartesian-axis`), иначе скриншот будет пустой. Добавлять 5 сек задержку после загрузки для анимации.
7. **Один `app.js` на 1200 строк** = кошмар для отладки. В новом проекте разбивать на файлы с самого начала.
8. **Звёздочка/иконка на графике** — лучше делать через `dot` prop компонента `Line` как SVG `text` элемент, а не через абсолютное позиционирование в HTML.
