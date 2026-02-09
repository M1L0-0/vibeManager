/**
 * Tool Store - Manages the current UI tool state machine
 */

import { create } from 'zustand';
import { PamDNA, Cell } from '@/lib/vibe-core';
import { getPamModule } from '@/pams/registry';
import { useGridStore } from './grid-store';

// --- View State ---

export interface ViewState {
    showSynapticVision: boolean;
    showNebula: boolean;
    pan: { x: number; y: number };
    zoom: number;
    // future: showHeatmap, showGridLines, showDebugOverlay
}

// --- Interaction (FSM) State ---

export type InteractionState =
    | { type: 'HAND_IDLE' }
    | { type: 'INSPECT_IDLE', targetId?: string }
    | { type: 'GENESIS_IDLE', dna: PamDNA } // Spawning
    | { type: 'GENESIS_TRANSPLANT_IDLE' } // Ready to drag
    | { type: 'GENESIS_DRAGGING', cell: Cell } // Currently dragging
    | { type: 'GENESIS_HOLDING', cell: Cell, ignoreNextClick: boolean } // Clicked and holding (for 2-step move)
    | { type: 'GENESIS_GLUING_SOURCE' } // Selecting source
    | { type: 'GENESIS_GLUING_SOURCE' } // Selecting source
    | { type: 'GENESIS_GLUING_TARGET', sourceId: string } // Selecting target
    | { type: 'ERASER_IDLE' }; // Erasing cells

// --- Actions / Events ---

type GridEvent =
    | { type: 'CLICK', cell: Cell }
    | { type: 'MOUSE_DOWN', cell: Cell }
    | { type: 'MOUSE_UP', cell: Cell }
    | { type: 'CLICK', cell: Cell }
    | { type: 'MOUSE_DOWN', cell: Cell }
    | { type: 'MOUSE_UP', cell: Cell }
    | { type: 'RIGHT_CLICK', cell: Cell }
    | { type: 'BACKGROUND_CLICK', coord: { q: number; r: number } };

export interface ToolStoreState {
    // Slices
    view: ViewState;
    interaction: InteractionState;

    // View Actions
    toggleSynapticVision: () => void;
    toggleNebula: () => void;
    setPan: (pan: { x: number; y: number }) => void;
    setZoom: (zoom: number) => void;

    // FSM Transitions
    setToolHand: () => void;
    setToolInspect: () => void;
    setToolGenesis: (dna: PamDNA) => void;
    setToolGenesisGlue: () => void;
    setToolGenesis: (dna: PamDNA) => void;
    setToolGenesisGlue: () => void;
    setToolGenesisTransplant: () => void;
    setToolEraser: () => void;

    // Main Event Handler (The "Reducer")
    handleGridEvent: (event: GridEvent) => void;

    // Helper to clear inspection (can be triggered by UI close)
    clearInspection: () => void;
}

