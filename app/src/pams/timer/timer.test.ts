import { TimerCell } from './index';
import { Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';

// Mock the store
jest.mock('@/store/grid-store', () => ({
    useGridStore: {
        getState: jest.fn(),
    },
}));

// Mock propagation helper to act as if it worked
jest.mock('@/core/grid/propagation', () => ({
    handleStandardWavePropagation: jest.fn(() => true), // Return true = propagated/not duplicate
}));

describe('Timer Cell', () => {
    const mockUpdateCell = jest.fn();
    const mockPropagateSignal = jest.fn();
    const mockCells = new Map();

    beforeEach(() => {
        jest.clearAllMocks();
        mockCells.clear();
        (useGridStore.getState as unknown as jest.Mock).mockReturnValue({
            updateCell: mockUpdateCell,
            propagateSignal: mockPropagateSignal,
            cells: mockCells,
        });
    });

    const createTimerCell = (id: string, isRunning: boolean = false): Cell => ({
        id,
        coord: { q: 0, r: 0 },
        dna: TimerCell.dna,
        state: {
            energy: 100,
            activity: 0,
            seenSignals: new Set(),
            data: {
                maxTime: 3,
                timeRemaining: 3,
                isRunning: isRunning,
                lastTick: Date.now(),
                autoRestart: false,
                loop: false,
                paused: false
            }
        },
        signals: [],
        createdAt: Date.now()
    });

    const createWaveSignal = (waveId: string): Signal => ({
        id: 'sig-1',
        type: 'wave',
        waveId,
        sourceId: 'src-1',
        timestamp: Date.now(),
        strength: 1,
        payload: { message: 'test' }
    });

    it('should toggle running state when receiving a fresh wave', () => {
        const cell = createTimerCell('timer-1', false);
        const signal = createWaveSignal('wave-A');

        // Mock store retrieval
        mockCells.set(cell.id, cell);

        if (TimerCell.onSignal) {
            TimerCell.onSignal(cell, signal);
        }

        // It should have called updateCell with isRunning = true
        expect(mockUpdateCell).toHaveBeenCalledWith(
            'timer-1',
            expect.objectContaining({
                state: expect.objectContaining({
                    data: expect.objectContaining({
                        isRunning: true
                    })
                })
            }),
            { skipHistory: true }
        );
    });

    it('should NOT toggle running state if wave is already seen', () => {
        const cell = createTimerCell('timer-1', false);
        cell.state.seenSignals!.add('wave-A'); // Already seen

        const signal = createWaveSignal('wave-A');
        mockCells.set(cell.id, cell);

        // Update mock to simulate propagation helper returning false for duplicate
        const { handleStandardWavePropagation } = require('@/core/grid/propagation');
        handleStandardWavePropagation.mockReturnValue(false);

        if (TimerCell.onSignal) {
            TimerCell.onSignal(cell, signal);
        }

        // Should NOT update state toggling isRunning
        // Note: updateCell might be called by propagation helper logic internally, 
        // but we mocked that helper. 
        // Key is: did we reach the toggle logic?

        // If logic was reached, isRunning would flip to true.
        // We expect it NOT to flip.
        expect(mockUpdateCell).not.toHaveBeenCalledWith(
            'timer-1',
            expect.objectContaining({
                state: expect.objectContaining({
                    data: expect.objectContaining({
                        isRunning: true
                    })
                })
            }),
            { skipHistory: true }
        );
    });
});
