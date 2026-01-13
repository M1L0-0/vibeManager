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
    // Allow deep partial for state updates
    updateCell: (cellId: string, updates: Omit<Partial<Cell>, 'state'> & { state?: Partial<Cell['state']> }) => void;
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
    // Centralized Propagation (Visuals + Delivery)
    propagateSignal: (sourceId: string, signal: Signal, options?: { speed?: number, color?: string, type?: 'linear' | 'arc', directions?: number[] }) => void;

    // Grouping
    mergeCells: (cellIdA: string, cellIdB: string) => void;
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

            // Apply update to target cell
            // We have to be careful with types here since updates.state is partial
            const updatedCell: Cell = {
                ...cell,
                ...updates,
                state: {
                    ...cell.state,
                    ...(updates.state || {})
                }
            };

            // Merge Data Deeply if present
            if (updates.state && updates.state.data) {
                updatedCell.state.data = { ...cell.state.data, ...updates.state.data };
            }

            newCells.set(cellId, updatedCell);

            // Group Synchronization
            // If cell belongs to a group, sync specific shared state to all peers
            // Shared state: color (in DNA? no, usually static), data properties (channel, speed, etc)
            // Excluded state: directions (per cell), activity (per cell)
            if (updatedCell.state.groupId) {
                const groupId = updatedCell.state.groupId;
                const sharedData = updates.state?.data;
                const sharedSeenSignals = updates.state?.seenSignals;

                // Sync these props to all group members
                state.cells.forEach((peer, peerId) => {
                    if (peer.state.groupId === groupId && peerId !== cellId) {
                        const newPeer = { ...peer };
                        let peerStateUpdated = false;

                        // Sync Data
                        if (sharedData) {
                            const { directions, ...trulySharedData } = sharedData;

                            // Protect own directions
                            const currentDirections = peer.state.data?.directions;
                            if (currentDirections) {
                                // If sharedData has directions, we might want to ignore it or not.
                                // Current strategy: Don't sync directions automatically via sharedData update
                            }

                            newPeer.state = {
                                ...peer.state,
                                data: {
                                    ...peer.state.data,
                                    ...trulySharedData,
                                    directions: peer.state.data?.directions || [0, 1, 2, 3, 4, 5] // Preserve own directions
                                }
                            };
                            peerStateUpdated = true;
                        }

                        // Sync Seen Signals (Critical for Group Immunity/Infinite Loop prevention)
                        if (sharedSeenSignals) {
                            if (!newPeer.state.seenSignals) {
                                newPeer.state.seenSignals = new Set(sharedSeenSignals);
                            } else {
                                // Union of sets
                                sharedSeenSignals.forEach(s => newPeer.state.seenSignals!.add(s));
                            }
                            peerStateUpdated = true;
                        }

                        if (peerStateUpdated) {
                            newCells.set(peerId, newPeer);
                        }
                    }
                });
            }

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

        // Unified Group Emission Logic
        // If source is part of a group, we treat the entire group as the source.
        const sourceGroupId = sourceCell.state.groupId;
        let emitters: Cell[] = [sourceCell];

        if (sourceGroupId) {
            // Find all cells in this group
            // Performance note: O(N) scan. For huge grids, use a separate group map.
            const groupMembers = Array.from(state.cells.values()).filter(c => c.state.groupId === sourceGroupId);
            if (groupMembers.length > 0) {
                emitters = groupMembers;
            }
        }

        const newParticles: Particle[] = [];

        // Emit from all emitters (or just the single source)
        emitters.forEach(emitter => {
            const neighbors = getNeighbors(emitter.coord);

            // Determine directions for THIS emitter
            // If options.directions is passed (override), use it? 
            // Or if it's a group emission, we should probably respect each cell's individual internal config
            // unless the signal is forcing a direction.
            // WaveCell.onClick passes `cell.state.data.directions`.
            // StructureEditor configures `cell.state.data.directions`.
            // So we should rely on `emitter.state.data.directions`.

            // BUT: propagateSignal call from WaveCell passes options.directions specifically for THAT cell.
            // If we are auto-expanding to group, we should look up directions for each peer.

            let emissionDirections = options?.directions;

            if (sourceGroupId && emitter.id !== sourceId) {
                // For peers, use their own configured directions
                emissionDirections = emitter.state.data?.directions;
            } else if (!emissionDirections && sourceGroupId) {
                // For source itself, if no override, use its data
                emissionDirections = emitter.state.data?.directions;
            }

            // Default to all if undefined
            if (!emissionDirections) emissionDirections = [0, 1, 2, 3, 4, 5];


            neighbors.forEach((neighborCoord, directionIndex) => {
                // Filter by direction
                if (emissionDirections && !emissionDirections.includes(directionIndex)) {
                    return;
                }

                const neighborId = hexToId(neighborCoord);
                const neighborCell = state.cells.get(neighborId);

                // Don't emit back into own group!
                if (neighborCell && neighborCell.state.groupId === sourceGroupId && sourceGroupId) {
                    return;
                }

                if (neighborCell) {
                    // Determine particle color
                    let particleColor = options?.color || '#ffffff';
                    if (!options?.color && signal.channelId) {
                        // ... logic same as before ... 
                        const channel = CHANNELS[signal.channelId as ChannelId];
                        if (channel) particleColor = channel.color;
                    }

                    // Handle Range Logic (same as before)
                    const currentRange = signal.range !== undefined ? signal.range : 100;
                    if (currentRange <= 0) return;

                    const nextSignal = { ...signal, range: currentRange - 1 };

                    newParticles.push({
                        id: `p-${Date.now()}-${Math.random()}`,
                        sourceId: emitter.id, // Emitting from THIS group member
                        targetId: neighborId,
                        signal: nextSignal,
                        progress: 0,
                        speed: options?.speed || 5.0,
                        color: particleColor,
                        type: options?.type || 'linear'
                    });
                }
            });
        });

        if (newParticles.length > 0) {
            set(state => ({
                particles: [...state.particles, ...newParticles]
            }));
        }
    },

    mergeCells: (cellIdA, cellIdB) => {
        set((state) => {
            const cellA = state.cells.get(cellIdA);
            const cellB = state.cells.get(cellIdB);

            if (!cellA || !cellB) return state;
            if (cellA.dna.id !== cellB.dna.id) {
                console.warn("Cannot merge different cell types");
                return state;
            }

            // Determine Group ID
            const groupA = cellA.state.groupId;
            const groupB = cellB.state.groupId;

            let finalGroupId = groupA || groupB || `group-${Date.now()}-${Math.random()}`;

            // If both have different groups, merge B's group into A's group
            // (Standard Union-Find logic, but here we just update all cells)
            if (groupA && groupB && groupA !== groupB) {
                finalGroupId = groupA; // Winner
            }

            const newCells = new Map(state.cells);

            // Function to update a cell to the new group
            const addToGroup = (id: string, masterData: any) => {
                const c = newCells.get(id);
                if (c) {
                    newCells.set(id, {
                        ...c,
                        state: {
                            ...c.state,
                            groupId: finalGroupId,
                            data: {
                                ...c.state.data,
                                ...masterData, // Sync data to match the master
                                // Keep own directions
                                directions: c.state.data?.directions || [0, 1, 2, 3, 4, 5]
                            }
                        }
                    });
                }
            };

            // Master data source (A takes precedence unless B was already in target group?)
            // Let's say A is always master for now, or whoever had the group.
            const masterData = cellA.state.data || {};

            // Update A and B
            addToGroup(cellIdA, masterData);
            addToGroup(cellIdB, masterData);

            // If merging two existing groups, find all their members and update them
            // This is O(N) over all cells, which is fine for small grids.
            // For larger grids, we might want a `groups` map.
            if ((groupA && groupA !== finalGroupId) || (groupB && groupB !== finalGroupId)) {
                state.cells.forEach((cell, id) => {
                    if (cell.state.groupId === groupA || cell.state.groupId === groupB) {
                        addToGroup(id, masterData);
                    }
                });
            }

            console.log(`Merged ${cellIdA} and ${cellIdB} into group ${finalGroupId}`);
            return { cells: newCells };
        });
    }
}));
