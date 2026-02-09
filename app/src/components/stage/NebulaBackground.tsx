'use client';
import { memo } from 'react';

interface NebulaBackgroundProps {
    pan: { x: number; y: number };
    zoom: number;
    PATTERN_W: number;
    PATTERN_H: number;
    HEX_SIZE: number;
}

export const NebulaBackground = memo(function NebulaBackground({ pan, zoom, PATTERN_W, PATTERN_H, HEX_SIZE }: NebulaBackgroundProps) {
    return (
        <>
            {/* 1. Magenta Zone (Active - Top Left) */}
            <div
                style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '50vw',
                    height: '50vw',
                    transform: `translate(${pan.x * 0.5}px, ${pan.y * 0.5}px)`,
                    pointerEvents: 'none',
                    willChange: 'transform',
                    zIndex: 0,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at center, rgba(192, 38, 211, 0.25) 0%, rgba(147, 51, 234, 0.05) 60%, transparent 70%)',
                        animation: 'float-fast-1 12s ease-in-out infinite alternate',
                        mixBlendMode: 'screen',
                        filter: 'blur(30px)',
                        opacity: 0.8,
                    }}
                />
            </div>

            {/* 2. Cyan Zone (Flowing - Bottom Right) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '-10%',
                    width: '60vw',
                    height: '60vw',
                    transform: `translate(${pan.x * 0.6}px, ${pan.y * 0.6}px)`,
                    pointerEvents: 'none',
                    willChange: 'transform',
                    zIndex: 0,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.2) 0%, rgba(14, 165, 233, 0.05) 60%, transparent 70%)',
                        animation: 'float-fast-2 15s ease-in-out infinite alternate-reverse',
                        mixBlendMode: 'screen',
                        filter: 'blur(25px)',
                        opacity: 0.7,
                    }}
                />
            </div>

            {/* 3. Indigo Zone (Deep Pulse - Center/Background) */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '70vw',
                    height: '70vw',
                    transform: `translate(-50%, -50%) translate(${pan.x * 0.4}px, ${pan.y * 0.4}px)`,
                    pointerEvents: 'none',
                    willChange: 'transform',
                    zIndex: 0,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 60%)',
                        animation: 'float-fast-3 18s ease-in-out infinite',
                        mixBlendMode: 'plus-lighter',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            {/* 4. Teal/Green Highlight (Small & Fast - Bottom Left) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '10%',
                    width: '35vw',
                    height: '35vw',
                    transform: `translate(${pan.x * 0.55}px, ${pan.y * 0.55}px)`,
                    pointerEvents: 'none',
                    willChange: 'transform',
                    zIndex: 0,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, transparent 60%)',
                        animation: 'float-fast-1 10s ease-in-out infinite alternate-reverse',
                        mixBlendMode: 'screen',
                        filter: 'blur(20px)',
                    }}
                />
            </div>

            {/* 5. Pink Highlight (Small & Fast - Top Right) */}
            <div
                style={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: '30vw',
                    height: '30vw',
                    transform: `translate(${pan.x * 0.45}px, ${pan.y * 0.45}px)`,
                    pointerEvents: 'none',
                    willChange: 'transform',
                    zIndex: 0,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 60%)',
                        animation: 'float-fast-2 13s ease-in-out infinite',
                        mixBlendMode: 'screen',
                        filter: 'blur(20px)',
                    }}
                />
            </div>

            {/* 6. Infinite Hex Grid - SVG Pattern for Perfect Alignment */}
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                    pointerEvents: 'none',
                    opacity: 0.3 // Increased visibility (was 0.2)
                }}
            >
                <defs>
                    <pattern
                        id="hex-grid-pattern"
                        x={pan.x}
                        y={pan.y}
                        width={PATTERN_W * zoom}
                        height={PATTERN_H * zoom}
                        patternUnits="userSpaceOnUse"
                    >
                        {/* Scale the pattern contents based on zoom */}
                        <g transform={`scale(${zoom})`}>
                            {/* Draw the repeating unit (2 hex centers approx or just wireframe) */}
                            {/* Path for pointy-topped hexes tiling */}
                            {/* We draw the top-left edges of two staggered hexes to form the tile */}
                            <path
                                d={`
                                    M 0 ${HEX_SIZE} L 0 ${HEX_SIZE * 2}
                                    M 0 ${HEX_SIZE} L ${PATTERN_W / 2} ${HEX_SIZE * 0.5}
                                    M 0 ${HEX_SIZE * 2} L ${PATTERN_W / 2} ${HEX_SIZE * 2.5}
                                    M ${PATTERN_W / 2} 0 L ${PATTERN_W / 2} ${HEX_SIZE * 0.5}
                                    M ${PATTERN_W / 2} ${HEX_SIZE * 2.5} L ${PATTERN_W / 2} ${HEX_SIZE * 3}
                                    M ${PATTERN_W} ${HEX_SIZE} L ${PATTERN_W} ${HEX_SIZE * 2}
                                    M ${PATTERN_W} ${HEX_SIZE} L ${PATTERN_W / 2} ${HEX_SIZE * 0.5}
                                    M ${PATTERN_W} ${HEX_SIZE * 2} L ${PATTERN_W / 2} ${HEX_SIZE * 2.5}
                                `}
                                fill="none"
                                stroke="#a8a29e" // Warmer grey/white for visibility
                                strokeWidth="0.8" // Slightly thicker lines (was 0.5)
                                opacity="0.5" // Increased line opacity (was 0.4)
                            />
                        </g>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex-grid-pattern)" />
            </svg>
        </>
    );
});
