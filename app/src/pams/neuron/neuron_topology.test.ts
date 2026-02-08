import { useGridStore } from '@/store/grid-store';
import { NeuronCell } from '@/pams/neuron';
import { TimerCell } from '@/pams/timer';
import { Cell, Signal } from '@/lib/vibe-core';
import { createImpulse } from '@/core/grid/propagation';

// Mock the store
jest.mock('@/store/grid-store', () => ({
    useGridStore: {
        getState: jest.fn(),
    },
}));

// Mock propagation
jest.mock('@/core/grid/propagation', () => {
    const original = jest.requireActual('@/core/grid/propagation');
    return {
        ...original,
        createImpulse: jest.fn(original.createImpulse),
        handleStandardWavePropagation: jest.fn(original.handleStandardWavePropagation),
    };
});

describe('Neuron Topology Integration', () => {
    let store: any;
    let neuron: Cell;
    let timer1: Cell;
    let timer2: Cell;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Store State
        store = {
            cells: new Map(),
            updateCell: jest.fn((id, updates) => {
                const cell = store.cells.get(id);
                if (cell) {
                    Object.assign(cell.state, updates.state);
                    store.cells.set(id, { ...cell });
                }
            }),
            propagateSignal: jest.fn((id, signal, opts) => {
                // Mock propagation: deliver to target cells in next tick?
                // For this test, we manually deliver signals
            })
        };
        (useGridStore.getState as jest.Mock).mockReturnValue(store);

        // Setup Cells
        neuron = {
            id: 'neuron',
            dna: NeuronCell.dna,
            state: { data: { operation: 'AND', range: 5, currentInputs: 0 }, energy: 100, activity: 0 },
            signals: [],
            coord: { q: 0, r: 0 }, createdAt: 0
        };

        timer1 = {
            id: 't1',
            dna: TimerCell.dna,
            state: { data: { timeRemaining: 3, maxTime: 3, isRunning: false }, energy: 100, activity: 0 },
            signals: [],
            coord: { q: 1, r: -1 }, createdAt: 0
        };

        timer2 = {
            id: 't2',
            dna: TimerCell.dna,
            state: { data: { timeRemaining: 3, maxTime: 3, isRunning: false }, energy: 100, activity: 0 },
            signals: [],
            coord: { q: -1, r: 1 }, createdAt: 0
        };

        store.cells.set(neuron.id, neuron);
        store.cells.set(timer1.id, timer1);
        store.cells.set(timer2.id, timer2);

        // Init properties
        NeuronCell.onSpawn!(neuron);
        TimerCell.onSpawn!(timer1);
        TimerCell.onSpawn!(timer2);
    });

    test('Identical Timers trigger AND Neuron', () => {
        // 1. Activate both timers (Simulate Trigger Wave)
        // We bypass the trigger wave and just set them running to simulate perfect sync
        timer1.state.data.isRunning = true;
        timer2.state.data.isRunning = true;

        // 2. Advance Time (Tick)
        const TICK_DELTA = 100; // 100ms per tick
        let totalTime = 0;

        // Run until timers finish (3000ms)
        // We use a loop to simulate ticks
        for (let i = 0; i < 35; i++) { // 3.5 seconds
            totalTime += TICK_DELTA;
            jest.spyOn(Date, 'now').mockReturnValue(1000 + totalTime);

            TimerCell.onTick!(timer1, TICK_DELTA / 1000);
            TimerCell.onTick!(timer2, TICK_DELTA / 1000);

            // Check if timers fired
            if (timer1.state.data.timeRemaining <= 0 && timer1.state.data.isRunning === false) {
                // Timer 1 Finished!
            }
        }

        // Verify Timers triggered createImpulse
        expect(createImpulse).toHaveBeenCalledTimes(2);

        // 3. Deliver Signals to Neuron
        // Since we mocked createImpulse, we manually trigger Neuron.onSignal
        // In real app, createImpulse -> propagateSignal -> CellTicker -> onSignal

        const signal1: Signal = { id: 's1', type: 'wave', sourceId: 't1', timestamp: Date.now(), waveId: 'w1', strength: 1 } as any;
        const signal2: Signal = { id: 's2', type: 'wave', sourceId: 't2', timestamp: Date.now(), waveId: 'w2', strength: 1 } as any;

        // Signals arrive "Simultaneously" (same batch)
        NeuronCell.onSignal!(neuron, signal1);
        NeuronCell.onSignal!(neuron, signal2);

        // Verify Buffer
        expect(neuron.state.data._currentInputs).toBeUndefined(); // It's in 'data' actually.
        // My mock updateCell implementation updates the object reference.
        expect(neuron.state.data.currentInputs).toBe(2);

        // 4. Tick Neuron (Evaluate)
        // Advance buffer window
        jest.spyOn(Date, 'now').mockReturnValue(1000 + totalTime + 150);
        NeuronCell.onTick!(neuron, 16);

        // 5. Verify Neuron Fired (createImpulse called 3rd time)
        expect(createImpulse).toHaveBeenCalledTimes(3);
        const lastCall = (createImpulse as jest.Mock).mock.calls[2];
        expect(lastCall[0]).toBe(neuron);
    });
});
