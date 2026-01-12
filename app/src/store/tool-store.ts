/**
 * Tool Store - Manages the current UI tool selection
 */

import { create } from 'zustand';
import { PamDNA } from '@/lib/vibe-core';

export type Tool = 'hand' | 'inspect' | 'genesis' | 'visualizer';
export type EditorMode = 'spawn' | 'transplant';

interface ToolState {
    currentTool: Tool;
    editorMode: EditorMode;
    selectedCellDNA: PamDNA | null;
    inspectingCell: string | null; // Cell ID
    setTool: (tool: Tool) => void;
    setEditorMode: (mode: EditorMode) => void;
    setSelectedCellDNA: (dna: PamDNA | null) => void;
    setInspectingCell: (cellId: string | null) => void;
}

export const useToolStore = create<ToolState>((set) => ({
    currentTool: 'hand',
    editorMode: 'spawn',
    selectedCellDNA: null,
    inspectingCell: null,
    setTool: (tool) => set({ currentTool: tool }),
    setEditorMode: (mode) => set({ editorMode: mode }),
    setSelectedCellDNA: (dna) => set({ selectedCellDNA: dna }),
    setInspectingCell: (cellId) => set({ inspectingCell: cellId }),
}));
