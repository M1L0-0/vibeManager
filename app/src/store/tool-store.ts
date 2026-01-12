/**
 * Tool Store - Manages the current UI tool selection
 */

import { create } from 'zustand';

export type Tool = 'hand' | 'inspect';

interface ToolState {
    currentTool: Tool;
    setTool: (tool: Tool) => void;
}

export const useToolStore = create<ToolState>((set) => ({
    currentTool: 'hand',
    setTool: (tool) => set({ currentTool: tool }),
}));
