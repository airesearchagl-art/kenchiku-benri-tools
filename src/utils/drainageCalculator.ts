
import stationsData from '@/data/amedas_stations.json';

export interface Station {
    id: string;
    type: string;
    elems: string;
    lat: [number, number]; // [deg, min]
    lon: [number, number]; // [deg, min]
    kjName: string;
    knName: string;
    enName: string;
}

export interface RainfallRecord {
    rank: number;
    value: number;
    date: string;
}

// JASS 12 Table 1: Allowable Roof Area (m2) at Rainfall Intensity 180mm/h
// Condition 1: Vertical Drain + Vertical Pipe OR Horizontal Pipe (<=2m)
// Condition 2: Horizontal Drain + Horizontal Pipe (<=2m, 1/50)
// Condition 3: Vertical Drain + Horizontal Pipe (>2m, 1/100)
export const DRAINAGE_CAPACITY_TABLE = {
    condition1: {
        80: 110,
        100: 240,
        125: 430,
        150: 690,
        200: 1500,
    },
    condition2: {
        80: 70,
        100: 160,
        125: 280,
        150: 460,
        200: 1000,
    },
    condition3: {
        80: 50,
        100: 110,
        125: 200,
        150: 330,
        200: 700,
    },
} as const;

export type PipeSize = keyof typeof DRAINAGE_CAPACITY_TABLE.condition1;
export type DrainageCondition = keyof typeof DRAINAGE_CAPACITY_TABLE;

export const CONDITION_LABELS: Record<DrainageCondition, string> = {
    condition1: '縦型ドレイン ＋ 竪樋 または 横引き管(2m以下)',
    condition2: '横型ドレイン ＋ 横引き管(2m以下、勾配1/50)',
    condition3: '縦型ドレイン ＋ 横引き管(2m超、勾配1/100)',
};

/**
 * Calculates the allowable roof area for a given rainfall intensity.
 * Formula: A_adj = A_table * (180 / I)
 */
export function calculateAllowableArea(
    condition: DrainageCondition,
    pipeSize: PipeSize,
    rainfallIntensity: number
): number {
    const baseArea = DRAINAGE_CAPACITY_TABLE[condition][pipeSize];
    if (!baseArea || rainfallIntensity <= 0) return 0;
    return Math.floor(baseArea * (180 / rainfallIntensity));
}

/**
 * Converts [deg, min] array to decimal degrees.
 */
function toDecimalDegrees(coords: [number, number]): number {
    return coords[0] + coords[1] / 60;
}

/**
 * Calculates distance between two coordinates in km (Haversine formula).
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Finds the nearest AMeDAS station from a given latitude and longitude.
 * @param lat Latitude in decimal degrees
 * @param lon Longitude in decimal degrees
 */
export function findNearestStation(lat: number, lon: number): Station & { distance: number } | null {
    let nearestStation: Station | null = null;
    let minDistance = Infinity;

    const stations = stationsData as Record<string, Station>;

    for (const [id, station] of Object.entries(stations)) {
        // Basic filter: 'elems' having '1' tells capability.
        // We assume mostly all listed valid AMeDAS have basic sensors.
        // Soya Misaki is 11001. elems "11112010".

        const sLat = toDecimalDegrees(station.lat);
        const sLon = toDecimalDegrees(station.lon);

        const distance = getDistanceFromLatLonInKm(lat, lon, sLat, sLon);

        if (distance < minDistance) {
            minDistance = distance;
            nearestStation = { ...station, id };
        }
    }

    if (nearestStation) {
        return { ...nearestStation, distance: minDistance };
    }
    return null;
}
