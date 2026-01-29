"use client";

import React, { ComponentProps } from "react";
import { Viewer, CesiumComponentRef, Cesium3DTileset } from "resium";
import { Ion, Viewer as CesiumViewerType, Cartesian3, Color, JulianDate } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Check if env var is set, otherwise Cesium will use default token (limited) or error if required.
if (process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN) {
    Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN;
}

type CesiumViewerProps = ComponentProps<typeof Viewer> & {
    targetLocation?: { lat: number; lng: number; height?: number } | null;
    tilesetUrl?: string; // URL for Plateau 3D Tiles
    simulationTime?: Date;
};

// Default Plateau URL (Tokyo 23-ku LOD1) - Fallback
// Note: This is a specific dataset (Chiyoda-ku example used as placeholder if no global one found yet)
// We will try to replace this with a wider coverage one or make it dynamic.
const DEFAULT_TILESET_URL = "https://assets.cms.plateau.reearth.io/assets/0e/e5948a-e95c-4e31-be85-1f8c066ed996/13101_chiyoda-ku_pref_2023_citygml_1_op_bldg_3dtiles_13101_chiyoda-ku_lod1/tileset.json";

export default function CesiumViewer({ targetLocation, tilesetUrl, simulationTime, ...props }: CesiumViewerProps) {
    const viewerRef = React.useRef<CesiumComponentRef<CesiumViewerType>>(null);

    React.useEffect(() => {
        if (targetLocation && viewerRef.current?.cesiumElement) {
            const viewer = viewerRef.current.cesiumElement;
            viewer.camera.flyTo({
                destination: Cartesian3.fromDegrees(
                    targetLocation.lng,
                    targetLocation.lat,
                    targetLocation.height ?? 500 // Default height 500m
                ),
                duration: 2, // 2 seconds flight
            });
        }
    }, [targetLocation]);

    React.useEffect(() => {
        if (simulationTime && viewerRef.current?.cesiumElement) {
            const viewer = viewerRef.current.cesiumElement;
            // Convert JS Date to Cesium JulianDate.
            // Note: JulianDate.fromDate requires a standard Date object.
            const julianDate = JulianDate.fromDate(simulationTime);

            // Update clock
            viewer.clock.currentTime = julianDate;
            viewer.clock.shouldAnimate = false; // Keep it static at the set time
        }
    }, [simulationTime]);

    return (
        <Viewer
            full
            ref={viewerRef}
            shadows
            timeline={false} // We will add custom controls
            animation={false}
            // Terrain can be added here if needed
            {...props}
            className={`relative w-full h-full ${props.className || ""}`}
        >
            <Cesium3DTileset url={tilesetUrl || DEFAULT_TILESET_URL} />
        </Viewer>
    );
}
