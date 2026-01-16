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
import { getNeighbors } from '@/core/grid/hex';

export function HexGrid() {
    const cellsMap = useGridStore((state) => state.cells);
    const cells = Array.from(cellsMap.values());
    const currentTool = useToolStore((state) => state.currentTool);
    const editorMode = useToolStore((state) => state.editorMode);
    const selectedCellDNA = useToolStore((state) => state.selectedCellDNA);
    const spawnCell = useGridStore((state) => state.spawnCell);
    const killCell = useGridStore((state) => state.killCell);
    const updateCell = useGridStore((state) => state.updateCell);
    const mergeCells = useGridStore((state) => state.mergeCells);
    const getCellAt = useGridStore((state) => state.getCellAt);

    // const [inspectingCell, setInspectingCell] = useState<Cell | null>(null);
    // Local state removed - moved to tool-store to fix stale closure issues with memoized HexCells
    // const [draggingCell, setDraggingCell] = useState<Cell | null>(null);
    // const [glueSource, setGlueSource] = useState<string | null>(null);

    const handleCellClick = (cell: Cell) => {
        const {
            currentTool,
            editorMode,
            selectedCellDNA,
            glueSource,
            setGlueSource,
            setInspectingCell // Use store action directly
        } = useToolStore.getState();

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

        if (currentTool === 'inspect') {
            setInspectingCell(cell.id);
            return;
        }

        if (currentTool === 'genesis' && editorMode === 'glue') {
            if (!glueSource) {
                // Select first cell
                console.log(`🔗 Glue: Selected source ${cell.id}`);
                setGlueSource(cell.id);
            } else {
                // Select second cell & merge
                if (glueSource === cell.id) {
                    // Deselect
                    setGlueSource(null);
                    return;
                }

                console.log(`🔗 Glue: Merging ${glueSource} + ${cell.id}`);
                mergeCells(glueSource, cell.id);
                setGlueSource(null);
            }
            return;
        }

        // Hand Tool - trigger normal onClick behavior
        const pamModule = getPamModule(cell.dna.id);
        if (pamModule?.onClick) {
            pamModule.onClick(cell);
        }
    };

    const handleCellMouseDown = (cell: Cell) => {
        const { currentTool, editorMode, setDraggingCell } = useToolStore.getState();
        // Genesis Tool - Transplant Mode
        if (currentTool === 'genesis' && editorMode === 'transplant') {
            setDraggingCell(cell);
        }
    };

    const handleCellMouseUp = (targetCell: Cell) => {
        const { currentTool, editorMode, draggingCell, setDraggingCell } = useToolStore.getState();
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
