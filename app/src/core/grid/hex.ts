/**
 * Hexagonal Grid System using Axial Coordinates
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

export interface HexCoord {
  q: number; // column
  r: number; // row
}

export interface Point {
  x: number;
  y: number;
}

// Hex size (radius from center to vertex)
export const HEX_SIZE = 40;

// Hex directions (6 neighbors in axial coordinates)
const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

/**
 * Convert hex coordinate to unique string ID
 */
export function hexToId(hex: HexCoord): string {
  return `${hex.q},${hex.r}`;
}

/**
 * Convert string ID back to hex coordinate
 */
export function idToHex(id: string): HexCoord {
  const [q, r] = id.split(',').map(Number);
  return { q, r };
}

/**
 * Convert hex axial coordinates to pixel position (pointy-top orientation)
 * For perfect edge-to-edge tiling with no gaps or overlaps
 */
export function hexToPixel(hex: HexCoord, size: number = HEX_SIZE): Point {
  const x = size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = size * ((3 / 2) * hex.r);
  return { x, y };
}

/**
 * Convert pixel position to hex axial coordinates (pointy-top orientation)
 */
export function pixelToHex(point: Point, size: number = HEX_SIZE): HexCoord {
  const q = ((Math.sqrt(3) / 3) * point.x - (1 / 3) * point.y) / size;
  const r = ((2 / 3) * point.y) / size;
  return hexRound({ q, r });
}

/**
 * Round fractional hex coordinates to nearest hex
 */
function hexRound(hex: HexCoord): HexCoord {
  // Convert to cube coordinates
  const s = -hex.q - hex.r;

  let rq = Math.round(hex.q);
  let rr = Math.round(hex.r);
  let rs = Math.round(s);

  const qDiff = Math.abs(rq - hex.q);
  const rDiff = Math.abs(rr - hex.r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

/**
 * Get all 6 neighboring hex coordinates
 */
export function getNeighbors(hex: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((dir) => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
  }));
}

/**
 * Calculate distance between two hexes
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const s1 = -a.q - a.r;
  const s2 = -b.q - b.r;
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(s1 - s2)) / 2;
}

/**
 * Get all hexes within a certain radius
 */
export function getHexesInRadius(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [];

  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }

  return results;
}
