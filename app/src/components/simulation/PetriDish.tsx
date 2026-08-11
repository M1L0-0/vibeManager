'use client';

import { useEffect, useState } from 'react';
import { Viewport } from '@/components/stage/Viewport';
import { SimulationControls } from '@/components/ui/SimulationControls';
import { useGridStore, useGridStoreApi } from '@/store/grid-store';
import { GenomeInspector } from '@/components/ui/GenomeInspector';
import { EndpointDashboard } from '@/components/ui/EndpointDashboard';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useToolStore, useToolStoreApi } from '@/store/tool-store';
import { useGlobalUIStore } from '@/store/global-ui-store';
import { getAllCellTypes } from '@/pams/registry';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';
import { getHexesInRadius } from '@/core/grid/hex';
import { CellTicker } from '@/components/stage/CellTicker';
import { masterpieceDish } from '@/seeds/masterpiece';

interface PetriDishProps {
    windowId: string;
}

export function PetriDish({ windowId }: PetriDishProps) {
    const spawnCell = useGridStore((state) => state.spawnCell);
    const gridStore = useGridStoreApi();

    // FSM Selectors
    const toolStore = useToolStoreApi(); // For direct access if needed, or just use selectors?
    // Actually, calling setters from useEffect is fine with selectors.

    const interaction = useToolStore((state) => state.interaction);
    const clearInspection = useToolStore((state) => state.clearInspection);
    const setToolHand = useToolStore((state) => state.setToolHand);
    const setToolInspect = useToolStore((state) => state.setToolInspect);
    const setToolEraser = useToolStore((state) => state.setToolEraser);
    const setToolGenesis = useToolStore((state) => state.setToolGenesis);

    const { activeToolId, linkSource, activeGenesisDna, genesisMode, showNebula, showDebugOverlay } = useGlobalUIStore();
    const setToolGenesisGlue = useToolStore((state) => state.setToolGenesisGlue);
    const setToolGenesisTransplant = useToolStore((state) => state.setToolGenesisTransplant);
    const setViewSettings = useToolStore((state) => state.setViewSettings);
    const setStoreWindowId = useToolStore((state) => state.setWindowId);

    // Init Window ID
    useEffect(() => {
        setStoreWindowId(windowId);
    }, [windowId, setStoreWindowId]);

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

        if (activeToolId === 'link') {
            if (linkSource) {
                // If global source exists, ensure local state matches
                if (interaction.type !== 'LINK_SOURCE_SELECTED' || interaction.sourceId !== linkSource.cellId) {
                    const isForeign = linkSource.windowId !== windowId;
                    toolStore.getState().setToolLinkSource?.(linkSource.cellId, isForeign);
                }
            } else {
                // If no global source, ensure we are in idle
                if (interaction.type !== 'LINK_IDLE') {
                    toolStore.getState().setToolLink();
                }
            }
        }

        if (activeToolId === 'genesis') {
            if (genesisMode === 'spawn') {
                if (activeGenesisDna) {
                    if (interaction.type !== 'GENESIS_IDLE' || interaction.dna.id !== activeGenesisDna.id) {
                        setToolGenesis(activeGenesisDna);
                    }
                } else {
                    const first = getAllCellTypes()[0];
                    if (first) {
                        if (interaction.type !== 'GENESIS_IDLE' || interaction.dna.id !== first.dna.id) {
                            setToolGenesis(first.dna);
                        }
                    }
                }
            } else if (genesisMode === 'transplant' && !type.startsWith('GENESIS_TRANSPLANT')) {
                setToolGenesisTransplant();
            } else if (genesisMode === 'glue' && !type.startsWith('GENESIS_GLUING')) {
                setToolGenesisGlue();
            }
        }

    }, [activeToolId, linkSource, interaction.type, interaction, setToolHand, setToolInspect, setToolEraser, setToolGenesis, setToolGenesisGlue, setToolGenesisTransplant, genesisMode, activeGenesisDna, toolStore]);

    // Sync View Settings
    useEffect(() => {
        setViewSettings({ showNebula, showDebugOverlay });
    }, [showNebula, showDebugOverlay, setViewSettings]);

    // Handle Cross-Window Link Updates
    useEffect(() => {
        const handleLinkUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { sourceId, url } = customEvent.detail;

            // Check if this window owns the source cell
            const cell = gridStore.getState().cells.get(sourceId);
            if (cell) {
                console.log(`[PetriDish] Received Link Update for ${sourceId}. Setting URL: ${url}`);
                const currentData = cell.state.data || {};
                gridStore.getState().updateCell(sourceId, {
                    state: {
                        ...cell.state,
                        data: {
                            ...currentData,
                            url
                        }
                    }
                });
            }
        };

        window.addEventListener('vibe-link-cell', handleLinkUpdate);
        return () => window.removeEventListener('vibe-link-cell', handleLinkUpdate);
    }, [gridStore]);

    const isGenesis = interaction.type.startsWith('GENESIS');
    const inspectingCellId = interaction.type === 'INSPECT_IDLE' ? interaction.targetId : null;

    // Use hook to get cell reactively
    const inspectingCell = useGridStore((state) =>
        inspectingCellId ? state.cells.get(inspectingCellId) : undefined
    );

    useEffect(() => {
        // One-time forceful load of the Masterpiece for portfolio users
        const loadedMasterpiece = localStorage.getItem('vibeManager_loaded_star_v11');
        if (!loadedMasterpiece) {
            gridStore.getState().importGrid(masterpieceDish);
            localStorage.setItem('vibeManager_loaded_star_v11', 'true');
            return;
        }

        const cells = gridStore.getState().cells;
        if (cells.size > 0) return;

        // Fallback for completely empty manual clears
        gridStore.getState().importGrid(masterpieceDish);
    }, [gridStore]);

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
            <TutorialOverlay />

            {inspectingCell && (
                <GenomeInspector
                    cell={inspectingCell}
                    onClose={() => clearInspection()}
                />
            )}
        </div>
    );
}
