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
                // Add signal to neighbor's queue
                const updatedSignals = [...neighborCell.signals, signal];
                useGridStore.getState().updateCell(neighborId, {
                    signals: updatedSignals,
                    state: {
                        ...neighborCell.state,
                        activity: 1.0, // Trigger pulse animation
                    },
                });
            }
        });

        // Trigger our own pulse animation
        const store = useGridStore.getState();
        store.updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: 1.0,
            },
        });
    },

    onSignal: (cell: Cell, signal: Signal) => {
        console.log('📨 Stem Cell received signal:', signal);
    },
};
