/**
 * HexGrid Component - Renders the hexagonal grid
 */

'use client';

import { useGridStore } from '@/store/grid-store';
import { HexCell } from './HexCell';
import { Cell } from '@/lib/vibe-core';
import { StemCell } from '@/pams/stem';

export function HexGrid() {
    const cellsMap = useGridStore((state) => state.cells);
    const cells = Array.from(cellsMap.values());

    const handleCellClick = (cell: Cell) => {
        // Trigger the cell's onClick behavior
        if (cell.dna.id === 'stem' && StemCell.onClick) {
            StemCell.onClick(cell);
        }
    };

    return (
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
                {cells.map((cell) => (
                    <HexCell
                        key={cell.id}
                        cell={cell}
                        onClick={handleCellClick}
                    />
                ))}
            </g>
        </svg>
    );
}
