/**
 * Grid Store - The "World State" of the Cellular OS
 * Uses Zustand for reactive state management
 */

import { create } from 'zustand';
import { Cell, PamDNA, Signal, PamModule } from '@/lib/vibe-core';
import { HexCoord, hexToId } from '@/core/grid/hex';

interface GridState {
    // The world map: cellId -> Cell
    cells: Map<string, Cell>;

    // Active signals being propagated
    signals: Signal[];

    // Actions
    spawnCell: (coord: HexCoord, dna: PamDNA, pamModule?: PamModule) => void;
    killCell: (cellId: string) => void;
    updateCell: (cellId: string, updates: Partial<Cell>) => void;
    addSignal: (signal: Signal) => void;
    clearSignals: () => void;

    // Getters
    getCellAt: (coord: HexCoord) => Cell | undefined;
    getAllCells: () => Cell[];
}

export const useGridStore = create<GridState>((set, get) => ({
    cells: new Map(),
    signals: [],

    spawnCell: (coord, dna, pamModule) => {
        const cellId = hexToId(coord);
        const existing = get().cells.get(cellId);

        if (existing) {
            console.warn(`Cell already exists at ${cellId}`);
            return;
        }

        const newCell: Cell = {
            id: cellId,
            coord,
            dna,
            state: {
                energy: 100,
                activity: 0,
                data: {},
            },
            signals: [],
            createdAt: Date.now(),
        };

        // Call onSpawn lifecycle if provided
        if (pamModule?.onSpawn) {
            pamModule.onSpawn(newCell);
        }

        set((state) => {
            const newCells = new Map(state.cells);
            newCells.set(cellId, newCell);
            return { cells: newCells };
        });
    },

    killCell: (cellId) => {
        set((state) => {
            const newCells = new Map(state.cells);
            newCells.delete(cellId);
            return { cells: newCells };
        });
    },

    updateCell: (cellId, updates) => {
        set((state) => {
            const cell = state.cells.get(cellId);
            if (!cell) return state;

            const newCells = new Map(state.cells);
            newCells.set(cellId, { ...cell, ...updates });
            return { cells: newCells };
        });
    },

    addSignal: (signal) => {
        set((state) => ({
            signals: [...state.signals, signal],
        }));
    },

    clearSignals: () => {
        set({ signals: [] });
    },

    getCellAt: (coord) => {
        const cellId = hexToId(coord);
        return get().cells.get(cellId);
    },

    getAllCells: () => {
        return Array.from(get().cells.values());
    },
}));
