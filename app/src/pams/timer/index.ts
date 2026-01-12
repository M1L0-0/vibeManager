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
        // Initialize timer data
        cell.state.data = {
            timeRemaining: 3,
            maxTime: 3,
            isRunning: false,
            lastTick: Date.now(),
        } as TimerData;
    },

    onClick: (cell: Cell) => {
        const data = cell.state.data as TimerData;

        if (!data) return;

        // If timer finished, reset it
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

            const neighbors = getNeighbors(cell.coord);
            neighbors.forEach((neighborCoord) => {
                const neighborId = hexToId(neighborCoord);
                const neighborCell = useGridStore.getState().getCellAt(neighborCoord);

                if (neighborCell) {
                    console.log(`📡 Timer signal sent to neighbor: ${neighborId}`);
                    // Add signal to neighbor's queue - onSignal will handle activity
                    useGridStore.getState().updateCell(neighborId, {
                        signals: [...neighborCell.signals, signal],
                    });
                }
            });

            // Trigger our own completion pulse
            useGridStore.getState().updateCell(cell.id, {
                state: {
                    ...cell.state,
                    activity: 1.0,
                    data,
                },
            });
        }
    },

    onSignal: (cell: Cell, signal: Signal) => {
        console.log('📨 Timer Cell received signal:', signal);

        // Handle wave propagation
        if (signal.type === 'wave' && signal.waveId) {
            // Initialize seenSignals if needed
            if (!cell.state.seenSignals) {
                cell.state.seenSignals = new Set<string>();
            }

            // Check if already processed
            if (cell.state.seenSignals.has(signal.waveId)) {
                console.log(`🌊 Timer Cell ${cell.id}: Already processed wave ${signal.waveId}`);
                return;
            }

            console.log(`🌊 Timer Cell ${cell.id}: Propagating wave ${signal.waveId}`);

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

            // Trigger timer start/pause when wave passes (same as onClick but without calling it)
            const data = cell.state.data as TimerData;
            if (data) {
                // If timer finished, reset it
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
                        seenSignals: cell.state.seenSignals,
                    },
                });
            }

            return;
        }

        // Handle non-wave signals (e.g., from neighbors clicking)
        // Trigger onClick behavior
        if (TimerCell.onClick) {
            TimerCell.onClick(cell);
        }
    },
};
