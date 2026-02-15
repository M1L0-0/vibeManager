'use client';

import { ReactNode, useRef } from 'react';
import { createGridStore, GridStoreContext, GridStore } from '@/store/grid-store';
import { createToolStore, ToolStoreContext, ToolStore } from '@/store/tool-store';
import { createSimStore, SimulationStoreContext, SimulationStore } from '@/store/simulation-store';

interface SimulationProviderProps {
    children: ReactNode;
}

export function SimulationProvider({ children }: SimulationProviderProps) {
    // Stores are created once per provider instance (per window)
    const gridStoreRef = useRef<GridStore | null>(null);
    const toolStoreRef = useRef<ToolStore | null>(null);
    const simStoreRef = useRef<SimulationStore | null>(null);

    if (!gridStoreRef.current) {
        gridStoreRef.current = createGridStore();
        // ToolStore needs GridStore instance
        toolStoreRef.current = createToolStore(gridStoreRef.current);
        simStoreRef.current = createSimStore();
    }

    return (
        <GridStoreContext.Provider value={gridStoreRef.current}>
            <ToolStoreContext.Provider value={toolStoreRef.current!}>
                <SimulationStoreContext.Provider value={simStoreRef.current!}>
                    {children}
                </SimulationStoreContext.Provider>
            </ToolStoreContext.Provider>
        </GridStoreContext.Provider>
    );
}
