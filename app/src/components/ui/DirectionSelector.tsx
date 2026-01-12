import React from 'react';
import { cn } from '@/lib/utils';

interface DirectionSelectorProps {
    value?: number[]; // indices 0-5
    onChange: (value: number[]) => void;
    className?: string;
}

export function DirectionSelector({ value = [0, 1, 2, 3, 4, 5], onChange, className }: DirectionSelectorProps) {
    // 6 Directions (0 starting at East/Right, going clockwise? Or North?)
    // Hex grid usually: 0=E, 1=SE, 2=SW, 3=W, 4=NW, 5=NE (Pointy top)
    // Or Flat top: 0=SE, 1=S, 2=SW, 3=NW, 4=N, 5=NE

    // Let's assume standard "Pointy Top" hex orientation for visuals if that's what we use being vertical.
    // Actually, look at the grid. Pointy top is standard for N/S alignment.
    // Neighbors usually: 0 (Right/East), 1 (Bottom Right), 2 (Bottom Left), 3 (Left), 4 (Top Left), 5 (Top Right)

    // We'll create 6 segments.
    // Center is 50,50. Radius 45.

    const toggleDirection = (index: number) => {
        if (value.includes(index)) {
            onChange(value.filter(v => v !== index));
        } else {
            onChange([...value, index].sort((a, b) => a - b));
        }
    };

    const segments = [
        { id: 0, label: 'E', d: "M 50 50 L 95 50 L 72.5 89 L 50 50" }, // roughly... actually let's do calculating properly or use simple paths
        // Wait, manual paths are hard. Let's use rotation.
    ];

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                    {/* Background Hex */}
                    <polygon points="95,50 72.5,89 27.5,89 5,50 27.5,11 72.5,11" fill="#1f2937" />

                    {/* Segments */}
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                        const isActive = value.includes(i);

                        // Map index to rotation degrees to match Grid coordinates
                        // Grid 0: E (0)
                        // Grid 1: NE (300)
                        // Grid 2: NW (240)
                        // Grid 3: W (180)
                        // Grid 4: SW (120)
                        // Grid 5: SE (60)
                        const rotations = [0, 300, 240, 180, 120, 60];
                        const rotation = rotations[i];

                        return (
                            <g key={i} transform={`rotate(${rotation} 50 50)`}
                                onClick={() => toggleDirection(i)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                {/* The Wedge */}
                                {/* Triangle from center (50,50) to (100, 50 - width) and (100, 50 + width)? */}
                                {/* Let's use a path describing a slice */}
                                <path
                                    d="M 50 50 L 90 27 L 90 73 Z" // Equilateral triangle wedge
                                    fill={isActive ? '#06b6d4' : '#374151'}
                                    stroke="#111827"
                                    strokeWidth="2"
                                />

                                {/* Direction Arrow/Icon? */}
                            </g>
                        );
                    })}

                    {/* Center decoration */}
                    <circle cx="50" cy="50" r="10" fill="#111827" />
                </svg>
            </div>
            <div className="flex gap-2 text-xs">
                <button
                    onClick={() => onChange([0, 1, 2, 3, 4, 5])}
                    className="text-cyan-400 hover:text-cyan-300"
                >
                    All
                </button>
                <div className="text-gray-600">|</div>
                <button
                    onClick={() => onChange([])}
                    className="text-gray-400 hover:text-gray-300"
                >
                    None
                </button>
            </div>
        </div>
    );
}
