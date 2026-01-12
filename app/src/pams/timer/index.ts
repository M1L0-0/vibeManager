/**
 * Timer Cell - A countdown cell that emits a pulse after 3 seconds
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { getNeighbors, hexToId } from '@/core/grid/hex';

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
    dna: {
        id: 'timer',
        name: 'Timer Cell',
        version: '1.0.0',
        color: '#f59e0b', // Orange/Amber
        icon: 'Timer',
        description: 'Counts down from 3 seconds and emits a pulse',
    },

    onSpawn: (cell: Cell) => {
        // Initialize timer state if needed
        if (!cell.state.data) {
            cell.state.data = {
                maxTime: 3, // seconds
                timeRemaining: 3,
                isRunning: false, // Default to not running on spawn
                lastTick: Date.now(), // Initialize lastTick
                autoRestart: false,
                loop: false,
                paused: false
            } as TimerData;
        }
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
            state: { ...cell.state, data },
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

        // Calculate pulse activity based on time (speeds up as countdown progresses)
        const progress = 1 - (data.timeRemaining / data.maxTime);
        const pulseFrequency = 0.5 + progress * 2; // 0.5Hz to 2.5Hz
        const pulseActivity = Math.abs(Math.sin(Date.now() / (1000 / pulseFrequency))) * 0.3;

        // Update cell state
        useGridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: data.isRunning ? pulseActivity : 0,
                data,
            },
        });

        // Timer completed!
        if (data.timeRemaining <= 0 && data.isRunning) {
            console.log(`⏱️ Timer Cell ${cell.id}: COMPLETED! Sending pulse...`);
            data.isRunning = false;

            // Send pulse to all neighbors
            const signal: Signal = {
                id: `timer-signal-${Date.now()}-${Math.random()}`,
                type: 'timer-pulse',
                strength: 1.0,
                sourceId: cell.id,
                timestamp: Date.now(),
                payload: { message: 'Timer completed!' },
            };

            // Send pulse to all neighbors
            useGridStore.getState().propagateSignal(cell.id, signal, {
                speed: 5.0,
                color: '#f59e0b',
                type: 'linear'
            });

            // Trigger our own completion pulse
            useGridStore.getState().updateCell(cell.id, {
                state: {
                    ...cell.state,
                    activity: 1.0,
                    data,
                },
            });

            // Handle auto-restart and loop modes
            if (data.autoRestart || data.loop) {
                console.log(`⏱️ Timer Cell ${cell.id}: Auto-restarting...`);
                data.timeRemaining = data.maxTime;

                // In loop mode, keep running. In autoRestart mode, stop until clicked again
                data.isRunning = data.loop;

                useGridStore.getState().updateCell(cell.id, {
                    state: {
                        ...cell.state,
                        data,
                    },
                });
            }
        }
    },

    onSignal: (cell: Cell, signal: Signal) => {
        // --- Deduplication Logic ---
        // Ensure we haven't processed this signal/wave before
        if (signal.waveId) {
            // Initialize seenSignals if needed
            if (!cell.state.seenSignals) {
                cell.state.seenSignals = new Set<string>();
            }

            if (cell.state.seenSignals.has(signal.waveId)) {
                // Already processed this wave
                return;
            }

            // Mark as seen
            cell.state.seenSignals.add(signal.waveId);
            useGridStore.getState().updateCell(cell.id, {
                state: { ...cell.state, seenSignals: cell.state.seenSignals }
            });
        }

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
                // Toggle running state (Pause/Resume)
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
        // If it's a wave passing through
        if (signal.type === 'wave' && signal.waveId) {
            console.log(`🌊 Timer Cell ${cell.id}: Propagating wave ${signal.waveId}`);

            // Propagate to neighbors
            const allowedDirections = signal.payload?.allowedDirections;

            // Respect signal speed if present, otherwise default to 10.0 (Fast)
            const propagateSpeed = signal.speed || 10.0;

            useGridStore.getState().propagateSignal(cell.id, signal, {
                speed: propagateSpeed,
                color: '#f59e0b',
                type: 'arc',
                directions: allowedDirections
            });

            // Visual feedback
            useGridStore.getState().updateCell(cell.id, {
                state: {
                    ...cell.state,
                    activity: 0.8,
                }
            });

            // If command was NOT handled explicitly (Default/Universal), use default trigger behavior
            if (!commandHandled) {
                // Default: Toggle running state (same as Click / Pause)
                // But for clarity, let's treat explicit PAUSE and default TRIGGER the same for TimerCell?
                // Actually, TRIGGER usually means "Start if stopped" or "Do logic".
                // Timer Logic: Toggle.

                const data = cell.state.data as TimerData;
                if (data) {
                    if (data.timeRemaining <= 0) {
                        data.timeRemaining = data.maxTime;
                        data.isRunning = false;
                        data.lastTick = Date.now();
                    } else {
                        // Toggle pause/resume
                        data.isRunning = !data.isRunning;
                        data.lastTick = Date.now();
                    }

                    console.log(`⏱️ Timer Cell ${cell.id} triggered by wave: ${data.isRunning ? 'Started/Resumed' : 'Paused'}`);

                    // Update cell with new data
                    useGridStore.getState().updateCell(cell.id, {
                        state: {
                            ...cell.state,
                            data,
                        },
                    });
                }
            }
            return; // Return after handling wave propagation to prevent default onClick behavior
        }

        // Handle non-wave signals (e.g., from neighbors clicking)
        // Trigger onClick behavior if no command was processed and it's not a wave
        if (!signal.command && TimerCell.onClick) {
            TimerCell.onClick(cell);
        }
    },
};
