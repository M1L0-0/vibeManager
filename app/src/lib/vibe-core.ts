/**
 * Core Type Definitions for VibeManager
 * The "DNA" of the Cellular OS
 */

import { HexCoord } from '@/core/grid/hex';

/**
 * Signal - Biomimetic communication between cells
 */
export interface Signal {
    id: string;
    type: string;
    strength: number; // 0-1, decays over distance
    payload?: any;
    sourceId: string;
    timestamp: number;
    waveId?: string; // For wave propagation - ensures once-only processing
    command?: string; // Generic command: 'trigger_default', 'replicate', 'destroy', etc.
}

/**
 * PamDNA - The genetic blueprint of a cell module
 */
export interface PamDNA {
    id: string;
    name: string;
    version: string;
    color: string; // Primary color for this PAM type
    icon?: string; // Lucide icon name
    description?: string;
}

/**
 * PamState - Runtime state of a cell instance
 */
export interface PamState {
    energy: number; // 0-100
    activity: number; // 0-1, for pulse animation
    data?: Record<string, any>; // Module-specific data
    seenSignals?: Set<string>; // Track processed signal IDs to prevent duplicates/loops
}

/**
 * Cell - A living instance in the grid
 */
export interface Cell {
    id: string; // unique instance ID
    coord: HexCoord;
    dna: PamDNA;
    state: PamState;
    signals: Signal[]; // Incoming signals queue
    createdAt: number;
}

/**
 * PamModule - The behavior interface that all PAMs must implement
 */
export interface PamModule {
    dna: PamDNA;

    /**
     * Called when the cell is spawned
     */
    onSpawn?: (cell: Cell) => void;

    /**
     * Called when a signal is received
     */
    onSignal?: (cell: Cell, signal: Signal) => void;

    /**
     * Called every tick (for autonomous behavior)
     */
    onTick?: (cell: Cell, deltaTime: number) => void;

    /**
     * Called when the cell is clicked
     */
    onClick?: (cell: Cell) => void;
}
