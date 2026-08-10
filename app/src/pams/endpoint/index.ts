import { PamModule, Cell, Signal } from '@/lib/vibe-core';
// Removed global store import
import { sseManager } from '@/lib/sse-client';
import { createImpulse } from '@/core/grid/propagation';
import { EndpointConfig } from './Config';

export const EndpointCell: PamModule = {
    dna: {
        id: 'endpoint',
        name: 'Endpoint',
        version: '1.0.0',
        color: '#a855f7', // Purple/Vibe default
        icon: 'RadioReceiver', // Closest match
        description: 'Fires signals when external webhooks are received via /api/ingest. (Note: Disabled for Portfolio)',
    },

    configComponent: EndpointConfig,

    onSpawn: (cell: Cell, gridStore: any) => {
        // Initialize state
        cell.state.data = {
            range: 1, // Default to 1 hop (Local interaction)
            ...cell.state.data
        };

        // Subscribe to SSE events for this cell ID
        // Note: sseManager handles connection management
        const unsubscribe = sseManager.subscribe(cell.id, (payload) => {
            // Logic to handle external event
            // console.log(`📡 Endpoint ${cell.id} received external payload:`, payload);

            // Fetch fresh cell state from INJECTED store
            const freshCell = gridStore.getState().cells.get(cell.id);
            if (!freshCell) return;

            // Trigger Signal
            createImpulse(freshCell, 'wave', {
                message: payload.message || 'External Trigger'
            }, {
                color: payload.color || '#a855f7',
                strength: payload.strength || 1.0,
                range: payload.range // Allow external override of range
            }, gridStore);

            // Visual Feedback
            gridStore.getState().updateCell(cell.id, {
                state: { activity: 1.0 }
            }, { skipHistory: true });

            setTimeout(() => {
                gridStore.getState().updateCell(cell.id, {
                    state: { activity: 0 }
                }, { skipHistory: true });
            }, 300);
        });

        // Store unsubscribe in data? No, functions aren't serializable.
        // Issue: How to unsubscribe on delete? 
        // VibeCore currently doesn't have an `onDestroy` hook.
        // This is a known limitation. We rely on the sseManager to handle dead subscribers eventually (or memory leak for now).
        // Feature Request: Add onDestroy to PamModule.
    },

    onSignal: (cell: Cell, signal: Signal, gridStore: any) => {
        // Endpoint cells usually don't react to grid signals, they EMIT them.
        // But maybe they could forward them back to a webhook?
        // For now: do nothing.
    },

    getLabel: (cell: Cell) => {
        return 'API';
    }
};
