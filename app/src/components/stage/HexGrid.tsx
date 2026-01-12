/**
 * HexGrid Component - Renders the hexagonal grid
 */

'use client';

import { useGridStore } from '@/store/grid-store';
import { useToolStore } from '@/store/tool-store';
import { HexCell } from './HexCell';
import { Cell } from '@/lib/vibe-core';
import { getPamModule } from '@/pams/registry';
import { GenomeInspector } from '../ui/GenomeInspector';
import { useState } from 'react';

export function HexGrid() {
    const cellsMap = useGridStore((state) => state.cells);
    const cells = Array.from(cellsMap.values());
    const currentTool = useToolStore((state) => state.currentTool);
    const editorMode = useToolStore((state) => state.editorMode);
    const selectedCellDNA = useToolStore((state) => state.selectedCellDNA);
    const spawnCell = useGridStore((state) => state.spawnCell);
    const killCell = useGridStore((state) => state.killCell);
    const updateCell = useGridStore((state) => state.updateCell);
    const getCellAt = useGridStore((state) => state.getCellAt);

    const [inspectingCell, setInspectingCell] = useState<Cell | null>(null);
    const [draggingCell, setDraggingCell] = useState<Cell | null>(null);

    const handleCellClick = (cell: Cell) => {
        // Genesis Tool - Transplant Mode (do nothing on click, only drag-drop)
        if (currentTool === 'genesis' && editorMode === 'transplant') {
            return; // Don't trigger onClick in transplant mode
        }

        // Genesis Tool - Spawn Mode
        if (currentTool === 'genesis' && editorMode === 'spawn') {
            if (!selectedCellDNA) {
                console.log('No cell type selected');
                return;
            }

            console.log(`🧬 Spawning ${selectedCellDNA.name} at ${cell.coord.q},${cell.coord.r}`);

            // Kill existing cell if present
            killCell(cell.id);

            // Spawn new cell of selected type
            const pamModule = getPamModule(selectedCellDNA.id);
            spawnCell(cell.coord, selectedCellDNA, pamModule);
            return;
        }

        // Inspect Tool
        if (currentTool === 'inspect') {
            setInspectingCell(cell);
            return;
        }

        // Hand Tool - trigger normal onClick behavior
        const pamModule = getPamModule(cell.dna.id);
        if (pamModule?.onClick) {
            pamModule.onClick(cell);
        }
    };

    const handleCellMouseDown = (cell: Cell) => {
        // Genesis Tool - Transplant Mode
        if (currentTool === 'genesis' && editorMode === 'transplant') {
            setDraggingCell(cell);
        }
    };

    const handleCellMouseUp = (targetCell: Cell) => {
        // Genesis Tool - Transplant Mode
        if (currentTool === 'genesis' && editorMode === 'transplant' && draggingCell) {
            if (draggingCell.id === targetCell.id) {
                // Dropped on same cell, cancel
                setDraggingCell(null);
                return;
            }

            console.log(`🔬 Transplanting ${draggingCell.dna.name} from ${draggingCell.coord.q},${draggingCell.coord.r} to ${targetCell.coord.q},${targetCell.coord.r}`);

            // Get the current states
            const sourceCoord = draggingCell.coord;
            const targetCoord = targetCell.coord;
            const sourceDNA = draggingCell.dna;
            const targetDNA = targetCell.dna;
            const sourceState = draggingCell.state;
            const targetState = targetCell.state;

            // Kill both cells
            killCell(draggingCell.id);
            killCell(targetCell.id);

            // Swap: source DNA goes to target position, target DNA goes to source position
            const sourcePam = getPamModule(sourceDNA.id);
            const targetPam = getPamModule(targetDNA.id);

            spawnCell(targetCoord, sourceDNA, sourcePam);
            spawnCell(sourceCoord, targetDNA, targetPam);

            // Update the states to preserve data
            setTimeout(() => {
                const newTargetCell = getCellAt(targetCoord);
                const newSourceCell = getCellAt(sourceCoord);

                if (newTargetCell) {
                    updateCell(newTargetCell.id, { state: sourceState });
                }
                if (newSourceCell) {
                    updateCell(newSourceCell.id, { state: targetState });
                }
            }, 10);

            setDraggingCell(null);
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
                            onMouseDown={handleCellMouseDown}
                            onMouseUp={handleCellMouseUp}
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
