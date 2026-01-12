/**
 * VibeManager - The Cellular OS
 * Main entry point
 */

'use client';

import { useEffect } from 'react';
import { Viewport } from '@/components/stage/Viewport';
import { useGridStore } from '@/store/grid-store';
import { StemCell } from '@/pams/stem';
import { getHexesInRadius } from '@/core/grid/hex';

export default function Home() {
  const spawnCell = useGridStore((state) => state.spawnCell);

  useEffect(() => {
    // Spawn initial cells in a hexagonal pattern
    const centerCoord = { q: 0, r: 0 };
    const radius = 3;
    const hexes = getHexesInRadius(centerCoord, radius);

    hexes.forEach((coord) => {
      spawnCell(coord, StemCell.dna);
    });
  }, [spawnCell]);

  return <Viewport />;
}
