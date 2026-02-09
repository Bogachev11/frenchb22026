const PROJECT_START = new Date(2026, 1, 9); // Feb 9, 2026

// ISO week number (Monday = start of week)
const weekOfYear = (date) => {
    const d = new Date(typeof date === 'string' ? date + 'T12:00:00' : +date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); // nearest Thursday
    const jan4 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7);
};

const getCurrentWeek = () => weekOfYear(new Date());

const getCurrentDay = () => {
    const now = new Date();
    const jan1 = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now - jan1) / 86400000);
};

const fmtH = (h) => {
    if (!h) return '0';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h${mins}m`;
};

const getMoodColor = (v) => {
    if (v <= 2) return '#ef4444';
    if (v <= 3) return '#8b5cf6';
    if (v <= 4) return '#3b82f6';
    return '#1d4ed8';
};

// ISO week of 1st of each month (2026)
const MONTHS = [
    [1,'Jan'], [5,'Feb'], [9,'Mar'], [14,'Apr'], [18,'May'], [23,'Jun'],
    [27,'Jul'], [31,'Aug'], [36,'Sep'], [40,'Oct'], [44,'Nov'], [49,'Dec']
];
const MONTH_TICKS = MONTHS.map(m => m[0]);
const fmtMonth = (week) => (MONTHS.find(m => m[0] === week) || [])[1] || '';
