/**
 * PAM Registry - Central registry for all cell types
 * Add new cell types here and they'll automatically appear in the Genesis Tool
 */
/**
 * PAM Registry - Central registry for all cell types
 * Add new cell types here and they'll automatically appear in the Genesis Tool
 */

import { PamModule } from '@/lib/vibe-core';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';
import { NeuronCell } from '@/pams/neuron';
import { PixelCell } from '@/pams/pixel';
import { EndpointCell } from '@/pams/endpoint';
import { NucleusCell } from '@/pams/nucleus';
import { RibosomeCell } from '@/pams/ribosome';
import { VesicleCell } from '@/pams/vesicle';

// Registry mapping cell ID to PAM module
export const REGISTRY: Record<string, PamModule> = {
    [RibosomeCell.dna.id]: RibosomeCell,

    [NucleusCell.dna.id]: NucleusCell,

    [EndpointCell.dna.id]: EndpointCell,
    [VesicleCell.dna.id]: VesicleCell,

    [StemCell.dna.id]: StemCell,
    [TimerCell.dna.id]: TimerCell,
    [WaveCell.dna.id]: WaveCell,
    [NeuronCell.dna.id]: NeuronCell,
    [PixelCell.dna.id]: PixelCell,
};

// Get all available cell types as an array (for Genesis Tool)
export const getAllCellTypes = (): PamModule[] => {
    return Object.values(REGISTRY);
};

// Get PAM module by cell ID
export const getPamModule = (cellId: string): PamModule | undefined => {
    return REGISTRY[cellId];
};
