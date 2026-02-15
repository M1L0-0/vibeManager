/**
 * Ribosome Cell
 * Auto-generated PAM module.
 */

import { PamModule, Cell, Signal, PamDNA } from '@/lib/vibe-core';
// Removed global store import
import { RibosomeConfig } from './Config';

// Helper for broadcasting DNA
const broadcastDNA = (cell: Cell, gridStore: any) => {
    // Broadcast DNA to all neighbors
    const template = (cell.state.data as any)?.dnaTemplate;
    if (!template) return;

    // Create DNA Bundle
    const dnaPayload: PamDNA = {
        id: `dna-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: template.name,
        version: '1.0.0',
        color: template.color,
        description: template.description,
        payload: template.payload
    };

    // Broadcast Signal
    gridStore.getState().propagateSignal(cell.id, {
        id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'dna-transfer',
        sourceId: cell.id,
        timestamp: Date.now(),
        range: 1, // Neighbors only
        strength: 1,
        speed: 10, // Fast transmission
        dnaPayload
    });

    // Visual feedback (pulse)
    gridStore.getState().updateCell(cell.id, {
        state: { ...cell.state, activity: 1 }
    });
};

export const RibosomeCell: PamModule = {
    dna: {
        id: 'ribosome',
        name: 'Ribosome',
        version: '1.0.0',
        color: '#FF4081',
        icon: 'code',
        description: 'Synthesizes and broadcasts DNA bundles.',
    },

    onSpawn: (cell) => {
        cell.state.data = {
            ...cell.state.data,
            // Default Template
            dnaTemplate: {
                name: 'New Packet',
                color: '#00ccff',
                payload: { msg: 'Hello World' },
                description: 'Custom DNA Packet'
            }
        };
    },

    onSignal: (cell, signal, gridStore) => {
        // Trigger on any signal (or specific type if required)
        if (signal.type === 'dna-transfer') return; // Don't react to own output

        broadcastDNA(cell, gridStore);
    },

    onClick: (cell, gridStore) => {
        broadcastDNA(cell, gridStore);
    },

    getLabel: (cell) => 'DNA',

    getRenderDependencies: (cell) => [cell.state.data],

    configComponent: RibosomeConfig,

    onTick: (cell: Cell, deltaTime: number, gridStore: any) => {
        // Update physics or logic
    },
};
