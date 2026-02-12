import { Cell, Signal, PamDNA } from '@/lib/vibe-core';
import { HexCoord, hexToId } from '@/core/grid/hex';
import { StemDNA, TimerDNA, NeuronDNA, PixelDNA, WaveDNA } from '@/pams/dna-catalog';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

interface SimpleCellDef {
    q: number;
    r: number;
    type: 'stem' | 'timer' | 'neuron' | 'pixel' | 'wave';
    data?: any;
}

const getDNA = (type: string): PamDNA => {
    switch (type) {
        case 'stem': return StemDNA;
        case 'timer': return TimerDNA;
        case 'neuron': return NeuronDNA;
        case 'pixel': return PixelDNA;
        case 'wave': return WaveDNA;
        default: return StemDNA;
    }
};

const createCell = (def: SimpleCellDef): Cell => {
    const dna = getDNA(def.type);
    const coord = { q: def.q, r: def.r };
    // CRITICAL FIX: ID must match coordinate for grid lookups (e.g. propagation) to work!
    // signal propagation uses hexToId(coord) to find neighbors.
    // If we use random IDs, cells are "invisible" to neighbors.
    const id = hexToId(coord); // Was generateId()

    return {
        id: id,
        coord: coord,
        dna: {
            ...dna,
            // Ensure ID matches exactly what the system expects
            id: dna.id
        },
        state: {
            energy: 100,
            activity: 0,
            seenSignals: new Set<string>(), // IMPORTANT: Initialize for proper propagation
            data: def.data || {}
        },
        signals: [],
        createdAt: Date.now()
    };
};

const serializeDish = (cells: Cell[]) => {
    // Expected format by grid-store importGrid:
    // { cells: Cell[] }

    // We need to serialize the Set (seenSignals) to array for JSON,
    // but grid-store handles deserialization.
    // However, JSON.stringify collapses Sets to {}, so we must transform them manually.

    const serializableCells = cells.map(cell => ({
        ...cell,
        state: {
            ...cell.state,
            seenSignals: Array.from(cell.state.seenSignals || [])
        }
    }));

    return JSON.stringify({
        version: "1.0",
        timestamp: Date.now(),
        cells: serializableCells
    });
};

// --- DEMO 1: LOGIC LAB ---
const generateLogicLab = () => {
    const cells: Cell[] = [];

    // Helper to create a gate assembly
    // centered at (0, yOffset)
    const createGate = (type: string, yOffset: number, color: string) => {
        const row = yOffset;

        // --- LOGIC UNIT ---
        // Neuron at Center (0, row)
        cells.push(createCell({
            q: 0, r: row,
            type: 'neuron',
            data: { operation: type, label: type }
        }));

        // --- OUTPUT ---
        // (1, row) -> (2, row) [Pixel]
        cells.push(createCell({ q: 1, r: row, type: 'stem' }));
        cells.push(createCell({
            q: 2, r: row,
            type: 'pixel',
            data: { displayColor: color, label: 'OUT' }
        }));

        // --- INPUT A (Top-Left approach) ---
        // Path: (-3, row) -> (-2, row) -> (-1, row) -> Neuron
        cells.push(createCell({
            q: -3, r: row,
            type: 'timer',
            data: {
                maxTime: 2.0, // 2 seconds
                label: 'A',
                isRunning: true,
                loop: true,
                range: 50
            }
        }));
        cells.push(createCell({ q: -2, r: row, type: 'stem' }));
        cells.push(createCell({ q: -1, r: row, type: 'stem' }));

        // --- INPUT B (Bottom-Left approach) ---
        // Path: (-2, row+2) -> (-1, row+1) -> Neuron
        // Note: (-1, row+1) is South-West of (0, row)
        cells.push(createCell({
            q: -3, r: row + 3, // Further back
            type: 'timer',
            data: {
                maxTime: 0.4, // Changed from 2.5
                label: '0.4s', // Changed from 'B'
                isRunning: true,
                loop: true,
                range: 50,
                color: '#ef4444' // Red // Changed from '#3b82f6'
            }
        }));
        cells.push(createCell({ q: -2, r: row + 2, type: 'stem' }));
        cells.push(createCell({ q: -1, r: row + 1, type: 'stem' }));
    };

    createGate('AND', 0, '#10b981');   // Green
    createGate('OR', 5, '#f59e0b');    // Orange
    createGate('XOR', 10, '#3b82f6');  // Blue

    return serializeDish(cells);
};

