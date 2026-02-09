# Спецификация: индикатор "последнее обновление" (Update Indicator)

Функция, которая показывала в правом верхнем углу дашборда, когда данные были обновлены в последний раз.

---

## 1. Как это выглядело

```
┌──────────────────────────────────────────────┐
│ French A2→B1                    ● upd 17m ago│
│ days • 40 lessons • Day 87                   │
│                                              │
```

- Мигающая синяя точка (●) + текст "upd Xm ago"
- Расположение: правый верхний угол заголовка, на одной линии с "French A2→B1"
- Точка пульсировала (анимация `animate-pulse` Tailwind)

### Варианты текста

| Прошло времени | Текст |
|---|---|
| < 1 часа | `upd 17m ago` |
| 1–23 часа (тот же день) | `upd 3h ago` |
| Вчера | `upd yesterday` |
| 2+ дня | `upd 2+ days ago` |
| Сегодня (0 минут) | `upd today` |

---

## 2. Визуальные параметры

### 2.1. Контейнер

```javascript
React.createElement('div', { 
  className: "absolute top-5 right-4 flex items-center gap-1" 
})
```

- Позиционирование: `absolute`, `top: 20px` (`top-5`), `right: 16px` (`right-4`)
- Flex-контейнер, элементы по центру вертикали
- Gap между точкой и текстом: `4px` (`gap-1`)

### 2.2. Мигающая точка

```javascript
React.createElement('div', { 
  className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
})
```

- Форма: круг (`rounded-full`)
- Размер: **8x8px** (`w-2 h-2`)
- Цвет: `#3b82f6` (blue-500)
- Анимация: `animate-pulse` (Tailwind) — плавное мигание opacity от 1 до 0, бесконечно

### 2.3. Текст

```javascript
React.createElement('span', { 
  className: "text-sm text-black opacity-70" 
}, `upd ${getUpdateTimeText(lastUpdateTime)}`)
```

- Шрифт: Inter, **14px** (`text-sm`)
- Цвет: чёрный с прозрачностью 70% (`text-black opacity-70`)
- Формат: `upd ` + результат `getUpdateTimeText()`

---

## 3. Логика определения времени

### 3.1. Функция `getUpdateTimeText`

```javascript
const getUpdateTimeText = (updateTime) => {
  const now = new Date();
  const diffMs = now - updateTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;    // "17m ago"
  } else if (diffHours < 24 && diffDays === 0) {
    return `${diffHours}h ago`;      // "3h ago"
  } else if (diffDays === 1) {
    return 'yesterday';              // "yesterday"
  } else if (diffDays >= 2) {
    return '2+ days ago';            // "2+ days ago"
  }
  
  return 'today';                    // fallback
};
```

### 3.2. State

```javascript
const [lastUpdateTime, setLastUpdateTime] = React.useState(
  new Date(Date.now() - 24 * 60 * 60 * 1000) // По умолчанию: вчера
);
```

- Начальное значение: вчера (чтобы не показывать "0m ago" до загрузки)
- Обновляется при загрузке `update-log.json`

---

## 4. Источник данных: update-log.json

### 4.1. Загрузка времени обновления

```javascript
React.useEffect(() => {
  const loadUpdateTime = async () => {
    try {
      const response = await fetch('./update-log.json');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.lastUpdateTime) {
          setLastUpdateTime(new Date(data.lastUpdateTime));
        }
      }
    } catch (error) {
      // При ошибке оставляем значение по умолчанию (вчера)
      setLastUpdateTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
    }
  };
  
  loadUpdateTime();
}, []); // Загружается один раз при монтировании
```

### 4.2. Формат update-log.json

```json
{
  "lastUpdateTime": "2025-12-18T17:37:11.351Z",
  "commitMessage": "Auto-updated at Thu Dec 18 17:37:11 UTC 2025",
  "location": "GitHub repository",
  "data": [...]
}
```

- `lastUpdateTime` — ISO 8601 строка (UTC)
- Файл обновляется GitHub Action `auto-update-log.yml` каждые 30 минут
- Action проверяет Google Sheets на изменения; если данные те же — не коммитит

### 4.3. GitHub Action (auto-update-log.yml)

```yaml
name: Auto Update Log
on:
  schedule:
    - cron: '*/30 * * * *'  # каждые 30 минут
  workflow_dispatch:         # + ручной запуск

jobs:
  update-log:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        token: ${{ secrets.API_TOKEN }}
    - name: Update log file
      run: |
        SHEET_ID="YOUR_SHEET_ID"
        API_KEY="YOUR_API_KEY"
        RANGE="Sheet1!A2:O1000"
        
        # Получить данные из Google Sheets
        RESPONSE=$(curl -s "https://sheets.googleapis.com/v4/spreadsheets/$SHEET_ID/values/$RANGE?key=$API_KEY")
        CURRENT_DATA=$(echo "$RESPONSE" | jq -c '.values // []')
        
        # Сравнить с текущими
        if [ -f "update-log.json" ]; then
          OLD_DATA=$(jq -c '.data // []' update-log.json)
          if [ "$CURRENT_DATA" = "$OLD_DATA" ]; then
            echo "No changes - skipping"
            exit 0
          fi
        fi
        
        # Обновить файл (только если данные изменились)
        UPDATE_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
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

**Необходимые GitHub Secrets:**
- `API_TOKEN` — Personal Access Token с правами на запись в репозиторий

---

## 5. Полная цепочка работы

```
Google Sheets (данные) 
  ↓ [каждые 30 мин, GitHub Action]
  ↓ curl → сравнение → если изменились → commit + push
  ↓
update-log.json (в репозитории)
  ↓ [деплой на GitHub Pages]
  ↓
Фронтенд: fetch('./update-log.json')
  ↓
setLastUpdateTime(new Date(data.lastUpdateTime))
  ↓
getUpdateTimeText(lastUpdateTime) → "17m ago"
  ↓
● upd 17m ago   [в правом верхнем углу]
```

---

## 6. Текущее состояние (в закрытом проекте)

Индикатор обновления **закомментирован** и заменён на статичную надпись "finished":

```javascript
// Закомментирована мигающая точка:
// React.createElement('div', { className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse" }),

// Закомментировано отображение времени обновления:
// React.createElement('span', { className: "text-sm text-black opacity-70" }, `upd ${getUpdateTimeText(lastUpdateTime)}`)

// Вместо них:
React.createElement('span', { 
  className: "text-sm text-blue-500", 
  style: { 
    border: '1px solid #3b82f6', 
    borderRadius: '4px', 
    padding: '2px 8px'
  } 
}, "finished")
```

Для нового проекта: раскомментировать точку и текст, убрать "finished".

---

## 7. Что нужно для работы в новом проекте

1. **Файл `update-log.json`** в корне репозитория (создаётся автоматически GitHub Action)
2. **GitHub Action `auto-update-log.yml`** (см. раздел 4.3)
3. **GitHub Secret `API_TOKEN`** — Personal Access Token
4. **State `lastUpdateTime`** в компоненте
5. **useEffect** для загрузки `update-log.json` при монтировании
6. **Функция `getUpdateTimeText`** для форматирования
7. **JSX**: контейнер `absolute top-5 right-4` + точка `animate-pulse` + текст
