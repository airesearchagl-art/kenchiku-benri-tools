"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Dynamically import CesiumViewer to disable SSR, as Cesium depends on window/document
const CesiumViewer = dynamic(
    () => import("@/components/plateau/CesiumViewer"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading 3D Engine...</p>
                </div>
            </div>
        ),
    }
);

import ShadowControls from "@/components/plateau/ShadowControls";
import MapboxViewer from "@/components/plateau/MapboxViewer";

export default function PlateauShadowPage() {
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [viewMode, setViewMode] = useState<"cesium" | "mapbox">("cesium");
    const [address, setAddress] = useState("");
    const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number; height?: number } | null>(null);
    const [simulationTime, setSimulationTime] = useState<Date>(new Date());

    const handleSearch = async () => {
        if (!address) return;

        // Dynamically import geocode utility to ensure client-side execution if needed,
        // though it's already a clean utility.
        const { geocodeAddress } = await import("@/utils/googleMaps");
        const result = await geocodeAddress(address);

        if (result) {
            setTargetLocation({ ...result, height: 1000 });
            setIsMapLoaded(true); // Auto load map if searched
        } else {
            alert("住所が見つかりませんでした。");
        }
    };

    return (
        <div className="w-full h-screen flex flex-col pt-16">
            {/* Header / Controls Area */}
            <div className="p-4 bg-white border-b shadow-sm z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">3D都市モデル × 日影シミュレーター</h1>
                    <div className="flex items-center gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-md">
                            <button
                                onClick={() => setViewMode("cesium")}
                                className={`px-3 py-1 text-sm rounded-sm transition-colors ${viewMode === "cesium" ? "bg-white shadow text-black" : "text-gray-500"
                                    }`}
                            >
                                Cesium (Plateau)
                            </button>
                            <button
                                onClick={() => setViewMode("mapbox")}
                                className={`px-3 py-1 text-sm rounded-sm transition-colors ${viewMode === "mapbox" ? "bg-white shadow text-black" : "text-gray-500"
                                    }`}
                            >
                                Mapbox (軽量)
                            </button>
                        </div>

                        {!isMapLoaded && viewMode === "cesium" && (
                            <Button onClick={() => setIsMapLoaded(true)}>
                                3D地図を読み込む (Cesium)
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2 max-w-lg">
                    <div className="flex-1">
                        {/* Manually using input for now if Input component has issues, or use Input if verified */}
                        <input
                            type="text"
                            placeholder="住所を入力 (例: 東京都千代田区丸の内1-1)"
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch}>検索</Button>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-slate-200 overflow-hidden">
                {viewMode === "cesium" ? (
                    isMapLoaded ? (
                        <>
                            <CesiumViewer targetLocation={targetLocation} simulationTime={simulationTime} />
                            <ShadowControls time={simulationTime} onTimeChange={setSimulationTime} />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-slate-100">
                            <div className="text-center">
                                <p className="mb-2">住所を検索するか、ボタンを押して地図を表示してください。</p>
                                <p className="text-xs text-slate-400">※3Dデータの読み込みにはAPI利用枠または通信量がかかります</p>
                            </div>
                        </div>
                    )
                ) : (
                    <MapboxViewer targetLocation={targetLocation} />
                )}
            </div>
        </div>
    );
}
