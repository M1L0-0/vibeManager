import { scaffoldGrid, advanceTimer, getGridSnapshot } from '@/test/utils';
import { StemCell } from '@/pams/stem';
import { WaveCell } from '@/pams/wave';

// Mock timer so we can control ticks
jest.useFakeTimers();

describe('Grid Snapshots', () => {

    it('Stem Cell Generation: should emit signal every 2 seconds', () => {
        // Setup a single Stem Cell at 0,0
        const store = scaffoldGrid([{
            id: 'stem-1',
            coord: { q: 0, r: 0 },
            dna: StemCell.dna,
            state: {
                energy: 100,
                activity: 0,
                data: {
                    interval: 2000 // 2 seconds
                }
            },
            signals: [],
            createdAt: Date.now()
        }]);

        // Snapshot initial state
        expect(getGridSnapshot(store)).toMatchSnapshot('Initial State');

        // Advance 1 second (no signal yet)
        advanceTimer(store, 1000);
        expect(getGridSnapshot(store)).toMatchSnapshot('After 1s (No Signal)');

        // Advance another 1.1 seconds (signal should be emitted)
        advanceTimer(store, 1100);
        expect(getGridSnapshot(store)).toMatchSnapshot('After 2.1s (Signal Emitted)');
    });

    it('Wave Propagation: should transmit signal to neighbor', () => {
        // Setup: Stem (0,0) -> Wave (1,0)
        const store = scaffoldGrid([
            {
                id: 'stem-1',
                coord: { q: 0, r: 0 },
                dna: StemCell.dna,
                state: {
                    energy: 100,
                    activity: 0,
                    data: { interval: 1000 }
                },
                signals: [],
                createdAt: Date.now()
            },
            {
                id: 'wave-1',
                coord: { q: 1, r: 0 },
                dna: WaveCell.dna,
                state: {
                    energy: 100,
                    activity: 0,
                    data: { directions: [0, 1, 2, 3, 4, 5] } // Omni-directional
                },
                signals: [],
                createdAt: Date.now()
            }
        ]);

        // Trigger the stem cell immediately
        advanceTimer(store, 1100);
        expect(getGridSnapshot(store)).toMatchSnapshot('Signal emitted from Stem');

        // Allow time for signal to travel (depends on speed, typically < 1s for adjacent)
        advanceTimer(store, 500);
        expect(getGridSnapshot(store)).toMatchSnapshot('Signal reaches Wave');
    });
});
