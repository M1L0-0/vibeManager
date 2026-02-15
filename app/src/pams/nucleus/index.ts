/**
 * Nucleus Cell
 * Auto-generated PAM module.
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';

import { NucleusConfig } from './Config';

export const NucleusCell: PamModule = {
    dna: {
        id: 'nucleus',
        name: 'Nucleus',
        version: '1.0.0',
        color: '#E040FB', // Purple
        icon: 'dna',
        description: 'Stores DNA bundles.',
    },

    onSpawn: (cell: Cell) => {
        // Initialize state with empty DNA storage
        cell.state.data = {
            ...cell.state.data,
            dnaStorage: []
        };
    },

    onSignal: (cell: Cell, signal: Signal) => {
        // Basic absorption for now
    },

    getLabel: (cell: Cell) => {
        return ''; // No label, using icon/visuals
    },

    configComponent: NucleusConfig
};
