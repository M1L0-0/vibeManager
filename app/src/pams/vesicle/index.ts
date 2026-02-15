import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { VesicleConfig } from './Config';

export const VesicleCell: PamModule = {
    dna: {
        id: 'vesicle',
        name: 'Vesicle',
        version: '1.0.0',
        color: '#f472b6', // Pink-400
        icon: 'Send',
        description: 'Sends HTTP requests to a configured URL when signaled.',
    },

    configComponent: VesicleConfig,

    onSpawn: (cell: Cell) => {
        cell.state.data = {
            url: '',
            method: 'POST',
            body: '{\n  "message": "Hello from Vibe!"\n}',
            ...cell.state.data
        };
    },

    onSignal: async (cell: Cell, signal: Signal, gridStore: any) => {
        // Debounce?
        const now = Date.now();
        const data = cell.state.data as any || {};

        if (data.lastRefractoryTick && now - data.lastRefractoryTick < 500) return;

        // Visual Impulse
        gridStore.getState().updateCell(cell.id, {
            state: {
                ...cell.state,
                activity: 1.0,
                data: { ...data, lastRefractoryTick: now }
            }
        }, { skipHistory: true });

        setTimeout(() => {
            gridStore.getState().updateCell(cell.id, {
                state: { activity: 0 }
            }, { skipHistory: true });
        }, 300);

        // Execute Request
        const { url, method = 'POST', body } = data;

        if (!url) return;

        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' },
            };

            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                // Use signal payload if available (Dynamic Mode)
                if (signal.payload && Object.keys(signal.payload).length > 0) {
                    options.body = JSON.stringify(signal.payload);
                } else {
                    // Fallback to static body
                    options.body = body;
                }
            }

            await fetch(url, options);
            // console.log(`Post sent to ${url}`);
        } catch (e) {
            console.error(`Vesicle ${cell.id} failed to send:`, e);
            // Maybe feedback error state?
        }
    },

    getLabel: (cell: Cell) => {
        return cell.state.data?.method || 'POST';
    }
};
