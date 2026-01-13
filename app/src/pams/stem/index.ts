/**
 * Stem Cell - The default, empty cell module
 * Used for testing the grid system
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';
import { handleStandardWavePropagation } from '@/core/grid/propagation';

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

        // Propagate to neighbors using centralized helper
        useGridStore.getState().propagateSignal(cell.id, signal, {
            speed: 5.0, // Standard pulse speed
            color: '#8b5cf6', // Purple for stem cell
            type: 'linear'
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
        // console.log(`🌱 Stem Cell ${cell.id} received signal:`, signal);

        // Visual reaction (optional)
        // Handle wave propagation (independent of command)
        if (signal.type === 'wave') {
            const propagated = handleStandardWavePropagation(cell, signal);
            if (propagated) {
                // If it's a new wave, also toggle local activity
                const currentActivity = cell.state.activity;
                const newActivity = currentActivity > 0.5 ? 0 : 1.0;

                useGridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        activity: newActivity
                    }
                });
            }
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
