
/**
 * Utility functions for Geographic calculations.
 */

export interface Point {
    x: number; // Longitude
    y: number; // Latitude
}

/**
 * Converts Lat/Lon to Tile coordinates (XYZ) for Web Mercator.
 */
export function latLonToTile(lat: number, lon: number, zoom: number): { x: number, y: number } {
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor(
        (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
    );
    return { x, y };
}

/**
 * Checks if a point (lon, lat) is inside a polygon (array of [lon, lat]).
 * Uses Ray Casting algorithm.
 */
export function isPointInPolygon(point: Point, polygon: number[][]): boolean {
    const x = point.x;
    const y = point.y;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Checks if point is in MultiPolygon.
 */
export function isPointInMultiPolygon(point: Point, multiPolygon: number[][][][]): boolean {
    // MultiPolygon is array of Polygons.
    // Each Polygon is array of Rings. Ring[0] is outer, Ring[1..] are holes.
    // For simplicity, we just check if it's in the outer ring of any polygon.
    // Handling holes properly requires verifying it's NOT in inner rings.

    for (const polygon of multiPolygon) {
        // Check outer ring (index 0)
        if (isPointInPolygon(point, polygon[0])) {
            // If inside outer ring, check holes (index 1+)
            let inHole = false;
            for (let k = 1; k < polygon.length; k++) {
                if (isPointInPolygon(point, polygon[k])) {
                    inHole = true;
                    break;
                }
            }
            if (!inHole) return true;
        }
    }
    return false;
}
