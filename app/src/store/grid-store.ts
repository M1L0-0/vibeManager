/**
 * Grid Store - The "World State" of the Cellular OS
 * Uses Zustand for reactive state management
 */

import { create } from 'zustand';
import { Cell, PamDNA, Signal, PamModule, Particle } from '@/lib/vibe-core';
import { HexCoord, hexToId, getNeighbors } from '@/core/grid/hex';

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

    // Particles (Visual Signals)
    particles: Particle[];
    addParticle: (particle: Particle) => void;
    removeParticle: (particleId: string) => void;
    updateParticles: (updater: (particles: Particle[]) => Particle[]) => void;

    // Atomic Signal Delivery
    deliverSignal: (cellId: string, signal: Signal) => void;

    // Centralized Propagation (Visuals + Delivery)
    propagateSignal: (sourceId: string, signal: Signal, options?: { speed?: number, color?: string, type?: 'linear' | 'arc' }) => void;
}

export const useGridStore = create<GridState>((set, get) => ({
    cells: new Map(),
    signals: [],
    particles: [],

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

    addParticle: (particle) => {
        set((state) => ({
            particles: [...state.particles, particle],
        }));
    },

    removeParticle: (particleId) => {
        set((state) => ({
            particles: state.particles.filter((p) => p.id !== particleId),
        }));
    },

    updateParticles: (updater) => {
        set((state) => ({
            particles: updater(state.particles),
        }));
    },

    deliverSignal: (cellId, signal) => {
        set((state) => {
            const cell = state.cells.get(cellId);
            if (!cell) return state;

            const newCells = new Map(state.cells);
            // Append new signal to existing signals
            newCells.set(cellId, { ...cell, signals: [...cell.signals, signal] });
            return { cells: newCells };
        });
    },

    propagateSignal: (sourceId, signal, options) => {
        const state = get();
        const sourceCell = state.cells.get(sourceId);
        if (!sourceCell) return;

        const neighbors = getNeighbors(sourceCell.coord);

        // We'll add particles for valid neighbors
        const newParticles: Particle[] = [];

        neighbors.forEach(neighborCoord => {
            const neighborId = hexToId(neighborCoord);
            const neighborCell = state.cells.get(neighborId);

            if (neighborCell) {
                newParticles.push({
                    id: `p-${Date.now()}-${Math.random()}`,
                    sourceId: sourceId,
                    targetId: neighborId,
                    signal: signal,
                    progress: 0,
                    speed: options?.speed || 5.0,
                    color: options?.color || '#ffffff',
                    type: options?.type || 'linear'
                });
            }
        });

        if (newParticles.length > 0) {
            set(state => ({
                particles: [...state.particles, ...newParticles]
            }));
        }
    }
}));
