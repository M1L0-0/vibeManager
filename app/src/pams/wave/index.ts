/**
 * Wave Cell - Emits propagating waves across the grid
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';
import { handleStandardWavePropagation } from '@/core/grid/propagation';

import { WaveConfig } from './Config';

export const WaveCell: PamModule = {
    dna: {
        id: 'wave',
        name: 'Wave Cell',
        version: '1.0.0',
        color: '#06b6d4', // Cyan - represents water/waves
        icon: 'Waves',
        description: 'Emits propagating waves that ripple across connected cells',
    },

    configComponent: WaveConfig,

    onSpawn: (cell: Cell) => {
        // Initialize seen waves set
        if (!cell.state.seenSignals) {
            cell.state.seenSignals = new Set<string>();
        }
        // Initialize default behavior (Omni-directional, Universal channel)
        if (!cell.state.data) {
            cell.state.data = {
                directions: [0, 1, 2, 3, 4, 5],
                channel: 'universal',
                range: 10,
                command: 'TRIGGER'
            };
        }
    },

    onClick: (cell: Cell) => {
        console.log('🌊 Wave Cell clicked:', cell.id);

        // Generate unique wave ID
        const waveId = `wave-${Date.now()}-${Math.random()}`;

        // Create wave signal (no command - cells handle waves in onSignal)
        // Calculate speed from delay (default 0.1s => 10 speed)
        const delay = cell.state.data?.speedDelay || 0.1;
        const speed = 1 / Math.max(0.01, delay);

        const signal: Signal = {
            id: `signal-${Date.now()}-${Math.random()}`,
            type: 'wave',
            strength: 1.0,
            sourceId: cell.id,
            timestamp: Date.now(),
            waveId: waveId,
            channelId: cell.state.data?.channel || 'universal',
            range: cell.state.data?.range !== undefined ? cell.state.data.range : 10,
            command: cell.state.data?.command || 'TRIGGER',
            speed: speed, // Inject speed
            payload: {
                message: 'Wave propagating...',
                originCell: cell.id,
                allowedDirections: cell.state.data?.directions || [0, 1, 2, 3, 4, 5]
            },
        };

        console.log(`🌊 Wave emitted: ${waveId}`);

        // Mark this wave as seen by the source cell
        if (!cell.state.seenSignals) {
            cell.state.seenSignals = new Set<string>();
        }
        cell.state.seenSignals.add(waveId);

        // Send wave to all neighbors (respecting configured directions)
        const directions = cell.state.data?.directions || [0, 1, 2, 3, 4, 5];

        useGridStore.getState().propagateSignal(cell.id, signal, {
            speed: speed,
            type: 'arc',
            directions: directions
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
        // Use standardized wave propagation logic
        if (signal.type === 'wave') {
            const propagated = handleStandardWavePropagation(cell, signal);
            if (propagated) {
                console.log(`🌊 Wave Cell ${cell.id}: Propagated wave ${signal.waveId}`);
            } else {
                console.log(`🌊 Wave Cell ${cell.id}: Already processed wave ${signal.waveId}`);
            }
        }
    },
};
