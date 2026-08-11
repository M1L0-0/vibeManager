import { createGridStore } from './store/grid-store';
import { WaveCell } from './pams/wave/index';
import { StemCell } from './pams/stem/index';
import { REGISTRY } from './pams/registry';

describe('WaveCell Bug Test', () => {
    it('checks if WaveCell drops incoming waves', () => {
        const store = createGridStore();
        const grid = store.getState();

        function hex(q: number, r: number) { return { q, r, s: -q - r }; }
        grid.spawnCell(hex(0, 0), WaveCell.dna, WaveCell); // Origin Wave
        grid.spawnCell(hex(1, 0), StemCell.dna, StemCell); // Stem Right

        const cells = grid.getAllCells();
        const W = cells.find(c => c.coord.q === 0)!;

        let impulseSpy = jest.spyOn(console, 'log');

        WaveCell.onClick!(W, store);

        function tickLoop(frames: number) {
            for (let i = 0; i < frames; i++) {
                const state = store.getState();
                state.startBatch();

                state.updateParticles(particles => {
                    const next: any[] = [];
                    particles.forEach(p => {
                        console.log(`[Tick ${i}] Particle from ${p.sourceId} to ${p.targetId} type: ${p.signal.type} prog: ${p.progress.toFixed(2)}`);
                        p.progress += 0.5;
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
                        cell.signals.forEach(s => {
                            console.log(`[Tick ${i}] Cell ${cell.dna.name} receives signal ${s.type} command ${s.command}`);
                            pam.onSignal!(cell, s, store);
                        });
                        state.updateCell(cell.id, { signals: [] });
                    }
                });

                state.endBatch();
            }
        }

        tickLoop(10);
    });
});
