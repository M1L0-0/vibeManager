import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { createContext, useContext } from 'react';
import { PamDNA, Cell } from '@/lib/vibe-core';
import { getPamModule } from '@/pams/registry';
import { GridStore } from './grid-store';
import { hexToPixel, pixelToHex, HexCoord, hexToId } from '@/core/grid/hex';

interface Point { x: number; y: number; }

// --- View State ---

export interface ViewState {
    showSynapticVision: boolean;
    showNebula: boolean;
    showDebugOverlay: boolean;
    pan: { x: number; y: number };
    zoom: number;
    // Selection View State
    selectionRect?: { start: Point; end: Point };
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
    | { type: 'GENESIS_GLUING_TARGET', sourceId: string } // Selecting target
    | { type: 'ERASER_IDLE' } // Erasing cells
    | { type: 'SELECT_IDLE' }
    | { type: 'SELECT_DRAGGING' }
    | { type: 'PASTE_IDLE' };

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
    debugSelectedId: string | undefined; // Last clicked cell for debug panel

    // Selection State
    selection: Set<string>; // Selected Cell IDs
    setSelection: (ids: Set<string>) => void;
    clearSelection: () => void;
    startSelection: (pos: Point) => void;
    updateSelection: (pos: Point) => void;
    endSelection: () => void;

    // View Actions
    toggleSynapticVision: () => void;
    toggleNebula: () => void;
    toggleDebugOverlay: () => void;
    setPan: (pan: { x: number; y: number }) => void;
    setZoom: (zoom: number) => void;
    setViewSettings: (settings: Partial<ViewState>) => void;

    // FSM Transitions
    setToolHand: () => void;
    setToolInspect: () => void;
    setToolGenesis: (dna: PamDNA) => void;
    setToolGenesisGlue: () => void;
    setToolGenesisTransplant: () => void;
    setToolEraser: () => void;
    setToolSelect: () => void;
    setToolPaste: () => void;

    // Main Event Handler (The "Reducer")
    handleGridEvent: (event: GridEvent) => void;

    // Helper to clear inspection (can be triggered by UI close)
    clearInspection: () => void;
}

export type ToolStore = ReturnType<typeof createToolStore>;

