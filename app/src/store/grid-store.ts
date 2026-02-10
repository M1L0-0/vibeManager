/**
 * Grid Store - The "World State" of the Cellular OS
 * Uses Zustand for reactive state management
 */

import { create } from 'zustand';
import { Cell, PamDNA, Signal, PamModule, Particle } from '@/lib/vibe-core';
import { HexCoord, hexToId, getNeighbors, hexDistance } from '@/core/grid/hex';
import { CHANNELS, ChannelId } from '@/core/grid/channels';

interface GridState {
    // The world map: cellId -> Cell
    cells: Map<string, Cell>;

    // Group Index: groupId -> Set<cellId>
    // Optimizes O(N) lookups to O(1)
    groups: Map<string, Set<string>>;

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
    propagateSignal: (sourceId: string, signal: Signal, options?: { speed?: number, color?: string, type?: 'linear' | 'arc' | 'wobble', directions?: number[], wireless?: boolean }) => void;

    // Grouping
    mergeCells: (cellIdA: string, cellIdB: string) => void;
    // Serialization
    exportGrid: () => string;
    importGrid: (jsonString: string) => void;
}

export const useGridStore = create<GridState>((set, get) => ({
    cells: new Map(),
    groups: new Map(),
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
            const cell = state.cells.get(cellId);
            const newCells = new Map(state.cells);
            const newGroups = new Map(state.groups);

            // Clean up group index
            if (cell && cell.state.groupId) {
                const group = newGroups.get(cell.state.groupId);
                if (group) {
                    group.delete(cellId);
                    if (group.size === 0) {
                        newGroups.delete(cell.state.groupId);
                    }
                }
            }

            newCells.delete(cellId);
            // return { cells: newCells }; // BUG FIX: Return both if groups changed?
            // Actually Set and Map mutations in strict mode...
            // Zustand merge is shallow. If we mutate the Map inside `state.groups.get(...)`, that mutation persists if we don't clone the map.
            // But here we cloned newGroups.
            // However, we didn't clone the Set inside newGroups.
            // But since 'group' is a reference to the Set in the old map...
            // If we modify 'group' (delete), it modifies the Set in the old state too.
            // Strict immutability requires cloning the Set.
            // For performance, maybe we accept mutation of the Set if we treat it as an index? 
            // Better to be safe: Clone the Set if we modify it.

            // Let's implement helper to safe-delete from group
            /* 
               Actually, cleaner logic below:
            */
            return { cells: newCells, groups: newGroups };
        });
    },

    updateCell: (cellId, updates) => {
        set((state) => {
            // console.log('[GridStore] updateCell', cellId, updates);
            const cell = state.cells.get(cellId);
            if (!cell) {
                console.warn('[GridStore] updateCell: Cell not found', cellId);
                return state;
            }

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

            const oldGroupId = cell.state.groupId;
            const newGroupId = updatedCell.state.groupId;

            let newGroups = state.groups; // Check if we need to clone

            // Handle Group Index Changes
            if (oldGroupId !== newGroupId) {
                newGroups = new Map(state.groups);

                // Remove from old group
                if (oldGroupId) {
                    const oldGroupSet = new Set(newGroups.get(oldGroupId));
                    oldGroupSet.delete(cellId);
                    if (oldGroupSet.size === 0) {
                        newGroups.delete(oldGroupId);
                    } else {
                        newGroups.set(oldGroupId, oldGroupSet);
                    }
                }

                // Add to new group
                if (newGroupId) {
                    const newGroupSet = new Set(newGroups.get(newGroupId) || []);
                    newGroupSet.add(cellId);
                    newGroups.set(newGroupId, newGroupSet);
                }
            }

            // Group Synchronization (Existing logic, but update peer fetching)
            if (updatedCell.state.groupId) {
                const groupId = updatedCell.state.groupId;
                const sharedData = updates.state?.data;
                const sharedSeenSignals = updates.state?.seenSignals;

                // Sync to peers
                // Optimization: Use `newGroups` index instead of iterating `state.cells`
                const peers = newGroups.get(groupId); // Logic note: if we just added it, it's in newGroups

                if (peers) {
                    peers.forEach(peerId => {
                        if (peerId === cellId) return; // Skip self

                        // We need to get the peer cell from `newCells` (in case we updated multiple in one batch? No, updateCell is single)
                        // But we need the current peer state.
                        const peer = newCells.get(peerId);
                        if (!peer) return; // Should not happen if index is sync

                        const newPeer = { ...peer };
                        let peerStateUpdated = false;

                        // Sync Data
                        if (sharedData) {
                            const { directions, ...trulySharedData } = sharedData;

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

                        // Sync Seen Signals
                        if (sharedSeenSignals) {
                            if (!newPeer.state.seenSignals) {
                                newPeer.state.seenSignals = new Set(sharedSeenSignals);
                            } else {
                                sharedSeenSignals.forEach(s => newPeer.state.seenSignals!.add(s));
                            }
                            peerStateUpdated = true;
                        }

                        if (peerStateUpdated) {
                            newCells.set(peerId, newPeer);
                        }
                    });
                }
            }

            return { cells: newCells, groups: newGroups };
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
        console.log('[GridStore] propagateSignal', sourceId, signal.type);
        const state = get();
        const sourceCell = state.cells.get(sourceId);
        if (!sourceCell) {
            console.warn('[GridStore] propagateSignal: Source cell not found', sourceId);
            return;
        }

        // Unified Group Emission Logic
        // If source is part of a group, we treat the entire group as the source.
        const sourceGroupId = sourceCell.state.groupId;
        let emitters: Cell[] = [sourceCell];

        if (sourceGroupId) {
            // Find all cells in this group
            // OPTIMIZED: Use Group Index
            const groupSet = state.groups.get(sourceGroupId);
            if (groupSet) {
                // Clear emitters and repopulate from group to avoid duplication
                // (Since [sourceCell] was default)
                emitters = [];
                groupSet.forEach(memberId => {
                    const member = state.cells.get(memberId);
                    if (member) emitters.push(member);
                });
            } else {
                console.warn('[GridStore] propagateSignal: Group not found in index', sourceGroupId);
            }
        }

        // Ensure at least source if empty group (fallback)
        if (emitters.length === 0) {
            emitters.push(sourceCell);
        }

        console.log('[GridStore] Emitters count:', emitters.length);

        const newParticles: Particle[] = [];

        if (options?.wireless) {
            // --- Wireless / AoE Mode ---
            const range = signal.range || 10;
            const cells = Array.from(state.cells.values());

            emitters.forEach(emitter => {
                cells.forEach(target => {
                    if (target.id === emitter.id) return; // Don't target self
                    if (target.state.groupId && target.state.groupId === sourceGroupId) return; // Don't target own group

                    const dist = hexDistance(emitter.coord, target.coord);
                    if (dist > range) return;
                    if (dist === 0) return;

                    const remainingRange = range - dist;
                    if (remainingRange < 0) return;

                    const nextSignal = { ...signal, range: remainingRange };
                    const particleColor = options?.color || '#ffffff';

                    newParticles.push({
                        id: `p-${Date.now()}-${Math.random()}`,
                        sourceId: emitter.id,
                        targetId: target.id,
                        signal: nextSignal,
                        progress: 0,
                        speed: (options?.speed || 5.0) / Math.max(1, dist),
                        color: particleColor,
                        type: options?.type || 'arc'
                    });
                });
            });

            if (newParticles.length > 0) {
                set(state => ({
                    particles: [...state.particles, ...newParticles]
                }));
            }
            return;
        }

        // --- Standard Neighbor Propagation ---
        emitters.forEach(emitter => {
            const neighbors = getNeighbors(emitter.coord);
            let emissionDirections = options?.directions;

            if (sourceGroupId && emitter.id !== sourceId) {
                emissionDirections = emitter.state.data?.directions;
            } else if (!emissionDirections && sourceGroupId) {
                emissionDirections = emitter.state.data?.directions;
            }

            if (!emissionDirections) emissionDirections = [0, 1, 2, 3, 4, 5];

            console.log(`[GridStore] Processing emitter ${emitter.id} at ${emitter.coord.q},${emitter.coord.r}. Neighbors:`, neighbors);

            neighbors.forEach((neighborCoord, directionIndex) => {
                if (emissionDirections && !emissionDirections.includes(directionIndex)) {
                    return;
                }

                const neighborId = hexToId(neighborCoord);
                const neighborCell = state.cells.get(neighborId);

                if (neighborCell) console.log(`  -> Found neighbor ${neighborId}`);

                // Don't emit back into own group!
                if (neighborCell && neighborCell.state.groupId === sourceGroupId && sourceGroupId) {
                    return;
                }

                if (neighborCell) {
                    let particleColor = options?.color || '#ffffff';
                    if (!options?.color && signal.channelId) {
                        const channel = CHANNELS[signal.channelId as ChannelId];
                        if (channel) particleColor = channel.color;
                    }

                    const currentRange = signal.range !== undefined ? signal.range : 100;
                    if (currentRange <= 0) return;

                    const nextSignal = { ...signal, range: currentRange - 1 };

                    newParticles.push({
                        id: `p-${Date.now()}-${Math.random()}`,
                        sourceId: emitter.id,
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
                                directions: (c.state.data as any)?.directions || [0, 1, 2, 3, 4, 5]
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
            // OPTIMIZED: Use index if possible, but we are actively rebuilding the index anyway.
            // Since we iterate 'addToGroup' which sets existing cells...
            // Let's use the Index to find members of A and B efficiently instead of scanning all cells.

            const membersA = state.groups.get(groupA || '') || new Set<string>();
            const membersB = state.groups.get(groupB || '') || new Set<string>();

            // Note: If they didn't have groups, they might not be in the index? 
            // Logic: if groupA is undefined, membersA is empty.
            // But cellA itself needs processing.

            addToGroup(cellIdA, masterData);
            addToGroup(cellIdB, masterData);

            if (groupA) {
                membersA.forEach(id => addToGroup(id, masterData));
            }

            if (groupB) {
                membersB.forEach(id => addToGroup(id, masterData));
            }

            // Rebuild Groups Index for affected groups
            // We just mass-updated IDs to 'finalGroupId'.
            // The simplest way is to fetch the Set for finalGroupId and add everyone.
            // And delete the old groups.
            const newGroups = new Map(state.groups);

            const newGroupSet = new Set(newGroups.get(finalGroupId) || []);

            // Add A members
            if (groupA) {
                const oldSetA = newGroups.get(groupA); // This is reference to old state
                if (oldSetA) oldSetA.forEach(id => newGroupSet.add(id));
                newGroups.delete(groupA);
            }

            // Add B members
            if (groupB) {
                const oldSetB = newGroups.get(groupB);
                if (oldSetB) oldSetB.forEach(id => newGroupSet.add(id));
                newGroups.delete(groupB);
            }

            // Add the two specific cells (in case they weren't in a group before)
            newGroupSet.add(cellIdA);
            newGroupSet.add(cellIdB);

            newGroups.set(finalGroupId, newGroupSet);

            console.log(`Merged ${cellIdA} and ${cellIdB} into group ${finalGroupId}`);
            return { cells: newCells, groups: newGroups };
        });
    },

    exportGrid: () => {
        const state = get();
        // Serialize Cells (Map -> Array)
        const serializableCells = Array.from(state.cells.values()).map(cell => ({
            ...cell,
            state: {
                ...cell.state,
                seenSignals: cell.state.seenSignals ? Array.from(cell.state.seenSignals) : []
            }
        }));

        return JSON.stringify({
            version: "1.0",
            timestamp: Date.now(),
            cells: serializableCells
        }, null, 2);
    },

    importGrid: (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);

            if (!data.cells || !Array.isArray(data.cells)) {
                console.error("Invalid grid file format");
                return;
            }

            const newCells = new Map<string, Cell>();
            const newGroups = new Map<string, Set<string>>();

            // Should clear previous state? Yes.
            // But we need to handle the import carefully.

            data.cells.forEach((rawCell: any) => {
                const cell: Cell = {
                    ...rawCell,
                    state: {
                        ...rawCell.state,
                        seenSignals: new Set(rawCell.state.seenSignals || [])
                    }
                };

                newCells.set(cell.id, cell);

                // Rebuild Group Index
                if (cell.state.groupId) {
                    const groupSet = newGroups.get(cell.state.groupId) || new Set();
                    groupSet.add(cell.id);
                    newGroups.set(cell.state.groupId, groupSet);
                }
            });

            set({
                cells: newCells,
                groups: newGroups,
                signals: [],
                particles: []
            });
            console.log(`Imported ${newCells.size} cells successfully.`);
            console.log('Rebuilt Groups:', newGroups.size);
            if (data.cells.length > 0) {
                console.log('Importing Cell 0 coord type:', typeof data.cells[0]?.coord?.q);
            }

        } catch (e) {
            console.error("Failed to import grid:", e);
        }
    }
}));
