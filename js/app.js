const e = React.createElement;
const { ResponsiveContainer, ComposedChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } = Recharts;

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
    const [data, setData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [lastUpdateTime, setLastUpdateTime] = React.useState(new Date(Date.now() - 86400000));
    const [updText, setUpdText] = React.useState('');
    const cw = getCurrentWeek();

    React.useEffect(() => {
        fetchData().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
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

    const total = data.reduce((s, d) => s + d.podcasts + d.films + d.tutor + d.homework, 0);
    const avgH = cw > 0 ? total / (cw * 7) : 0;
    const streaks = data.filter(d => (d.podcasts + d.films) >= 4).length;

    // Mood data: daily dots + weekly average line
    const moodData = data.map(d => {
        const entry = { week: d.week, weekAvg: d.moods.length ? d.moods.reduce((a, b) => a + b, 0) / d.moods.length : null };
        d.moods.forEach((m, j) => { entry[`m${j}`] = m; });
        return entry;
    });

    const xProps = { type: 'number', dataKey: 'week', domain: [1, 52], ticks: MONTH_TICKS, tickFormatter: fmtMonth };
    const mg = { left: 5, right: 10, top: 5, bottom: 0 };

    return e('div', { className: 'max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1' },

        // Header
        e('div', { className: 'p-4 pb-2 relative' },
            e('h1', { className: 'text-3xl font-bold' }, 'French B2 in 1 year'),
            e('p', { className: 'text-base opacity-70' }, `At least 4 hours of listening per week \u2022 Day ${getCurrentDay()}`),
            // Update indicator (backend TBD)
            e('div', { className: 'absolute top-5 right-4 flex items-center gap-1' },
                e('div', { className: 'w-2 h-2 bg-blue-500 rounded-full animate-pulse' }),
                e('span', { className: 'text-sm text-black opacity-70' }, `upd ${updText}`)
            )
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
            KPI(fmtH(avgH), 'Avg/Day'),
            KPI(`${streaks}`, '4h Streaks')
        ),

        // Chart 1: Podcasts & Films
        e('div', { className: 'px-2 pb-1' },
            e('div', { className: 'text-sm font-medium text-gray-700 px-2' },
                e('span', { style: { color: '#5189E9' } }, 'Podcasts'),
                ' & ',
                e('span', { style: { color: '#F72585' } }, 'Films')
            ),
            e('div', { style: { height: 130 } },
                e(ResponsiveContainer, { width: '100%', height: '100%' },
                    e(ComposedChart, { data, margin: mg },
                        e(CartesianGrid, { vertical: false }),
                        e(XAxis, xProps),
                        e(YAxis, { domain: [0, 6], ticks: [0, 2, 4, 6], axisLine: false, fontSize: 12, tickFormatter: fmtH }),
                        e(ReferenceLine, { y: 4, stroke: '#e91e63', strokeDasharray: '6 3', strokeWidth: 1.5 }),
                        e(Bar, { dataKey: 'podcasts', stackId: 'a', fill: '#5189E9', barSize: 6 }),
                        e(Bar, { dataKey: 'films', stackId: 'a', fill: '#F72585', barSize: 6 })
                    )
                )
            )
        ),

        // Chart 2: Tutor & Homework
        e('div', { className: 'px-2 pb-1' },
            e('div', { className: 'text-sm font-medium text-gray-700 px-2' },
                e('span', { style: { color: '#4A2CF5' } }, 'Tutor'),
                ' & ',
                e('span', { style: { color: '#4CC9F0' } }, 'Homework')
            ),
            e('div', { style: { height: 130 } },
                e(ResponsiveContainer, { width: '100%', height: '100%' },
                    e(ComposedChart, { data, margin: mg },
                        e(CartesianGrid, { vertical: false }),
                        e(XAxis, xProps),
                        e(YAxis, { domain: [0, 4], ticks: [0, 1, 2, 3, 4], axisLine: false, fontSize: 12, tickFormatter: fmtH }),
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
                        e(Line, { type: 'monotone', dataKey: 'weekAvg', stroke: 'url(#moodGradient)', strokeWidth: 4, dot: false, connectNulls: false }),
                        [0,1,2,3,4,5,6].map(j => e(Line, { key: j, dataKey: `m${j}`, stroke: 'transparent', strokeWidth: 0, dot: MoodDot, isAnimationActive: false }))
                    )
                )
            )
        ),

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
