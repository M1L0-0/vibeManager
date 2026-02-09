/**
 * Stem Cell - The default, empty cell module
 * Used for testing the grid system
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';
import { handleStandardWavePropagation, createImpulse } from '@/core/grid/propagation';
import { StemDNA } from '@/pams/dna-catalog';

export const StemCell: PamModule = {
    dna: StemDNA,

    onSpawn: (cell: Cell) => {
        // Initialize seen waves tracking
        if (!cell.state.seenSignals) {
            cell.state.seenSignals = new Set<string>();
        }
    },

    onClick: (cellArg: Cell) => {
        // FEAT: Fetch fresh state to bypass React stale closures
        const cell = useGridStore.getState().cells.get(cellArg.id) || cellArg;
        console.log('🧬 Stem Cell clicked:', cell.id);

        // Create Impulse (Handles standardized logic + range)
        createImpulse(cell, 'wave', { message: 'Hello from ' + cell.id }, {
            speed: 5.0, // Standard pulse speed
            color: '#8b5cf6', // Purple for stem cell
            type: 'linear',
            strength: 1.0
        });
    },

    onSignal: (cell: Cell, signal: Signal) => {
        // console.log(`🌱 Stem Cell ${cell.id} received signal:`, signal);

        // Visual reaction (optional)
        // Handle wave propagation (independent of command)
        if (signal.type === 'wave') {
            const propagated = handleStandardWavePropagation(cell, signal, {
                visualActivity: false // Disable auto-reset, we manage state manually below
            });
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
