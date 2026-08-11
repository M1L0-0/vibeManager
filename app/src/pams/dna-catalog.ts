/**
 * DNA Catalog - Pure metadata definitions for cell types.
 * 
 * Separated from cell logic (StemCell, etc.) to prevent circular dependency cycles
 * when imported by the UI or Store.
 */

import { PamDNA } from '@/lib/vibe-core';

export const StemDNA: PamDNA = {
    id: 'stem',
    name: 'Stem Cell',
    version: '1.0.0',
    color: '#8b5cf6', // Purple
    icon: 'Circle',
    description: 'The primordial cell. Transmits transient pulses and relays waves, but holds no active state.',
};

export const TimerDNA: PamDNA = {
    id: 'timer',
    name: 'Timer Cell',
    version: '1.0.0',
    color: '#f59e0b', // Amber
    icon: 'Timer',
    description: 'Emits a pulse at regular intervals',
};

export const WaveDNA: PamDNA = {
    id: 'wave',
    name: 'Wave Cell',
    version: '1.0.0',
    color: '#3b82f6', // Blue
    icon: 'Activity', // Wave/Pulse icon
    description: 'Propagates signals in a coordinated wave front',
};

export const NeuronDNA: PamDNA = {
    id: 'neuron',
    name: 'Neuron',
    version: '1.0.0',
    color: '#10b981', // Emerald
    icon: 'Network', // Network/Circuit icon
    description: 'Integrates signals and performs logical operations (AND, OR, XOR)',
};

export const PixelDNA: PamDNA = {
    id: 'pixel',
    name: 'Pixel',
    version: '1.0.0',
    color: '#333333', // Dark / Off
    icon: 'Monitor', // Monitor/Screen icon
    description: 'Displays the color of the last received signal',
};