export const useToolStore = create<ToolStoreState>((set, get) => ({
    view: {
        showSynapticVision: false,
        showNebula: true, // Default to on
        pan: { x: 0, y: 0 },
        zoom: 1,
    },

    interaction: { type: 'HAND_IDLE' },

    // --- View Actions ---

    toggleSynapticVision: () => set(state => ({
        view: { ...state.view, showSynapticVision: !state.view.showSynapticVision }
    })),

    toggleNebula: () => set(state => ({
        view: { ...state.view, showNebula: !state.view.showNebula }
    })),

    setPan: (pan) => set(state => ({
        view: { ...state.view, pan }
    })),

    setZoom: (zoom) => set(state => ({
        view: { ...state.view, zoom }
    })),

    // --- FSM Transitions (Tool Selection) ---

    setToolHand: () => set({ interaction: { type: 'HAND_IDLE' } }),

    setToolInspect: () => set({ interaction: { type: 'INSPECT_IDLE' } }), // Clears any target

    setToolGenesis: (dna) => set({ interaction: { type: 'GENESIS_IDLE', dna } }), // Default to simple spawn mode for that DNA

    setToolGenesisGlue: () => set({ interaction: { type: 'GENESIS_GLUING_SOURCE' } }),

    setToolGenesisTransplant: () => set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } }),

    setToolEraser: () => set({ interaction: { type: 'ERASER_IDLE' } }),

    clearInspection: () => {
        const current = get().interaction;
        if (current.type === 'INSPECT_IDLE') {
            set({ interaction: { type: 'INSPECT_IDLE', targetId: undefined } });
        }
    },

    // --- Main Event Reducer ---

    handleGridEvent: (event) => {
        const state = get().interaction;
        const gridStore = useGridStore.getState();
        // Note: Accessing gridStore here is safe because actions are invoked at runtime

        switch (state.type) {
            case 'HAND_IDLE': {
                if (event.type === 'CLICK') {
                    // Trigger PAM onClick
                    const pam = getPamModule(event.cell.dna.id);
                    pam?.onClick?.(event.cell);
                }
                if (event.type === 'RIGHT_CLICK') {
                    // Right click logic (e.g. Timer Reset)
                    // Re-implementing specific right-click logic or delegating to PAM?
                    // Previous logic was hardcoded in HexGrid. Let's keep it robust.
                    if (event.cell.dna.id === 'timer') {
                        const data = event.cell.state.data;
                        if (data) {
                            console.log(`🔄 Timer Cell ${event.cell.id}: Reset via right-click`);
                            gridStore.updateCell(event.cell.id, {
                                state: {
                                    ...event.cell.state,
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
                }
                break;
            }

            case 'INSPECT_IDLE': {
                if (event.type === 'CLICK') {
                    set({ interaction: { type: 'INSPECT_IDLE', targetId: event.cell.id } });
                }
                break;
            }

            case 'GENESIS_IDLE': {
                if (event.type === 'CLICK') {
                    console.log(`🧬 Spawning ${state.dna.name} at ${event.cell.coord.q},${event.cell.coord.r}`);
                    gridStore.killCell(event.cell.id);
                    const pam = getPamModule(state.dna.id);
                    gridStore.spawnCell(event.cell.coord, state.dna, pam);
                }
                if (event.type === 'BACKGROUND_CLICK') {
                    console.log(`🧬 Spawning ${state.dna.name} on BACKGROUND at ${event.coord.q},${event.coord.r}`);
                    // Spawn on empty space
                    // Check if occupied? (GridStore handles this check usually, but safely)
                    const pam = getPamModule(state.dna.id);
                    gridStore.spawnCell(event.coord, state.dna, pam);
                }
                break;
            }

            case 'ERASER_IDLE': {
                if (event.type === 'CLICK') {
                    console.log(`🗑️ Eraser: Killing cell ${event.cell.id}`);
                    gridStore.killCell(event.cell.id);
                }
                break;
            }

            case 'GENESIS_TRANSPLANT_IDLE': {
                if (event.type === 'MOUSE_DOWN') {
                    // Start Dragging
                    set({ interaction: { type: 'GENESIS_DRAGGING', cell: event.cell } });
                }
                // Allow selecting directly via click (redundant but safe)
                if (event.type === 'CLICK') {
                    set({ interaction: { type: 'GENESIS_HOLDING', cell: event.cell, ignoreNextClick: false } });
                }
                break;
            }

            case 'GENESIS_DRAGGING': {
                if (event.type === 'MOUSE_UP') {
                    // Completing the drag
                    const draggingCell = state.cell;
                    const targetCell = event.cell;

                    if (draggingCell.id === targetCell.id) {
                        // Dropped on self -> Transition to HOLDING (Click-to-pick-up behavior)
                        // We set ignoreNextClick=true because a CLICK event will typically follow this MouseUp immediately
                        set({ interaction: { type: 'GENESIS_HOLDING', cell: draggingCell, ignoreNextClick: true } });
                        return;
                    }

                    console.log(`🔬 Transplanting (Drag) from ${draggingCell.id} to ${targetCell.id}`);

                    // Logic copied from previous HexGrid handler
                    const sourceCoord = draggingCell.coord;
                    const targetCoord = targetCell.coord;
                    const sourceDNA = draggingCell.dna;
                    const targetDNA = targetCell.dna;
                    const sourceState = draggingCell.state;
                    const targetState = targetCell.state;

                    // Kill both cells
                    gridStore.killCell(draggingCell.id);
                    gridStore.killCell(targetCell.id);

                    // Swap
                    const sourcePam = getPamModule(sourceDNA.id);
                    const targetPam = getPamModule(targetDNA.id);

                    gridStore.spawnCell(targetCoord, sourceDNA, sourcePam);
                    gridStore.spawnCell(sourceCoord, targetDNA, targetPam);

                    setTimeout(() => {
                        const newTargetCell = gridStore.getCellAt(targetCoord);
                        const newSourceCell = gridStore.getCellAt(sourceCoord);

                        if (newTargetCell) gridStore.updateCell(newTargetCell.id, { state: sourceState });
                        if (newSourceCell) gridStore.updateCell(newSourceCell.id, { state: targetState });
                    }, 10);

                    // Return to idle
                    set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } });
                }
                break;
            }

            case 'GENESIS_HOLDING': {
                if (event.type === 'CLICK') {
                    if (state.ignoreNextClick) {
                        // Consume the immediate click from the MouseUp that put us here
                        set({ interaction: { type: 'GENESIS_HOLDING', cell: state.cell, ignoreNextClick: false } });
                        return;
                    }

                    const holdingCell = state.cell;
                    const targetCell = event.cell;

                    if (holdingCell.id === targetCell.id) {
                        // Clicked self again -> Deselect/Put down
                        console.log(`🔬 Transplant Cancelled`);
                        set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } });
                        return;
                    }

                    console.log(`🔬 Transplanting (Click) from ${holdingCell.id} to ${targetCell.id}`);

                    // Swap Logic (Duplicated for now, could be helper)
                    const sourceCoord = holdingCell.coord;
                    const targetCoord = targetCell.coord;
                    const sourceDNA = holdingCell.dna;
                    const targetDNA = targetCell.dna;
                    const sourceState = holdingCell.state;
                    const targetState = targetCell.state;

                    gridStore.killCell(holdingCell.id);
                    gridStore.killCell(targetCell.id);

                    const sourcePam = getPamModule(sourceDNA.id);
                    const targetPam = getPamModule(targetDNA.id);

                    gridStore.spawnCell(targetCoord, sourceDNA, sourcePam);
                    gridStore.spawnCell(sourceCoord, targetDNA, targetPam);

                    setTimeout(() => {
                        const newTargetCell = gridStore.getCellAt(targetCoord);
                        const newSourceCell = gridStore.getCellAt(sourceCoord);

                        if (newTargetCell) gridStore.updateCell(newTargetCell.id, { state: sourceState });
                        if (newSourceCell) gridStore.updateCell(newSourceCell.id, { state: targetState });
                    }, 10);

                    set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } });
                }
                break;
            }

            case 'GENESIS_GLUING_SOURCE': {
                if (event.type === 'CLICK') {
                    console.log(`🔗 Glue: Selected source ${event.cell.id}`);
                    set({ interaction: { type: 'GENESIS_GLUING_TARGET', sourceId: event.cell.id } });
                }
                break;
            }

            case 'GENESIS_GLUING_TARGET': {
                if (event.type === 'CLICK') {
                    if (state.sourceId === event.cell.id) {
                        // Clicked same cell -> Deselect
                        set({ interaction: { type: 'GENESIS_GLUING_SOURCE' } });
                        return;
                    }
                    console.log(`🔗 Glue: Merging ${state.sourceId} + ${event.cell.id}`);
                    gridStore.mergeCells(state.sourceId, event.cell.id);
                    // Reset to Source selection for next merge
                    set({ interaction: { type: 'GENESIS_GLUING_SOURCE' } });
                }
                break;
            }
        }

        // --- Global Transitions (Drag Logic) ---
        // This is tricky. Dragging usually starts from MOUSE_DOWN.
        // We only want to allow dragging if we are in "Transplant Mode".
        // Use setToolGenesisTransplant() (need to add this) to enter that mode.
    },
}));
