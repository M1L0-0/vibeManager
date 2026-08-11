/**
 * Viewport Component - The infinite canvas wrapper
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { HexGrid } from './HexGrid';
import { SignalOverlay } from './SignalOverlay';
import { NebulaBackground } from './NebulaBackground';
import { SelectionOverlay } from './SelectionOverlay';
import { PasteOverlay } from './PasteOverlay';
import { DebugPanel } from '@/components/ui/DebugPanel';
import { useToolStore, useToolStoreApi } from '@/store/tool-store';
import { pixelToHex } from '@/core/grid/hex';

export function Viewport() {
    const interaction = useToolStore((state) => state.interaction);
    const view = useToolStore((state) => state.view);
    const setPan = useToolStore((state) => state.setPan);
    const setZoom = useToolStore((state) => state.setZoom);
    const startSelection = useToolStore((state) => state.startSelection);
    const updateSelection = useToolStore((state) => state.updateSelection);
    const endSelection = useToolStore((state) => state.endSelection);

    const { pan, zoom } = view;

    // Local drag state is fine
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Center viewport on mount
    useEffect(() => {
        setPan({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }, [setPan]);

    // Disable viewport panning when in transplant mode (to prevent conflict with drag-and-drop)
    const canDragViewport = !(
        interaction.type === 'GENESIS_TRANSPLANT_IDLE' ||
        interaction.type === 'GENESIS_DRAGGING' ||
        interaction.type === 'GENESIS_HOLDING'
    );

    // Store viewport offset during drag to resolve global coordinates correctly
    const dragOffsetRef = useRef({ left: 0, top: 0 });

    // Track click start to distinguish between click and drag
    const clickStartRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffsetRef.current = { left: rect.left, top: rect.top };
        clickStartRef.current = { x: e.clientX, y: e.clientY };

        // Selection Logic
        if (interaction.type === 'SELECT_IDLE') {
            // Don't start selection immediately. Wait for threshold.
            selectionDragStartRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (!canDragViewport) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const selectionDragStartRef = useRef<{ x: number, y: number } | null>(null);

    const toolStore = useToolStoreApi();

    // Use window listeners for drag to prevent UI interference and text selection
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            const currentInteraction = toolStore.getState().interaction;
            const currentPan = toolStore.getState().view.pan;
            const currentZoom = toolStore.getState().view.zoom;
            const offset = dragOffsetRef.current;

            // Handle Selection Drag Start (Threshold)
            if (currentInteraction.type === 'SELECT_IDLE' && selectionDragStartRef.current) {
                const start = selectionDragStartRef.current;
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                if (dx * dx + dy * dy > 25) { // 5px threshold
                    // Start dragging
                    // Calculate World Point relative to Viewport
                    const relativeX = start.x - offset.left;
                    const relativeY = start.y - offset.top;

                    const worldX = (relativeX - currentPan.x) / currentZoom;
                    const worldY = (relativeY - currentPan.y) / currentZoom;
                    // Trigger start
                    toolStore.getState().startSelection({ x: worldX, y: worldY });
                    selectionDragStartRef.current = null; // Consumed
                }
            }

            if (currentInteraction.type === 'SELECT_DRAGGING') {
                const relativeX = e.clientX - offset.left;
                const relativeY = e.clientY - offset.top;

                const worldX = (relativeX - currentPan.x) / currentZoom;
                const worldY = (relativeY - currentPan.y) / currentZoom;

                updateSelection({ x: worldX, y: worldY });
                return;
            }

            // Note: We access local isDragging via ref because we can't easily access state inside this effect without deps
            // However, dragging viewport logic relies on React state `isDragging`. 
            // We can check `canDragViewport` from global interaction too.
        };

        const handleWindowMouseUp = () => {
            selectionDragStartRef.current = null; // Reset threshold trigger
            const currentInteraction = toolStore.getState().interaction;
            if (currentInteraction.type === 'SELECT_DRAGGING') {
                endSelection();
                return;
            }
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [updateSelection, endSelection]); // Minimal dependencies

    // Separate effect for Viewport Dragging to use local React state (isDragging) correctly
    // We keep this separate because it relies on `isDragging` and `dragStart` which change often during interaction
    useEffect(() => {
        if (!isDragging) return;

        const handleDragMove = (e: MouseEvent) => {
            if (canDragViewport) {
                setPan({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y,
                });
            }
        };

        window.addEventListener('mousemove', handleDragMove);
        return () => window.removeEventListener('mousemove', handleDragMove);
    }, [isDragging, canDragViewport, dragStart, setPan]);

    const viewportRef = useRef<HTMLDivElement>(null);

    // Use a static ID since there's only one viewport, preventing SSR hydration mismatches
    const nebulaPatternId = 'nebula-pattern-main';

    // Handle Wheel (Zoom)
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            // Get bounding rect to calculate relative mouse position
            const rect = el.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom-to-cursor logic
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.1, Math.min(8, zoom * zoomFactor));

            // Pan calculation needs to maintain relative mouse position
            const newPanX = mouseX - ((mouseX - pan.x) / zoom) * newZoom;
            const newPanY = mouseY - ((mouseY - pan.y) / zoom) * newZoom;

            setZoom(newZoom);
            setPan({ x: newPanX, y: newPanY });
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);

    }, [pan, zoom, setZoom, setPan]);

    // Hex Grid Dimensions (from hex.ts)
    const HEX_SIZE = 40;
    const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE; // ~69.28
    const HEX_HEIGHT = 2 * HEX_SIZE; // 80
    // The pattern needs to repeat every:
    // Width: sqrt(3) * size (column width) -> No, standard tiling is complicated.
    // Let's use a pattern width of sqrt(3)*size * 2? 
    // Actually, simple path: vertically spaced by 1.5 * size (60px). Horizontally by sqrt(3) * size (~69.28).
    // To tile perfectly, use a pattern unit of Width = sqrt(3)*size, Height = 3*size.
    // Contains 2 hexes (one at 0,0, one offset).
    const PATTERN_W = Math.sqrt(3) * HEX_SIZE;
    const PATTERN_H = 3 * HEX_SIZE;

    const showNebula = useToolStore((state) => state.view.showNebula);

    // ...

    return (
        <div
            ref={viewportRef}
            className="infinite-viewport"
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: '#1a1a24',
                position: 'relative',
                cursor: interaction.type === 'PASTE_IDLE' ? 'copy' : (canDragViewport ? (isDragging ? 'grabbing' : 'grab') : 'default'),
            }}
            // ... (handleMouseDown logic needs updating too? handleMouseDown uses e.clientX directly which is global. 
            // However, drag calculation e.clientX - pan.x works if pan is global offset? 
            // No, Pan is purely transform offset. 
            // If viewport is top-left 0,0, e.clientX is fine. 
            // If viewport is offset, e.clientX includes that offset. 
            // Dragging delta (movement) is fine regardless of offset. 
            // Positioning grid clicks needs offset.)

            onMouseDown={handleMouseDown}
            onClick={(e) => {
                // Check if we dragged
                const dx = e.clientX - clickStartRef.current.x;
                const dy = e.clientY - clickStartRef.current.y;
                if (dx * dx + dy * dy > 25) return; // Ignore click if moved > 5px

                // ...
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Calculate Hex Coord
                // World Point = (ScreenLocal - Pan) / Zoom
                const worldX = (mouseX - pan.x) / zoom;
                const worldY = (mouseY - pan.y) / zoom;

                const coord = pixelToHex({ x: worldX, y: worldY });

                toolStore.getState().handleGridEvent({
                    type: 'BACKGROUND_CLICK',
                    coord
                });
            }}
        >
            {/* Background Layers */}
            {showNebula && (
                <NebulaBackground
                    pan={pan}
                    zoom={zoom}
                    PATTERN_W={PATTERN_W}
                    PATTERN_H={PATTERN_H}
                    HEX_SIZE={HEX_SIZE}
                    patternId={nebulaPatternId}
                />
            )}

            {/* 5. Game World */}
            <div
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    position: 'relative'
                }}
            >
                <HexGrid />
                <SignalOverlay />
                <SelectionOverlay />
                <PasteOverlay viewportRef={viewportRef} />
            </div>

            {/* Info overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    background: 'rgba(0,0,0,0.4)',
                    padding: '6px 10px',
                    borderRadius: '99px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 20, // UI on top
                    pointerEvents: 'none'
                }}
            >
                <div className="flex gap-4">
                    <span>POS: {pan.x.toFixed(0)},{pan.y.toFixed(0)}</span>
                    <span>ZOOM: {zoom.toFixed(2)}x</span>
                </div>
            </div>

            <DebugPanel />

            <style jsx global>{`
                @keyframes float-fast-1 {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                    25% { transform: translate(60px, -40px) scale(1.1) rotate(10deg); border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                    50% { transform: translate(-30px, 50px) scale(0.9) rotate(-10deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                    75% { transform: translate(40px, 20px) scale(1.05) rotate(5deg); border-radius: 50% 50% 40% 60% / 50% 60% 40% 50%; }
                    100% { transform: translate(0, 0) scale(1) rotate(0deg); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
                }
                @keyframes float-fast-2 {
                    0% { transform: translate(0, 0) scale(0.9) rotate(0deg); border-radius: 50% 50% 60% 40% / 50% 40% 60% 50%; opacity: 0.6; }
                    33% { transform: translate(-50px, 40px) scale(1.15) rotate(-15deg); border-radius: 40% 60% 40% 60% / 40% 60% 40% 60%; opacity: 0.8; }
                    66% { transform: translate(40px, -30px) scale(0.95) rotate(10deg); border-radius: 60% 40% 70% 30% / 60% 30% 70% 40%; opacity: 0.7; }
                    100% { transform: translate(0, 0) scale(0.9) rotate(0deg); border-radius: 50% 50% 60% 40% / 50% 40% 60% 50%; opacity: 0.6; }
                }
                @keyframes float-fast-3 {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