// --- DEMO 2: POLYRHYTHM ENGINE ---
const generatePolyrhythm = () => {
    const cells: Cell[] = [];

    // Center Mixing Chamber
    cells.push(createCell({ q: 0, r: 0, type: 'pixel', data: { displayColor: '#ffffff' } }));

    // Arm 1: The "Fast" Loop (Red, Interval 0.4s)
    // Direction: East (+q)
    const arm1Length = 8;
    for (let i = 1; i <= arm1Length; i++) {
        cells.push(createCell({ q: i, r: 0, type: 'stem' }));
    }
    cells.push(createCell({
        q: arm1Length + 1, r: 0,
        type: 'timer',
        data: {
            maxTime: 0.4,
            label: '0.4s',
            isRunning: true,
            loop: true,
            range: 10
        }
    }));
    // Visual flair: Pixel indicators along the path
    cells.push(createCell({ q: 3, r: -1, type: 'pixel', data: { displayColor: '#ef4444' } }));
    cells.push(createCell({ q: 6, r: 1, type: 'pixel', data: { displayColor: '#ef4444' } }));

    // Arm 2: The "Medium" Loop (Green, Interval 1.0s)
    // Direction: South-West (0, +r)
    const arm2Length = 8;
    for (let i = 1; i <= arm2Length; i++) {
        cells.push(createCell({ q: 0, r: i, type: 'stem' }));
    }
    cells.push(createCell({
        q: 0, r: arm2Length + 1,
        type: 'timer',
        data: {
            maxTime: 1.0,
            label: '1.0s',
            isRunning: true,
            loop: true,
            range: 10
        }
    }));
    cells.push(createCell({ q: 1, r: 3, type: 'pixel', data: { displayColor: '#22c55e' } }));
    cells.push(createCell({ q: -1, r: 6, type: 'pixel', data: { displayColor: '#22c55e' } }));

    // Arm 3: The "Slow" Loop (Blue, Interval 2.5s)
    // Direction: North-West (-1, 0) ... no that's West.
    // Let's go North-West: (0, -1) [Wait, (0, -1) is NW? No, (0,-1) is NW relative to axis?]
    // Coordinates:
    // E: (+1, 0)
    // SE: (0, +1)
    // SW: (-1, +1)
    // W: (-1, 0)
    // NW: (0, -1)
    // NE: (+1, -1)

    // Let's use North-West direction: (0, -r)
    const arm3Length = 8;
    for (let i = 1; i <= arm3Length; i++) {
        cells.push(createCell({ q: 0, r: -i, type: 'stem' }));
    }
    cells.push(createCell({
        q: 0, r: -(arm3Length + 1),
        type: 'timer',
        data: {
            maxTime: 2.5,
            label: '2.5s',
            isRunning: true,
            loop: true,
            range: 10 // Limit range to prevent bleeding
        }
    }));
    cells.push(createCell({ q: -1, r: -3, type: 'pixel', data: { displayColor: '#3b82f6' } }));
    cells.push(createCell({ q: 1, r: -6, type: 'pixel', data: { displayColor: '#3b82f6' } }));

    return serializeDish(cells);
};

// --- DEMO 3: WIRELESS LATTICE ---
const generateWireless = () => {
    const cells: Cell[] = [];

    // Central Broadcaster
    cells.push(createCell({
        q: 0, r: 0,
        type: 'timer',
        data: {
            maxTime: 1.2,
            label: 'PULSE',
            isRunning: true,
            loop: true
        }
    }));
    cells.push(createCell({
        q: 1, r: 0,
        type: 'wave',
        data: { wireless: true, range: 15, label: 'TX' }
    }));

    // Rings of Satellites
    const createSatellite = (q: number, r: number, color: string) => {
        // Receiver
        cells.push(createCell({
            q, r,
            type: 'wave',
            data: { wireless: true, label: 'RX' }
        }));
        // Display Cluster
        cells.push(createCell({ q: q + 1, r: r, type: 'pixel', data: { displayColor: color } }));
        cells.push(createCell({ q: q, r: r + 1, type: 'pixel', data: { displayColor: color } }));
        cells.push(createCell({ q: q - 1, r: r + 1, type: 'pixel', data: { displayColor: color } }));
    };

    // Inner Ring (Radius 4)
    const ring1 = [
        { q: 4, r: 0 }, { q: -4, r: 0 },
        { q: 0, r: 4 }, { q: 0, r: -4 },
        { q: 4, r: -4 }, { q: -4, r: 4 }
    ];
    ring1.forEach(p => createSatellite(p.q, p.r, '#f472b6')); // Pink

    // Outer Ring (Radius 8)
    const ring2 = [
        { q: 8, r: 0 }, { q: -8, r: 0 },
        { q: 0, r: 8 }, { q: 0, r: -8 },
        { q: 8, r: -8 }, { q: -8, r: 8 }
    ];
    ring2.forEach(p => createSatellite(p.q, p.r, '#c084fc')); // Purple

    return serializeDish(cells);
};

export const DEFAULT_DISHES = [
    {
        id: 'demo-logic-lab',
        name: 'Demo: Logic Lab',
        timestamp: Date.now(),
        thumbnail: '',
        data: generateLogicLab()
    },
    {
        id: 'demo-polyrhythm',
        name: 'Demo: Polyrhythm Engine',
        timestamp: Date.now() - 1000,
        thumbnail: '',
        data: generatePolyrhythm()
    },
    {
        id: 'demo-wireless',
        name: 'Demo: Wireless Lattice',
        timestamp: Date.now() - 2000,
        thumbnail: '',
        data: generateWireless()
    }
];
