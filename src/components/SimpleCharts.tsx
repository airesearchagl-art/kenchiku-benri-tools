import React from 'react';

// Common Types
interface ChartProps {
    data: number[]; // 8 values for N, NE, E, SE, S, SW, W, NW
    labels?: string[];
    color?: string;
    maxVal?: number;
    title?: string;
    showLabels?: boolean;
}

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const WindRose: React.FC<ChartProps> = ({ data, color = '#3b82f6', maxVal, title }) => {
    const size = 200;
    const center = size / 2;
    const radius = 80;
    const maxValue = maxVal || Math.max(...data, 1);

    return (
        <div className="flex flex-col items-center">
            {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Grid current circles */}
                {[0.25, 0.5, 0.75, 1].map((r, i) => (
                    <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="#e2e8f0" />
                ))}
                {/* Axes */}
                {DIRECTIONS.map((_, i) => {
                    const angle = (i * 45 - 90) * (Math.PI / 180);
                    return (
                        <line
                            key={i}
                            x1={center} y1={center}
                            x2={center + Math.cos(angle) * radius}
                            y2={center + Math.sin(angle) * radius}
                            stroke="#e2e8f0"
                        />
                    );
                })}
                {/* Data Bars (Wedge) */}
                {data.map((val, i) => {
                    const startAngle = (i * 45 - 90 - 15) * (Math.PI / 180); // -15 deg offset
                    const endAngle = (i * 45 - 90 + 15) * (Math.PI / 180);   // +15 deg offset
                    const barRadius = (val / maxValue) * radius;

                    // Arc path
                    const x1 = center + Math.cos(startAngle) * barRadius;
                    const y1 = center + Math.sin(startAngle) * barRadius;
                    const x2 = center + Math.cos(endAngle) * barRadius;
                    const y2 = center + Math.sin(endAngle) * barRadius;

                    return (
                        <path
                            key={i}
                            d={`M${center},${center} L${x1},${y1} A${barRadius},${barRadius} 0 0,1 ${x2},${y2} Z`}
                            fill={color}
                            opacity={0.7}
                            stroke="none"
                        >
                            <title>{DIRECTIONS[i]}: {val}</title>
                        </path>
                    );
                })}
                {/* Labels */}
                {DIRECTIONS.map((label, i) => {
                    const angle = (i * 45 - 90) * (Math.PI / 180);
                    const labelR = radius + 15;
                    const x = center + Math.cos(angle) * labelR;
                    const y = center + Math.sin(angle) * labelR;
                    return (
                        <text key={i} x={x} y={y} fontSize="10" textAnchor="middle" alignmentBaseline="middle" fill="#64748b">
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

export const RadarChart: React.FC<ChartProps> = ({ data, color = '#f97316', maxVal = 100 }) => {
    const size = 200;
    const center = size / 2;
    const radius = 80;

    // Generate Polygon Points
    const points = data.map((val, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180);
        const r = (Math.max(0, val) / maxVal) * radius;
        return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Grid (Octagons) */}
                {[0.25, 0.5, 0.75, 1].map((scale, idx) => {
                    const gridPoints = DIRECTIONS.map((_, i) => {
                        const angle = (i * 45 - 90) * (Math.PI / 180);
                        const r = radius * scale;
                        return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
                    }).join(' ');
                    return <polygon key={idx} points={gridPoints} fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />;
                })}
                {/* Axes */}
                {DIRECTIONS.map((label, i) => {
                    const angle = (i * 45 - 90) * (Math.PI / 180);
                    const x2 = center + Math.cos(angle) * radius;
                    const y2 = center + Math.sin(angle) * radius;
                    return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="#e2e8f0" />;
                })}
                {/* Data Polygon */}
                <polygon points={points} fill={color} fillOpacity={0.4} stroke={color} strokeWidth={2} />

                {/* Labels */}
                {DIRECTIONS.map((label, i) => {
                    const angle = (i * 45 - 90) * (Math.PI / 180);
                    const labelR = radius + 15;
                    const x = center + Math.cos(angle) * labelR;
                    const y = center + Math.sin(angle) * labelR;
                    return (
                        <text key={i} x={x} y={y} fontSize="10" textAnchor="middle" alignmentBaseline="middle" fill="#64748b">
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};
