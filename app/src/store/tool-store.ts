/**
 * Tool Store - Manages the current UI tool selection
 */

import { create } from 'zustand';
import { PamDNA } from '@/lib/vibe-core';

import { Cell } from '@/lib/vibe-core';

export type Tool = 'hand' | 'inspect' | 'genesis' | 'visualizer';
export type EditorMode = 'spawn' | 'transplant' | 'glue';

interface ToolState {
    currentTool: Tool;
    editorMode: EditorMode;
    selectedCellDNA: PamDNA | null;
    inspectingCell: string | null; // Cell ID

    // Interaction State (Moved from HexGrid to fix stale closures)
    glueSource: string | null;
    draggingCell: Cell | null;

    setTool: (tool: Tool) => void;
    setEditorMode: (mode: EditorMode) => void;
    setSelectedCellDNA: (dna: PamDNA | null) => void;
    setInspectingCell: (cellId: string | null) => void;
    setGlueSource: (source: string | null) => void;
    setDraggingCell: (cell: Cell | null) => void;
}

export const useToolStore = create<ToolState>((set) => ({
    currentTool: 'hand',
    editorMode: 'spawn',
    selectedCellDNA: null,
    inspectingCell: null,
    glueSource: null,
    draggingCell: null,

    setTool: (tool) => set({ currentTool: tool }),
    setEditorMode: (mode) => set({ editorMode: mode }),
    setSelectedCellDNA: (dna) => set({ selectedCellDNA: dna }),
    setInspectingCell: (cellId) => set({ inspectingCell: cellId }),
    setGlueSource: (source) => set({ glueSource: source }),
    setDraggingCell: (cell) => set({ draggingCell: cell }),
}));
