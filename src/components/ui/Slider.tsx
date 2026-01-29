import React from 'react';

interface SliderProps {
    value: number[];
    onValueChange: (val: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className = '' }: SliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange([Number(e.target.value)]);
    };

    return (
        <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
            <input
                type="range"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                min={min}
                max={max}
                step={step}
                value={value[0]}
                onChange={handleChange}
            />
        </div>
    );
}
