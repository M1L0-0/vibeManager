/**
 * Grid Store - The "World State" of the Cellular OS
 * Uses Zustand for reactive state management
 */

import { create } from 'zustand';
import { Cell, PamDNA, Signal, PamModule, Particle } from '@/lib/vibe-core';
import { HexCoord, hexToId, getNeighbors } from '@/core/grid/hex';
import { CHANNELS, ChannelId } from '@/core/grid/channels';

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
    propagateSignal: (sourceId: string, signal: Signal, options?: { speed?: number, color?: string, type?: 'linear' | 'arc', directions?: number[] }) => void;
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

        neighbors.forEach((neighborCoord, directionIndex) => {
            // Filter by direction if mask provided
            // directionIndex corresponds to the neighbor index (0-5)
            if (options?.directions && !options.directions.includes(directionIndex)) {
                return;
            }

            const neighborId = hexToId(neighborCoord);
            const neighborCell = state.cells.get(neighborId);

            if (neighborCell) {
                // Determine particle color: Explicit override > Channel Color > Default
                let particleColor = options?.color || '#ffffff';

                if (!options?.color && signal.channelId) {
                    const channel = CHANNELS[signal.channelId as ChannelId];
                    if (channel) {
                        particleColor = channel.color;
                    }
                }

                // Handle Range Logic
                // If signal has a range, decrement it for the next hop
                const currentRange = signal.range !== undefined ? signal.range : 100; // Default infinite-ish
                if (currentRange <= 0) {
                    return; // Fizzle out
                }

                const nextSignal = {
                    ...signal,
                    range: currentRange - 1
                };

                newParticles.push({
                    id: `p-${Date.now()}-${Math.random()}`,
                    sourceId: sourceId,
                    targetId: neighborId,
                    signal: nextSignal, // Carry the decremented range
                    progress: 0,
                    speed: options?.speed || 5.0,
                    color: particleColor,
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
