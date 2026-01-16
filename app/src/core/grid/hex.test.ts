import {
    hexToId,
    idToHex,
    hexToPixel,
    pixelToHex,
    getNeighbors,
    hexDistance,
    getHexesInRadius,
    HEX_SIZE,
    HexCoord
} from './hex';

describe('Hex Grid Core', () => {
    describe('Coordinate Conversion', () => {
        it('should convert hex to id correctly', () => {
            expect(hexToId({ q: 1, r: -2 })).toBe('1,-2');
            expect(hexToId({ q: 0, r: 0 })).toBe('0,0');
        });

        it('should convert id to hex correctly', () => {
            expect(idToHex('1,-2')).toEqual({ q: 1, r: -2 });
            expect(idToHex('0,0')).toEqual({ q: 0, r: 0 });
        });

        it('should be reversible', () => {
            const hex = { q: 5, r: -3 };
            expect(idToHex(hexToId(hex))).toEqual(hex);
        });
    });

    describe('Pixel Conversion', () => {
        it('should convert center hex to 0,0 pixel', () => {
            const point = hexToPixel({ q: 0, r: 0 });
            expect(point).toEqual({ x: 0, y: 0 });
        });

        it('should convert pixel back to hex correctly', () => {
            const hex = { q: 1, r: 0 };
            const point = hexToPixel(hex);
            const result = pixelToHex(point);
            expect(result).toEqual(hex);
        });

        it('should round to nearest hex for arbitrary pixels', () => {
            // slightly offset from exact center of 0,0
            const result = pixelToHex({ x: 1, y: 1 });
            expect(result).toEqual({ q: 0, r: 0 });
        });
    });

    describe('Neighbors', () => {
        it('should return 6 neighbors', () => {
            const neighbors = getNeighbors({ q: 0, r: 0 });
            expect(neighbors).toHaveLength(6);
            expect(neighbors).toContainEqual({ q: 1, r: 0 });
            expect(neighbors).toContainEqual({ q: -1, r: 1 });
        });
    });

    describe('Distance', () => {
        it('should calculate distance correctly', () => {
            expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
            expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2);
            expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(1); // Neighbor
        });
    });

    describe('Radius', () => {
        it('should return correct number of hexes for radius 1', () => {
            // Center + 6 neighbors
            const hexes = getHexesInRadius({ q: 0, r: 0 }, 1);
            expect(hexes.length).toBe(7);
        });

        it('should return correct number of hexes for radius 0', () => {
            const hexes = getHexesInRadius({ q: 0, r: 0 }, 0);
            expect(hexes.length).toBe(1);
            expect(hexes[0]).toEqual({ q: 0, r: 0 });
        });
    })
});
