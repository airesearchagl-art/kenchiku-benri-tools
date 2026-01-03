'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapPickerProps {
    lat: number;
    lon: number;
    onLocationSelect: (lat: number, lon: number) => void;
}

function LocationMarker({ position, onDragEnd }: { position: { lat: number, lng: number }, onDragEnd: (e: any) => void }) {
    const markerRef = useRef<any>(null);

    const map = useMapEvents({
        click(e: any) {
            map.flyTo(e.latlng, map.getZoom());
            // Optionally move marker on click too, but drag is safer
        },
    });

    // Keep map centered on position change from outside
    useEffect(() => {
        map.flyTo(position, map.getZoom());
    }, [position, map]);

    return position === null ? null : (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: onDragEnd,
            }}
            ref={markerRef}
        />
    );
}

export default function MapPicker({ lat, lon, onLocationSelect }: MapPickerProps) {
    const [position, setPosition] = useState({ lat, lng: lon });

    // Sync prop changes to state
    useEffect(() => {
        setPosition({ lat, lng: lon });
    }, [lat, lon]);

    const handleDragEnd = (e: any) => {
        const marker = e.target;
        if (marker != null) {
            const newPos = marker.getLatLng();
            setPosition(newPos);
            onLocationSelect(newPos.lat, newPos.lng);
        }
    };

    return (
        <div className="w-full h-full relative z-0">
            <MapContainer
                center={[lat, lon]}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} onDragEnd={handleDragEnd} />
            </MapContainer>
            <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 p-2 rounded text-xs shadow-md">
                ピンをドラッグして位置を調整できます
            </div>
        </div>
    );
}
