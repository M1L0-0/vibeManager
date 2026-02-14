/**
 * ToolSelector - Left sidebar for selecting UI tools
 */

'use client';

import { useToolStore } from '@/store/tool-store';
import { getAllCellTypes } from '@/pams/registry';
import { GlassButton, GlassPanel } from './Glass';
import { Hand, Search, Dna, Eye, Sparkles, Eraser, BoxSelect, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

export function ToolSelector() {
    const interaction = useToolStore((state) => state.interaction);
    const setToolHand = useToolStore((state) => state.setToolHand);
    const setToolInspect = useToolStore((state) => state.setToolInspect);
    const setToolGenesis = useToolStore((state) => state.setToolGenesis);
    const setToolEraser = useToolStore((state) => state.setToolEraser);

    // Helper to determine active tool
    const getActiveTool = () => {
        if (interaction.type === 'HAND_IDLE') return 'hand';
        if (interaction.type.startsWith('INSPECT')) return 'inspect';
        if (interaction.type.startsWith('GENESIS')) return 'genesis';
        if (interaction.type.startsWith('SELECT')) return 'select';
        if (interaction.type === 'ERASER_IDLE') return 'eraser';
        return null;
    };

    // Helper to select tool
    const handleSelectTool = (toolId: string) => {
        if (toolId === 'hand') setToolHand();
        if (toolId === 'select') useToolStore.getState().setToolSelect();
        if (toolId === 'inspect') setToolInspect();
        if (toolId === 'eraser') setToolEraser();
        if (toolId === 'genesis') {
            // Default to first available cell type
            const firstCell = getAllCellTypes()[0];
            if (firstCell) {
                setToolGenesis(firstCell.dna);
            }
        }
    };

    // Wait, the previous code had `setTool(tool.id)`.
    // I need to implement `handleSelectTool` correctly.

    // Let's assume we can just import StemCell.

    const tools = [
        { id: 'hand', icon: Hand, label: 'Hand Tool', description: 'Interact with cells' },
        { id: 'select', icon: BoxSelect, label: 'Selection Tool', description: 'Select area to Copy/Paste' },
        { id: 'inspect', icon: Search, label: 'Inspect Tool', description: 'View cell genome' },
        { id: 'genesis', icon: Dna, label: 'Genesis Tool', description: 'Create and arrange cells' },
        { id: 'eraser', icon: Eraser, label: 'Eraser Tool', description: 'Remove cells' },
        // { id: 'visualizer', icon: Eye, label: 'Synaptic Vision', description: 'Visualize signals & control simulation' },
    ];

    // Synaptic Vision is now in SimulationControls, removed from here? 
    // The previous ToolSelector had it.
    // My plan said: "For now, keep it in the list if the user prefers, BUT selecting it should toggling the view flag".
    // Let's keep it but make it toggle view.

    const { toggleSynapticVision, toggleNebula, view } = useToolStore();
    const { showNebula } = view;

    return (
        <GlassPanel className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-3 z-50">
            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = getActiveTool() === tool.id;

                return (
                    <GlassButton
                        key={tool.id}
                        onClick={() => handleSelectTool(tool.id)}
                        isActive={isActive}
                        activeVariant="purple"
                        className="group relative w-14 h-14"
                        title={tool.label}
                    >
                        <Icon size={24} />
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                            <div className="font-semibold">{tool.label}</div>
                            <div className="text-gray-400 text-xs">{tool.description}</div>
                        </div>
                    </GlassButton>
                );
            })}

            {/* Visualizer Separate Toggle */}
            <GlassButton
                onClick={toggleSynapticVision}
                isActive={view.showSynapticVision}
                activeVariant="cyan"
                className="group relative w-14 h-14"
                title="Synaptic Vision"
            >
                <Eye size={24} />
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                    <div className="font-semibold">Synaptic Vision</div>
                    <div className="text-gray-400 text-xs">Toggle signal overlay</div>
                </div>
            </GlassButton>

            {/* Nebula Toggle */}
            <GlassButton
                onClick={toggleNebula}
                isActive={showNebula}
                activeVariant="purple"
                className="group relative w-14 h-14"
                title="Nebula Background"
            >
                <Sparkles size={24} />
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                    <div className="font-semibold">Nebula</div>
                    <div className="text-gray-400 text-xs">Toggle background FX</div>
                </div>
            </GlassButton>

            {/* Debug Toggle */}
            <GlassButton
                onClick={() => useToolStore.getState().toggleDebugOverlay()}
                isActive={view.showDebugOverlay}
                activeVariant="red"
                className="group relative w-14 h-14"
                title="Debug Overlay"
            >
                <Bug size={24} />
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                    <div className="font-semibold">Debug Kernel</div>
                    <div className="text-gray-400 text-xs">Show Grid Coordinates</div>
                </div>
            </GlassButton>
        </GlassPanel>
    );
}
