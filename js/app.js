const e = React.createElement;
const { ResponsiveContainer, ComposedChart, LineChart, Bar, Cell, Customized, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } = Recharts;

// --- Small reusable pieces ---
const KPI = (value, label) => e('div', { className: 'bg-gray-50 p-2 rounded-lg' },
    e('div', { className: 'text-xl font-bold text-gray-800 font-num' }, value),
    e('div', { className: 'text-xs text-gray-500' }, label)
);

const MoodDot = ({ cx, cy, value, index }) => {
    if (value == null) return null;
    return e('circle', { key: index, cx, cy, r: 3, fill: getMoodColor(value), fillOpacity: 0.15 });
};

// --- App ---
const getUpdateTimeText = (updateTime) => {
    const now = new Date();
    const diffMs = now - updateTime;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'just now';
    if (diffHrs < 1) return `${diffMin}m ago`;
    if (diffDays === 0) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'yesterday';
    return '2+ days ago';
};

const App = () => {
    const [raw, setRaw] = React.useState({ weekly: [], daily: [] });
    const [loading, setLoading] = React.useState(true);
    const [mode, setMode] = React.useState('W');
    const [lastUpdateTime, setLastUpdateTime] = React.useState(new Date(Date.now() - 86400000));
    const [updText, setUpdText] = React.useState('');
    const cw = getCurrentWeek();
    const scrollRefs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];
    const syncingRef = React.useRef(false);
    const syncScroll = (source) => {
        if (syncingRef.current || !source) return;
        const left = source.scrollLeft;
        syncingRef.current = true;
        scrollRefs.forEach(r => { if (r.current && r.current !== source) r.current.scrollLeft = left; });
        setTimeout(() => { syncingRef.current = false; }, 0);
    };

    React.useEffect(() => {
        fetchData().then(d => { setRaw(d); setLoading(false); }).catch(() => setLoading(false));
        // Load update-log.json for last update time
        fetch('./update-log.json').then(r => r.ok ? r.json() : null).then(d => {
            if (d && d.lastUpdateTime) setLastUpdateTime(new Date(d.lastUpdateTime));
        }).catch(() => {});
    }, []);

    // Refresh "ago" text every 30s
    React.useEffect(() => {
        const tick = () => setUpdText(getUpdateTimeText(lastUpdateTime));
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, [lastUpdateTime]);

    if (loading) return e('div', { className: 'max-w-md mx-auto bg-white min-h-screen flex items-center justify-center text-gray-400' }, 'Loading...');

    const data = Array.isArray(raw.weekly) ? raw.weekly : [];
    const daily = Array.isArray(raw.daily) ? raw.daily : [];
    const barData = mode === 'W' ? data : daily;
    const desktop = window.innerWidth >= 768;
    const bSize = mode === 'D' ? (desktop ? 10 : 6) : (desktop ? 16 : 6);

    const total = data.reduce((s, d) => s + d.podcasts + d.films + d.tutor + d.homework + d.reading + d.speaking + (d.words || 0), 0);
    const avgH = cw > 0 ? total / (cw * 7) : 0;
    const streaks = data.filter(d => (d.podcasts + d.films) >= 4).length;

    // Mood data: daily dots + 7-day rolling average
    const moodData = [], moodBuf = [];
    daily.forEach(d => {
        const entry = { week: d.week };
        if (d.mood != null) {
            entry.mood = d.mood;
            moodBuf.push(d.mood);
            entry.avg = moodBuf.slice(-7).reduce((a, b) => a + b, 0) / Math.min(moodBuf.length, 7);
        }
        moodData.push(entry);
    });

    const chartData = barData.length > 0 ? barData : [{ week: 1, podcasts: 0, films: 0, tutor: 0, homework: 0, reading: 0, speaking: 0, words: 0 }];
    const moodChartData = moodData.length > 0 ? moodData : [{ week: 1, mood: null, avg: null }];
    const xProps = { type: 'number', dataKey: 'week', domain: [1, 52], ticks: MONTH_TICKS, tickFormatter: fmtMonth };
    const mg = { left: 2, right: 10, top: 5, bottom: 0 };
    const yAxisW = 28;
    const pph = 20, yPad = 30; // pixels per hour + fixed overhead (margins + X-axis labels)
    const ceilMax = (vals, min) => Math.max(min, Math.ceil(Math.max(...vals, 0)));
    const maxPF = ceilMax(barData.map(d => d.podcasts + d.films), 5);
    const maxTH = ceilMax(barData.map(d => d.tutor + d.homework), 1);
    const maxRS = ceilMax(barData.map(d => (d.reading || 0) + (d.speaking || 0) + (d.words || 0)), 1);
    // Высоты контейнеров графиков одинаковы в W и D (по недельной шкале)
    const maxPFH = ceilMax(data.map(d => d.podcasts + d.films), 5), maxTHH = ceilMax(data.map(d => d.tutor + d.homework), 1), maxRSH = ceilMax(data.map(d => (d.reading || 0) + (d.speaking || 0) + (d.words || 0)), 1);
    const mkTicks = n => { const s = n > 4 ? 2 : 1, t = []; for (let i = 0; i <= n; i += s) t.push(i); return t; };
    const mkY = n => ({ width: yAxisW, domain: [0, n], ticks: mkTicks(n), axisLine: false, fontSize: 12, tickFormatter: fmtH });
    const cells = chartData.map((d, i) => e(Cell, { key: i, fillOpacity: (d.wk ?? d.week) === cw ? 1 : 0.5 }));
    const PFNotesLayer = (props) => {
        if (mode !== 'W' || typeof ANNOTATIONS === 'undefined' || !ANNOTATIONS.PF) return null;
        const xa = props.xAxisMap && Object.values(props.xAxisMap)[0];
        const ya = props.yAxisMap && Object.values(props.yAxisMap)[0];
        if (!xa || !ya || !xa.scale || !ya.scale) return null;
        const lineHeight = 14;
        return e('g', null,
            Object.entries(ANNOTATIONS.PF).map(([wk, val]) => {
                const ww = +wk;
                const row = data.find(d => d.week === ww);
                if (!row) return null;
                const item = typeof val === 'string' ? { text: val, anchor: 'top' } : val;
                const txt = (item.text || '').replace(/<br\s*\/?>/gi, '\n');
                const lines = txt.split('\n');
                const yVal = item.anchor === 'podcasts' ? row.podcasts : (row.podcasts + row.films);
                const y = ya.scale(yVal) + 2;
                const x = xa.scale(ww) + (desktop ? 10 : 6);
                return e('text', {
                    key: `pfn-${wk}`,
                    x,
                    y,
                    fill: '#111',
                    stroke: '#fff',
                    strokeWidth: 3,
                    paintOrder: 'stroke fill',
                    fontSize: 12,
                    dominantBaseline: 'hanging',
                    textAnchor: 'start'
                }, lines.map((line, i) => e('tspan', { key: i, x, dy: i === 0 ? 0 : lineHeight }, line)));
            })
        );
    };

    const pfTitle = e('div', { className: 'text-sm font-medium font-bold text-gray-700' }, e('span', { style: { color: '#5189E9' } }, 'Podcasts'), ' & ', e('span', { style: { color: '#F72585' } }, 'Films'));
    const modeToggle = e('div', { className: 'flex text-xs rounded overflow-hidden border border-gray-300' },
        e('button', { className: `px-1.5 py-0.5 ${mode === 'W' ? 'bg-gray-800 text-white' : 'text-gray-400'}`, onClick: () => setMode('W') }, 'W'),
        e('button', { className: `px-1.5 py-0.5 ${mode === 'D' ? 'bg-gray-800 text-white' : 'text-gray-400'}`, onClick: () => setMode('D') }, 'D')
    );
    // D: высоты по daily max → один и тот же pph на всех трёх. W: по недельным.
    const h1 = mode === 'D' ? (maxPF * pph + yPad) : (maxPFH * pph + yPad) * 0.9;
    const h2 = mode === 'D' ? (maxTH * pph + yPad) : (maxTHH * pph + yPad) * 0.9;
    const h3 = mode === 'D' ? (maxRS * pph + yPad) : (maxRSH * pph + yPad) * 0.9;
    const h4 = 85;
    const charts = [
        e(ResponsiveContainer, { width: '100%', height: '100%' },
            e(ComposedChart, { data: chartData, margin: mg },
                e(CartesianGrid, { vertical: false }),
                e(XAxis, xProps),
                e(YAxis, { ...mkY(maxPF), axisLine: false }),
                ...(mode === 'W' ? [e(ReferenceLine, { y: 4, stroke: '#e91e63', strokeDasharray: '2 2', strokeWidth: 1.5 })] : []),
                e(Bar, { dataKey: 'podcasts', stackId: 'a', fill: '#5189E9', barSize: bSize }, cells),
                e(Bar, { dataKey: 'films', stackId: 'a', fill: '#F72585', barSize: bSize }, cells),
                e(Customized, { component: PFNotesLayer })
            )
        ),
        e(ResponsiveContainer, { width: '100%', height: '100%' },
            e(ComposedChart, { data: chartData, margin: mg },
                e(CartesianGrid, { vertical: false }),
                e(XAxis, xProps),
                e(YAxis, { ...mkY(maxTH), axisLine: false }),
                e(Bar, { dataKey: 'tutor', stackId: 'a', fill: '#4A2CF5', barSize: bSize }, cells),
                e(Bar, { dataKey: 'homework', stackId: 'a', fill: '#4CC9F0', barSize: bSize }, cells)
            )
        ),
        e(ResponsiveContainer, { width: '100%', height: '100%' },
            e(ComposedChart, { data: chartData, margin: mg },
                e(CartesianGrid, { vertical: false }),
                e(XAxis, xProps),
                e(YAxis, { ...mkY(maxRS), axisLine: false }),
                e(Bar, { dataKey: 'reading', stackId: 'a', fill: '#9378FF', barSize: bSize }, cells),
                e(Bar, { dataKey: 'speaking', stackId: 'a', fill: '#4caf50', barSize: bSize }, cells),
                e(Bar, { dataKey: 'words', stackId: 'a', fill: '#FF9800', barSize: bSize }, cells)
            )
        ),
        e(ResponsiveContainer, { width: '100%', height: '100%' },
            e(LineChart, { data: moodChartData, margin: mg },
                e('defs', null,
                    e('linearGradient', { id: 'moodGradient', x1: '0', y1: '0', x2: '0', y2: '1' },
                        e('stop', { offset: '0%', stopColor: '#3b82f6' }),
                        e('stop', { offset: '50%', stopColor: '#8b5cf6' }),
                        e('stop', { offset: '100%', stopColor: '#ef4444' })
                    )
                ),
                e(CartesianGrid, { vertical: false }),
                e(XAxis, xProps),
                e(YAxis, { width: yAxisW, domain: [1, 5], ticks: [1, 3, 5], axisLine: false, fontSize: 12 }),
                e(Line, { dataKey: 'mood', stroke: 'transparent', strokeWidth: 0, dot: MoodDot, isAnimationActive: false }),
                e(Line, { type: 'monotone', dataKey: 'avg', stroke: 'url(#moodGradient)', strokeWidth: 4, dot: false, connectNulls: true })
            )
        ),
    ];
    const blockGap = { style: { marginTop: -1 } };
    const blocks = [
        e('div', null,
            e('div', { className: 'flex justify-between items-center px-2 pb-0.5' }, pfTitle, modeToggle),
            e('div', { style: { height: h1 } }, charts[0])
        ),
        e('div', blockGap,
            e('div', { className: 'text-sm font-medium font-bold text-gray-700 px-2 pb-0.5' },
                e('span', { style: { color: '#4A2CF5' } }, 'Tutor'), ' & ', e('span', { style: { color: '#4CC9F0' } }, 'Homework'),
            ),
            e('div', { style: { height: h2 } }, charts[1])
        ),
        e('div', blockGap,
            e('div', { className: 'text-sm font-medium font-bold text-gray-700 px-2 pb-0.5' },
                e('span', { style: { color: '#9378FF' } }, 'Reading'), ', ', e('span', { style: { color: '#4caf50' } }, 'Speaking'), ' & ', e('span', { style: { color: '#FF9800' } }, 'Learning words'),
            ),
            e('div', { style: { height: h3 } }, charts[2])
        ),
        e('div', blockGap,
            e('div', { className: 'text-sm font-medium font-bold text-gray-700 px-2 pb-0.5' }, 'How I feel about my french'),
            e('div', { className: 'text-xs text-gray-500 px-2 pb-0.5' }, '1 \u2013 total disaster, 5 \u2013 absolutely brilliant'),
            e('div', { style: { height: h4 } }, charts[3])
        ),
    ];
    // W: блоки как есть. D: те же 4 блока (заголовок над своим графиком), у каждого графика своя область скролла, скроллы синхронны
    const scrollOpt = { className: 'overflow-x-auto overflow-y-hidden', style: { WebkitOverflowScrolling: 'touch' } };
    const scrollOptHideBar = { ...scrollOpt, className: scrollOpt.className + ' scrollbar-hide' };
    const chartsContent = mode === 'D'
        ? e('div', { className: 'flex flex-col', style: { gap: 0 } },
            e('div', null,
                e('div', { className: 'flex justify-between items-center px-2 pb-0.5' }, pfTitle, modeToggle),
                e('div', { ...scrollOpt, ref: scrollRefs[0], onScroll: () => syncScroll(scrollRefs[0].current) },
                    e('div', { style: { height: h1, minWidth: '400%' } }, charts[0])
                )
            ),
            e('div', blockGap,
                e('div', { className: 'text-sm font-medium font-bold text-gray-700 px-2 pb-0.5' },
                    e('span', { style: { color: '#4A2CF5' } }, 'Tutor'), ' & ', e('span', { style: { color: '#4CC9F0' } }, 'Homework'),
                ),
                e('div', { ...scrollOptHideBar, ref: scrollRefs[1], onScroll: () => syncScroll(scrollRefs[1].current) },
                    e('div', { style: { height: h2, minWidth: '400%' } }, charts[1])
                )
            ),
            e('div', blockGap,
                e('div', { className: 'text-sm font-medium font-bold text-gray-700 px-2 pb-0.5' },
                    e('span', { style: { color: '#9378FF' } }, 'Reading'), ', ', e('span', { style: { color: '#4caf50' } }, 'Speaking'), ' & ', e('span', { style: { color: '#FF9800' } }, 'Learning words'),
                ),
                e('div', { ...scrollOptHideBar, ref: scrollRefs[2], onScroll: () => syncScroll(scrollRefs[2].current) },
                    e('div', { style: { height: h3, minWidth: '400%' } }, charts[2])
                )
            ),
            e('div', blockGap,
                e('div', { className: 'text-sm font-medium font-bold text-gray-700 px-2 pb-0.5' }, 'How I feel about my french'),
                e('div', { className: 'text-xs text-gray-500 px-2 pb-0.5' }, '1 \u2013 total disaster, 5 \u2013 absolutely brilliant'),
                e('div', { ...scrollOptHideBar, ref: scrollRefs[3], onScroll: () => syncScroll(scrollRefs[3].current) },
                    e('div', { style: { height: h4, minWidth: '400%' } }, charts[3])
                )
            )
        )
        : e('div', { className: 'flex flex-col', style: { gap: 0 } }, ...blocks);

    return e('div', { className: 'max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1' },

        // Header
        e('div', { className: 'p-4 pb-2 relative' },
            e('h1', { className: 'text-3xl font-bold' }, 'French B2 in 1 year'),
            e('p', { className: 'text-base opacity-70' }, `At least 4 hours of listening per week \u2022 Day ${getCurrentDay()}`),
            e('div', { className: 'absolute top-5 right-4 flex items-center gap-1' },
                e('div', { className: 'w-2 h-2 bg-blue-500 rounded-full animate-pulse' }),
                e('span', { className: 'text-sm text-black opacity-70' }, `upd ${updText}`)
            )
        ),

        // KPI cards
        e('div', { className: 'grid grid-cols-4 gap-2 px-4 pb-3 max-w-lg' },
            e('div', { className: 'bg-gray-50 p-2 rounded-lg flex items-center gap-2' },
                e('div', null,
                    e('div', { className: 'text-xl font-bold text-gray-800 font-num' }, `${cw}/52`),
                    e('div', { className: 'text-xs text-gray-500' }, 'Week')
                ),
                e('div', { className: 'w-2 h-10 bg-gray-200 rounded-full overflow-hidden flex flex-col-reverse ml-auto' },
                    e('div', { className: 'bg-gray-800 rounded-full', style: { height: `${(cw/52)*100}%` } })
                )
            ),
            KPI(`${Math.round(total)}h`, 'Total Hours'),
            KPI(fmtH(avgH), 'Avg/Day'),
            KPI(`${streaks}`, '4h Streaks')
        ),

        chartsContent,

        // Footer
        e('div', { className: 'px-4 py-3 text-left border-t border-gray-200' },
            e('div', { className: 'text-xs text-gray-500' },
                'Started at 12 Jan, 2026 \u2022 Aleksandr Bogachev \u2022 \uD835\uDD4F ',
                e('a', { href: 'https://x.com/bogachev_al', target: '_blank', rel: 'noopener noreferrer', className: 'text-gray-500 hover:text-gray-700 underline' }, 'bogachev_al')
            )
        )
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
