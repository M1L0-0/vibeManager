/**
 * Viewport Component - The infinite canvas wrapper
 */

'use client';

import { useState } from 'react';
import { HexGrid } from './HexGrid';
import { useToolStore } from '@/store/tool-store';

export function Viewport() {
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const currentTool = useToolStore((state) => state.currentTool);
    const editorMode = useToolStore((state) => state.editorMode);

    // Disable viewport panning when in transplant mode
    const canDragViewport = !(currentTool === 'genesis' && editorMode === 'transplant');

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!canDragViewport) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && canDragViewport) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((prev) => Math.max(0.5, Math.min(3, prev * delta)));
    };

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                position: 'relative',
                cursor: canDragViewport ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <div
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    width: '100%',
                    height: '100%',
                }}
            >
                <HexGrid />
            </div>

            {/* Info overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.5)',
                    padding: '10px',
                    borderRadius: '8px',
                }}
            >
                <div>Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</div>
                <div>Zoom: {zoom.toFixed(2)}x</div>
                <div style={{ marginTop: 10, opacity: 0.7 }}>
                    🖱️ Click cells to emit signals<br />
                    🔍 Scroll to zoom<br />
                    ✋ Drag to pan
                </div>
            </div>
        </div>
    );
}
