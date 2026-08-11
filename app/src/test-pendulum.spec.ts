import { createGridStore } from './store/grid-store';
import { WaveCell } from './pams/wave/index';
import { StemCell } from './pams/stem/index';
import { TimerCell } from './pams/timer/index';
import { getHexesInRadius } from './core/grid/hex';
import { REGISTRY } from './pams/registry';

describe('Pendulum Bug Simulation', () => {
    it('simulates the exact PetriDish layout to find the loop', () => {


        const store = createGridStore();
        const grid = store.getState();
        const spawnCell = grid.spawnCell;

        // Same layout as PetriDish.tsx
        const centerCoord = { q: 0, r: 0 };
        const hexes = getHexesInRadius(centerCoord, 3);
        const timerCoord = { q: 2, r: 1 };
        const waveCoord = { q: -2, r: 1 };

        hexes.forEach((coord) => {
            if (coord.q === timerCoord.q && coord.r === timerCoord.r) {
                spawnCell(coord, TimerCell.dna, TimerCell);
            } else if (coord.q === waveCoord.q && coord.r === waveCoord.r) {
                spawnCell(coord, WaveCell.dna, WaveCell);
            } else {
                spawnCell(coord, StemCell.dna, StemCell);
            }
        });

        const wCell = grid.getCellAt(waveCoord);

        // Click WaveCell
        WaveCell.onClick!(wCell!, store);

        let activeCount = 0;
        let peakActive = 0;
        let finalTick = 0;

        for (let i = 0; i < 200; i++) { // 200 ticks = lot of time
            const state = store.getState();
            state.startBatch();

            state.updateParticles(particles => {
                const next: any[] = [];
                particles.forEach(p => {
                    p.progress += 0.08; // (0.016 * 5.0)
                    if (p.progress >= 1.0) {
                        state.deliverSignal(p.targetId, p.signal);
                    } else {
                        next.push(p);
                    }
                });
                return next;
            });

            state.getAllCells().forEach(cell => {
                const pam = REGISTRY[cell.dna.id];
                if (cell.signals.length > 0 && pam?.onSignal) {
                    cell.signals.forEach(s => pam.onSignal!(cell, s, store));
                    state.updateCell(cell.id, { signals: [] });
                }
            });

            state.endBatch();

            const c = store.getState().particles.length;
            activeCount = c;
            if (c > peakActive) peakActive = c;

            if (c === 0 && i > 10) {
                finalTick = i;
                break; // Everything died
            }
        }

        console.log(`Peak particles: ${peakActive}, loop ended at tick: ${finalTick}`);

        // Let's print if it actually died!
        expect(activeCount).toBe(0);
    });
});
