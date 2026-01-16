/**
 * Signal Overlay - Visualizes particles traveling between cells
 */

'use client';

import { useEffect, useRef } from 'react';
import { useGridStore } from '@/store/grid-store';
import { useSimulationStore } from '@/store/simulation-store';
import { useToolStore } from '@/store/tool-store';
import { hexToPixel } from '@/core/grid/hex';

export function SignalOverlay() {
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
                pointerEvents: 'none',
                overflow: 'visible', // Allow particles to be seen if they fly out (though grid usually clips?)
                zIndex: 10
            }}
            viewBox="-400 -400 800 800"
        >
            {particles.map((p) => {
                const source = cells.get(p.sourceId);
                const target = cells.get(p.targetId);

                if (!source || !target) return null;

                const start = hexToPixel(source.coord);
                const end = hexToPixel(target.coord);

                // Linear interpolation based on progress
                const x = start.x + (end.x - start.x) * p.progress;
                const y = start.y + (end.y - start.y) * p.progress;

                return (
                    <circle
                        key={p.id}
                        cx={x}
                        cy={y}
                        r={4}
                        fill={p.color}
                        stroke="white"
                        strokeWidth={1}
                    />
                );
            })}
        </svg>
    );
}
