import { useGridStore } from '@/store/grid-store';
import { Cell, Particle } from '@/lib/vibe-core';
import { hexToId } from '@/core/grid/hex';
import { REGISTRY } from '@/pams/registry';

/**
 * Resets and populates the global GridStore for testing.
 */
export const scaffoldGrid = (cells: Cell[]) => {
    const store = useGridStore;

    store.setState({
        cells: new Map(),
        groups: new Map(),
        signals: [],
        particles: [],
        history: { past: [], future: [] },
        clipboard: []
    });

    store.setState((state) => {
        const newCells = new Map(state.cells);
        cells.forEach((cell) => {
            // Correctly set ID matching coordinate if not provided
            const id = cell.id || hexToId(cell.coord);
            newCells.set(id, { ...cell, id });
        });
        return { cells: newCells };
    });

    return store;
};

/**
 * Simulates the game loop by advancing time in small increments (16ms).
 * This mimics the functionality of `CellTicker.tsx` headlessly.
 */
export const advanceTimer = (store: typeof useGridStore, ms: number) => {
    const TICK_MS = 16;
    let remainingMs = ms;

    while (remainingMs > 0) {
        const dtMs = Math.min(remainingMs, TICK_MS);
        const deltaTime = dtMs / 1000; // seconds

        jest.advanceTimersByTime(dtMs);

        const state = store.getState();
        const gridStore = state; // alias for clarity

        // --- 1. Particle Physics ---
        if (gridStore.particles.length > 0) {
            gridStore.updateParticles((particles) => {
                const nextParticles: Particle[] = [];

                particles.forEach(p => {
                    p.progress += (deltaTime * p.speed);

                    if (p.progress >= 1.0) {
                        gridStore.deliverSignal(p.targetId, p.signal);
                    } else {
                        nextParticles.push(p);
                    }
                });
                return nextParticles;
            });
        }

        // --- 2. Cell Logic (Tick + Signal Processing) ---
        // We must fetch cells again in case logic added/removed them (though unlikely in tick)
        const cells = gridStore.getAllCells();

        cells.forEach((cell) => {
            const pamModule = REGISTRY[cell.dna.id];

            // Tick
            if (pamModule?.onTick) {
                pamModule.onTick(cell, deltaTime);
            }

            // Signals
            if (cell.signals.length > 0 && pamModule?.onSignal) {
                cell.signals.forEach((signal) => {
                    try {
                        pamModule.onSignal!(cell, signal);
                    } catch (e) {
                        console.error(`Error processing signal for ${cell.id}`, e);
                    }
                });

                // Clear processed signals (skip history to avoid spam)
                gridStore.updateCell(cell.id, { signals: [] }, { skipHistory: true });
            }
        });

        // Increment internal tick counter if needed (mostly for debug)
        // store.getState().incrementTick(); // simulation-store has this, not grid-store

        remainingMs -= dtMs;
    }
};

/**
 * returns a deterministic snapshot of the grid state.
 */
export const getGridSnapshot = (store: typeof useGridStore) => {
    const state = store.getState();

    return {
        // Sort cells by ID for deterministic output
        cells: Array.from(state.cells.values())
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(cell => ({
                id: cell.id,
                coord: cell.coord, // Use full object
                type: cell.dna.id,
                state: {
                    ...cell.state,
                    // Strip non-deterministic fields if any? timestamp?
                    lastFired: cell.state.data?.lastFired ? 'MOCKED_TIMESTAMP' : undefined
                },
                signals: cell.signals // Pending signals
            })),
        particles: state.particles
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(p => ({
                source: p.sourceId,
                target: p.targetId,
                progress: p.progress.toFixed(2), // Round for stability
                type: p.signal.type
            }))
    };
};
