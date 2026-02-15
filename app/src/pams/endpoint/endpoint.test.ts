import { EndpointCell } from './index';
import { scaffoldGrid, getGridSnapshot } from '@/test/utils';
import { useGridStore } from '@/store/grid-store';

describe('Endpoint Cell', () => {
    it('should initialize correctly', () => {
        const store = scaffoldGrid([{
            id: 'test-endpoint',
            coord: { q: 0, r: 0 },
            dna: EndpointCell.dna,
            state: { energy: 100, activity: 0 },
            signals: [],
            createdAt: Date.now()
        }]);

        expect(getGridSnapshot(store)).toMatchSnapshot('Initial State');
    });
});
