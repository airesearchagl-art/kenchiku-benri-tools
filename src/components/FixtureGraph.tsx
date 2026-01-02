'use client';

import React, { useRef, useEffect } from 'react';
import { BuildingUsage, SANITARY_STANDARDS, FixtureType } from '@/utils/sanitaryStandards';

interface FixtureGraphProps {
    usage: BuildingUsage;
    fixtureType: FixtureType;
    population: number;
    small?: boolean;
}

export const FixtureGraph: React.FC<FixtureGraphProps> = ({ usage, fixtureType, population, small = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvas Setup (Dynamic size for small)
        const width = canvas.width;
        const height = canvas.height;
        const padding = small ? 10 : 30;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        const standards = SANITARY_STANDARDS[usage][fixtureType];

        // Scale ranges
        const maxPop = Math.max(population * 1.5, 500); // Dynamic X range

        // Calculate max Y (fixtures) for the max population at Level 1 (highest curve)
        const yMax1 = Math.ceil(maxPop / standards[1].factor);
        // Add some headroom
        const maxFixtures = Math.ceil(yMax1 * 1.2);

        // Helper to map coordinates
        const mapX = (pop: number) => padding + (pop / maxPop) * graphWidth;
        const mapY = (fixtures: number) => height - padding - (fixtures / maxFixtures) * graphHeight;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background and Grid
        ctx.fillStyle = '#f8fafc'; // slate-50
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#e2e8f0'; // slate-200
        ctx.lineWidth = 1;
        ctx.beginPath();

        // X Axis Grid
        if (!small) {
            for (let p = 0; p <= maxPop; p += Math.round(maxPop / 5 / 10) * 10) {
                const x = mapX(p);
                ctx.moveTo(x, height - padding);
                ctx.lineTo(x, padding);
                ctx.fillStyle = '#94a3b8'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
                ctx.fillText(p.toString(), x, height - padding + 12);
            }
        }
        // Y Axis Grid
        if (!small) {
            for (let f = 0; f <= maxFixtures; f += Math.max(1, Math.round(maxFixtures / 5))) {
                const y = mapY(f);
                ctx.moveTo(padding, y);
                ctx.lineTo(width - padding, y);
                ctx.fillStyle = '#94a3b8'; ctx.font = '9px Arial'; ctx.textAlign = 'right';
                ctx.fillText(f.toString(), padding - 4, y + 3);
            }
        }
        ctx.stroke();

        // Draw Step Functions
        const drawStep = (level: 1 | 2 | 3, color: string, dash: number[]) => {
            const factor = standards[level].factor;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = small ? 1 : 2;
            ctx.setLineDash(dash);

            let currentFixtures = 1; // Minimum
            let currentPopX = mapX(0);

            ctx.moveTo(currentPopX, mapY(0)); // Start at 0,0

            // Step through capacities
            for (let f = 1; f <= maxFixtures; f++) {
                const y = mapY(f);
                const endX = mapX(f * factor);

                // Draw horizontal part
                ctx.lineTo(endX, y);

                // Draw vertical part (step up) if not last
                const nextY = mapY(f + 1);
                if (f < maxFixtures) {
                    ctx.lineTo(endX, nextY);
                }
            }
            ctx.stroke();
        };

        // Draw Levels
        drawStep(1, '#64748b', []); // Solid - Level 1 (Good)
        drawStep(2, '#94a3b8', [5, 5]); // Dashed - Level 2 (Standard)
        drawStep(3, '#cbd5e1', [2, 2]); // Dotted - Level 3 (Min)

        // Draw Current Population Line
        if (population > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#ef4444'; // Red-500
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            const curX = mapX(population);
            ctx.moveTo(curX, height - padding);
            ctx.lineTo(curX, padding);
            ctx.stroke();

            if (!small) {
                ctx.fillStyle = '#ef4444';
                ctx.textAlign = 'center';
                ctx.fillText(`${population}人`, curX, padding - 5);
            }
        }

        // Legend (Hidden in small mode)
        if (!small) {
            const legendY = 15;
            const legendX = width - 100;
            ctx.font = '10px Arial'; ctx.textAlign = 'left';

            ctx.fillStyle = '#64748b'; ctx.fillRect(legendX, legendY, 10, 2); ctx.fillText('Level 1', legendX + 15, legendY + 4);

            ctx.fillStyle = '#94a3b8';
            ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.moveTo(legendX, legendY + 12); ctx.lineTo(legendX + 10, legendY + 12); ctx.stroke();
            ctx.fillText('Level 2', legendX + 15, legendY + 16);

            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.setLineDash([2, 2]); ctx.moveTo(legendX, legendY + 24); ctx.lineTo(legendX + 10, legendY + 24); ctx.stroke();
            ctx.fillText('Level 3', legendX + 15, legendY + 28);
        }

    }, [usage, fixtureType, population, small]);

    return (
        <div className="w-full border rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} width={small ? 150 : 350} height={small ? 60 : 200} className="w-full h-auto" />
        </div>
    );
};
