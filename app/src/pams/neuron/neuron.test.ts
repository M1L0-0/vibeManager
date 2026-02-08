import { createStore } from 'zustand';
import { useGridStore } from '@/store/grid-store';
import { NeuronCell } from './index';
import { Cell, Signal } from '@/lib/vibe-core';
import { createImpulse } from '@/core/grid/propagation';

// Mock the store
jest.mock('@/store/grid-store', () => ({
    useGridStore: {
        getState: jest.fn(),
    },
}));

// Mock propagation
jest.mock('@/core/grid/propagation', () => ({
    handleStandardWavePropagation: jest.fn(),
    createImpulse: jest.fn(),
}));

describe('Neuron Cell Logic', () => {
    let mockStore: any;
    let cell: Cell;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock store with minimum implementation
        mockStore = {
            updateCell: jest.fn(),
            propagateSignal: jest.fn(),
            cells: new Map(),
        };
        (useGridStore.getState as jest.Mock).mockReturnValue(mockStore);

        // Setup default cell
        cell = {
            id: 'test-neuron',
            coord: { q: 0, r: 0 },
            dna: NeuronCell.dna,
            state: {
                energy: 100,
                activity: 0,
                data: {
                    operation: 'AND',
                    currentInputs: 0,
                    _lastInputTime: 0,
                    _inputBuffer: 0,
                },
            },
            signals: [],
            createdAt: Date.now(),
        };
    });

    test('buffers inputs within window', () => {
        const now = 1000;
        jest.spyOn(Date, 'now').mockReturnValue(now);

        // First signal
        NeuronCell.onSignal!(cell, { id: 's1', type: 'wave', sourceId: 'src1' } as Signal);

        expect(mockStore.updateCell).toHaveBeenCalledWith(
            cell.id,
            expect.objectContaining({
                state: expect.objectContaining({
                    data: expect.objectContaining({
                        _inputBuffer: 1,
                        currentInputs: 1
                    })
                })
            })
        );

        // Update cell state to reflect the change
        cell.state.data = { ...cell.state.data, _inputBuffer: 1, _lastInputTime: now };

        // Second signal (immediate)
        NeuronCell.onSignal!(cell, { id: 's2', type: 'wave', sourceId: 'src2' } as Signal);

        expect(mockStore.updateCell).toHaveBeenLastCalledWith(
            cell.id,
            expect.objectContaining({
                state: expect.objectContaining({
                    data: expect.objectContaining({
                        _inputBuffer: 2,
                        currentInputs: 2
                    })
                })
            })
        );
    });

    test('resets buffer after window expiration', () => {
        const start = 1000;
        jest.spyOn(Date, 'now').mockReturnValue(start);

        // First signal
        NeuronCell.onSignal!(cell, { id: 's1', type: 'wave', sourceId: 'src1' } as Signal);

        // Advance time past window (100ms)
        jest.spyOn(Date, 'now').mockReturnValue(start + 200);

        // Update cell to have old buffer
        cell.state.data = { ...cell.state.data, _inputBuffer: 1, _lastInputTime: start };

        // New signal arrives late
        NeuronCell.onSignal!(cell, { id: 's2', type: 'wave', sourceId: 'src2' } as Signal);

        // Should reset to 1 (not 2)
        expect(mockStore.updateCell).toHaveBeenLastCalledWith(
            cell.id,
            expect.objectContaining({
                state: expect.objectContaining({
                    data: expect.objectContaining({
                        _inputBuffer: 1
                    })
                })
            })
        );
    });

    describe('Logic Evaluation', () => {
        function triggerTick(mode: string, inputCount: number) {
            cell.state.data!.operation = mode as any;
            cell.state.data!._inputBuffer = inputCount;
            cell.state.data!._lastInputTime = 1000;

            // Advance time to trigger evaluation
            jest.spyOn(Date, 'now').mockReturnValue(1200);

            NeuronCell.onTick!(cell, 16);
        }

        test('AND gate fires with 2 inputs', () => {
            triggerTick('AND', 2);
            expect(createImpulse).toHaveBeenCalledWith(
                cell, 'wave', expect.anything(), expect.objectContaining({ command: 'TRIGGER' })
            );
        });

        test('AND gate ignores 1 input', () => {
            triggerTick('AND', 1);
            expect(createImpulse).not.toHaveBeenCalled();
        });

        test('OR gate fires with 1 input', () => {
            triggerTick('OR', 1);
            expect(createImpulse).toHaveBeenCalled();
        });

        test('XOR gate fires with 1 input', () => {
            triggerTick('XOR', 1);
            expect(createImpulse).toHaveBeenCalled();
        });

        test('XOR gate ignores 2 inputs', () => {
            triggerTick('XOR', 2);
            expect(createImpulse).not.toHaveBeenCalled();
        });
    });
});
