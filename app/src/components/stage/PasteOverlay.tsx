'use client';

import { useGlobalUIStore } from '@/store/global-ui-store';
import { useToolStore } from '@/store/tool-store';
import { hexToPixel, pixelToHex, HEX_SIZE, HexCoord } from '@/core/grid/hex';
import React, { useEffect, useState } from 'react';
import { Cell } from '@/lib/vibe-core';

interface PasteOverlayProps {
    viewportRef: React.RefObject<HTMLDivElement | null>;
}

export function PasteOverlay({ viewportRef }: PasteOverlayProps) {
    const interaction = useToolStore((state) => state.interaction);
    const pan = useToolStore((state) => state.view.pan);
    const zoom = useToolStore((state) => state.view.zoom);
    const clipboard = useGlobalUIStore((state) => state.clipboard);

    const [hoverCoord, setHoverCoord] = useState<HexCoord | null>(null);

    // Only active in PASTE_IDLE
    const isActive = interaction.type === 'PASTE_IDLE';

    useEffect(() => {
        if (!isActive) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate Hex Coord under mouse
            // Use getBoundingClientRect of viewport? 
            // We assume Viewport acts as full screen or we need offset.
            // But Viewport.tsx handles this by passing internal pan/zoom.
            // We need the Viewport's container offset if it's not full window.
            // `e.clientX` is global.
            // Ideally we attach listener to the parent container, but window listener is easier for overlays.
            // We need to know the offset of the viewport container.
            // This is tricky from a child component.
            // However, Viewport.tsx is the parent. 
            // Maybe we can assume Viewport is the `offsetParent` if we use `e.offsetX`?
            // No, `PasteOverlay` is inside `Viewport` div.

            // Let's rely on Viewport passing the ref or using `e.target` if it bubbles?
            // Actually, `Viewport.tsx` renders this. 
            // Let's use `window` listener and try to adjust.
            // Or better, assume `Viewport` is filling the context it is placed in.
            // If we are inside `Viewport`, `parentElement` logic?

            // Copied from Viewport.tsx logic:
            // const rect = e.currentTarget.getBoundingClientRect();
            // This requires the container ref.
            // Let's assume for now we use a simpler approach or pass a ref?
            // Wait, we can't easily pass ref here without prop drilling.

            // Alternative: Just render this overlay normally, but update `hoverCoord` via `onMouseMove` on the PARENT `Viewport`?
            // That would trigger re-renders of the whole Viewport on every mouse move. BAD.

            // So `PasteOverlay` should handle its own mouse tracking.
            // It is mounted inside `Viewport`'s `div`.
            // We can search for the parent `.infinite-viewport`?

            if (!viewportRef.current) {
                console.warn('[PasteOverlay] No viewportRef');
                return;
            }

            const rect = viewportRef.current.getBoundingClientRect();

            // Check if mouse is within this viewport
            if (
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                setHoverCoord(null);
                return;
            }

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - pan.x) / zoom;
            const worldY = (mouseY - pan.y) / zoom;

            const coord = pixelToHex({ x: worldX, y: worldY });

            // Throttle?
            setHoverCoord(coord);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isActive, pan, zoom]);

    if (!isActive || !hoverCoord || clipboard.length === 0) return null;

    // Calculate Offset Logic (Same as GridStore.paste)
    let minQ = Infinity, minR = Infinity;
    clipboard.forEach(cell => {
        if (cell.coord.q < minQ) minQ = cell.coord.q;
        if (cell.coord.r < minR) minR = cell.coord.r;
    });

    const qOffset = hoverCoord.q - minQ;
    const rOffset = hoverCoord.r - minR;

    // Generate hexagon path
    const hexPath = () => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = HEX_SIZE * Math.cos(angle);
            const y = HEX_SIZE * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        return `M ${points.join(' L ')} Z`;
    };

    const d = hexPath();

    return (
        <svg
            width="100%"
            height="100%"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 10,
                overflow: 'visible'
            }}
        >
            <g>
                {clipboard.map((cell, i) => {
                    const newQ = cell.coord.q + qOffset;
                    const newR = cell.coord.r + rOffset;
                    const pos = hexToPixel({ q: newQ, r: newR });

                    return (
                        <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                            {/* Ghost Cell Body */}
                            <path
                                d={d}
                                fill={cell.dna.color}
                                fillOpacity={0.4}
                                stroke="white"
                                strokeDasharray="4 2"
                                strokeWidth={2}
                            />
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}
