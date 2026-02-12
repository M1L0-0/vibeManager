
import { Cell, Signal } from '@/lib/vibe-core';
import { REGISTRY } from '@/pams/registry';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export const DishValidator = {
    validate: (data: any): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ['Invalid JSON object'], warnings: [] };
        }

        if (!Array.isArray(data.cells)) {
            return { isValid: false, errors: ['Missing "cells" array'], warnings: [] };
        }

        const cellIds = new Set<string>();
        const coords = new Set<string>();

        data.cells.forEach((cell: any, index: number) => {
            // 1. Basic Structure
            if (!cell.id) errors.push(`Cell [${index}] missing ID`);
            if (!cell.dna || !cell.dna.id) errors.push(`Cell [${index}] missing DNA ID`);
            if (!cell.coord) errors.push(`Cell [${index}] missing Coordinates`);

            // 2. Uniqueness
            if (cellIds.has(cell.id)) errors.push(`Duplicate Cell ID: ${cell.id}`);
            cellIds.add(cell.id);

            const coordKey = `${cell.coord?.q},${cell.coord?.r}`;
            if (coords.has(coordKey)) errors.push(`Duplicate Coordinate: ${coordKey}`);
            coords.add(coordKey);

            // 3. DNA Validity
            const dnaId = cell.dna?.id;
            if (dnaId && !REGISTRY[dnaId]) {
                warnings.push(`Unknown DNA ID: "${dnaId}" (Cell ${cell.id})`);
            }

            // 4. Data Validity (Type-specific checks)
            if (dnaId === 'timer') {
                const d = cell.state?.data;
                if (typeof d?.maxTime !== 'number') warnings.push(`Timer ${cell.id}: maxTime is not a number`);
                if (typeof d?.timeRemaining !== 'number') warnings.push(`Timer ${cell.id}: timeRemaining is not a number`);
                // Check if isRunning matches visual expectation?
            }

            // 5. Hydration Checks
            if (cell.state?.seenSignals) {
                if (Array.isArray(cell.state.seenSignals)) {
                    // This is technically allowed in JSON, but we want to know if it's not converted yet
                    // Actually, this validator runs on the JSON *before* import, so Array is expected.
                } else if (!(cell.state.seenSignals instanceof Set)) {
                    // If it's acting on runtime object? 
                    // Let's assume this validates the JSON.
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
};
