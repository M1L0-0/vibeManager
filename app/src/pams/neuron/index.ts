/**
 * Neuron Cell - Biological Logic Gate
 * Integrates signals over a small time window and fires based on logical rules.
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { handleStandardWavePropagation, createImpulse } from '@/core/grid/propagation';
import { NeuronDNA } from '@/pams/dna-catalog';
import { NeuronConfig } from './Config';

const INPUT_WINDOW_MS = 100; // Time window to group simultaneous signals

export const NeuronCell: PamModule = {
    dna: NeuronDNA,

    configComponent: NeuronConfig,

    onSpawn: (cell: Cell) => {
        // Initialize state
        if (!cell.state.data) {
            cell.state.data = {
                operation: 'AND',
                currentInputs: 0,
                directions: [0, 1, 2, 3, 4, 5], // Omni-directional output by default
                range: 5, // Shorter range for logic connections
            };
        }
    },

    onSignal: (cell: Cell, signal: Signal) => {
        // 1. Handle Wave Propagation (Pass-through or Output?)
        // Neurons act as processing nodes, so they usually consume signals and emit a NEW calculated signal.
        // However, if it's just a visual wave passing through, we might want to let it pass?
        // Decision: Neurons BLOCK normal waves and only emit their OWN logical result.
        // But for visual debugging, we might want to see the input hit it.

        // Don't process our own output signals
        if (signal.sourceId === cell.id) return;


        // 2. Logic Accumulation
        // We use a "Debounce" pattern.
        // First signal starts the timer. Subsequent signals increment count.
        // When timer fires, we evaluate logic.

        const now = Date.now();

        // --- CRITICAL FIX: Fetch fresh state to prevent stale-closure race conditions ---
        // When multiple signals arrive in the same tick, 'cell' is a stale snapshot from the start of the tick.
        // We must read the latest state from the store to see updates made by previous signals in this batch.
        const freshCell = useGridStore.getState().cells.get(cell.id) || cell;
        const data = freshCell.state.data || {};

        // Retrieve or initialize accumulation state (stored in data for persistence/debug)
        const lastInputTime = (data as any)._lastInputTime || 0;
        const inputBuffer = (data as any)._inputBuffer || 0;

        let newInputBuffer = inputBuffer;

        // If window expired, reset buffer
        if (now - lastInputTime > INPUT_WINDOW_MS) {
            newInputBuffer = 0;
        }

        // Increment input count
        newInputBuffer++;

        // Update state
        // Update state
        useGridStore.getState().updateCell(cell.id, {
            state: {
                ...freshCell.state, // Use fresh state
                activity: 0.5, // "Charging" visual
                data: {
                    ...data,
                    _lastInputTime: now,
                    _inputBuffer: newInputBuffer,
                    currentInputs: newInputBuffer // Exposed for UI
                }
            }
        });

        // Schedule Evaluation (Debounce)
        // We set a timeout equal to the window. 
        // Note: In a real tick-based system we'd use ticks. Here we use setTimeout which might be tricky with React strict mode,
        // but works for this prototype. A more robust way is `onTick`.

        // Clear existing timeout if any? (Ideally yes, but hard to store timer ID in serializable state)
        // Simplification: We blindly wait INPUT_WINDOW_MS. 
        // If multiple timers are running, we need a way to only fire once.
        // Solution: `onTick` is better.
    },

    onTick: (cellArg: Cell, deltaTime: number) => {
        // Fetch fresh state for evaluation
        const cell = useGridStore.getState().cells.get(cellArg.id) || cellArg;

        const data = cell.state.data || {};
        const lastInputTime = (data as any)._lastInputTime || 0;
        const inputBuffer = (data as any)._inputBuffer || 0;
        const processedTime = (data as any)._processedTime || 0;

        // If we have pending inputs and the window has passed...
        // AND we haven't already processed this batch (check timestamp)
        if (inputBuffer > 0 &&
            (Date.now() - lastInputTime > INPUT_WINDOW_MS) &&
            lastInputTime > processedTime
        ) {
            evaluateLogic(cell, inputBuffer);
        }
    },

    getLabel: (cell: Cell) => {
        const op = cell.state.data?.operation || 'AND';
        switch (op) {
            case 'AND': return '&';
            case 'OR': return '≥1';
            case 'XOR': return '=1';
            case 'NAND': return '!&';
            case 'NOR': return '!|';
            default: return op;
        }
    }
};

function evaluateLogic(cell: Cell, inputCount: number) {
    const data = cell.state.data || {};
    const operation = data.operation || 'AND';

    let shouldFire = false;

    switch (operation) {
        case 'AND':
            shouldFire = inputCount >= 2;
            break;
        case 'OR':
            shouldFire = inputCount >= 1;
            break;
        case 'XOR':
            shouldFire = inputCount === 1;
            break;
        case 'NAND':
            shouldFire = !(inputCount >= 2); // Tricky: NAND usually implies clocked input. 
            // In async: "Fire unless 2+ inputs". But this would mean constant firing?
            // For async grids, NAND usually acts as "Fire if 1 input, but silence if 2".
            shouldFire = inputCount < 2 && inputCount > 0;
            break;
        case 'NOR':
            // Async NOR: Fire if NO inputs? No, that's an oscillator.
            // Usually undefined in pure async event pulses without clock.
            // We'll treat it as "NOT OR" -> inverted signal? 
            // Let's stick to active inputs for now.
            shouldFire = false;
            break;
    }

    // console.log(`🧠 Neuron ${cell.id} Eval: Op=${operation} Inputs=${inputCount} Fire=${shouldFire}`);

    if (shouldFire) {
        createImpulse(cell, 'wave', { message: 'Logic True' }, {
            color: '#10b981', // Emerald for Logic True
            strength: 1.0,
            command: 'TRIGGER'
        });
    } else {
        // Visual Feedback for "Failed Logic" (Fizzle)
        useGridStore.getState().updateCell(cell.id, {
            state: {
                activity: 0.2 // Low activity "Fizzle"
            }
        });
        setTimeout(() => {
            useGridStore.getState().updateCell(cell.id, {
                state: { activity: 0 }
            });
        }, 200);
    }

    // Mark as processed
    useGridStore.getState().updateCell(cell.id, {
        state: {
            ...cell.state,
            data: {
                ...data,
                _processedTime: Date.now(),
                _inputBuffer: 0,
                currentInputs: 0
            }
        }
    });
}
