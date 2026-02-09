const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + 1) / 7);
};

const formatHours = (h) => {
    if (!h) return '0h';
    return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
};

// Week numbers where each month starts (2026)
const MONTHS = [
    [1,'Jan'], [5,'Feb'], [9,'Mar'], [13,'Apr'], [18,'May'], [22,'Jun'],
    [26,'Jul'], [31,'Aug'], [35,'Sep'], [40,'Oct'], [44,'Nov'], [48,'Dec']
];
const MONTH_TICKS = MONTHS.map(m => m[0]);
const fmtMonth = (week) => (MONTHS.find(m => m[0] === week) || [])[1] || '';
