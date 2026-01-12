/**
 * Simulation Store - Controls time and metadata
 */

import { create } from 'zustand';

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

export const useSimulationStore = create<SimulationState>((set) => ({
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
