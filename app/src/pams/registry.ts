/**
 * PAM Registry - Central registry for all cell types
 * Add new cell types here and they'll automatically appear in the Genesis Tool
 */

import { PamModule } from '@/lib/vibe-core';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';

// Registry mapping cell ID to PAM module
export const REGISTRY: Record<string, PamModule> = {
    'stem': StemCell,
    'timer': TimerCell,
    'wave': WaveCell,
};

// Get all available cell types as an array (for Genesis Tool)
export const getAllCellTypes = (): PamModule[] => {
    return Object.values(REGISTRY);
};

// Get PAM module by cell ID
export const getPamModule = (cellId: string): PamModule | undefined => {
    return REGISTRY[cellId];
};
