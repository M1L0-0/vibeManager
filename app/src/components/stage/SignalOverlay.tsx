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
    const { showParticles } = useSimulationStore();
    const currentTool = useToolStore((state) => state.currentTool);
    const cells = useGridStore((state) => state.cells);
    const particles = useGridStore((state) => state.particles);

    // Render loop
    useEffect(() => {
        if (!showParticles) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to match window/viewport (assuming full screen for now)
        // Ideally checking parent container would be better but fixed size works for prototype
        // Actually, since this is inside the viewport, it should be large enough?
        // Wait, Viewport transforms the container. If this is *inside* viewport content,
        // it needs to be the size of the *content*, not the screen.
        // But Viewport uses infinite canvas logic.
        // If we place this alongside HexGrid in the transform container, it matches coordinate space.
        // We'll trust the parent to size us or we size to a large enough area?
        // Let's assume this is placed INSIDE the transform container, so 0,0 is q=0,r=0 center.

        // Actually, standard HTML canvas needs explicit width/height in pixels.
        // We might need to handle this carefully.
        // For V1, let's assume a fixed large size centered on 0,0?
        // OR, we can just use SVG? SVG is easier for coordinate systems.
        // Let's switch to SVG.
    }, [showParticles, particles, cells]);

    // Strictly show only in visualizer mode AND if enabled
    if (currentTool !== 'visualizer' || !showParticles) return null;

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
