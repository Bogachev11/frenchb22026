// Fetch daily data from Google Sheets → return weekly + daily
const fetchData = async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.RANGE}?key=${CONFIG.API_KEY}&t=${Date.now()}`;
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    const json = await res.json();
    if (!json.values) return { weekly: [], daily: [] };

    const weeks = {};
    const daily = [];
    json.values.forEach(row => {
        if (!row[0]) return;
        const wk = weekOfYear(row[0]);
        const date = new Date(row[0]);
        const dow = (date.getDay() + 6) % 7; // 0=Mon, 6=Sun
        const p = (parseFloat(row[1]) || 0), f = (parseFloat(row[2]) || 0),
              t = (parseFloat(row[3]) || 0), h = (parseFloat(row[4]) || 0),
              r = (parseFloat(row[6]) || 0), s = (parseFloat(row[7]) || 0);
        daily.push({ week: wk + dow / 7, wk, podcasts: p/60, films: f/60, tutor: t/60, homework: h/60, reading: r/60, speaking: s/60 });

        if (!weeks[wk]) weeks[wk] = { podcasts: 0, movies: 0, tutor: 0, homework: 0, reading: 0, speaking: 0, moods: [] };
        const w = weeks[wk];
        w.podcasts += p; w.movies += f; w.tutor += t; w.homework += h; w.reading += r; w.speaking += s;
        if (row[5] !== undefined && row[5] !== '') w.moods.push(parseFloat(row[5]));
    });

    const weekly = Object.entries(weeks).map(([wk, d]) => ({
        week: +wk,
        podcasts: d.podcasts / 60, films: d.movies / 60,
        tutor: d.tutor / 60, homework: d.homework / 60,
        reading: d.reading / 60, speaking: d.speaking / 60,
        moods: d.moods
    })).sort((a, b) => a.week - b.week);

    return { weekly, daily: daily.sort((a, b) => a.week - b.week) };
};
