const PROJECT_START = new Date(2026, 1, 9); // Feb 9, 2026

const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + 1) / 7);
};

const getCurrentDay = () => Math.max(1, Math.ceil((new Date() - PROJECT_START) / 86400000) + 1);

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

// Week numbers where each month starts (2026)
const MONTHS = [
    [1,'Jan'], [5,'Feb'], [9,'Mar'], [13,'Apr'], [18,'May'], [22,'Jun'],
    [26,'Jul'], [31,'Aug'], [35,'Sep'], [40,'Oct'], [44,'Nov'], [48,'Dec']
];
const MONTH_TICKS = MONTHS.map(m => m[0]);
const fmtMonth = (week) => (MONTHS.find(m => m[0] === week) || [])[1] || '';
