/**
 * VibeManager - The Cellular OS
 * Main entry point
 */

'use client';

import { useEffect } from 'react';
import { Viewport } from '@/components/stage/Viewport';
import { useGridStore } from '@/store/grid-store';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { getHexesInRadius } from '@/core/grid/hex';
import { CellTicker } from '@/components/stage/CellTicker';

export default function Home() {
  const spawnCell = useGridStore((state) => state.spawnCell);

  useEffect(() => {
    // Spawn initial cells in a hexagonal pattern
    const centerCoord = { q: 0, r: 0 };
    const radius = 3;
    const hexes = getHexesInRadius(centerCoord, radius);

    // Replace one cell with a timer cell
    const timerCoord = { q: 2, r: 1 };

    hexes.forEach((coord) => {
      // If this is the timer position, spawn a timer cell
      if (coord.q === timerCoord.q && coord.r === timerCoord.r) {
        spawnCell(coord, TimerCell.dna, TimerCell);
      } else {
        // Otherwise spawn a stem cell
        spawnCell(coord, StemCell.dna, StemCell);
      }
    });
  }, [spawnCell]);

  return (
    <>
      <CellTicker />
      <Viewport />
    </>
  );
}
