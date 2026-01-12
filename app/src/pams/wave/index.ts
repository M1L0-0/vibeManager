/**
 * Wave Cell - Emits propagating waves across the grid
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';

export const WaveCell: PamModule = {
    dna: {
        id: 'wave',
        name: 'Wave Cell',
        version: '1.0.0',
        color: '#06b6d4', // Cyan - represents water/waves
        icon: 'Waves',
        description: 'Emits propagating waves that ripple across connected cells',
    },

    onSpawn: (cell: Cell) => {
        // Initialize seen waves set
        if (!cell.state.seenSignals) {
            cell.state.seenSignals = new Set<string>();
        }
    },

    onClick: (cell: Cell) => {
        console.log('🌊 Wave Cell clicked:', cell.id);

        // Generate unique wave ID
        const waveId = `wave-${Date.now()}-${Math.random()}`;

        // Create wave signal (no command - cells handle waves in onSignal)
        const signal: Signal = {
            id: `signal-${Date.now()}-${Math.random()}`,
            type: 'wave',
            strength: 1.0,
            sourceId: cell.id,
            timestamp: Date.now(),
            waveId: waveId,
            payload: {
                message: 'Wave propagating...',
                originCell: cell.id,
            },
        };

        console.log(`🌊 Wave emitted: ${waveId}`);

        // Mark this wave as seen by the source cell
        if (!cell.state.seenSignals) {
            cell.state.seenSignals = new Set<string>();
        }
        cell.state.seenSignals.add(waveId);

        // Send wave to all neighbors
        const neighbors = getNeighbors(cell.coord);
        neighbors.forEach((neighborCoord) => {
            const neighborId = hexToId(neighborCoord);
            const neighborCell = useGridStore.getState().getCellAt(neighborCoord);

            if (neighborCell) {
                console.log(`🌊 Wave sent to neighbor: ${neighborId}`);
                useGridStore.getState().updateCell(neighborId, {
                    signals: [...neighborCell.signals, signal],
                });
            }
        });

        // Visual feedback - brief pulse
        useGridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: 1.0,
                seenSignals: cell.state.seenSignals,
            },
        });
    },

    onSignal: (cell: Cell, signal: Signal) => {
        // Wave cells can also propagate waves they receive
        if (signal.type === 'wave' && signal.waveId) {
            // Check if we've already seen this wave
            if (!cell.state.seenSignals) {
                cell.state.seenSignals = new Set<string>();
            }

            if (cell.state.seenSignals.has(signal.waveId)) {
                console.log(`🌊 Wave Cell ${cell.id}: Already processed wave ${signal.waveId}`);
                return;
            }

            console.log(`🌊 Wave Cell ${cell.id}: Propagating wave ${signal.waveId}`);

            // Mark as seen
            cell.state.seenSignals.add(signal.waveId);

            // Propagate to neighbors
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

            // Visual feedback
            useGridStore.getState().updateCell(cell.id, {
                state: {
                    ...cell.state,
                    activity: 0.8,
                    seenSignals: cell.state.seenSignals,
                },
            });
        }
    },
};
