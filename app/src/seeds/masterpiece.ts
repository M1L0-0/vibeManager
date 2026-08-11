import { createDemo } from './dish-factory';
import { HEX_DIRECTIONS } from '@/core/grid/hex';

export const masterpieceDish = createDemo('Showcase', (f) => {
    // A perfectly symmetrical 6-pointed star.
    // Center Heartbeat
    f.spawn(0, 0, 'timer', { label: 'Heartbeat', maxTime: 1.5, isRunning: true, loop: true, color: '#f43f5e', range: 2 });

    // 6 Radiating Arms
    HEX_DIRECTIONS.forEach((dir, index) => {
        // Distance 1: The Conductors (Stem)
        f.spawn(dir.q, dir.r, 'stem');

        // Unique color for each point of the star
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];

        // Distance 2: The Amplifiers (Wave)
        f.spawn(dir.q * 2, dir.r * 2, 'wave', { range: 10, wireless: false, speedDelay: 0.1, color: colors[index] });

        // Distance 3: The Canvas (Pixel)
        f.spawn(dir.q * 3, dir.r * 3, 'pixel');
    });
});
