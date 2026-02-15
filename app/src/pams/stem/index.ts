/**
 * Stem Cell - The default, empty cell module
 * Used for testing the grid system
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
// Removed global store import
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

    onClick: (cellArg: Cell, gridStore: any) => {
        // FEAT: Fetch fresh state to bypass React stale closures
        const cell = gridStore.getState().cells.get(cellArg.id) || cellArg;
        console.log('🧬 Stem Cell clicked:', cell.id);

        // Create Impulse (Handles standardized logic + range)
        createImpulse(cell, 'wave', { message: 'Hello from ' + cell.id }, {
            speed: 5.0, // Standard pulse speed
            color: '#8b5cf6', // Purple for stem cell
            type: 'linear',
            strength: 1.0
        }, gridStore);
    },

    onSignal: (cell: Cell, signal: Signal, gridStore: any) => {
        // Visual reaction
        // Handle wave propagation (Standard)
        if (signal.type === 'wave') {
            const propagated = handleStandardWavePropagation(cell, signal, {
                visualActivity: 1.0 // Flash fully
            }, gridStore);
            // handleStandardWavePropagation handles auto-reset of activity
            return;
        }

        // Handle non-wave signals (pulse, etc)
        // Just flash for feedback
        const store = gridStore.getState();
        store.updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: 1.0,
            },
        }, { skipHistory: true });

        // Auto-reset
        setTimeout(() => {
            store.updateCell(cell.id, {
                state: { activity: 0 }
            }, { skipHistory: true });
        }, 500); // Increased from 300 to 500 for better visibility
    },
};
