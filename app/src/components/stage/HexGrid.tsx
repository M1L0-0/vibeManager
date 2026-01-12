/**
 * HexGrid Component - Renders the hexagonal grid
 */

'use client';

import { useGridStore } from '@/store/grid-store';
import { HexCell } from './HexCell';
import { Cell } from '@/lib/vibe-core';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';

// Registry of all PAM modules
const PAM_REGISTRY: Record<string, any> = {
    'stem': StemCell,
    'timer': TimerCell,
    'wave': WaveCell,
};

export function HexGrid() {
    const cellsMap = useGridStore((state) => state.cells);
    const cells = Array.from(cellsMap.values());

    const handleCellClick = (cell: Cell) => {
        // Find and trigger the cell's onClick behavior from registry
        const pamModule = PAM_REGISTRY[cell.dna.id];
        if (pamModule?.onClick) {
            pamModule.onClick(cell);
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
