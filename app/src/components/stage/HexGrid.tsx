/**
 * HexGrid Component - Renders the hexagonal grid
 */

'use client';

import { useGridStore } from '@/store/grid-store';
import { useToolStore } from '@/store/tool-store';
import { HexCell } from './HexCell';
import { Cell } from '@/lib/vibe-core';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';
import { GenomeInspector } from '../ui/GenomeInspector';
import { useState } from 'react';

// Registry of all PAM modules
const PAM_REGISTRY: Record<string, any> = {
    'stem': StemCell,
    'timer': TimerCell,
    'wave': WaveCell,
};

export function HexGrid() {
    const cellsMap = useGridStore((state) => state.cells);
    const cells = Array.from(cellsMap.values());
    const currentTool = useToolStore((state) => state.currentTool);

    const [inspectingCell, setInspectingCell] = useState<Cell | null>(null);

    const handleCellClick = (cell: Cell) => {
        // Check current tool
        if (currentTool === 'inspect') {
            // Open genome inspector
            setInspectingCell(cell);
        } else {
            // Hand tool - trigger normal onClick behavior
            const pamModule = PAM_REGISTRY[cell.dna.id];
            if (pamModule?.onClick) {
                pamModule.onClick(cell);
            }
        }
    };

    const handleCellRightClick = (cell: Cell) => {
        // Right-click behavior: reset timer cells
        if (cell.dna.id === 'timer') {
            const updateCell = useGridStore.getState().updateCell;
            const data = cell.state.data;

            if (data) {
                console.log(`🔄 Timer Cell ${cell.id}: Reset via right-click`);
                updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data: {
                            ...data,
                            timeRemaining: data.maxTime,
                            isRunning: false,
                            lastTick: Date.now(),
                        },
                    },
                });
            }
        }
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
                    {cells.map((cell) => (
                        <HexCell
                            key={cell.id}
                            cell={cell}
                            onClick={handleCellClick}
                            onRightClick={handleCellRightClick}
                        />
                    ))}
                </g>
            </svg>

            {/* Genome Inspector Popup */}
            {inspectingCell && (
                <GenomeInspector
                    cell={inspectingCell}
                    onClose={() => setInspectingCell(null)}
                />
            )}
        </>
    );
}
