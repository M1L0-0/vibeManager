import { handleStandardWavePropagation } from './propagation';
import { useGridStore } from '@/store/grid-store';
import { Cell, Signal } from '@/lib/vibe-core';

// Mock the store
jest.mock('@/store/grid-store', () => ({
    useGridStore: {
        getState: jest.fn(),
    },
}));

describe('Signal Propagation', () => {
    const mockPropagateSignal = jest.fn();
    const mockUpdateCell = jest.fn();
    const mockCells = new Map();

    beforeEach(() => {
        jest.clearAllMocks();
        mockCells.clear();

        // Setup default mock implementation
        (useGridStore.getState as unknown as jest.Mock).mockReturnValue({
            propagateSignal: mockPropagateSignal,
            updateCell: mockUpdateCell,
            cells: mockCells,
        });
    });

    const createCell = (id: string, groupId?: string): Cell => ({
        id,
        q: 0,
        r: 0,
        type: 'STANDARD',
        state: {
            type: 'STANDARD',
        }
    });

    const createSignal = (waveId: string, sourceGroupId?: string): Signal => ({
        id: 'sig-1',
        type: 'wave',
        waveId,
        sourceGroupId,
        q: 0,
        r: 0
    });

    it('should propagate a fresh signal', () => {
        const cell = createCell('0,0');
        const signal = createSignal('wave-1');

        // Mock fresh cell retrieval
        mockCells.set(cell.id, cell);

        const result = handleStandardWavePropagation(cell, signal);

        expect(result).toBe(true);
        expect(mockPropagateSignal).toHaveBeenCalledTimes(1);
        expect(mockUpdateCell).toHaveBeenCalled();
    });

    it('should ignore duplicate signals (already seen)', () => {
        const cell = createCell('0,0');
        cell.state.seenSignals = new Set(['wave-1']);
        const signal = createSignal('wave-1');

        mockCells.set(cell.id, cell);

        const result = handleStandardWavePropagation(cell, signal);

        expect(result).toBe(false);
        expect(mockPropagateSignal).not.toHaveBeenCalled();
    });

    it('should respect group immunity', () => {
        const cell = createCell('0,0', 'group-A');
        // We need to manually add groupId to the state object as per the implementation check
        // impl: if (cell.state.groupId && signal.sourceGroupId === cell.state.groupId)
        cell.state.groupId = 'group-A';

        const signal = createSignal('wave-1', 'group-A');

        mockCells.set(cell.id, cell);

        const result = handleStandardWavePropagation(cell, signal);

        expect(result).toBe(false);
        expect(mockPropagateSignal).not.toHaveBeenCalled();
    });

    it('should update cell activity and seen signals', () => {
        const cell = createCell('0,0');
        const signal = createSignal('wave-1');
        mockCells.set(cell.id, cell);

        handleStandardWavePropagation(cell, signal);

        expect(mockUpdateCell).toHaveBeenCalledWith(
            '0,0',
            expect.objectContaining({
                state: expect.objectContaining({
                    activity: 0.8,
                    seenSignals: expect.any(Set)
                })
            })
        );
    });
});
