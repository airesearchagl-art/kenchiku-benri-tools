
export type Point = { x: number; y: number };

export type ShapeType = 'rect' | 'polygon';

export interface Shape {
    id: string;
    type: ShapeType;
    name: string;
    // For rect
    width?: number;
    height?: number;
    // For polygon
    points?: Point[];
    // Common
    subtraction: boolean; // True if this area should be subtracted (void)
}

export interface FloorData {
    id: string;
    name: string;
    shapes: Shape[];
}

/**
 * Calculates the area of a rectangle.
 */
export function calculateRectArea(width: number, height: number): number {
    return width * height;
}

/**
 * Calculates the area of a polygon using the Shoelace Formula.
 */
export function calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

/**
 * Calculates the total area of a single shape.
 * Returns negative value if subtraction is true.
 */
export function calculateShapeArea(shape: Shape): number {
    let area = 0;
    if (shape.type === 'rect') {
        area = calculateRectArea(shape.width || 0, shape.height || 0);
    } else if (shape.type === 'polygon') {
        area = calculatePolygonArea(shape.points || []);
    }
    return shape.subtraction ? -area : area;
}

/**
 * Calculates the total area of a floor.
 */
export function calculateFloorArea(floor: FloorData): number {
    return floor.shapes.reduce((total, shape) => total + calculateShapeArea(shape), 0);
}

/**
 * Parses a string of coordinates "x1,y1 x2,y2 ..." into a Point array.
 */
export function parsePoints(input: string): Point[] {
    return input.trim().split(/\s+/).map(pair => {
        const [x, y] = pair.split(',').map(Number);
        return { x: x || 0, y: y || 0 };
    });
}

/**
 * Formats a Point array into an SVG points string "x1,y1 x2,y2 ...".
 */
export function formatPoints(points: Point[]): string {
    return points.map(p => `${p.x},${p.y}`).join(' ');
}
