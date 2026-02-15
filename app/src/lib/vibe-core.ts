/**
 * Core Type Definitions for VibeManager
 * The "DNA" of the Cellular OS
 */

import { HexCoord } from '@/core/grid/hex';
import { ChannelId } from '@/core/grid/channels';

export type SignalCommand = 'TRIGGER' | 'RESET' | 'PAUSE';

/**
 * Signal - Biomimetic communication between cells
 */
export interface Signal {
    id: string;
    type: string;
    channelId?: string; // Chemical Channel ID
    strength: number; // 0-1, decays over distance
    range?: number; // Time To Live (hops remaining). Default 1 for local interactions.
    speed?: number; // Speed of propagation (units per second)
    command?: SignalCommand; // Specific instruction
    payload?: any;
    dnaPayload?: PamDNA; // DNA bundle being transmitted
    sourceId: string;
    timestamp: number;
    waveId?: string; // For wave propagation - ensures once-only processing
    dominance?: 'DOMINANT' | 'RECESSIVE'; // Physics Rule
    sourceGroupId?: string; // For group immunity
}

/**
 * Particle - Visual representation of a traveling signal
 */
export interface Particle {
    id: string;
    sourceId: string;
    targetId: string;
    signal: Signal; // The payload being carried
    progress: number; // 0.0 to 1.0
    speed: number; // units per second (1.0 = 1 hex/sec)
    color: string;
    type: 'linear' | 'arc' | 'wobble'; // Movement pattern
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
    payload?: any; // Arbitrary JSON payload
}

/**
 * PamState - Runtime state of a cell instance
 */
/**
 * StandardCellData - Common properties available to all cells
 */
export interface StandardCellData {
    // Identity & Display
    label?: string;          // Optional text label override
    description?: string;    // User notes/annotations
    conductive?: boolean;    // If false, blocks signal propagation (insulator)
    dominance?: 'DOMINANT' | 'RECESSIVE'; // Defines signal output characteristic

    // Signal Physics
    channel?: ChannelId;     // Chemical Channel ID
    range?: number;          // TTL (Time To Live in hops)
    speedDelay?: number;     // Propagation delay per hop (seconds)
    activityDecay?: number;  // Visual fade speed (0.0-1.0)

    // Directionality
    directions?: number[];   // Allowed output directions [0-5]

    // Logic / Neuron State
    operation?: 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | 'NOT'; // Logic Operation
    currentInputs?: number;  // Buffered input count for logic gates

    // Other common fields
    lastFired?: number;      // Timestamp of last activation
    command?: string;        // Signal command payload ('TRIGGER', etc.)

    // DNA Features
    dnaStorage?: PamDNA[];   // DNA bundles stored in this cell
}

/**
 * PamState - Runtime state of a cell instance
 */
export interface PamState {
    energy: number; // 0-100
    activity: number; // 0-1, for pulse animation
    data?: Partial<StandardCellData> & Record<string, any>; // Module-specific data + Standard Data
    seenSignals?: Set<string>; // Track processed signal IDs to prevent duplicates/loops
    groupId?: string; // ID of the group this cell belongs to (for clustering)
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

    /**
     * Optional: Get a short text label to display on the cell (e.g. "3.0" for timer)
     * This replaces hardcoded rendering logic in HexCell
     */
    getLabel?: (cell: Cell) => string;

    /**
     * Optional: Get custom memoization keys. 
     * If your cell label depends on specific state.data properties, return them here 
     * so React knows when to re-render.
     */
    getRenderDependencies?: (cell: Cell) => any[];

    /**
     * Optional React Component for configuring this cell in GenomeInspector
     */
    configComponent?: React.ComponentType<{ cell: Cell; updateCell: (id: string, updates: Partial<Cell>) => void }>;
}
