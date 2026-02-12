/**
 * Pixel Cell - A visual display unit
 * Changes color based on received signals
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { PixelDNA } from '@/pams/dna-catalog';
import { CHANNELS, ChannelId } from '@/core/grid/channels';

export const PixelCell: PamModule = {
    dna: PixelDNA,

    onSpawn: (cell: Cell) => {
        // Initialize with default color
        useGridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                data: {
                    ...cell.state.data,
                    displayColor: '#333333'
                }
            }
        });
    },

    onClick: (cell: Cell) => {
        console.log('🖥️ Pixel Clicked:', cell.id);
        // Toggle activity for visual feedback
        useGridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: 1.0
            }
        }, { skipHistory: true });

        setTimeout(() => {
            useGridStore.getState().updateCell(cell.id, {
                state: { activity: 0 }
            }, { skipHistory: true });
        }, 500);
    },

    onSignal: (cell: Cell, signal: Signal) => {
        const store = useGridStore.getState();
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

        // 2. Store Base Color (if not already stored)
        // We assume the current 'displayColor' is the "paint" unless we are already flashing
        // To be safe, maybe we should have stored 'baseColor' on spawn?
        // Let's rely on data.baseColor if it exists, or initialize it from current displayColor

        const baseColor = data.baseColor || data.displayColor || '#333333';

        store.updateCell(cell.id, {
            state: {
                ...freshCell.state,
                data: {
                    ...data,
                    baseColor: baseColor, // Persist base color
                    displayColor: signalColor // Flash to signal color
                },
                activity: 1.0 // Pulse
            }
        }, { skipHistory: true });

        // 3. Decay and Restore Color
        setTimeout(() => {
            const currentStore = useGridStore.getState();
            const current = currentStore.cells.get(cell.id);
            if (current) {
                currentStore.updateCell(cell.id, {
                    state: {
                        ...current.state,
                        data: {
                            ...current.state.data,
                            displayColor: baseColor // Restore original color
                        },
                        activity: 0
                    }
                }, { skipHistory: true });
            }
        }, 400); // Slightly longer than wave transit to ensure visibility
    },

    // Custom renderer hook?
    // HexCell renders based on 'color' prop.
    // We need HexCell to respect 'state.data.displayColor'.
    // I should check HexCell.tsx to see if it supports dynamic color overrides.
};
