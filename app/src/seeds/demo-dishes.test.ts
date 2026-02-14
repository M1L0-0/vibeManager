// import { describe, it, expect } from 'vitest'; // Jest globals are used instead
import { DEFAULT_DISHES } from './demo-dishes';
// import { Cell } from '@/lib/vibe-core'; // Avoid alias issues for now

describe('Demo Dishes Validation', () => {
    it('should have valid JSON data for all dishes', () => {
        DEFAULT_DISHES.forEach(dish => {
            expect(() => {
                JSON.parse(dish.data);
            }).not.toThrow();
        });
    });

    it('should not have duplicate cell coordinates in any dish', () => {
        DEFAULT_DISHES.forEach(dish => {
            const data = JSON.parse(dish.data);
            const cells: any[] = data.cells || data; // Handle both export format and raw array

            if (!Array.isArray(cells)) return; // Skip if not array (legacy format might vary)

            const seenCoords = new Set<string>();
            const duplicates: string[] = [];

            cells.forEach(cell => {
                const key = `${cell.coord.q},${cell.coord.r}`;
                if (seenCoords.has(key)) {
                    duplicates.push(key);
                }
                seenCoords.add(key);
            });

            if (duplicates.length > 0) {
                console.error(`Dish "${dish.name}" has duplicate coordinates: ${duplicates.join(', ')}`);
            }

            expect(duplicates).toHaveLength(0);
        });
    });
});
