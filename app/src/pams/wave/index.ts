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

            // Propagate to neighbors (respecting configured directions)
            // If the signal carries specific constraints (from another wave), prioritize those?
            // OR: Should a Wave Cell acting as a relay enforce its OWN directions?
            // "Copycat" implies passing the original signal.
            // Let's say: If I am receiving a Wave, I propagate ITs wave. 
            // So if the signal has constraints, I honor them. If not, I use my own?
            // User said: "mimicing the signal". So we honor the SIGNAL's constraints.

            const allowedDirections = signal.payload?.allowedDirections || cell.state.data?.directions || [0, 1, 2, 3, 4, 5];

            // Speed Logic:
            // 1. If local 'speedDelay' is customized (different from default 0.1), use local speed.
            // 2. Else if signal carries a 'speed', use that (pass-through).
            // 3. Fallback to default 10.0 (0.1s delay).

            const defaultDelay = 0.1;
            const localDelay = cell.state.data?.speedDelay;
            const isLocalCustomized = localDelay !== undefined && Math.abs(localDelay - defaultDelay) > 0.001;

            let propagateSpeed = 10.0; // Default

            if (isLocalCustomized && localDelay) {
                // Local override
                propagateSpeed = 1 / Math.max(0.01, localDelay);
            } else if (signal.speed) {
                // Pass-through
                propagateSpeed = signal.speed;
            }

            // Inject speed into next signal if acting as pass-through or repeater
            const nextSignal = {
                ...signal,
                speed: propagateSpeed
            };

            useGridStore.getState().propagateSignal(cell.id, nextSignal, {
                speed: propagateSpeed,
                type: 'arc',
                directions: allowedDirections
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
