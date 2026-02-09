const e = React.createElement;
const { ResponsiveContainer, ComposedChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } = Recharts;

// --- Mock data (will be replaced with Google Sheets) ---
const generateMockData = () => {
    const n = getCurrentWeek();
    return Array.from({ length: n }, (_, i) => ({
        week: i + 1,
        podcasts: +(Math.random() * 3).toFixed(1),
        films: +(Math.random() * 2.5).toFixed(1),
        tutor: +(Math.random() * 2 + 0.5).toFixed(1),
        homework: +(Math.random() * 2).toFixed(1),
        mood: Math.ceil(Math.random() * 5)
    }));
};

// --- Small reusable pieces ---
const KPI = (value, label) => e('div', { className: 'bg-gray-50 p-2 rounded-lg' },
    e('div', { className: 'text-xl font-bold text-gray-800 font-num' }, value),
    e('div', { className: 'text-xs text-gray-500' }, label)
);

const MoodDot = ({ cx, cy, payload }) => {
    if (!payload || payload.mood == null) return null;
    return e('circle', { cx, cy, r: 3, fill: getMoodColor(payload.mood), fillOpacity: 0.3 });
};

const Legend = (items) => e('div', { className: 'flex gap-3' },
    items.map(([color, label]) => e('div', { className: 'flex items-center gap-1', key: label },
        e('div', { className: 'w-2.5 h-2.5 rounded-sm', style: { background: color } }),
        e('span', { className: 'text-xs text-gray-500' }, label)
    ))
);

// --- App ---
const App = () => {
    const data = React.useMemo(generateMockData, []);
    const cw = getCurrentWeek();

    const total = data.reduce((s, d) => s + d.podcasts + d.films + d.tutor + d.homework, 0);
    const avg = cw > 0 ? (total / (cw * 7)).toFixed(1) : 0;

    // Mood data with SMA (±2 weeks window)
    const moodData = data.map((d, i) => {
        const win = data.slice(Math.max(0, i - 2), i + 3).map(w => w.mood).filter(v => v != null);
        return { week: d.week, mood: d.mood, movingAvg: win.length ? win.reduce((a, b) => a + b, 0) / win.length : null };
    });

    const xProps = { type: 'number', dataKey: 'week', domain: [1, 52], ticks: MONTH_TICKS, tickFormatter: fmtMonth };
    const mg = { left: 5, right: 10, top: 5, bottom: 0 };

    return e('div', { className: 'max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1' },

        // Header
        e('div', { className: 'p-4 pb-2' },
            e('h1', { className: 'text-3xl font-bold' }, 'French 2026'),
            e('p', { className: 'text-base opacity-70' }, 'Year Tracker')
        ),

        // KPI cards
        e('div', { className: 'grid grid-cols-4 gap-2 px-4 pb-3' },
            // Week card with progress bar
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
            KPI(`${avg}h`, 'Avg/Day'),
            KPI('\u2014', 'TBD')
        ),

        // Chart 1: Podcasts & Films
        e('div', { className: 'px-2 pb-1' },
            e('div', { className: 'flex items-baseline justify-between px-2' },
                e('span', { className: 'text-sm font-medium text-gray-700' }, 'Podcasts & Films'),
                Legend([['#5189E9', 'Podcasts'], ['#F72585', 'Films']])
            ),
            e('div', { style: { height: 130 } },
                e(ResponsiveContainer, { width: '100%', height: '100%' },
                    e(ComposedChart, { data, margin: mg },
                        e(CartesianGrid, { vertical: false }),
                        e(XAxis, xProps),
                        e(YAxis, { axisLine: false, fontSize: 12, tickFormatter: v => `${v}h` }),
                        e(ReferenceLine, { y: 4, stroke: '#e91e63', strokeDasharray: '6 3', strokeWidth: 1.5 }),
                        e(Bar, { dataKey: 'podcasts', stackId: 'a', fill: '#5189E9', barSize: 6 }),
                        e(Bar, { dataKey: 'films', stackId: 'a', fill: '#F72585', barSize: 6 })
                    )
                )
            )
        ),

        // Chart 2: Tutor & Homework
        e('div', { className: 'px-2 pb-1' },
            e('div', { className: 'flex items-baseline justify-between px-2' },
                e('span', { className: 'text-sm font-medium text-gray-700' }, 'Tutor & Homework'),
                Legend([['#4A2CF5', 'Tutor'], ['#4CC9F0', 'Homework']])
            ),
            e('div', { style: { height: 130 } },
                e(ResponsiveContainer, { width: '100%', height: '100%' },
                    e(ComposedChart, { data, margin: mg },
                        e(CartesianGrid, { vertical: false }),
                        e(XAxis, xProps),
                        e(YAxis, { axisLine: false, fontSize: 12, tickFormatter: v => `${v}h` }),
                        e(Bar, { dataKey: 'tutor', stackId: 'a', fill: '#4A2CF5', barSize: 6 }),
                        e(Bar, { dataKey: 'homework', stackId: 'a', fill: '#4CC9F0', barSize: 6 })
                    )
                )
            )
        ),

        // Chart 3: How I feel about my french
        e('div', { className: 'px-2 pb-4' },
            e('div', { className: 'text-sm font-medium text-gray-700 px-2' }, 'How I feel about my french'),
            e('div', { className: 'text-xs text-gray-500 px-2 mb-1' }, '1 \u2013 total disaster, 5 \u2013 absolutely brilliant'),
            e('div', { style: { height: 92 } },
                e(ResponsiveContainer, { width: '100%', height: '100%' },
                    e(LineChart, { data: moodData, margin: { left: 5, right: 10, top: 9, bottom: 5 } },
                        e('defs', null,
                            e('linearGradient', { id: 'moodGradient', x1: '0', y1: '0', x2: '0', y2: '1' },
                                e('stop', { offset: '0%', stopColor: '#3b82f6' }),
                                e('stop', { offset: '50%', stopColor: '#8b5cf6' }),
                                e('stop', { offset: '100%', stopColor: '#ef4444' })
                            )
                        ),
                        e(CartesianGrid, { vertical: false }),
                        e(XAxis, xProps),
                        e(YAxis, { domain: [1, 5], ticks: [1, 2, 3, 4, 5], axisLine: false, fontSize: 12 }),
                        e(Line, { type: 'monotone', dataKey: 'movingAvg', stroke: 'url(#moodGradient)', strokeWidth: 4, dot: false, connectNulls: false }),
                        e(Line, { type: 'monotone', dataKey: 'mood', stroke: 'transparent', strokeWidth: 0, dot: MoodDot, connectNulls: false, isAnimationActive: false })
                    )
                )
            )
        )
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
