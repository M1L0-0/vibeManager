import { RibosomeCell } from './index';
import { scaffoldGrid, getGridSnapshot } from '@/test/utils';
import { useGridStore } from '@/store/grid-store';

describe('Ribosome Cell', () => {
    it('should initialize correctly', () => {
        const store = scaffoldGrid([{
            id: 'test-ribosome',
            coord: { q: 0, r: 0 },
            dna: RibosomeCell.dna,
            state: { energy: 100, activity: 0 },
            signals: [],
            createdAt: Date.now()
        }]);

        expect(getGridSnapshot(store)).toMatchSnapshot('Initial State');
    });
});
