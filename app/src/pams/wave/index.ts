/**
 * Wave Cell - Emits propagating waves across the grid
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';
import { handleStandardWavePropagation, createImpulse } from '@/core/grid/propagation';
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

    // Use Helper
    createImpulse(cell, 'wave', { message: 'Wave propagating...' }, {
        inheritLastFired: true,
        wireless: cell.state.data?.wireless
        // Color is optional, helper will fallback or we can defaults
    });
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
        cell.state.data = {
            directions: [0, 1, 2, 3, 4, 5],
            channel: 'universal',
            range: 1000,
            command: 'TRIGGER',
            ...cell.state.data
        };
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
