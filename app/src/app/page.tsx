/**
 * VibeManager - The Cellular OS
 * Main entry point
 */

'use client';

import { useEffect } from 'react';
import { Viewport } from '@/components/stage/Viewport';
import { ToolSelector } from '@/components/ui/ToolSelector';
import { CellSelector } from '@/components/ui/CellSelector';
import { SimulationControls } from '@/components/ui/SimulationControls';
import { useGridStore } from '@/store/grid-store';
import { GenomeInspector } from '@/components/ui/GenomeInspector';
import { useToolStore } from '@/store/tool-store';
import { StemCell } from '@/pams/stem';
import { TimerCell } from '@/pams/timer';
import { WaveCell } from '@/pams/wave';
import { getHexesInRadius } from '@/core/grid/hex';
import { CellTicker } from '@/components/stage/CellTicker';

export default function Home() {
  const spawnCell = useGridStore((state) => state.spawnCell);
  const currentTool = useToolStore((state) => state.currentTool);

  useEffect(() => {
    // Spawn initial cells in a hexagonal pattern
    const centerCoord = { q: 0, r: 0 };
    const radius = 3;
    const hexes = getHexesInRadius(centerCoord, radius);

    // Replace one cell with a timer cell
    const timerCoord = { q: 2, r: 1 };
    // Replace another cell with a wave cell
    const waveCoord = { q: -2, r: 1 };

    hexes.forEach((coord) => {
      // If this is the timer position, spawn a timer cell
      if (coord.q === timerCoord.q && coord.r === timerCoord.r) {
        spawnCell(coord, TimerCell.dna, TimerCell);
      } else if (coord.q === waveCoord.q && coord.r === waveCoord.r) {
        // Spawn a wave cell
        spawnCell(coord, WaveCell.dna, WaveCell);
      } else {
        // Otherwise spawn a stem cell
        spawnCell(coord, StemCell.dna, StemCell);
      }
    });
  }, [spawnCell]);

  const inspectingCellId = useToolStore((state) => state.inspectingCell);
  const setInspectingCell = useToolStore((state) => state.setInspectingCell);
  const getCellAt = useGridStore((state) => state.getCellAt);

  // Retrieve the actual cell object if we are inspecting one
  // We need to look it up from the grid store using the ID
  const inspectingCell = inspectingCellId ? useGridStore.getState().cells.get(inspectingCellId) : null;

  return (
    <>
      <CellTicker />
      <ToolSelector />
      {currentTool === 'genesis' && <CellSelector />}
      {currentTool === 'visualizer' && <SimulationControls />}
      <Viewport />

      {/* Global Overlays */}
      {inspectingCell && (
        <GenomeInspector
          cell={inspectingCell}
          onClose={() => setInspectingCell(null)}
        />
      )}
    </>
  );
}
