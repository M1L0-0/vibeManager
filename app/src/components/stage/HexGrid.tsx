/**
 * HexGrid Component - Renders the hexagonal grid
 */

'use client';

import { useGridStore } from '@/store/grid-store';
import { useToolStore } from '@/store/tool-store';
import { HexCell } from './HexCell';
import { Cell } from '@/lib/vibe-core';
import { getNeighbors, hexToPixel, HEX_SIZE, hexToId } from '@/core/grid/hex';

import { memo } from 'react';

export const HexGrid = memo(function HexGrid() {
    const cellsMap = useGridStore((state) => state.cells);
    const cells = Array.from(cellsMap.values());
    const groups = useGridStore((state) => state.groups);

    // Subscribe to selection state for rendering highlights
    const selection = useToolStore((state) => state.selection);

    const handleGridEvent = useToolStore((state) => state.handleGridEvent);
    const view = useToolStore((state) => state.view);
    const { pan, zoom } = view;
    const interaction = useToolStore((state) => state.interaction);

    // Only show selection highlights if we are in Selection Mode
    const showSelection = interaction.type.startsWith('SELECT');

    // Viewport Culling
    const visibleCells = cells.filter(cell => {
        // Optimistic window size (client-side only for now)
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

        // Buffer in pixels (allow 4 extra hexes)
        const buffer = HEX_SIZE * 4;

        // Calculate World Bounds of the Viewport
        // transform is: translate(pan.x, pan.y) scale(zoom)
        // Inverse transform to find world coordinates of the screen edges
        const minX = -pan.x / zoom - buffer;
        const maxX = (windowWidth - pan.x) / zoom + buffer;
        const minY = -pan.y / zoom - buffer;
        const maxY = (windowHeight - pan.y) / zoom + buffer;

        // Calculate Cell Position
        const pos = hexToPixel(cell.coord);

        return (
            pos.x >= minX &&
            pos.x <= maxX &&
            pos.y >= minY &&
            pos.y <= maxY
        );
    });



    const handleCellClick = (cell: Cell) => {
        handleGridEvent({ type: 'CLICK', cell });
    };

    const handleCellMouseDown = (cell: Cell) => {
        handleGridEvent({ type: 'MOUSE_DOWN', cell });
    };

    const handleCellMouseUp = (targetCell: Cell) => {
        handleGridEvent({ type: 'MOUSE_UP', cell: targetCell });
    };

    const handleCellRightClick = (cell: Cell) => {
        handleGridEvent({ type: 'RIGHT_CLICK', cell });
    };

    return (
        <>
            <svg
                width="100%"
                height="100%"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'visible'
                }}
            >
                <g id="grid-container">
                    {visibleCells.map((cell) => {
                        // Calculate connected sides for group rendering
                        // OPTIMIZED: Use Group Index Set check instead of full Cell lookup
                        const groupId = cell.state.groupId;
                        const groupMembers = groupId ? groups.get(groupId) : null;

                        const neighborCoords = getNeighbors(cell.coord);
                        const connectedSides = neighborCoords.map(nCoord => {
                            if (!groupId || !groupMembers) return false;
                            const nId = hexToId(nCoord);
                            return groupMembers.has(nId);
                        });

                        return (
                            <HexCell
                                key={cell.id}
                                cell={cell}
                                onClick={handleCellClick}
                                onRightClick={handleCellRightClick}
                                onMouseDown={handleCellMouseDown}
                                onMouseUp={handleCellMouseUp}
                                connectedSides={connectedSides}
                                isSelected={showSelection && selection.has(cell.id)}
                                showDebugOverlay={view.showDebugOverlay}
                            />
                        );
                    })}
                </g>
            </svg>

        </>
    );
});
