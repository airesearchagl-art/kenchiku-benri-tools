"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface ShadowControlsProps {
    time: Date;
    onTimeChange: (newTime: Date) => void;
}

export default function ShadowControls({ time, onTimeChange }: ShadowControlsProps) {
    // Helper to format time HH:mm
    const formatTime = (d: Date) => {
        return `${d.getHours().toString().padStart(2, "0")}:${d
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const minutes = parseInt(e.target.value);
        const newDate = new Date(time);
        newDate.setHours(Math.floor(minutes / 60));
        newDate.setMinutes(minutes % 60);
        onTimeChange(newDate);
    };

    const setWinterSolstice = () => {
        const newDate = new Date(time);
        newDate.setMonth(11); // December (0-indexed)
        newDate.setDate(22);
        // Keep current time or reset to noon? Let's keep time.
        onTimeChange(newDate);
    };

    const setSummerSolstice = () => {
        const newDate = new Date(time);
        newDate.setMonth(5); // June
        newDate.setDate(21);
        onTimeChange(newDate);
    }

    // Calculate current minutes from 0:00 for slider
    const currentMinutes = time.getHours() * 60 + time.getMinutes();

    return (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg w-80 z-20">
            <h3 className="font-bold mb-2 text-sm">日影シミュレーション設定</h3>

            <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                    日付: {time.toLocaleDateString()}
                </label>
                <div className="flex gap-2 mb-2">
                    <Button size="sm" variant="outline" onClick={setWinterSolstice} className="text-xs">
                        冬至 (12/22)
                    </Button>
                    <Button size="sm" variant="outline" onClick={setSummerSolstice} className="text-xs">
                        夏至 (6/21)
                    </Button>
                </div>
                {/* Simple date input if needed, but presets might be enough for MVP */}
                <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm w-full"
                    value={time.toISOString().split('T')[0]}
                    onChange={(e) => {
                        if (!e.target.value) return;
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        const newDate = new Date(time);
                        newDate.setFullYear(y);
                        newDate.setMonth(m - 1);
                        newDate.setDate(d);
                        onTimeChange(newDate);
                    }}
                />
            </div>

            <div className="mb-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                    時間: {formatTime(time)}
                </label>
                <input
                    type="range"
                    min="0"
                    max="1439" // 24 * 60 - 1
                    value={currentMinutes}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span>12:00</span>
                    <span>24:00</span>
                </div>
            </div>

            <div className="text-xs text-slate-500 mt-2">
                ※スライダーを動かすと影が変化します
            </div>
        </div>
    );
}
