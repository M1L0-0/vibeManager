/**
 * Global Ticker - Calls onTick for all cells that need it
 */

'use client';

import { useEffect } from 'react';
import { Particle } from '@/lib/vibe-core';
import { useGridStoreApi } from '@/store/grid-store';
import { useSimulationStoreApi } from '@/store/simulation-store';
import { useToolStoreApi } from '@/store/tool-store';
import { REGISTRY } from '@/pams/registry';

// Map of PAM IDs to their modules
// Now using central registry to ensure all cells (including Neuron) are handled
const PAM_REGISTRY = REGISTRY;

export function CellTicker() {
    const gridStore = useGridStoreApi();
    const toolStore = useToolStoreApi();
    const simStore = useSimulationStoreApi();

    useEffect(() => {
        let lastTime = Date.now();
        let animationFrameId: number;

        const tick = () => {
            try {
                const state = simStore.getState();

                if (!state.isPlaying) {
                    lastTime = Date.now();
                    animationFrameId = requestAnimationFrame(tick);
                    return;
                }

                const now = Date.now();
                let deltaTime = (now - lastTime) / 1000;
                lastTime = now;

                const view = toolStore.getState().view;

                if (view.showSynapticVision) {
                    deltaTime *= state.simulationSpeed;
                } else {
                    deltaTime *= 1.0;
                }

                state.incrementTick();

                const gridState = gridStore.getState();

                // START BATCH
                gridState.startBatch();

                // --- Particle Physics Step ---
                if (gridState.particles.length > 0) {
                    gridState.updateParticles((particles) => {
                        const nextParticles: Particle[] = [];
                        particles.forEach(p => {
                            p.progress += (deltaTime * p.speed);
                            if (p.progress >= 1.0) {
                                gridState.deliverSignal(p.targetId, p.signal);
                            } else {
                                nextParticles.push(p);
                            }
                        });
                        return nextParticles;
                    });
                }

                // --- Cellular Automata Step ---
                const cells = gridState.getAllCells();
                cells.forEach((cell) => {
                    try {
                        const pamModule = PAM_REGISTRY[cell.dna.id];
                        if (pamModule?.onTick) {
                            pamModule.onTick(cell, deltaTime, gridStore);
                        }

                        // Process Signals (Buffer -> Logic -> Clear)
                        if (cell.signals.length > 0 && pamModule?.onSignal) {
                            cell.signals.forEach((signal) => {
                                try {
                                    pamModule!.onSignal!(cell, signal, gridStore);
                                } catch (signalError) {
                                    console.error(`Error processing signal for cell ${cell.id}:`, signalError);
                                }
                            });
                            // Clear signals after processing
                            gridState.updateCell(cell.id, { signals: [] }, { skipHistory: true });
                        }
                    } catch (cellError) {
                        console.error(`Error processing tick for cell ${cell.id}:`, cellError);
                    }
                });

                // END BATCH (Commit all updates in one render)
                gridState.endBatch();

                if (state.tickCount % 60 === 0) {
                    // console.log stats
                }

                animationFrameId = requestAnimationFrame(tick);
            } catch (e) {
                console.error("Critical Ticker Error:", e);
            }
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [gridStore, toolStore, simStore]);

    return null;
}