export const createToolStore = (gridStore: GridStore) => createStore<ToolStoreState>((set, get) => ({
    view: {
        showSynapticVision: true,
        showNebula: true,
        showDebugOverlay: false,
        pan: { x: 0, y: 0 },
        zoom: 1,
    },

    interaction: { type: 'HAND_IDLE' },
    debugSelectedId: undefined,
    selection: new Set(),

    // --- View Actions ---
    toggleSynapticVision: () => set(state => ({
        view: { ...state.view, showSynapticVision: !state.view.showSynapticVision }
    })),

    toggleNebula: () => set(state => ({
        view: { ...state.view, showNebula: !state.view.showNebula }
    })),

    toggleDebugOverlay: () => set(state => ({
        view: { ...state.view, showDebugOverlay: !state.view.showDebugOverlay }
    })),

    setPan: (pan) => set(state => ({
        view: { ...state.view, pan }
    })),

    setZoom: (zoom) => set(state => ({
        view: { ...state.view, zoom }
    })),

    setViewSettings: (settings) => set(state => ({
        view: { ...state.view, ...settings }
    })),

    // --- FSM Transitions ---
    setToolHand: () => set({ interaction: { type: 'HAND_IDLE' } }),
    setToolInspect: () => set({ interaction: { type: 'INSPECT_IDLE' } }),
    setToolGenesis: (dna) => set({ interaction: { type: 'GENESIS_IDLE', dna } }),
    setToolGenesisGlue: () => set({ interaction: { type: 'GENESIS_GLUING_SOURCE' } }),
    setToolGenesisTransplant: () => set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } }),
    setToolEraser: () => set({ interaction: { type: 'ERASER_IDLE' } }),
    setToolSelect: () => set({
        interaction: { type: 'SELECT_IDLE' },
        view: { ...get().view, selectionRect: undefined }
    }),
    setToolPaste: () => set({ interaction: { type: 'PASTE_IDLE' } }),

    // --- Selection ---
    setSelection: (selection) => set({ selection }),
    clearSelection: () => set({ selection: new Set(), view: { ...get().view, selectionRect: undefined } }),

    startSelection: (pos) => set(state => ({
        interaction: { type: 'SELECT_DRAGGING' },
        view: { ...state.view, selectionRect: { start: pos, end: pos } }
    })),

    updateSelection: (pos) => set(state => {
        if (!state.view.selectionRect) return {};
        return {
            view: { ...state.view, selectionRect: { ...state.view.selectionRect, end: pos } }
        };
    }),

    endSelection: () => {
        const state = get();
        const selectionRect = state.view.selectionRect;
        if (!selectionRect) {
            set({ interaction: { type: 'SELECT_IDLE' } });
            return;
        }

        const { start, end } = selectionRect;
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        console.log(`[ToolStore] End Selection. Bounds: [${minX.toFixed(2)}, ${maxX.toFixed(2)}] x [${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);

        const allCells = gridStore.getState().getAllCells();
        const newSelection = new Set<string>();

        const HEX_SIZE = 40;
        const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
        const HEX_HEIGHT = 2 * HEX_SIZE;
        const halfW = HEX_WIDTH / 2;
        const halfH = HEX_HEIGHT / 2;

        let matchCount = 0;
        allCells.forEach(cell => {
            const pos = hexToPixel(cell.coord);
            const cellMinX = pos.x - halfW;
            const cellMaxX = pos.x + halfW;
            const cellMinY = pos.y - halfH;
            const cellMaxY = pos.y + halfH;

            const overlaps = (minX < cellMaxX) && (maxX > cellMinX) && (minY < cellMaxY) && (maxY > cellMinY);
            if (overlaps) {
                newSelection.add(cell.id);
                matchCount++;
            }
        });

        console.log(`[ToolStore] Selected ${matchCount} cells.`);

        set({
            selection: newSelection,
            view: { ...state.view, selectionRect: undefined },
            interaction: { type: 'SELECT_IDLE' }
        });
    },

    clearInspection: () => {
        const current = get().interaction;
        if (current.type === 'INSPECT_IDLE') {
            set({ interaction: { type: 'INSPECT_IDLE', targetId: undefined } });
        }
    },

    // --- Main Event Reducer ---
    handleGridEvent: (event) => {
        const state = get().interaction;
        // Access provided store instance

        // Global Debug
        if (event.type === 'CLICK' || event.type === 'RIGHT_CLICK') {
            set({ debugSelectedId: event.cell.id });
        }

        switch (state.type) {
            case 'HAND_IDLE': {
                if (event.type === 'CLICK') {
                    const pam = getPamModule(event.cell.dna.id);
                    pam?.onClick?.(event.cell, gridStore);
                }
                if (event.type === 'RIGHT_CLICK') {
                    if (event.cell.dna.id === 'timer') {
                        const data = event.cell.state.data;
                        if (data) {
                            gridStore.getState().updateCell(event.cell.id, {
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
                    gridStore.getState().killCell(event.cell.id);
                    const pam = getPamModule(state.dna.id);
                    gridStore.getState().spawnCell(event.cell.coord, state.dna, pam);
                }
                if (event.type === 'BACKGROUND_CLICK') {
                    const pam = getPamModule(state.dna.id);
                    gridStore.getState().spawnCell(event.coord, state.dna, pam);
                }
                break;
            }

            case 'ERASER_IDLE': {
                if (event.type === 'CLICK') {
                    gridStore.getState().killCell(event.cell.id);
                }
                break;
            }

            case 'GENESIS_TRANSPLANT_IDLE': {
                if (event.type === 'MOUSE_DOWN') {
                    set({ interaction: { type: 'GENESIS_DRAGGING', cell: event.cell } });
                }
                if (event.type === 'CLICK') {
                    set({ interaction: { type: 'GENESIS_HOLDING', cell: event.cell, ignoreNextClick: false } });
                }
                break;
            }

            case 'GENESIS_DRAGGING': {
                if (event.type === 'MOUSE_UP') {
                    const draggingCell = state.cell;
                    const targetCell = event.cell;

                    if (draggingCell.id === targetCell.id) {
                        set({ interaction: { type: 'GENESIS_HOLDING', cell: draggingCell, ignoreNextClick: true } });
                        return;
                    }

                    // Swap Logic
                    const sourceCoord = draggingCell.coord;
                    const targetCoord = targetCell.coord;
                    const sourceDNA = draggingCell.dna;
                    const targetDNA = targetCell.dna;
                    const sourceState = draggingCell.state;
                    const targetState = targetCell.state;

                    gridStore.getState().killCell(draggingCell.id);
                    gridStore.getState().killCell(targetCell.id);

                    const sourcePam = getPamModule(sourceDNA.id);
                    const targetPam = getPamModule(targetDNA.id);

                    gridStore.getState().spawnCell(targetCoord, sourceDNA, sourcePam);
                    gridStore.getState().spawnCell(sourceCoord, targetDNA, targetPam);

                    // Restore state after spawn
                    setTimeout(() => {
                        const newTargetCell = gridStore.getState().getCellAt(targetCoord);
                        const newSourceCell = gridStore.getState().getCellAt(sourceCoord);
                        if (newTargetCell) gridStore.getState().updateCell(newTargetCell.id, { state: sourceState });
                        if (newSourceCell) gridStore.getState().updateCell(newSourceCell.id, { state: targetState });
                    }, 10);

                    set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } });
                }
                break;
            }

            case 'GENESIS_HOLDING': {
                if (event.type === 'CLICK') {
                    if (state.ignoreNextClick) {
                        set({ interaction: { type: 'GENESIS_HOLDING', cell: state.cell, ignoreNextClick: false } });
                        return;
                    }

                    const holdingCell = state.cell;
                    const targetCell = event.cell;

                    if (holdingCell.id === targetCell.id) {
                        set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } });
                        return;
                    }

                    // Swap Logic (Same as above)
                    const sourceCoord = holdingCell.coord;
                    const targetCoord = targetCell.coord;
                    const sourceDNA = holdingCell.dna;
                    const targetDNA = targetCell.dna;
                    const sourceState = holdingCell.state;
                    const targetState = targetCell.state;

                    gridStore.getState().killCell(holdingCell.id);
                    gridStore.getState().killCell(targetCell.id);

                    const sourcePam = getPamModule(sourceDNA.id);
                    const targetPam = getPamModule(targetDNA.id);

                    gridStore.getState().spawnCell(targetCoord, sourceDNA, sourcePam);
                    gridStore.getState().spawnCell(sourceCoord, targetDNA, targetPam);

                    setTimeout(() => {
                        const newTargetCell = gridStore.getState().getCellAt(targetCoord);
                        const newSourceCell = gridStore.getState().getCellAt(sourceCoord);
                        if (newTargetCell) gridStore.getState().updateCell(newTargetCell.id, { state: sourceState });
                        if (newSourceCell) gridStore.getState().updateCell(newSourceCell.id, { state: targetState });
                    }, 10);

                    set({ interaction: { type: 'GENESIS_TRANSPLANT_IDLE' } });
                }
                break;
            }

            case 'GENESIS_GLUING_SOURCE': {
                if (event.type === 'CLICK') {
                    set({ interaction: { type: 'GENESIS_GLUING_TARGET', sourceId: event.cell.id } });
                }
                break;
            }

            case 'GENESIS_GLUING_TARGET': {
                if (event.type === 'CLICK') {
                    if (state.sourceId === event.cell.id) {
                        set({ interaction: { type: 'GENESIS_GLUING_SOURCE' } });
                        return;
                    }
                    gridStore.getState().mergeCells(state.sourceId, event.cell.id);
                    set({ interaction: { type: 'GENESIS_GLUING_SOURCE' } });
                }
                break;
            }

            case 'SELECT_IDLE': {
                if (event.type === 'CLICK') {
                    const currentSelection = new Set(get().selection);
                    if (currentSelection.has(event.cell.id)) {
                        currentSelection.delete(event.cell.id);
                    } else {
                        currentSelection.add(event.cell.id);
                    }
                    set({ selection: currentSelection });
                }
                if (event.type === 'BACKGROUND_CLICK') {
                    set({ selection: new Set() });
                }
                break;
            }

            case 'PASTE_IDLE': {
                if (event.type === 'CLICK' || event.type === 'BACKGROUND_CLICK') {
                    const targetCoord = event.type === 'CLICK' ? event.cell.coord : event.coord;
                    gridStore.getState().paste(targetCoord);
                    // Stay in PASTE_IDLE for multi-paste/stamping
                    // set({ interaction: { type: 'HAND_IDLE' } });
                }
                break;
            }
        }
    }
}));

export const ToolStoreContext = createContext<ToolStore | null>(null);

export function useToolStore<T>(selector: (state: ToolStoreState) => T): T {
    const store = useContext(ToolStoreContext);
    if (!store) throw new Error('Missing ToolStoreContext.Provider in the tree');
    return useStore(store, selector);
}

export function useToolStoreApi() {
    const store = useContext(ToolStoreContext);
    if (!store) throw new Error('Missing ToolStoreContext.Provider in the tree');
    return store;
}
