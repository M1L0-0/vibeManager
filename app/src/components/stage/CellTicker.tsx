/**
 * Global Ticker - Calls onTick for all cells that need it
 */

'use client';

import { useEffect } from 'react';
import { Particle } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { useSimulationStore } from '@/store/simulation-store';
import { useToolStore } from '@/store/tool-store';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';

// Map of PAM IDs to their modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAM_REGISTRY: Record<string, any> = {
    'stem': StemCell,
    'timer': TimerCell,
    'wave': WaveCell,
};

export function CellTicker() {
    // No hooks here, we use direct store access in the loop to prevent re-renders restarting the loop

    // We only subscribe to showParticles to force re-mount if needed (unlikely)
    // But we don't want the loop to restart on speed changes.
    // So we'll access state directly inside the loop.

    useEffect(() => {
        let lastTime = Date.now();
        let animationFrameId: number;

        const tick = () => {
            try {
                const state = useSimulationStore.getState();

                if (!state.isPlaying) {
                    // If paused, just keep looping but don't advance physics
                    lastTime = Date.now(); // Reset time so we don't jump when resuming
                    animationFrameId = requestAnimationFrame(tick);
                    return;
                }

                const now = Date.now();
                let deltaTime = (now - lastTime) / 1000; // Convert to seconds
                lastTime = now;

                // Apply simulation speed (Time Scale) ONLY if we are in Visualizer mode
                // Apply simulation speed (Time Scale) IF Synaptic Vision is ON
                // OR if we decide global speed should always apply? 
                // User requirement says "speed modifier in synaptic vision mode is broken", implying it's linked.
                // But logic-wise, speed should probably apply always if the controls are visible?
                // For now, let's link it to the vision toggle as requested.
                const view = useToolStore.getState().view;

                // Allow speed mod if Synaptic Vision is ON *OR* if we just want global control.
                // Previous logic was specific to 'visualizer' tool. 
                // Given Sim Controls are now always visible, maybe speed should always apply?
                // But the user specifically mentioned "in synaptic vision mode".
                // Let's stick to: If Vision is ON, use speed. If OFF, run real-time (1.0).
                if (view.showSynapticVision) {
                    deltaTime *= state.simulationSpeed;
                } else {
                    deltaTime *= 1.0;
                }

                // debugging/stats
                state.incrementTick();

                const gridStore = useGridStore.getState();

                // --- Particle Physics Step (Signal Travel) ---
                if (gridStore.particles.length > 0) {
                    gridStore.updateParticles((particles) => {
                        const nextParticles: Particle[] = [];

                        particles.forEach(p => {
                            // Move particle
                            p.progress += (deltaTime * p.speed);

                            if (p.progress >= 1.0) {
                                // Arrival! Deliver signal to target
                                // Use atomic delivery to prevent race conditions with stale state
                                gridStore.deliverSignal(p.targetId, p.signal);
                            } else {
                                // Keep flying
                                nextParticles.push(p);
                            }
                        });

                        return nextParticles;
                    });
                }

                // --- Cellular Automata Step ---
                // Use getAllCells to ensure we have fresh data
                const cells = gridStore.getAllCells();

                // Call onTick for each cell that has it
                cells.forEach((cell) => {
                    const pamModule = PAM_REGISTRY[cell.dna.id];
                    if (pamModule?.onTick) {
                        pamModule.onTick(cell, deltaTime);
                    }

                    // Process pending signals (reception)
                    if (cell.signals.length > 0 && pamModule?.onSignal) {
                        // if (cell.signals.length > 1) console.log(`Traffic: Cell ${cell.id} processing ${cell.signals.length} signals`);

                        cell.signals.forEach((signal) => {
                            // Module-specific signal handling (safe)
                            pamModule.onSignal(cell, signal);
                        });

                        // Clear processed signals
                        gridStore.updateCell(cell.id, {
                            signals: [],
                        });
                    }

                });

                if (state.tickCount % 60 === 0) {
                    // console.log(`Tick ${state.tickCount}: ${cells.length} cells, ${gridStore.particles.length} particles.`);
                }

                animationFrameId = requestAnimationFrame(tick);
            } catch (e) {
                console.error("Critical Ticker Error:", e);
                // Recover from error by continuing loop? 
                // Or stop? If we keep going we might spam errors.
                // Let's stop to be safe if it's critical.
                // animationFrameId = requestAnimationFrame(tick);
            }
        };

        animationFrameId = requestAnimationFrame(tick);

        // Cleanup
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []); // Empty dependency array = runs once on mount. Loop reads store directly.

    return null;
}
