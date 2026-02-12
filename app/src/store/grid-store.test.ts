import { useGridStore } from './grid-store';
import { useToolStore } from './tool-store';
import { StemDNA, PixelDNA } from '@/pams/dna-catalog';
import { hexToId } from '@/core/grid/hex';

// Mock dependencies if needed, but Zustand stores are usually testable directly if environments are set up
// We might need to handle the 'create' import if it's strict on environment.
// For now, let's assume standard Jest setup for Zustand.

describe('GridStore Features', () => {
    beforeEach(() => {
        useGridStore.setState({
            cells: new Map(),
            groups: new Map(),
            history: { past: [], future: [] },
            clipboard: []
        });
    });

    it('should push history on checking state changes', () => {
        const startState = useGridStore.getState().history.past.length;

        useGridStore.getState().spawnCell({ q: 0, r: 0 }, StemDNA, {} as any);

        expect(useGridStore.getState().history.past.length).toBe(startState + 1);
    });

    it('should undo and redo cell spawning', () => {
        useGridStore.getState().spawnCell({ q: 0, r: 0 }, StemDNA, {} as any);
        const id = hexToId({ q: 0, r: 0 });

        expect(useGridStore.getState().cells.has(id)).toBe(true);

        useGridStore.getState().undo();
        expect(useGridStore.getState().cells.has(id)).toBe(false);

        useGridStore.getState().redo();
        expect(useGridStore.getState().cells.has(id)).toBe(true);
    });

    it('should copy and paste cells', () => {
        useGridStore.getState().spawnCell({ q: 0, r: 0 }, StemDNA, {} as any);
        const id = hexToId({ q: 0, r: 0 });

        useGridStore.getState().copy(new Set([id]));
        expect(useGridStore.getState().clipboard.length).toBe(1);

        // Paste at 5,5
        useGridStore.getState().paste({ q: 5, r: 5 });

        const newId = hexToId({ q: 5, r: 5 });
        const newStore = useGridStore.getState();
        expect(newStore.cells.has(newId)).toBe(true);
        const cell = newStore.cells.get(newId);
        expect(cell?.dna.id).toBe('stem');
    });

    it('should handle Pixel Cell color updates', () => {
        useGridStore.getState().spawnCell({ q: 0, r: 0 }, PixelDNA, {} as any);
        const id = hexToId({ q: 0, r: 0 });

        const cellBefore = useGridStore.getState().cells.get(id);
        expect(cellBefore).toBeDefined();

        useGridStore.getState().updateCell(id, {
            state: {
                ...cellBefore!.state,
                data: { displayColor: '#ff0000' }
            }
        });

        const cellAfter = useGridStore.getState().cells.get(id);
        expect((cellAfter!.state.data as any).displayColor).toBe('#ff0000');
    });
});
