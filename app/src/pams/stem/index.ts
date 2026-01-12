/**
 * Stem Cell - The default, empty cell module
 * Used for testing the grid system
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';

export const StemCell: PamModule = {
    dna: {
        id: 'stem',
        name: 'Stem Cell',
        version: '1.0.0',
        color: '#8b5cf6', // Purple
        icon: 'Circle',
        description: 'The primordial cell - empty and full of potential',
    },

    onSpawn: (cell: Cell) => {
        // Initialize seen waves tracking
        if (!cell.state.seenSignals) {
            cell.state.seenSignals = new Set<string>();
        }
    },

    onClick: (cell: Cell) => {
        console.log('🧬 Stem Cell clicked:', cell.id);

        // Emit a signal to neighbors
        const signal: Signal = {
            id: `signal-${Date.now()}-${Math.random()}`,
            type: 'pulse',
            strength: 1.0,
            sourceId: cell.id,
            timestamp: Date.now(),
            payload: { message: 'Hello from ' + cell.id },
        };

        // Propagate to neighbors
        const neighbors = getNeighbors(cell.coord);
        neighbors.forEach((neighborCoord) => {
            const neighborId = hexToId(neighborCoord);
            const neighborCell = useGridStore.getState().getCellAt(neighborCoord);

            if (neighborCell) {
                console.log(`📡 Signal sent to neighbor: ${neighborId}`);
                // Add signal to neighbor's queue - onSignal will handle activity
                const updatedSignals = [...neighborCell.signals, signal];
                useGridStore.getState().updateCell(neighborId, {
                    signals: updatedSignals,
                });
            }
        });

        // Toggle our own activity (same as receiving a signal)
        const currentActivity = cell.state.activity;
        const newActivity = currentActivity > 0.5 ? 0 : 1.0;

        const store = useGridStore.getState();
        store.updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: newActivity,
            },
        });
    },

    onSignal: (cell: Cell, signal: Signal) => {
        console.log('📨 Stem Cell received signal:', signal);

        // Handle wave propagation (independent of command)
        if (signal.type === 'wave' && signal.waveId) {
            // Initialize seenSignals if needed
            if (!cell.state.seenSignals) {
                cell.state.seenSignals = new Set<string>();
            }

            // Check if we've already processed this wave
            if (cell.state.seenSignals.has(signal.waveId)) {
                console.log(`🌊 Stem Cell ${cell.id}: Already processed wave ${signal.waveId}`);
                return;
            }

            console.log(`🌊 Stem Cell ${cell.id}: Propagating wave ${signal.waveId}`);

            // Mark this wave as seen
            cell.state.seenSignals.add(signal.waveId);

            // Propagate wave to neighbors
            const neighbors = getNeighbors(cell.coord);
            neighbors.forEach((neighborCoord) => {
                const neighborId = hexToId(neighborCoord);
                const neighborCell = useGridStore.getState().getCellAt(neighborCoord);

                if (neighborCell) {
                    useGridStore.getState().updateCell(neighborId, {
                        signals: [...neighborCell.signals, signal],
                    });
                }
            });

            // Visual feedback - brief flash when wave passes through
            const store = useGridStore.getState();

            // Toggle the cell as the wave passes
            const currentActivity = cell.state.activity;
            const newActivity = currentActivity > 0.5 ? 0 : 1.0;

            store.updateCell(cell.id, {
                state: {
                    ...cell.state,
                    activity: newActivity,
                    seenSignals: cell.state.seenSignals,
                },
            });

            // Note: Waves toggle cells but don't trigger onClick (which would send signals)
            // This prevents infinite loops
            return;
        }

        // Handle non-wave signals (pulse, timer-pulse from neighbors)
        const currentActivity = cell.state.activity;
        const newActivity = currentActivity > 0.5 ? 0 : 1.0;

        const store = useGridStore.getState();
        store.updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: newActivity,
            },
        });
    },
};
