import { Cell } from '@/lib/vibe-core';

// Hardcoded colors to avoid circular dependency with Registry
const CELL_COLORS: Record<string, string> = {
    'stem': '#10b981', // Emerald
    'timer': '#ef4444', // Red
    'wave': '#3b82f6', // Blue
    'neuron': '#f59e0b', // Amber
    'pixel': '#8b5cf6', // Violet
    'endpoint': '#a855f7', // Purple
    'default': '#6b7280' // Gray
};

export function generateDishPreview(dishDataJson: string): string {
    try {
        let cells: Cell[] = [];
        const parsed = typeof dishDataJson === 'string' ? JSON.parse(dishDataJson) : dishDataJson;

        if (Array.isArray(parsed)) {
            cells = parsed;
        } else if (parsed && Array.isArray(parsed.cells)) {
            cells = parsed.cells;
        }

        if (!cells || cells.length === 0) return '';

        // 1. Calculate Bounding Box
        let minQ = Infinity, maxQ = -Infinity;
        let minR = Infinity, maxR = -Infinity;

        cells.forEach(cell => {
            const { q, r } = cell.coord;
            if (q < minQ) minQ = q;
            if (q > maxQ) maxQ = q;
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
        });

        // Add padding
        minQ -= 1; maxQ += 1;
        minR -= 1; maxR += 1;

        // 2. Setup Canvas / SVG Dimensions
        const HEX_SIZE = 10;
        const width = (maxQ - minQ + 2) * (HEX_SIZE * 1.5);
        // Height estimation for Hex grid is trickier, simplified here
        const height = (maxR - minR + 2) * (HEX_SIZE * 1.732);

        // Map Hex(q, r) to Pixel(x, y)
        // Pointy-topped conversion
        // x = size * (sqrt(3) * q  +  sqrt(3)/2 * r)
        // y = size * (3/2 * r)
        // Wait, standard pointy top:
        // x = size * sqrt(3) * (q + r/2)
        // y = size * 3/2 * r 

        // Let's use a simple mapping that works for visual preview
        const getX = (q: number, r: number) => (q + r / 2) * (HEX_SIZE * 1.732);
        const getY = (q: number, r: number) => r * (HEX_SIZE * 1.5);

        // Re-calculate bounds based on pixel coordinates to center it
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        const renderItems = cells.map(cell => {
            const x = getX(cell.coord.q, cell.coord.r);
            const y = getY(cell.coord.q, cell.coord.r);

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            const color = cell.state.data?.color // Pixel/Timer override
                || cell.state.data?.displayColor // Pixel override
                || CELL_COLORS[cell.dna.id]
                || CELL_COLORS['default'];

            return { x, y, color };
        });

        const viewWidth = maxX - minX + HEX_SIZE * 4;
        const viewHeight = maxY - minY + HEX_SIZE * 4;
        const offsetX = -minX + HEX_SIZE * 2;
        const offsetY = -minY + HEX_SIZE * 2;

        // 3. Generate SVG String
        let svgBody = '';
        renderItems.forEach(item => {
            // Hexagon Path or Simple Circle
            // Circle is cheaper and looks fine for tiny thumbnail
            svgBody += `<circle cx="${item.x + offsetX}" cy="${item.y + offsetY}" r="${HEX_SIZE * 0.8}" fill="${item.color}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />`;
        });

        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${viewHeight}" width="100%" height="100%" style="background-color: #111;">
            ${svgBody}
        </svg>
        `;

        // 4. Convert to Data URI
        return `data:image/svg+xml;base64,${btoa(svg)}`;

    } catch (e) {
        console.error('Failed to generate preview', e);
        return '';
    }
}
