'use client';

import { useEffect, useState } from 'react';
import { Viewport } from '@/components/stage/Viewport';
import { SimulationControls } from '@/components/ui/SimulationControls';
import { useGridStore, useGridStoreApi } from '@/store/grid-store';
import { GenomeInspector } from '@/components/ui/GenomeInspector';
import { EndpointDashboard } from '@/components/ui/EndpointDashboard';
import { useToolStore, useToolStoreApi } from '@/store/tool-store';
import { useGlobalUIStore } from '@/store/global-ui-store';
import { getAllCellTypes } from '@/pams/registry';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';
import { getHexesInRadius } from '@/core/grid/hex';
import { CellTicker } from '@/components/stage/CellTicker';
import { Cell } from '@/lib/vibe-core';

interface PetriDishProps {
    windowId: string;
}

export function PetriDish({ windowId }: PetriDishProps) {
    const spawnCell = useGridStore((state) => state.spawnCell);

    // FSM Selectors
    const toolStore = useToolStoreApi(); // For direct access if needed, or just use selectors?
    // Actually, calling setters from useEffect is fine with selectors.

    const interaction = useToolStore((state) => state.interaction);
    const clearInspection = useToolStore((state) => state.clearInspection);
    const setToolHand = useToolStore((state) => state.setToolHand);
    const setToolInspect = useToolStore((state) => state.setToolInspect);
    const setToolEraser = useToolStore((state) => state.setToolEraser);
    const setToolGenesis = useToolStore((state) => state.setToolGenesis);

    const activeToolId = useGlobalUIStore(s => s.activeToolId);
    const { activeGenesisDna, genesisMode, showNebula, showDebugOverlay } = useGlobalUIStore();
    const setToolGenesisGlue = useToolStore((state) => state.setToolGenesisGlue);
    const setToolGenesisTransplant = useToolStore((state) => state.setToolGenesisTransplant);
    const setViewSettings = useToolStore((state) => state.setViewSettings);

    // Sync Global Tool to Local Tool
    useEffect(() => {
        const type = interaction.type;

        if (activeToolId === 'hand' && type !== 'HAND_IDLE') setToolHand();
        if (activeToolId === 'inspect' && !type.startsWith('INSPECT')) setToolInspect();
        if (activeToolId === 'eraser' && type !== 'ERASER_IDLE') setToolEraser();

        if (activeToolId === 'select' && !type.startsWith('SELECT')) {
            toolStore.getState().setToolSelect();
        }

        if (activeToolId === 'paste' && type !== 'PASTE_IDLE') {
            toolStore.getState().setToolPaste();
        }

        if (activeToolId === 'genesis') {
            if (genesisMode === 'spawn') {
                if (activeGenesisDna) {
                    setToolGenesis(activeGenesisDna);
                } else {
                    const first = getAllCellTypes()[0];
                    if (first) setToolGenesis(first.dna);
                }
            } else if (genesisMode === 'transplant' && !type.startsWith('GENESIS_TRANSPLANT')) {
                setToolGenesisTransplant();
            } else if (genesisMode === 'glue' && !type.startsWith('GENESIS_GLUING')) {
                setToolGenesisGlue();
            }
        }

    }, [activeToolId, interaction.type, setToolHand, setToolInspect, setToolEraser, setToolGenesis, setToolGenesisGlue, setToolGenesisTransplant, genesisMode, activeGenesisDna, toolStore]);

    // Sync View Settings
    useEffect(() => {
        setViewSettings({ showNebula, showDebugOverlay });
    }, [showNebula, showDebugOverlay, setViewSettings]);

    const isGenesis = interaction.type.startsWith('GENESIS');
    const inspectingCellId = interaction.type === 'INSPECT_IDLE' ? interaction.targetId : null;

    // Use hook to get cell reactively
    const inspectingCell = useGridStore((state) =>
        inspectingCellId ? state.cells.get(inspectingCellId) : undefined
    );

    const gridStore = useGridStoreApi();

    useEffect(() => {
        // Only spawn if empty? Or just on mount?
        // Since stores are fresh per instance, we can spawn on mount.
        // Check if empty first to avoid double spawn in StrictMode
        const cells = gridStore.getState().cells;
        if (cells.size > 0) return;

        // Spawn initial cells in a hexagonal pattern
        const centerCoord = { q: 0, r: 0 };
        const radius = 3;
        const hexes = getHexesInRadius(centerCoord, radius);

        // Replace one cell with a timer cell
        const timerCoord = { q: 2, r: 1 };
        // Replace another cell with a wave cell
        const waveCoord = { q: -2, r: 1 };

        hexes.forEach((coord) => {
            // If this is the timer position, spawn a timer cell
            if (coord.q === timerCoord.q && coord.r === timerCoord.r) {
                spawnCell(coord, TimerCell.dna, TimerCell);
            } else if (coord.q === waveCoord.q && coord.r === waveCoord.r) {
                // Spawn a wave cell
                spawnCell(coord, WaveCell.dna, WaveCell);
            } else {
                // Otherwise spawn a stem cell
                spawnCell(coord, StemCell.dna, StemCell);
            }
        });
    }, [spawnCell]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            <CellTicker />

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <EndpointDashboard />
                <SimulationControls />
            </div>

            {/* Stage */}
            <Viewport />

            {/* Global Overlays (Modals/Popups) */}
            {inspectingCell && (
                <GenomeInspector
                    cell={inspectingCell}
                    onClose={() => clearInspection()}
                />
            )}
        </div>
    );
}
