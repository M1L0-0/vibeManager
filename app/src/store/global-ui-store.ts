import { create } from 'zustand';

interface GlobalUIState {
    activeToolId: string;
    setActiveTool: (id: string) => void;

    // View Settings
    showNebula: boolean;
    toggleNebula: () => void;
    showDebugOverlay: boolean;
    toggleDebugOverlay: () => void;

    // Genesis
    activeGenesisDna: any | null;
    setActiveGenesisDna: (dna: any) => void;

    genesisMode: 'spawn' | 'transplant' | 'glue';
    setGenesisMode: (mode: 'spawn' | 'transplant' | 'glue') => void;
}

export const useGlobalUIStore = create<GlobalUIState>((set) => ({
    activeToolId: 'hand',
    setActiveTool: (id) => set({ activeToolId: id }),

    showNebula: true,
    toggleNebula: () => set((state) => ({ showNebula: !state.showNebula })),

    showDebugOverlay: false,
    toggleDebugOverlay: () => set((state) => ({ showDebugOverlay: !state.showDebugOverlay })),

    activeGenesisDna: null,
    setActiveGenesisDna: (dna) => set({ activeGenesisDna: dna }),

    genesisMode: 'spawn',
    setGenesisMode: (mode) => set({ genesisMode: mode }),
}));
