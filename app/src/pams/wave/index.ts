/**
 * Wave Cell - Emits propagating waves across the grid
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';
import { handleStandardWavePropagation } from '@/core/grid/propagation';
import { WaveDNA } from '@/pams/dna-catalog';
import { WaveConfig } from './Config';

// Standalone handler for triggering a new wave
const onWaveClick = (cellArgument: Cell) => {
    // FEAT: Fetch fresh state to bypass React stale closures (due to heavy memoization)
    const cell = useGridStore.getState().cells.get(cellArgument.id) || cellArgument;

    // Safety Cooldown to prevent infinite signal loops (Reflections/Echoes)
    const lastFired = cell.state.data?.lastFired || 0;
    const now = Date.now();
    if (now - lastFired < 150) {
        // console.warn(`Simulated circuit breaker: WaveCell ${cell.id} firing too fast`);
        return;
    }

    console.log('🌊 Wave Cell clicked:', cell.id);

    // Generate unique wave ID
    const waveId = `wave-${now}-${Math.random()}`;

    // Create wave signal (no command - cells handle waves in onSignal)
    // Calculate speed from delay (default 0.1s => 10 speed)
    const delay = cell.state.data?.speedDelay || 0.1;
    const speed = 1 / Math.max(0.01, delay);

    const signal: Signal = {
        id: `signal-${now}-${Math.random()}`,
        type: 'wave',
        strength: 1.0,
        sourceId: cell.id,
        timestamp: now,
        waveId: waveId,
        channelId: cell.state.data?.channel || 'universal',
        range: cell.state.data?.range !== undefined ? cell.state.data.range : 10,
        command: cell.state.data?.command || 'TRIGGER',
        sourceGroupId: cell.state.groupId,
        speed: speed, // Inject speed
        payload: {
            message: 'Wave propagating...',
            originCell: cell.id,
            allowedDirections: cell.state.data?.directions || [0, 1, 2, 3, 4, 5]
        },
    };

    console.log(`🌊 Wave emitted: ${waveId}`);

    // Mark this wave as seen by the source cell (Safely)
    // Create new set to avoid direct mutation of previous reference
    const currentSeen = cell.state.seenSignals ? new Set(cell.state.seenSignals) : new Set<string>();
    currentSeen.add(waveId);

    // Send wave to all neighbors (respecting configured directions)
    const directions = cell.state.data?.directions || [0, 1, 2, 3, 4, 5];

    useGridStore.getState().propagateSignal(cell.id, signal, {
        speed: speed,
        type: 'arc',
        directions: directions
    });

    // Update cell state (Activity + Seen + LastFired)
    useGridStore.getState().updateCell(cell.id, {
        state: {
            activity: 1.0,
            seenSignals: currentSeen,
            data: {
                ...cell.state.data,
                lastFired: now
            }
        },
    });

    // Auto-reset activity
    setTimeout(() => {
        useGridStore.getState().updateCell(cell.id, {
            state: {
                activity: 0
            }
        });
    }, 300);
};

export const WaveCell: PamModule = {
    dna: WaveDNA,

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

    onClick: onWaveClick,

    onSignal: (cell: Cell, signal: Signal) => {
        // 1. Handle Wave Propagation (Pass-through)
        if (signal.type === 'wave') {
            const propagated = handleStandardWavePropagation(cell, signal);
            if (propagated) {
                // console.log(`🌊 Wave Cell ${cell.id}: Propagated wave ${signal.waveId}`);
            }
            return;
        }

        // console.log(`📡 Wave Cell ${cell.id} received signal: type=${signal.type}, command=${signal.command}`);

        // 2. Handle External Triggers (e.g. from Timer, Button) -> Start NEW Wave
        // If we receive a TRIGGER command (or timer-pulse), and we are NOT just passing a wave...
        // 2. Handle External Triggers (e.g. from Timer, Button) -> Start NEW Wave
        // If we receive a TRIGGER command (or timer-pulse), and we are NOT just passing a wave...
        // FIXED: Re-enabled with strict checks
        if (signal.command === 'TRIGGER' || signal.type === 'timer-pulse') {
            // Prevent self-triggering via own wave (should be caught by type=wave check above, but for safety)
            if (signal.id && cell.state.seenSignals?.has(signal.id)) return;

            // console.log(`🌊 Wave Cell ${cell.id}: Triggered by external signal (${signal.type})`);
            // Trigger manual activation (New Wave)
            onWaveClick(cell);
        }
    },
};
