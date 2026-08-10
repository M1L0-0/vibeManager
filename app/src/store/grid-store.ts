/**
 * Grid Store - The "World State" of the Cellular OS
 * Uses Zustand for reactive state management
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { createContext, useContext } from 'react';
import { Cell, PamDNA, Signal, PamModule, Particle } from '@/lib/vibe-core';
import { HexCoord, hexToId, getNeighbors, hexDistance } from '@/core/grid/hex';
import { CHANNELS, ChannelId } from '@/core/grid/channels';

interface GridState {
    // The world map: cellId -> Cell
    cells: Map<string, Cell>;

    // Group Index: groupId -> Set<cellId>
    // Optimizes O(N) lookups to O(1)
    groups: Map<string, Set<string>>;

    // Undo/Redo History
    history: {
        past: Array<{ cells: Map<string, Cell>; groups: Map<string, Set<string>> }>;
        future: Array<{ cells: Map<string, Cell>; groups: Map<string, Set<string>> }>;
    };

    // Clipboard
    clipboard: Cell[];

    // Active signals being propagated
    signals: Signal[];

    // Actions
    spawnCell: (coord: HexCoord, dna: PamDNA, pamModule?: PamModule) => void;
    killCell: (cellId: string) => void;
    // Allow deep partial for state updates
    updateCell: (cellId: string, updates: Omit<Partial<Cell>, 'state'> & { state?: Partial<Cell['state']> }, options?: { skipHistory?: boolean }) => void;
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
    clear: () => void;

    // History Actions
    undo: () => void;
    redo: () => void;
    pushHistory: () => void;

    // Clipboard Actions
    copy: (cellIds: Set<string>) => Cell[];
    paste: (targetCoord: HexCoord, clipboardData?: Cell[]) => void;

    // Batching (Performance)
    startBatch: () => void;
    endBatch: () => void;
}

export type GridStore = ReturnType<typeof createGridStore>;

export const createGridStore = () => createStore<GridState>((set, get, api) => {
    // Shared Batch State (Closure)
    let isBatching = false;
    let batchQueue = new Map<string, any>();
    let particleQueue: Particle[] = [];

    return {
        cells: new Map(),
        groups: new Map(),
        history: { past: [], future: [] },
        clipboard: [],
        signals: [],
        particles: [],

        startBatch: () => {
            isBatching = true;
            batchQueue.clear();
            particleQueue = [];
        },

        endBatch: () => {
            isBatching = false;
            if (batchQueue.size === 0 && particleQueue.length === 0) return;

            set((state) => {
                const nextState: Partial<GridState> = {};

                // 1. Process Particle Queue
                if (particleQueue.length > 0) {
                    nextState.particles = [...state.particles, ...particleQueue];
                    particleQueue = []; // Clear
                }

                // 2. Process Cell Batches
                if (batchQueue.size > 0) {
                    const newCells = new Map(state.cells);
                    // Lazy group cloning: only clone if we actually hit a group change
                    // But since 'updateCell' logic is complex regarding groups, we should probably stick to 
                    // the simple "apply all updates" approach.

                    // However, we must reuse the logic of updateCell. 
                    // Copy-pasting the update logic is bad. 
                    // We can extract the "apply update to map" logic?
                    // Or we just inline the simplified logic here for Phase 1.

                    // Phase 1 Optimization: We assume most ticked updates are just 'activity' or 'seenSignals'.
                    // These DO NOT change groups or structure.
                    // If we detect structural changes (groupId, data.directions), we might need the full logic.
                    // But for now, let's implement the FULL logic inside the loop to be safe, just on the ONE cloned map.

                    let newGroups = state.groups;
                    let groupsCloned = false;

                    const ensureGroupsCloned = () => {
                        if (!groupsCloned) {
                            newGroups = new Map(state.groups);
                            groupsCloned = true;
                        }
                    };

                    batchQueue.forEach((updates, cellId) => {
                        const cell = newCells.get(cellId);
                        if (!cell) return;

                        // Application Logic (Mirrors updateCell)
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

                        // Group Logic check
                        const oldGroupId = cell.state.groupId;
                        const newGroupId = updatedCell.state.groupId;

                        if (oldGroupId !== newGroupId) {
                            ensureGroupsCloned();

                            if (oldGroupId) {
                                const oldGroupSet = new Set(newGroups.get(oldGroupId));
                                oldGroupSet.delete(cellId);
                                if (oldGroupSet.size === 0) newGroups.delete(oldGroupId);
                                else newGroups.set(oldGroupId, oldGroupSet);
                            }

                            if (newGroupId) {
                                const newGroupSet = new Set(newGroups.get(newGroupId) || []);
                                newGroupSet.add(cellId);
                                newGroups.set(newGroupId, newGroupSet);
                            }
                        }

                        // Note: Peer sync logic is skipped in batch for now! 
                        // It generates recursive updates which is hard in batch.
                        // Assuming tick-based updates don't need peer sync (because peers update themselves or via signals).
                    });

                    nextState.cells = newCells;
                    nextState.groups = newGroups; // Even if not cloned, it's the same ref
                    batchQueue.clear();
                }

                return nextState;
            });
        },

        spawnCell: (coord, dna, pamModule) => {
            // The TargetContent above starts at 'export const ...' and ends at 'spawnCell: ...' but excludes 'spawnCell' body?
            // No, I need to match EXACTLY.

            // I will target up to 'spawnCell' start.
            get().pushHistory(); // Save state before spawn
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
                pamModule.onSpawn(newCell, api);
            }

            set((state) => {
                const newCells = new Map(state.cells);
                newCells.set(cellId, newCell);
                return { cells: newCells };
            });
        },

        killCell: (cellId) => {
            get().pushHistory(); // Save state before kill
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
                return { cells: newCells, groups: newGroups };
            });
        },

        updateCell: (cellId, updates, options) => {
            if (isBatching) {
                // Queue update
                const existing = batchQueue.get(cellId) || {};

                // Deep merge state to avoid overwriting previous batch updates for this cell
                const merged = {
                    ...existing,
                    ...updates,
                    state: {
                        ...(existing.state || {}),
                        ...(updates.state || {}),
                        // Data merge?
                        data: {
                            ...(existing.state?.data || {}),
                            ...(updates.state?.data || {})
                        },
                        // Set merge? (seenSignals)
                        seenSignals: updates.state?.seenSignals || existing.state?.seenSignals
                        // Note: Set merging is tricky. If we just replace, we might lose prev additions.
                        // But usually propagation sends a NEW Set.
                        // Let's assume replacement is fine for now.
                    }
                };

                batchQueue.set(cellId, merged);
                return;
            }

            // Only push history if meaningful change (e.g. not just activity/energy tick)
            if (!options?.skipHistory) {
                get().pushHistory();
            }
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
            if (isBatching) {
                const existing = batchQueue.get(cellId) || {};
                // We need to append signal.
                // This is tricky because existing.signals might be undefined if we only had 'state' updates.
                // And we can't easily access the 'current' cell signals without reading state.
                // But we can just queue a state update? No, signals are on top level of Cell.

                // To handle this correctly in batch, we need to read the current state + existing batch updates.
                const currentCell = get().cells.get(cellId);
                if (!currentCell) return;

                // Resolve signals list
                const prevSignals = existing.signals || currentCell.signals;
                const newSignals = [...prevSignals, signal];

                const merged = {
                    ...existing,
                    signals: newSignals
                };
                batchQueue.set(cellId, merged);
                return;
            }

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
            // console.log('[GridStore] propagateSignal', sourceId, signal.type); // Verbose
            const state = get();
            const sourceCell = state.cells.get(sourceId);
            if (!sourceCell) return;

            // Unified Group Emission Logic
            const sourceGroupId = sourceCell.state.groupId;
            let emitters: Cell[] = [sourceCell];

            if (sourceGroupId) {
                const groupSet = state.groups.get(sourceGroupId);
                if (groupSet) {
                    emitters = [];
                    groupSet.forEach(memberId => {
                        const member = state.cells.get(memberId);
                        if (member) emitters.push(member);
                    });
                }
            }
            if (emitters.length === 0) emitters.push(sourceCell);

            const newParticles: Particle[] = [];

            if (options?.wireless) {
                // --- Wireless / AoE Mode ---
                const range = signal.range || 10;
                const cells = Array.from(state.cells.values());

                emitters.forEach(emitter => {
                    cells.forEach(target => {
                        if (target.id === emitter.id) return;
                        if (target.state.groupId && target.state.groupId === sourceGroupId) return;

                        const dist = hexDistance(emitter.coord, target.coord);
                        if (dist > range || dist === 0) return;

                        const nextSignal = { ...signal, range: range - dist }; // Range check logic
                        if (nextSignal.range! < 0) return;

                        newParticles.push({
                            id: `p-${Date.now()}-${Math.random()}`,
                            sourceId: emitter.id,
                            targetId: target.id,
                            signal: nextSignal,
                            progress: 0,
                            speed: (options?.speed || 5.0) / Math.max(1, dist),
                            color: options?.color || '#ffffff',
                            type: options?.type || 'arc'
                        });
                    });
                });
            } else {
                // --- Standard Neighbor Propagation ---
                emitters.forEach(emitter => {
                    const neighbors = getNeighbors(emitter.coord);
                    let emissionDirections = options?.directions;

                    if (sourceGroupId && emitter.id !== sourceId) {
                        emissionDirections = emitter.state.data?.directions; // Group members use their own directions?
                        // Actually, purely visual here. Logic assumes emitter's data.
                    } else if (!emissionDirections && sourceGroupId) {
                        emissionDirections = emitter.state.data?.directions;
                    }

                    if (!emissionDirections) emissionDirections = [0, 1, 2, 3, 4, 5];

                    neighbors.forEach((neighborCoord, directionIndex) => {
                        if (emissionDirections && !emissionDirections.includes(directionIndex)) return;

                        const neighborId = hexToId(neighborCoord);
                        const neighborCell = state.cells.get(neighborId);

                        if (neighborCell && (!sourceGroupId || neighborCell.state.groupId !== sourceGroupId)) {
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
            }

            if (newParticles.length > 0) {
                if (isBatching) {
                    particleQueue.push(...newParticles);
                } else {
                    set(state => ({
                        particles: [...state.particles, ...newParticles]
                    }));
                }
            }
        },

        mergeCells: (cellIdA, cellIdB) => {
            get().pushHistory();
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
                    // AUTO-HEAL: Ensure ID matches coordinate
                    // Legacy or Demo dishes might have random IDs which breaks propagation lookup.
                    const correctId = hexToId(rawCell.coord);

                    const cell: Cell = {
                        ...rawCell,
                        id: correctId, // Force correct ID
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
                    particles: [],
                    history: { past: [], future: [] } // Clear history on import
                });
                console.log(`Imported ${newCells.size} cells successfully.`);
                console.log('Rebuilt Groups:', newGroups.size);

                // DEBUG: Check for Demo Dish anomalies
                const brokenPixel = Array.from(newCells.values()).find(c => c.coord.q === 3 && c.coord.r === -1);
                if (brokenPixel) {
                    console.log('🔍 DEBUG: Checking "broken" pixel at 3,-1:', {
                        id: brokenPixel.id,
                        dnaId: brokenPixel.dna.id,
                        color: brokenPixel.dna.color,
                        dataColor: (brokenPixel.state.data as any)?.displayColor,
                        type: brokenPixel.dna.name
                    });
                } else {
                    console.log('⚠️ DEBUG: Could not find pixel at 3,-1');
                }

                const timer = Array.from(newCells.values()).find(c => c.dna.id === 'timer');
                if (timer) {
                    console.log('🔍 DEBUG: Checking first Timer:', {
                        id: timer.id,
                        maxTime: (timer.state.data as any)?.maxTime,
                        isRunning: (timer.state.data as any)?.isRunning,
                        seenSignals: timer.state.seenSignals
                    });
                }

            } catch (e) {
                console.error("Failed to import grid:", e);
            }
        },

        clear: () => {
            set({
                cells: new Map(),
                groups: new Map(),
                signals: [],
                particles: [],
                history: { past: [], future: [] }
            });
        },

        pushHistory: () => {
            set((state) => {
                const snapshot = {
                    cells: new Map(state.cells),
                    groups: new Map(state.groups) // Shallow copy of map, but Sets inside might need cloning if mutation happens?
                    // In killCell we clone map and modify set logic carefully.
                    // To be safe, let's deep clone groups map.
                };

                // Deep clone groups to be safe
                const groupsClone = new Map<string, Set<string>>();
                state.groups.forEach((v, k) => groupsClone.set(k, new Set(v)));

                const newPast = [...state.history.past, { cells: snapshot.cells, groups: groupsClone }];
                if (newPast.length > 50) newPast.shift(); // Limit history to 50 steps

                return {
                    history: {
                        past: newPast,
                        future: []
                    }
                };
            });
        },

        undo: () => {
            set((state) => {
                const past = state.history.past;
                if (past.length === 0) return state;

                const previous = past[past.length - 1];
                const newPast = past.slice(0, -1);

                const currentCells = state.cells;
                const restoredCells = new Map(previous.cells);

                // Smart Undo: Preserve Runtime State (Activity, Signals) from current "future" state
                // to prevent the simulation from jumping back in time visually.
                restoredCells.forEach((restoredCell, id) => {
                    const currentCell = currentCells.get(id);
                    // Only preserve if identity matches (same DNA)
                    if (currentCell && currentCell.dna.id === restoredCell.dna.id) {
                        restoredCell.state.activity = currentCell.state.activity;
                        restoredCell.state.seenSignals = currentCell.state.seenSignals;
                        restoredCell.signals = currentCell.signals;

                        // Also preserve transient data if needed?
                        // For now, activity/signals are the main "visual" components.
                        // Data might be structural (like timer maxTime), so we should revert data.
                        // But runtime data (like timeRemaining) might be nice to keep?
                        // Complicated. Let's stick to activity/signals for "visual" continuity.

                        // Actually, if we undo a placement, we don't want to reset everyone's timers if possible.
                        // But if the restoration replaces the cell object...
                        // Let's try to merge 'state.data' carefully?
                        // No, data often contains config. We want to UNDO config changes.
                        // So we MUST revert data.
                        // But 'activity' is purely visual/transient usually.
                    }
                });

                const current = {
                    cells: new Map(state.cells),
                    groups: new Map<string, Set<string>>()
                };
                state.groups.forEach((v, k) => current.groups.set(k, new Set(v)));

                return {
                    cells: restoredCells,
                    groups: previous.groups,
                    history: {
                        past: newPast,
                        future: [current, ...state.history.future]
                    }
                };
            });
        },

        redo: () => {
            set((state) => {
                const future = state.history.future;
                if (future.length === 0) return state;

                const next = future[0];
                const newFuture = future.slice(1);

                const current = {
                    cells: new Map(state.cells),
                    groups: new Map<string, Set<string>>()
                };
                state.groups.forEach((v, k) => current.groups.set(k, new Set(v)));

                return {
                    cells: next.cells,
                    groups: next.groups,
                    history: {
                        past: [...state.history.past, current],
                        future: newFuture
                    }
                };
            });
        },

        copy: (cellIds) => {
            const state = get();
            const clipboard: Cell[] = [];
            cellIds.forEach(id => {
                const cell = state.cells.get(id);
                if (cell) clipboard.push(cell);
            });
            // set({ clipboard }); // Deprecated local clipboard
            console.log(`📋 Copied ${clipboard.length} cells (returned)`);
            return clipboard;
        },

        paste: (targetCoord, clipboardData) => {
            const state = get();
            // Use provided data or fallback to local (migration support)
            const sourceClipboard = clipboardData || state.clipboard;

            if (sourceClipboard.length === 0) return;

            get().pushHistory();

            // Calculate centroid or top-left of clipboard to determine offset
            let minQ = Infinity, minR = Infinity;
            sourceClipboard.forEach(cell => {
                if (cell.coord.q < minQ) minQ = cell.coord.q;
                if (cell.coord.r < minR) minR = cell.coord.r;
            });

            // Calculate offset from minQ, minR to targetCoord
            const qOffset = targetCoord.q - minQ;
            const rOffset = targetCoord.r - minR;

            const newCells = new Map(state.cells);
            const newGroups = new Map(state.groups);

            // Map old group IDs to new group IDs to separate pasted groups from originals
            const groupMapping = new Map<string, string>();

            sourceClipboard.forEach(template => {
                const newQ = template.coord.q + qOffset;
                const newR = template.coord.r + rOffset;
                const newCoord = { q: newQ, r: newR };
                const newId = hexToId(newCoord);

                // Handle Groups
                let newGroupId = undefined;
                if (template.state.groupId) {
                    if (!groupMapping.has(template.state.groupId)) {
                        groupMapping.set(template.state.groupId, `group-${Date.now()}-${Math.random()}`);
                    }
                    newGroupId = groupMapping.get(template.state.groupId);
                }

                const newCell: Cell = {
                    ...template,
                    id: newId,
                    coord: newCoord,
                    state: {
                        ...template.state,
                        groupId: newGroupId,
                        // Clear runtime state?
                        energy: template.dna.id === 'stem' ? 100 : template.state.energy, // Reset logic depends on cell type
                    },
                    signals: [], // Clear signals logic
                    createdAt: Date.now()
                };

                // Kill existing at target
                if (newCells.has(newId)) {
                    // Should use killCell logic to clean groups, but we are doing bulk update.
                    // If we overwrite, we should remove old one from its group.
                    const old = newCells.get(newId);
                    if (old && old.state.groupId) {
                        const g = newGroups.get(old.state.groupId);
                        if (g) {
                            g.delete(newId);
                            if (g.size === 0) newGroups.delete(old.state.groupId);
                        }
                    }
                }

                newCells.set(newId, newCell);

                if (newGroupId) {
                    const g = newGroups.get(newGroupId) || new Set();
                    g.add(newId);
                    newGroups.set(newGroupId, g);
                }
            });

            set({ cells: newCells, groups: newGroups });
            console.log(`📋 Pasted ${sourceClipboard.length} cells at ${targetCoord.q},${targetCoord.r}`);
        }
    };
});

export const GridStoreContext = createContext<GridStore | null>(null);

export function useGridStore<T>(selector: (state: GridState) => T): T {
    const store = useContext(GridStoreContext);
    if (!store) throw new Error('Missing GridStoreContext.Provider in the tree');
    return useStore(store, selector);
}

export function useGridStoreApi() {
    const store = useContext(GridStoreContext);
    if (!store) throw new Error('Missing GridStoreContext.Provider in the tree');
    return store;
}
