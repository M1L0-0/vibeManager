/**
 * Global Ticker - Calls onTick for all cells that need it
 */

'use client';

import { useEffect } from 'react';
import { useGridStore } from '@/store/grid-store';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';

// Map of PAM IDs to their modules
const PAM_REGISTRY: Record<string, any> = {
    'stem': StemCell,
    'timer': TimerCell,
    'wave': WaveCell,
};

export function CellTicker() {
    useEffect(() => {
        let lastTime = Date.now();
        let animationFrameId: number;

        const tick = () => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000; // Convert to seconds
            lastTime = now;

            // Get all cells
            const cells = useGridStore.getState().getAllCells();

            // Call onTick for each cell that has it
            cells.forEach((cell) => {
                const pamModule = PAM_REGISTRY[cell.dna.id];
                if (pamModule?.onTick) {
                    pamModule.onTick(cell, deltaTime);
                }

                // Process pending signals
                if (cell.signals.length > 0 && pamModule?.onSignal) {
                    cell.signals.forEach((signal) => {
                        // Generic command handling - trigger default behavior
                        if (signal.command === 'trigger_default' && pamModule.onClick) {
                            console.log(`⚡ Executing default behavior for ${cell.id} via command`);
                            pamModule.onClick(cell);
                        }

                        // Always call onSignal for propagation and custom handling
                        // Note: Wave duplicate prevention happens in each cell's onSignal via waveId
                        pamModule.onSignal(cell, signal);
                    });

                    // Clear processed signals
                    useGridStore.getState().updateCell(cell.id, {
                        signals: [],
                    });
                }
            });

            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);

        // Cleanup
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

    return null; // This component doesn't render anything
}
