"use client";

import React from 'react';

interface MapboxViewerProps {
    targetLocation?: { lat: number; lng: number } | null;
}

export default function MapboxViewer({ targetLocation }: MapboxViewerProps) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-gray-500">
            <p>Mapboxビューワーは現在メンテナンス中です。</p>
            <p className="text-sm">(Cesiumモードをご利用ください)</p>
        </div>
    );
}
