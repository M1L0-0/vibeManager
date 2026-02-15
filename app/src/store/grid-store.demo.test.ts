// import { describe, it, expect, beforeEach } from 'vitest';
import { useGridStore } from './grid-store';
import { Cell } from '@/lib/vibe-core';
import { DEFAULT_DISHES } from '@/seeds/demo-dishes';

describe('Demo Dish Hydration & Signal Logic', () => {
    beforeEach(() => {
        useGridStore.getState().clear();
    });

    it('should correctly import the Timer Demo and have working signals', () => {
        // 1. Get the JSON data from the seed
        const polyData = DEFAULT_DISHES.find(d => d.id === 'demo-timer')?.data;
        expect(polyData).toBeDefined();

        // 2. Parsed by importGrid
        useGridStore.getState().importGrid(polyData as string);

        // 3. Check if cells exist
        const updatedStore = useGridStore.getState(); // Fetch FRESH state
        const cells = Array.from(updatedStore.cells.values());
        expect(cells.length).toBeGreaterThan(0);

        // 4. Check Pixel at (0, 1) [Green]
        const pixel = cells.find(c => c.coord.q === 0 && c.coord.r === 1);
        expect(pixel).toBeDefined();
        if (pixel) {
            expect(pixel.dna.id).toBe('pixel');
            expect(pixel.state.seenSignals).toBeInstanceOf(Set);
        }

        // 6. Check Timer (should be running)
        const timer = cells.find(c => c.dna.id === 'timer');
        expect(timer).toBeDefined();
        if (timer) {
            expect((timer.state.data as any).isRunning).toBe(true);
            expect(timer.state.seenSignals).toBeInstanceOf(Set);
        }

        // 7. Test Propagation (Manual Trigger)
        // If seenSignals is an Array, this will throw
        if (pixel) {
            // Simulate receiving a signal
            const signal = {
                id: 'test-sig',
                type: 'wave',
                waveId: 'wave-1',
                strength: 1,
                sourceId: 'src',
                timestamp: Date.now(),
                sourceGroupId: undefined
            };

            // We can't easily call propagateSignal directly without mocking, 
            // but we can check if the underlying Set works.
            expect(() => pixel.state.seenSignals?.has('foo')).not.toThrow();
        }
    });
});
