/**
 * Wave Cell - Emits propagating waves across the grid
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
// Removed: import { useGridStore } from '@/store/grid-store';
import { handleStandardWavePropagation, createImpulse } from '@/core/grid/propagation';
import { WaveDNA } from '@/pams/dna-catalog';
import { WaveConfig } from './Config';

// Standalone handler for triggering a new wave
const onWaveClick = (cellArgument: Cell, gridStore: any) => {
    // FEAT: Fetch fresh state to bypass React stale closures (due to heavy memoization)
    const cell = gridStore.getState().cells.get(cellArgument.id) || cellArgument;

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
        wireless: cell.state.data?.wireless,
        instant: cell.state.data?.instant,
        color: cell.state.data?.color
    }, gridStore);
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

    onSignal: (cell: Cell, signal: Signal, gridStore: any) => {
        // Handle Wave Propagation (Pass-through with Color Injection AND Range Amplification)
        if (signal.type === 'wave') {
            // Wave cells act as infinite repeaters/amplifiers. Force the signal range up to their intrinsic capacity.
            const boostedSignal = {
                ...signal,
                range: Math.max(signal.range || 0, cell.state.data?.range || 10),
                payload: {
                    ...signal.payload,
                    color: cell.state.data?.color || (signal.payload as any)?.color
                }
            };

            const propagated = handleStandardWavePropagation(cell, boostedSignal, {
                wireless: cell.state.data?.wireless,
                instant: cell.state.data?.instant,
                allowedDirections: cell.state.data?.directions || [0, 1, 2, 3, 4, 5],
                color: cell.state.data?.color
            }, gridStore);
            if (propagated) {
                // console.log(`🌊 Wave Cell ${cell.id}: Propagated wave ${signal.waveId}`);
            }
            return;
        }
    },
};
