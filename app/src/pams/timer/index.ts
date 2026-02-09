/**
 * Timer Cell - A countdown cell that emits a pulse after 3 seconds
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';
import { TimerConfig } from './Config';
import { handleStandardWavePropagation, createImpulse } from '@/core/grid/propagation';
import { TimerDNA } from '@/pams/dna-catalog';

interface TimerData {
    timeRemaining: number; // in seconds
    maxTime: number;
    isRunning: boolean;
    lastTick: number;
    autoRestart: boolean; // Auto-restart when timer completes
    loop: boolean; // Continuous loop mode
    paused: boolean; // Manually paused state
}

export const TimerCell: PamModule = {
    dna: TimerDNA,

    configComponent: TimerConfig,

    onSpawn: (cell: Cell) => {
        // Initialize timer state if needed
        cell.state.data = {
            maxTime: 3, // seconds
            timeRemaining: 3,
            isRunning: false, // Default to not running on spawn
            lastTick: Date.now(), // Initialize lastTick
            autoRestart: false,
            loop: false,
            paused: false,
            ...cell.state.data
        } as TimerData;
    },

    onClick: (cell: Cell) => {
        const data = cell.state.data as TimerData;

        if (!data || data.paused) return;

        // Auto-start logic: If not running and has auto-restart/loop, maybe start?
        // Actually, onTick usually assumes running?
        // Current implementation seems to always tick if timeRemaining > 0.

        let { timeRemaining, maxTime } = data;
        if (data.timeRemaining <= 0) {
            data.timeRemaining = data.maxTime;
            data.isRunning = false;
            data.lastTick = Date.now();
        } else {
            // Toggle pause/resume
            data.isRunning = !data.isRunning;
            data.lastTick = Date.now();
        }

        console.log(`⏱️ Timer Cell ${cell.id}: ${data.isRunning ? 'Started/Resumed' : 'Paused'}`);

        // Update cell with new data
        useGridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: data.isRunning ? cell.state.activity : 0, // Reset activity if paused
                data
            },
        });
    },

    onTick: (cell: Cell, deltaTime: number) => {
        const data = cell.state.data as TimerData;

        if (!data || !data.isRunning) return;

        // Ensure timeRemaining is valid
        if (typeof data.timeRemaining !== 'number' || isNaN(data.timeRemaining)) {
            data.timeRemaining = data.maxTime || 3;
        }

        // Update time remaining
        data.timeRemaining = Math.max(0, data.timeRemaining - deltaTime);

        // Update cell state
        useGridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                data,
            },
        });

        // Timer completed!
        if (data.timeRemaining <= 0 && data.isRunning) {
            console.log(`⏱️ Timer Cell ${cell.id}: COMPLETED! Stop requested.`);

            // Determine separate state for loop vs stop
            const shouldLoop = data.loop || data.autoRestart;

            // Send pulse (Impulse)
            createImpulse(cell, 'wave', { message: 'Timer completed!' }, {
                strength: 1.0,
                speed: 5.0,
                color: '#f59e0b',
                command: 'TRIGGER'
            });

            if (shouldLoop) {
                console.log(`⏱️ Timer Cell ${cell.id}: Auto-restarting...`);
                const nextData = {
                    ...data,
                    timeRemaining: data.maxTime,
                    isRunning: true
                };

                useGridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data: nextData
                    },
                });
            } else {
                console.log(`⏱️ Timer Cell ${cell.id}: Stopping.`);
                // Stop running
                // We use a fresh object to avoid any reference mutation issues from above
                const nextData = { ...data, isRunning: false };

                useGridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data: nextData
                    }
                });
            }
        }
    },

    onSignal: (cell: Cell, signal: Signal) => {


        let commandHandled = false;

        // --- Command Handling ---
        if (signal.command === 'RESET') {
            const maxTime = cell.state.data?.maxTime || 3;
            useGridStore.getState().updateCell(cell.id, {
                state: {
                    ...cell.state,
                    data: {
                        ...cell.state.data,
                        timeRemaining: maxTime,
                        isRunning: false
                    }
                }
            });
            commandHandled = true;
        } else if (signal.command === 'PAUSE') {
            const data = cell.state.data as TimerData;
            if (data) {
                data.isRunning = !data.isRunning;
                useGridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data: {
                            ...cell.state.data,
                            isRunning: data.isRunning
                        }
                    }
                });
            }
            commandHandled = true;
        }

        // --- Standard Wave Propagation ---
        if (signal.type === 'wave') {
            // Helper handles propagation. 
            // Note: We already updated seenSignals above, but the helper does it again. 
            // This is slightly redundant but harmless as Sets dedup.
            // Actually, helper returns FALSE if already seen.
            // Since we added it to Set above, helper might return false?
            // Helper checks: if (seenSignals.has(waveId)) return false;
            // YES, helper will fail if we add it locally first!

            // Refactor: Let helper handle dedup entirely.
            // But we have logic above (lines 154-172) that duplicates what helper does.
            // I should remove the local dedup block if I rely on helper.
            // Logic below assumes I should use helper.

            // However, removing that block means I need to handle it here.

            const propagated = handleStandardWavePropagation(cell, signal, {
                color: '#f59e0b'
            });

            if (!propagated && signal.waveId && cell.state.seenSignals?.has(signal.waveId)) {
                // Return if duplicate
                return;
            }

            // If we are here, it's a new wave (or propagated successfully).

            // Timer Logic: Trigger toggle if no command
            if (!commandHandled) {
                const data = cell.state.data as TimerData;
                if (data) {
                    // Logic Update: Always RESET and START on trigger to ensure synchronization
                    // This allows multi-timer logic circuits to work reliably.
                    data.timeRemaining = data.maxTime;
                    data.isRunning = true;
                    data.lastTick = Date.now();

                    console.log(`⏱️ Timer Cell ${cell.id} RESTARTED by wave (Sync)`);

                    useGridStore.getState().updateCell(cell.id, {
                        state: { ...cell.state, data }
                    });
                }
            }
            return; // Stop after wave handling
        }

        // --- Non-Wave Signals (Click/Pulse) ---
        if (!signal.command && TimerCell.onClick) {
            TimerCell.onClick(cell);
        }
    },

    getLabel: (cell: Cell) => {
        const data = cell.state.data as TimerData;
        if (data?.timeRemaining !== undefined && !isNaN(data.timeRemaining)) {
            return data.timeRemaining.toFixed(1);
        }
        return (data?.maxTime?.toFixed(1) || '3.0');
    },

    getRenderDependencies: (cell: Cell) => {
        return [cell.state.data?.timeRemaining, (cell.state.data as any)?.isRunning];
    }
};
