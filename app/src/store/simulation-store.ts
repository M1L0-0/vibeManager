import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { createContext, useContext } from 'react';

interface SimulationState {
    isPlaying: boolean;
    simulationSpeed: number; // Multiplier, 1.0 = normal
    tickCount: number;
    showParticles: boolean; // "Synaptic Vision" overlay toggle

    // Actions
    setIsPlaying: (isPlaying: boolean) => void;
    togglePlay: () => void;
    setSpeed: (speed: number) => void;
    incrementTick: () => void;
    toggleParticles: () => void;
}

export type SimulationStore = ReturnType<typeof createSimStore>;

export const createSimStore = () => createStore<SimulationState>((set) => ({
    isPlaying: true,
    simulationSpeed: 1.0,
    tickCount: 0,
    showParticles: true,

    setIsPlaying: (isPlaying) => set({ isPlaying }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setSpeed: (simulationSpeed) => set({ simulationSpeed }),
    incrementTick: () => set((state) => ({ tickCount: state.tickCount + 1 })),
    toggleParticles: () => set((state) => ({ showParticles: !state.showParticles })),
}));

export const SimulationStoreContext = createContext<SimulationStore | null>(null);

export function useSimulationStore<T>(selector: (state: SimulationState) => T): T {
    const store = useContext(SimulationStoreContext);
    if (!store) throw new Error('Missing SimulationStoreContext.Provider in the tree');
    return useStore(store, selector);
}

export function useSimulationStoreApi() {
    const store = useContext(SimulationStoreContext);
    if (!store) throw new Error('Missing SimulationStoreContext.Provider in the tree');
    return store;
}
