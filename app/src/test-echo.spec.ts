import { createGridStore } from './store/grid-store';
import { WaveCell } from './pams/wave/index';
import { StemCell } from './pams/stem/index';
import { REGISTRY } from './pams/registry';

describe('Echo Chamber Test', () => {
    it('simulates tick loop and checks for echo chamber', () => {
        const store = createGridStore();
        const grid = store.getState();

        function hex(q: number, r: number) { return { q, r, s: -q - r }; }
        grid.spawnCell(hex(0, 0), WaveCell.dna, WaveCell);
        grid.spawnCell(hex(1, 0), StemCell.dna, StemCell);
        grid.spawnCell(hex(-1, 0), StemCell.dna, StemCell);

        const cells = grid.getAllCells();
        const W = cells.find(c => c.coord.q === 0)!;

        console.log('--- Clicking WaveCell ---');
        WaveCell.onClick!(W, store);

        function tickLoop(frames: number) {
            for (let i = 0; i < frames; i++) {
                const state = store.getState();
                state.startBatch();

                state.updateParticles(particles => {
                    const next: any[] = [];
                    particles.forEach(p => {
                        p.progress += 0.5; // reaches 1.0 in 2 ticks
                        if (p.progress >= 1.0) {
                            state.deliverSignal(p.targetId, p.signal);
                        } else {
                            next.push(p);
                        }
                    });
                    return next;
                });

                const allCells = state.getAllCells();
                allCells.forEach(cell => {
                    const pam = REGISTRY[cell.dna.id];
                    if (cell.signals.length > 0 && pam?.onSignal) {
                        // console.log(`[Tick ${i}] Cell ${cell.dna.id} (${cell.coord.q},${cell.coord.r}) processes ${cell.signals.length} signals.`);
                        cell.signals.forEach(s => {
                            pam.onSignal!(cell, s, store);
                        });
                        state.updateCell(cell.id, { signals: [] });
                    }
                });

                state.endBatch();

                const c = store.getState().getCellAt(hex(0, 0));
                const active = store.getState().particles.length;
                if (active > 0) {
                    console.log(`[Tick ${i}] Active particles: ${active}, Wave seenSignals size: ${c?.state.seenSignals?.size}`);
                }
            }
        }

        tickLoop(10);
        const finalActive = store.getState().particles.length;
        console.log('Final active particles:', finalActive);
        expect(finalActive).toBe(0);
    });
});
