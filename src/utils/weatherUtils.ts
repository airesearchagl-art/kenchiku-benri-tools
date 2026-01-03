
export interface WeatherData {
    summerWind: WindStats;
    winterWind: WindStats;
    radarData: RadarStats;
}

export interface WindStats {
    totalCount: number;
    directions: number[]; // 0-7 (N, NE, E, SE, S, SW, W, NW) count
    dominantDir: string;
}

export interface RadarStats {
    [key: string]: number; // N, NE, ... score 0-100
}

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export async function fetchPassiveDesignData(lat: number, lon: number): Promise<WeatherData> {
    // 1. Fetch 1 year of historical data (last complete year)
    const end = new Date();
    end.setFullYear(end.getFullYear() - 1);
    const endDate = end.toISOString().split('T')[0];
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    const startDate = start.toISOString().split('T')[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,windspeed_10m,winddirection_10m,direct_normal_irradiance&timezone=Asia%2FTokyo`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather data');
    const data = await res.json();

    const hourly = data.hourly;
    const times = hourly.time;
    const winds = hourly.windspeed_10m;
    const dirs = hourly.winddirection_10m;
    // const temps = hourly.temperature_2m;
    // const suns = hourly.direct_normal_irradiance;

    // 2. Aggregate Seasonal Wind
    const summerWind = initWindStats();
    const winterWind = initWindStats();

    times.forEach((t: string, i: number) => {
        const date = new Date(t);
        const month = date.getMonth() + 1; // 1-12
        const spd = winds[i];
        const dir = dirs[i];

        if (spd < 1.0) return; // Calm, ignore (or count separately)

        // Bin direction (0-360) to 0-7
        const dirIdx = Math.round(dir / 45) % 8;

        if (month >= 6 && month <= 9) { // Summer (Jun-Sep)
            summerWind.directions[dirIdx]++;
            summerWind.totalCount++;
        } else if (month === 12 || month <= 2) { // Winter (Dec-Feb)
            winterWind.directions[dirIdx]++;
            winterWind.totalCount++;
        }
    });

    finalizeWindStats(summerWind);
    finalizeWindStats(winterWind);

    // 3. Calculate Radar Scores (Simplified Logic for MVP)
    // Suitability for Large Openings
    // + Winter Sun (S, SE, SW)
    // - Summer Sun (W, SW, NW) -> Penalty (Need shading)
    // + Summer Wind (Matching dominant summer wind)
    // - Winter Wind (Matching dominant winter wind) -> Penalty (Cold draft)

    const radar: RadarStats = {};
    DIRECTIONS.forEach((d, i) => {
        let score = 50; // Base score

        // Winter Sun (Heat Gain) - High for S, SE, SW
        if (['S', 'SE', 'SW'].includes(d)) score += 30;
        if (d === 'E') score += 10;

        // Summer Sun (Overheating Risk) - Penalty for W, NW, SW
        if (['W', 'NW', 'SW'].includes(d)) score -= 20;

        // Summer Wind (Cooling)
        // If this direction matches dominant summer wind, good for ventilation
        const summerFreq = summerWind.directions[i] / summerWind.totalCount;
        if (summerFreq > 0.15) score += 20; // High frequency
        else if (summerFreq > 0.1) score += 10;

        // Winter Wind (Cold Draft)
        // If matches dominant winter wind, bad for openings
        const winterFreq = winterWind.directions[i] / winterWind.totalCount;
        if (winterFreq > 0.15) score -= 20;
        else if (winterFreq > 0.1) score -= 10;

        // Clamp
        radar[d] = Math.max(0, Math.min(100, score));
    });

    return {
        summerWind,
        winterWind,
        radarData: radar
    };
}

function initWindStats(): WindStats {
    return { totalCount: 0, directions: new Array(8).fill(0), dominantDir: '-' };
}

function finalizeWindStats(stats: WindStats) {
    if (stats.totalCount === 0) return;
    let maxIdx = 0;
    stats.directions.forEach((c, i) => {
        if (c > stats.directions[maxIdx]) maxIdx = i;
    });
    stats.dominantDir = DIRECTIONS[maxIdx];
}
