// Fetch daily data from Google Sheets → group into weekly data
const fetchData = async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.RANGE}?key=${CONFIG.API_KEY}&t=${Date.now()}`;
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    const json = await res.json();
    if (!json.values) return [];

    // Group daily rows by week number
    const weeks = {};
    json.values.forEach(row => {
        if (!row[0]) return;
        const wk = weekOfYear(row[0]);
        if (!weeks[wk]) weeks[wk] = { podcasts: 0, movies: 0, tutor: 0, homework: 0, reading: 0, speaking: 0, moods: [] };
        const w = weeks[wk];
        w.podcasts += (parseFloat(row[1]) || 0);
        w.movies += (parseFloat(row[2]) || 0);
        w.tutor += (parseFloat(row[3]) || 0);
        w.homework += (parseFloat(row[4]) || 0);
        if (row[5] !== undefined && row[5] !== '') w.moods.push(parseFloat(row[5]));
        w.reading += (parseFloat(row[6]) || 0);
        w.speaking += (parseFloat(row[7]) || 0);
    });

    // Convert minutes → hours, return sorted array
    return Object.entries(weeks).map(([wk, d]) => ({
        week: +wk,
        podcasts: d.podcasts / 60,
        films: d.movies / 60,
        tutor: d.tutor / 60,
        homework: d.homework / 60,
        reading: d.reading / 60,
        speaking: d.speaking / 60,
        moods: d.moods
    })).sort((a, b) => a.week - b.week);
};
