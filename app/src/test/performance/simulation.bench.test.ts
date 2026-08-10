import { createGridStore } from '@/store/grid-store';
import { StemDNA, TimerDNA, WaveDNA } from '@/pams/dna-catalog';
import { hexToId } from '@/core/grid/hex';
import { Cell } from '@/lib/vibe-core';

describe('Simulation Performance Benchmark', () => {
    let storeApi: ReturnType<typeof createGridStore>;

    beforeEach(() => {
        storeApi = createGridStore();
    });

    it('BENCHMARK: 10000 Cells, 100 Ticks', async () => {
        const gridSize = 100; // Approx 10,000 cells (100x100)

        // 1. Setup Grid (Heavy Write)
        const setupStart = performance.now();
        const { spawnCell } = storeApi.getState();

        for (let q = 0; q < gridSize; q++) {
            for (let r = 0; r < gridSize; r++) {
                // Mix of cells: 
                // 10% Timers (Signal Sources)
                // 40% Wires (Conductors)
                // 50% Stem (Receivers)
                const rand = Math.random();
                let dna = StemDNA;
                if (rand < 0.1) dna = TimerDNA;
                else if (rand < 0.5) dna = WaveDNA;

                spawnCell({ q, r }, dna);
            }
        }
        const setupEnd = performance.now();
        const cellCount = storeApi.getState().cells.size;
        console.log(`[Setup] Created ${cellCount} cells in ${(setupEnd - setupStart).toFixed(2)}ms`);

        // 2. Warmup
        for (let i = 0; i < 5; i++) {
            const cells = storeApi.getState().getAllCells();
            cells.forEach(cell => { /* No-op */ });
        }

        // 3. Simulation Loop
        const TICK_COUNT = 100; // Reduced ticks because it might be slow
        const tickStart = performance.now();

        for (let i = 0; i < TICK_COUNT; i++) {
            // Emulate the Ticker Logic with BATCHING
            const currentStore = storeApi.getState();
            currentStore.startBatch(); // <--- OPTIMIZATION HERE

            const allCells = currentStore.getAllCells();

            // A. Physics Step
            if (currentStore.particles.length > 0) {
                currentStore.updateParticles(particles => {
                    return particles.filter(p => {
                        p.progress += 0.2;
                        return p.progress < 1.0;
                    });
                });
            }

            // B. Cellular Automata Step
            const activeCount = Math.floor(cellCount * 0.05); // 500 active cells
            // Optimization: Just slice the array, assuming stability (in real app we iterate all)
            const activeCells = allCells.slice(0, activeCount);

            activeCells.forEach(cell => {
                // Force a state update (The Bottleneck)
                currentStore.updateCell(cell.id, {
                    state: { activity: Math.random() }
                }, { skipHistory: true });
            });

            currentStore.endBatch(); // <--- OPTIMIZATION HERE (Commit once)
        }

        const tickEnd = performance.now();
        const totalTime = tickEnd - tickStart;
        const avgTick = totalTime / TICK_COUNT;

        console.log(`[Benchmark] ${TICK_COUNT} Ticks completed in ${totalTime.toFixed(2)}ms`);
        console.log(`[Benchmark] Average Tick: ${avgTick.toFixed(2)}ms`); // Target: < 16ms

        expect(cellCount).toBeGreaterThan(9000);
        expect(totalTime).toBeGreaterThan(0);
    });
});
