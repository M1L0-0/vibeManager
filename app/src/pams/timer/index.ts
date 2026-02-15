/**
 * Timer Cell - A countdown cell that emits a pulse after 3 seconds
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
// Removed: import { useGridStore } from '@/store/grid-store';
import { handleStandardWavePropagation, createImpulse } from '@/core/grid/propagation';
import { TimerDNA } from '@/pams/dna-catalog';
import { TimerConfig } from './Config';

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

    onClick: (cell: Cell, gridStore: any) => {
        const data = cell.state.data as TimerData;

        if (!data || data.paused) return;

        // Auto-start logic
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
        gridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: data.isRunning ? cell.state.activity : 0, // Reset activity if paused
                data
            },
        }, { skipHistory: true });
    },

    onTick: (cell: Cell, deltaTime: number, gridStore: any) => {
        const data = cell.state.data as TimerData;

        if (!data || !data.isRunning) return;

        // Ensure timeRemaining is valid
        if (typeof data.timeRemaining !== 'number' || isNaN(data.timeRemaining)) {
            data.timeRemaining = data.maxTime || 3;
        }

        // Update time remaining
        data.timeRemaining = Math.max(0, data.timeRemaining - deltaTime);

        // Update cell state
        gridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                data,
            },
        }, { skipHistory: true });

        // Timer completed!
        if (data.timeRemaining <= 0 && data.isRunning) {
            // Derive color if missing (Robust Demo Fix)
            let signalColor = (data as any).color;
            if (!signalColor) {
                if (data.maxTime <= 0.5) signalColor = '#ef4444'; // Fast = Red
                else if (data.maxTime <= 1.5) signalColor = '#22c55e'; // Medium = Green
                else signalColor = '#3b82f6'; // Slow = Blue
            }

            // Send pulse (Impulse) - ONE TIME
            createImpulse(cell, 'wave', { message: 'Timer completed!' }, {
                strength: 1.0,
                speed: 5.0,
                color: signalColor,
                command: 'TRIGGER'
            }, gridStore);

            // Determine separate state for loop vs stop
            const shouldLoop = data.loop || data.autoRestart;

            if (shouldLoop) {
                // console.log(`⏱️ Timer Cell ${cell.id}: Auto-restarting...`);
                const nextData = {
                    ...data,
                    timeRemaining: data.maxTime,
                    isRunning: true
                };

                gridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data: nextData
                    },
                }, { skipHistory: true });
            } else {
                // console.log(`⏱️ Timer Cell ${cell.id}: Stopping.`);
                // Stop running
                const nextData = { ...data, isRunning: false, timeRemaining: 0 };

                gridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data: nextData
                    }
                }, { skipHistory: true });
            }
        }
    },

    onSignal: (cell: Cell, signal: Signal, gridStore: any) => {
        let commandHandled = false;

        // --- Command Handling ---
        if (signal.command === 'RESET') {
            const maxTime = cell.state.data?.maxTime || 3;
            gridStore.getState().updateCell(cell.id, {
                state: {
                    ...cell.state,
                    data: {
                        ...cell.state.data,
                        timeRemaining: maxTime,
                        isRunning: false
                    }
                }
            }, { skipHistory: true });
            commandHandled = true;
        } else if (signal.command === 'PAUSE') {
            const data = cell.state.data as TimerData;
            if (data) {
                data.isRunning = !data.isRunning;
                gridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data: {
                            ...cell.state.data,
                            isRunning: data.isRunning
                        }
                    }
                }, { skipHistory: true });
            }
            commandHandled = true;
        }

        // --- Standard Wave Propagation ---
        if (signal.type === 'wave') {
            // Derive color if missing (Robust Demo Fix)
            let signalColor = (cell.state.data as any).color;
            if (!signalColor) {
                const maxTime = cell.state.data?.maxTime || 3;
                if (maxTime <= 0.5) signalColor = '#ef4444';
                else if (maxTime <= 1.5) signalColor = '#22c55e';
                else signalColor = '#3b82f6';
            }

            const propagated = handleStandardWavePropagation(cell, signal, {
                color: signalColor
            }, gridStore);

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

                    gridStore.getState().updateCell(cell.id, {
                        state: { ...cell.state, data }
                    }, { skipHistory: true });
                }
            }
            return; // Stop after wave handling
        }

        // --- Non-Wave Signals (Click/Pulse) ---
        if (!signal.command && TimerCell.onClick) {
            TimerCell.onClick(cell, gridStore);
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
