import { Cell } from '@/lib/vibe-core';
import { hexToPixel } from '@/core/grid/hex';

/**
 * Generates a lightweight thumbnail of the current grid state.
 * Renders directly to an off-screen canvas to avoid DOM screenshot overhead.
 */
export async function generateGridThumbnail(cells: Cell[], width = 300, height = 200, hexSize = 10): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // specific styling
    ctx.fillStyle = '#1e1e1e'; // Dark background
    ctx.fillRect(0, 0, width, height);

    if (cells.length === 0) return canvas.toDataURL('image/png');

    // Calculate bounds to center the content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    cells.forEach(cell => {
        const { x, y } = hexToPixel(cell.coord, hexSize);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Center offset
    const offsetX = (width - contentWidth) / 2 - minX;
    const offsetY = (height - contentHeight) / 2 - minY;

    ctx.translate(offsetX, offsetY);

    // Draw cells
    cells.forEach(cell => {
        const { x, y } = hexToPixel(cell.coord, hexSize);

        ctx.beginPath();
        // Draw Hexagon (simplified as circle for icon speed? or proper hex?)
        // Let's do circle for now, it's faster and looks fine at small scale
        ctx.arc(x, y, hexSize * 0.8, 0, Math.PI * 2);

        // Color based on DNA
        ctx.fillStyle = cell.dna.color || '#ffffff';
        ctx.fill();
    });

    return canvas.toDataURL('image/png', 0.8);
}
