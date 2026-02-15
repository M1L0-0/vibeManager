import { Cell, Signal, PamDNA } from '@/lib/vibe-core';
import { HexCoord, hexToId } from '@/core/grid/hex';
import { StemDNA, TimerDNA, NeuronDNA, PixelDNA, WaveDNA } from '@/pams/dna-catalog';

export type CellType = 'stem' | 'timer' | 'neuron' | 'pixel' | 'wave';

export class DishFactory {
    private cells: Cell[] = [];

    constructor(public name: string) { }

    /**
     * Spawn a cell at the given q, r coordinates
     */
    spawn(q: number, r: number, type: CellType, data: any = {}): DishFactory {
        const dna = this.getDNA(type);
        const coord = { q, r };
        const id = hexToId(coord); // CRITICAL: ID must match coordinate for grid lookups

        const cell: Cell = {
            id: id,
            coord: coord,
            dna: { ...dna, id: dna.id },
            state: {
                energy: 100,
                activity: 0,
                seenSignals: new Set<string>(),
                data: { ...this.getDefaults(type), ...data }
            },
            signals: [],
            createdAt: Date.now()
        };

        this.cells.push(cell);
        return this;
    }

    /**
     * Spawn a cluster of cells
     */
    spawnRing(q: number, r: number, radius: number, type: CellType, data: any = {}): DishFactory {
        // Simple ring implementation
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];

        // This is a simplified ring for radius 1. 
        // For full radius support we'd need proper hex ring logic.
        // Keeping it simple for now or strictly implementing radius 1.
        if (radius === 1) {
            directions.forEach(dir => {
                this.spawn(q + dir.q, r + dir.r, type, data);
            });
        }
        return this;
    }

    /**
     * Spawn a diode (Stem Cell with directed output)
     * Directions: 0=E, 1=SE, 2=SW, 3=W, 4=NW, 5=NE
     */
    spawnDiode(q: number, r: number, directions: number[], data: any = {}): DishFactory {
        return this.spawn(q, r, 'stem', {
            ...data,
            directions: directions,
            label: 'Diode',
            description: 'One-way signal gate'
        });
    }

    private getDNA(type: string): PamDNA {
        switch (type) {
            case 'stem': return StemDNA;
            case 'timer': return TimerDNA;
            case 'neuron': return NeuronDNA;
            case 'pixel': return PixelDNA;
            case 'wave': return WaveDNA;
            default: return StemDNA;
        }
    }

    private getDefaults(type: string): any {
        switch (type) {
            case 'timer': return {
                maxTime: 1.0,
                timeRemaining: 1.0,
                isRunning: false,
                paused: false,
                autoRestart: false,
                loop: false,
                lastTick: Date.now(),
                conductive: true // Standard Conductor
            };
            case 'pixel': return {
                displayColor: '#333333',
                baseColor: '#333333',
                persistence: true,
                conductive: true // Standard Conductor
            };
            case 'wave': return {
                range: 5,
                speedDelay: 0.1,
                wireless: false,
                conductive: true // Standard Conductor
            };
            case 'neuron': return {
                operation: 'AND',
                inputs: []
            };
            default: return {};
        }
    }

    /**
     * Serialize the dish to JSON string
     */
    export(): string {
        const serializableCells = this.cells.map(cell => ({
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
    }
}

/**
 * Helper to create a demo quickly
 */
export function createDemo(name: string, builder: (factory: DishFactory) => void): string {
    const factory = new DishFactory(name);
    builder(factory);
    return factory.export();
}
