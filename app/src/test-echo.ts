import { createGridStore } from './store/grid-store';
import { WaveCell } from './pams/wave/index';
import { StemCell } from './pams/stem/index';
import { REGISTRY } from './pams/registry';

const store = createGridStore();
const grid = store.getState();

// Spawn cells
function hex(q: number, r: number) { return { q, r, s: -q - r }; }
grid.spawnCell(hex(0, 0), WaveCell.dna, WaveCell); // Origin Wave
grid.spawnCell(hex(1, 0), StemCell.dna, StemCell); // Stem Right
grid.spawnCell(hex(-1, 0), StemCell.dna, StemCell); // Stem Left

const cells = grid.getAllCells();
const W = cells.find(c => c.coord.q === 0)!;
const SR = cells.find(c => c.coord.q === 1)!;
const SL = cells.find(c => c.coord.q === -1)!;

console.log('--- Clicking WaveCell ---');
WaveCell.onClick!(W, store);

function tickLoop(frames: number) {
    for (let i = 0; i < frames; i++) {
        const state = store.getState();
        state.startBatch();

        // Particles
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

        // Cells
        const allCells = state.getAllCells();
        allCells.forEach(cell => {
            const pam = REGISTRY[cell.dna.id];
            if (cell.signals.length > 0 && pam?.onSignal) {
                console.log(`[Tick ${i}] Cell ${cell.dna.id} (${cell.coord.q},${cell.coord.r}) processes ${cell.signals.length} signals.`);
                cell.signals.forEach(s => {
                    pam.onSignal!(cell, s, store);
                });
                state.updateCell(cell.id, { signals: [] });
            }
        });

        state.endBatch();

        let c = store.getState().getCellAt(hex(0, 0));
        let active = store.getState().particles.length;
        if (active > 0) {
            console.log(`[Tick ${i}] Active particles: ${active}, Wave seenSignals size: ${c?.state.seenSignals?.size}`);
        }
    }
}

tickLoop(10);
