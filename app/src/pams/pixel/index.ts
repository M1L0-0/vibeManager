/**
 * Pixel Cell - A visual display unit
 * Changes color based on received signals
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
// Removed global store import
import { PixelDNA } from '@/pams/dna-catalog';
import { CHANNELS, ChannelId } from '@/core/grid/channels';
import { PixelConfig } from './Config';
import { handleStandardWavePropagation } from '@/core/grid/propagation';

export const PixelCell: PamModule = {
    dna: PixelDNA,
    configComponent: PixelConfig,

    onSpawn: (cell: Cell, gridStore: any) => {
        // Initialize with default color
        gridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                data: {
                    ...cell.state.data,
                    displayColor: '#333333',
                    conductive: true // Enabled by default logic
                }
            }
        });
    },

    onClick: (cell: Cell, gridStore: any) => {
        console.log('🖥️ Pixel Clicked:', cell.id);
        // Toggle activity for visual feedback
        gridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: 1.0
            }
        }, { skipHistory: true });

        setTimeout(() => {
            gridStore.getState().updateCell(cell.id, {
                state: { activity: 0 }
            }, { skipHistory: true });
        }, 500);
    },

    onSignal: (cell: Cell, signal: Signal, gridStore: any) => {
        const store = gridStore.getState();
        const freshCell = store.cells.get(cell.id) || cell;
        const data = freshCell.state.data || {};

        // 1. Resolve Signal Color
        // Priority: Payload Color > Channel Color > Default White
        let signalColor = '#ffffff';

        if ((signal as any).payload?.color) {
            signalColor = (signal as any).payload.color;
        } else if ((signal as any).color) {
            signalColor = (signal as any).color;
        } else if (signal.channelId && CHANNELS[signal.channelId as ChannelId]) {
            signalColor = CHANNELS[signal.channelId as ChannelId].color;
        }

        // --- DIAGNOSTIC ALERT (Visual) ---
        // If it somehow still resolves to white or gray, we force the cell label to display the error text
        // so the user can see what arrived.
        let debugLabel = undefined;
        if (signalColor === '#ffffff' || signalColor === '#333333') {
            debugLabel = 'GRAY BUG';
            console.error("PIXEL GRAY BUG - FULL SIGNAL RECVD:", JSON.stringify(signal));
        }

        // 2. Persistent vs Temporary Color
        const baseColor = data.baseColor || data.displayColor || '#333333';

        // Default to TRUE (Canvas Mode) unless explicitly disabled
        const persistence = (data.persistence !== false);

        let newColor = baseColor;
        let decayToColor = baseColor;

        if (persistence) {
            newColor = signalColor;
            decayToColor = signalColor; // Stay this color
        } else {
            // Temporary Flash (Display Mode)
            // Flash to signal color, but decay back to baseColor
            newColor = baseColor; // Base doesn't change
            // We want to SHOW signal color, so displayColor = signalColor
            // But we don't update baseColor
        }

        const updateData: any = {
            ...data,
            displayColor: signalColor // Always flash to signal color initially
        };

        if (debugLabel) {
            updateData.label = debugLabel;
        }

        if (persistence) {
            updateData.baseColor = signalColor; // Persist it
        }

        console.log(`🎨 PixelCell [${cell.id}] ON_SIGNAL:`, {
            incomingCommand: signal.command,
            incomingColor: signalColor,
            persistenceState: persistence,
            resolvedFinalColor: updateData.displayColor
        });

        store.updateCell(cell.id, {
            state: {
                data: updateData,
                activity: 1.0
            }
        }, { skipHistory: true });

        // 3. Decay Activity
        setTimeout(() => {
            const currentStore = gridStore.getState();
            if (currentStore.cells.has(cell.id)) {

                // If temporary, revert display color
                const updates: any = { activity: 0 };

                if (!persistence) {
                    updates.data = {
                        ...currentStore.cells.get(cell.id)!.state.data,
                        displayColor: baseColor // Revert to original base
                    };
                }

                currentStore.updateCell(cell.id, {
                    state: updates
                }, { skipHistory: true });
            }
        }, 400);

        // 4. Propagation
        // Now handled by handleStandardWavePropagation checking 'conductive' internally
        // But we still call it to trigger the potential propagation.
        // If data.conductive is false, handleStandardWavePropagation will return false immediately.

        // Fix: Force Omni-directional propagation if acting as a conductor
        // We strip incoming directional constraints so the pixel acts like a wire node (hub),
        // unless the user has explicitly set directions on THIS cell (handled by propagation logic priority).
        const propagationSignal = {
            ...signal,
            range: Math.max(signal.range || 0, 1), // CRITICAL FIX: Ensure range > 0 so wire propagation continues
            payload: {
                ...signal.payload,
                allowedDirections: undefined
            }
        };

        handleStandardWavePropagation(cell, propagationSignal, {
            color: signalColor,
            allowedDirections: [0, 1, 2, 3, 4, 5]
        }, gridStore);
    },

    // Custom renderer hook?
    // HexCell renders based on 'color' prop.
    // We need HexCell to respect 'state.data.displayColor'.
    // I should check HexCell.tsx to see if it supports dynamic color overrides.
};
