
import { describe, it, expect, beforeEach } from '@jest/globals';
import { useToolStore } from './tool-store';
import { useGridStore } from './grid-store';
import { StemCell } from '@/pams/stem';

// Mock Grid Store
// Check if global jest is available, if not assume standard environment
declare const jest: any;

jest.mock('./grid-store', () => ({
    useGridStore: {
        getState: jest.fn(),
    },
}));

describe('ToolStore FSM', () => {
    let mockGridActions: any;

    beforeEach(() => {
        useToolStore.setState({
            interaction: { type: 'HAND_IDLE' },
            view: {
                showSynapticVision: false,
                pan: { x: 0, y: 0 },
                zoom: 1,
                showNebula: true,
                showDebugOverlay: false
            }
        });

        mockGridActions = {
            spawnCell: jest.fn(),
            killCell: jest.fn(),
            mergeCells: jest.fn(),
            updateCell: jest.fn(),
            propagateSignal: jest.fn(),
            getCellAt: jest.fn(),
        };

        (useGridStore.getState as any).mockReturnValue(mockGridActions);
    });

    it('should initialize in HAND_IDLE state', () => {
        expect(useToolStore.getState().interaction.type).toBe('HAND_IDLE');
    });

    it('should transition to INSPECT_IDLE', () => {
        useToolStore.getState().setToolInspect();
        expect(useToolStore.getState().interaction.type).toBe('INSPECT_IDLE');
    });

    it('should transition to GENESIS_IDLE with DNA', () => {
        useToolStore.getState().setToolGenesis(StemCell.dna);
        const state = useToolStore.getState().interaction;
        expect(state.type).toBe('GENESIS_IDLE');
        if (state.type === 'GENESIS_IDLE') {
            expect(state.dna.id).toBe('stem');
        }
    });

    describe('Genesis Spawn Mode', () => {
        it('should spawn cell on click', () => {
            useToolStore.getState().setToolGenesis(StemCell.dna);

            const cellMock = {
                id: 'cell-1',
                coord: { q: 0, r: 0 },
                dna: { id: 'void' } // existing cell
            } as any;

            useToolStore.getState().handleGridEvent({ type: 'CLICK', cell: cellMock });

            expect(mockGridActions.killCell).toHaveBeenCalledWith('cell-1');
            expect(mockGridActions.spawnCell).toHaveBeenCalled();
        });
    });

    describe('Genesis Glue Mode', () => {
        it('should enter glue source selection mode', () => {
            useToolStore.getState().setToolGenesisGlue();
            expect(useToolStore.getState().interaction.type).toBe('GENESIS_GLUING_SOURCE');
        });

        it('should transition to target selection after picking source', () => {
            useToolStore.getState().setToolGenesisGlue();
            const sourceCell = { id: 'source-1' } as any;

            useToolStore.getState().handleGridEvent({ type: 'CLICK', cell: sourceCell });

            const state = useToolStore.getState().interaction;
            expect(state.type).toBe('GENESIS_GLUING_TARGET');
            if (state.type === 'GENESIS_GLUING_TARGET') {
                expect(state.sourceId).toBe('source-1');
            }
        });

        it('should merge cells when target is clicked', () => {
            useToolStore.getState().setToolGenesisGlue();
            // Select Source
            useToolStore.getState().handleGridEvent({ type: 'CLICK', cell: { id: 'source-1' } as any });
            // Select Target
            useToolStore.getState().handleGridEvent({ type: 'CLICK', cell: { id: 'target-1' } as any });

            expect(mockGridActions.mergeCells).toHaveBeenCalledWith('source-1', 'target-1');
            // Should reset to source selection
            expect(useToolStore.getState().interaction.type).toBe('GENESIS_GLUING_SOURCE');
        });

        it('should cancel if clicking same cell as target', () => {
            useToolStore.getState().setToolGenesisGlue();
            useToolStore.getState().handleGridEvent({ type: 'CLICK', cell: { id: 'source-1' } as any });
            useToolStore.getState().handleGridEvent({ type: 'CLICK', cell: { id: 'source-1' } as any });

            expect(mockGridActions.mergeCells).not.toHaveBeenCalled();
            expect(useToolStore.getState().interaction.type).toBe('GENESIS_GLUING_SOURCE');
        });
    });

    describe('View State', () => {
        it('should toggle synaptic vision independently', () => {
            expect(useToolStore.getState().view.showSynapticVision).toBe(false);
            useToolStore.getState().toggleSynapticVision();
            expect(useToolStore.getState().view.showSynapticVision).toBe(true);

            // Should not affect interaction state
            expect(useToolStore.getState().interaction.type).toBe('HAND_IDLE');
        });
    });
});
