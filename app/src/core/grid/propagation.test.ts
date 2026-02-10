import { handleStandardWavePropagation, createImpulse } from './propagation';
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
        coord: { q: 0, r: 0 },
        dna: { id: 'STANDARD', name: 'Standard', version: '1.0', color: '#fff' }, // Fix DNA structure
        state: {
            energy: 100,
            activity: 0,
            seenSignals: new Set(),
            data: {},
            groupId
        },
        signals: [],
        createdAt: Date.now()
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
    it('should deliver instantly to neighbors when instant is true', () => {
        const cell = createCell('0,0');
        const signal = createSignal('wave-instant');

        const neighbor = createCell('1,0');
        neighbor.coord = { q: 1, r: -1 }; // Explicit neighbor coord (0,0 neighbor is 1,-1 or 1,0 depending on orientation, standard hex neighbors of 0,0 are 1,0 1,-1 0,-1 -1,0 -1,1 0,1)

        mockCells.set(cell.id, cell);
        mockCells.set(neighbor.id, neighbor);

        // Mock getCellAt to return neighbor
        const mockGetCellAt = jest.fn((coord) => {
            // Simple mock: if coord matches neighbor, return neighbor
            if (coord.q === 1 && coord.r === -1) return neighbor;
            if (coord.q === 0 && coord.r === 0) return cell;
            return undefined;
        });

        (useGridStore.getState as unknown as jest.Mock).mockReturnValue({
            propagateSignal: mockPropagateSignal,
            updateCell: mockUpdateCell,
            cells: mockCells,
            deliverSignal: jest.fn(),
            getCellAt: mockGetCellAt,
            getAllCells: jest.fn().mockReturnValue([cell, neighbor])
        });

        const deliverSignalSpy = useGridStore.getState().deliverSignal;

        const result = handleStandardWavePropagation(cell, signal, { instant: true });

        expect(result).toBe(true);
        expect(deliverSignalSpy).toHaveBeenCalled();
        expect(mockPropagateSignal).not.toHaveBeenCalled();
    });

    it('createImpulse should deliver instantly to neighbors when instant is true (wireless false)', () => {
        const cell = createCell('0,0');
        const neighbor = createCell('1,0');
        neighbor.coord = { q: 1, r: -1 }; // Neighbor

        mockCells.set(cell.id, cell);
        mockCells.set(neighbor.id, neighbor);

        (useGridStore.getState as unknown as jest.Mock).mockReturnValue({
            propagateSignal: mockPropagateSignal,
            updateCell: mockUpdateCell,
            cells: mockCells,
            deliverSignal: jest.fn(),
            getCellAt: jest.fn(), // Not used by robust fix
            getAllCells: jest.fn().mockReturnValue([cell, neighbor])
        });

        const deliverSignalSpy = useGridStore.getState().deliverSignal;

        createImpulse(cell, 'wave', {}, { instant: true, wireless: false });

        expect(deliverSignalSpy).toHaveBeenCalledWith(neighbor.id, expect.any(Object));
        expect(mockPropagateSignal).not.toHaveBeenCalled();
    });
});
