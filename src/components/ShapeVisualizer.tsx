'use client';

import React, { useMemo } from 'react';
import { Shape, formatPoints } from '@/utils/areaCalculator';

interface ShapeVisualizerProps {
    shapes: Shape[];
    width?: number; // Canvas width in px
    height?: number; // Canvas height in px
    className?: string;
}

export default function ShapeVisualizer({ shapes, width = 600, height = 400, className = '' }: ShapeVisualizerProps) {

    // Calculate bounding box to determine viewBox
    const viewBox = useMemo(() => {
        if (shapes.length === 0) return `0 0 100 100`;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        shapes.forEach(shape => {
            if (shape.type === 'rect') {
                // Assume rect starts at 0,0 for now? Or should we support positioning?
                // For simplicity in this tool version, we might assume shapes are just accumulating areas 
                // BUT for visualization, relative positioning matters.
                // If the tool doesn't support positioning (only dimensions), visualization is just a "gallery" of shapes.
                // HOWEVER, the "Polygon" input accepts coordinates. So those are absolute.
                // Let's assume Rects are also positioned?
                // Wait, my current input for 'rect' only asks Width/Height. It defaults position to (0,0) implied?
                // If I want to allow layout, I need X/Y for Rects too.
                // For now, let's lay them out in a grid or just scatter them?
                // Actually, if it's "Legal Floor Area", usually you trace a plan.
                // Polygon is coordinate based. Rect is likely just a specialized polygon.
                // If user enters Rect 10x10, where is it? 
                // Let's assume for this version, Rects are rendered at (0,0) or we need to add X/Y inputs.
                // Let's stick to what we have:
                // If Rect, we convert to points (0,0)-(W,0)-(W,H)-(0,H) effectively.
                // But this makes them all overlap at origin. This is bad for visualization.
                // FIX: Let's treat Rect as a shape starting at (0,0) BUT maybe we should auto-arrange?
                // OR better, update the UI to allow Offset X/Y for Rects.
                // OR just render them transparently overlapping to show size comparison?
                // Let's assume they are all relevant to a generic origin (0,0).

                const w = shape.width || 0;
                const h = shape.height || 0;
                // We'll treat rects as being at (0,0) to (w,h) for bounds purposes if no other info.
                minX = Math.min(minX, 0);
                minY = Math.min(minY, 0);
                maxX = Math.max(maxX, w);
                maxY = Math.max(maxY, h);

            } else if (shape.type === 'polygon' && shape.points) {
                shape.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
            }
        });

        // Add padding
        const padding = 1.0; // 1m padding
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const w = maxX - minX;
        const h = maxY - minY;

        // Ensure aspect ratio safety
        if (w <= 0 || h <= 0) return `0 0 100 100`;

        return `${minX} ${minY} ${w} ${h}`;
    }, [shapes]);

    return (
        <svg
            viewBox={viewBox}
            className={`bg-slate-50 border rounded w-full h-full ${className}`}
            style={{ maxHeight: height }} // limit height
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Grid or Axis could be nice */}
            <defs>
                <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
                    <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e2e8f0" strokeWidth="0.05" />
                </pattern>
            </defs>
            <rect x="-1000" y="-1000" width="2000" height="2000" fill="url(#grid)" />

            {/* Shapes */}
            {shapes.map((shape, index) => {
                const fill = shape.subtraction ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
                const stroke = shape.subtraction ? '#ef4444' : '#3b82f6';

                if (shape.type === 'rect') {
                    // Render rect at 0,0. 
                    // To make this useful without coordinates, we might wanted to allow drag/drop later.
                    // For now, it is what it is.
                    return (
                        <rect
                            key={shape.id}
                            x={0}
                            y={0}
                            width={shape.width}
                            height={shape.height}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={0.1}
                        />
                    );
                } else {
                    return (
                        <polygon
                            key={shape.id}
                            points={formatPoints(shape.points || [])}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={0.1}
                        />
                    );
                }
            })}

            {/* Origin Marker */}
            <path d="M -0.5 0 L 0.5 0 M 0 -0.5 L 0 0.5" stroke="#94a3b8" strokeWidth="0.1" />

        </svg>
    );
}
