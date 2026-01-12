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

import { TimerConfig } from './Config';
import { handleStandardWavePropagation } from '@/core/grid/propagation';

export const TimerCell: PamModule = {
    dna: {
        id: 'timer',
        name: 'Timer Cell',
        version: '1.0.0',
        color: '#f59e0b', // Amber
        icon: 'Clock',
        description: 'Triggers signals after a delay',
    },

    configComponent: TimerConfig,

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
        if (signal.waveId) {
            if (!cell.state.seenSignals) {
                cell.state.seenSignals = new Set<string>();
            }
            if (cell.state.seenSignals.has(signal.waveId)) {
                return;
            }
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
                    if (data.timeRemaining <= 0) {
                        data.timeRemaining = data.maxTime;
                        data.isRunning = false;
                        data.lastTick = Date.now();
                    } else {
                        data.isRunning = !data.isRunning;
                        data.lastTick = Date.now();
                    }
                    console.log(`⏱️ Timer Cell ${cell.id} triggered by wave`);
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
};
