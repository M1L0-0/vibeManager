/**
 * Signal Overlay - Visualizes particles traveling between cells
 */

'use client';

import { useEffect, useRef } from 'react';
import { useGridStore } from '@/store/grid-store';
import { useSimulationStore } from '@/store/simulation-store';
import { useToolStore } from '@/store/tool-store';
import { hexToPixel } from '@/core/grid/hex';

import { memo } from 'react';

export const SignalOverlay = memo(function SignalOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const showParticles = useToolStore((state) => state.view.showSynapticVision);
    const cells = useGridStore((state) => state.cells);
    const particles = useGridStore((state) => state.particles);

    // Render loop
    useEffect(() => {
        if (!showParticles) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    }, [showParticles, particles, cells]);

    // Strictly show only if enabled (decoupled from tool)
    if (!showParticles) return null;

    return (
        <svg
            width="100%"
            height="100%"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none', // Prevent blocking clicks
                overflow: 'visible',
                zIndex: 10
            }}
        >
            {
                particles.map((p) => {
                    const source = cells.get(p.sourceId);
                    const target = cells.get(p.targetId);

                    if (!source || !target) return null;

                    const start = hexToPixel(source.coord);
                    const end = hexToPixel(target.coord);

                    // Linear interpolation based on progress
                    const x = start.x + (end.x - start.x) * p.progress;
                    const y = start.y + (end.y - start.y) * p.progress;

                    return (
                        <g key={p.id}>
                            <circle
                                cx={x}
                                cy={y}
                                r={4}
                                fill={p.color}
                                stroke="white"
                                strokeWidth={0}
                                style={{
                                    filter: `drop-shadow(0 0 4px ${p.color}) drop-shadow(0 0 8px ${p.color})`
                                }}
                            />
                            {/* DNA Payload Indicator */}
                            {p.signal.dnaPayload && (
                                <rect
                                    x={x - 3}
                                    y={y - 3}
                                    width={6}
                                    height={6}
                                    fill={p.signal.dnaPayload.color}
                                    stroke="white"
                                    strokeWidth={1}
                                    transform={`rotate(45 ${x} ${y})`}
                                />
                            )}
                        </g>
                    );
                })
            }
        </svg >
    );
});
