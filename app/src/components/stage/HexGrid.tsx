/**
 * HexGrid Component - Renders the hexagonal grid
 */

'use client';

import { useGridStore } from '@/store/grid-store';
import { useToolStore } from '@/store/tool-store';
import { HexCell } from './HexCell';
import { Cell } from '@/lib/vibe-core';
import { getNeighbors } from '@/core/grid/hex';

export function HexGrid() {
    const cellsMap = useGridStore((state) => state.cells);
    const cells = Array.from(cellsMap.values());
    const getCellAt = useGridStore((state) => state.getCellAt);

    const handleGridEvent = useToolStore((state) => state.handleGridEvent);



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
                }}
                viewBox="-400 -400 800 800"
            >
                <g id="grid-container">
                    {cells.map((cell) => {
                        // Calculate connected sides for group rendering
                        const neighborCoords = getNeighbors(cell.coord);
                        const connectedSides = neighborCoords.map(nCoord => {
                            const nCell = getCellAt(nCoord);
                            return !!(cell.state.groupId && nCell && nCell.state.groupId === cell.state.groupId);
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
                            />
                        );
                    })}
                </g>
            </svg>

        </>
    );
}
