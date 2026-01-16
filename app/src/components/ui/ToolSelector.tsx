/**
 * ToolSelector - Left sidebar for selecting UI tools
 */

'use client';

import { useToolStore } from '@/store/tool-store';
import { Hand, Search, Dna, Eye, Link } from 'lucide-react';
import { StemDNA } from '@/pams/dna-catalog';

export function ToolSelector() {
    const interaction = useToolStore((state) => state.interaction);
    const setToolHand = useToolStore((state) => state.setToolHand);
    const setToolInspect = useToolStore((state) => state.setToolInspect);
    const setToolGenesis = useToolStore((state) => state.setToolGenesis);

    // Helper to determine active tool
    const getActiveTool = () => {
        if (interaction.type === 'HAND_IDLE') return 'hand';
        if (interaction.type.startsWith('INSPECT')) return 'inspect';
        if (interaction.type.startsWith('GENESIS')) return 'genesis';
        return null;
    };

    // Helper to select tool
    const handleSelectTool = (toolId: string) => {
        if (toolId === 'hand') setToolHand();
        if (toolId === 'inspect') setToolInspect();
        if (toolId === 'genesis') {
            // Default to Stem Cell for now
            setToolGenesis(StemDNA);
        }
    };

    // Wait, the previous code had `setTool(tool.id)`.
    // I need to implement `handleSelectTool` correctly.

    // Let's assume we can just import StemCell.

    const tools = [
        { id: 'hand', icon: Hand, label: 'Hand Tool', description: 'Interact with cells' },
        { id: 'inspect', icon: Search, label: 'Inspect Tool', description: 'View cell genome' },
        { id: 'genesis', icon: Dna, label: 'Genesis Tool', description: 'Create and arrange cells' },
        // { id: 'visualizer', icon: Eye, label: 'Synaptic Vision', description: 'Visualize signals & control simulation' },
    ];

    // Synaptic Vision is now in SimulationControls, removed from here? 
    // The previous ToolSelector had it.
    // My plan said: "For now, keep it in the list if the user prefers, BUT selecting it should toggling the view flag".
    // Let's keep it but make it toggle view.

    const { toggleSynapticVision, view } = useToolStore();

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-gray-900/90 backdrop-blur-sm p-3 rounded-xl border border-gray-700 shadow-2xl z-50">
            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = getActiveTool() === tool.id;

                return (
                    <button
                        key={tool.id}
                        onClick={() => {
                            handleSelectTool(tool.id);
                        }}
                        className={`
              group relative w-14 h-14 flex items-center justify-center rounded-lg
              transition-all duration-200
              ${isActive
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }
            `}
                        title={tool.label}
                    >
                        <Icon size={24} />
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                            <div className="font-semibold">{tool.label}</div>
                            <div className="text-gray-400 text-xs">{tool.description}</div>
                        </div>
                    </button>
                );
            })}

            {/* Visualizer Separate Toggle */}
            <button
                onClick={toggleSynapticVision}
                className={`
              group relative w-14 h-14 flex items-center justify-center rounded-lg
              transition-all duration-200
              ${view.showSynapticVision
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }
            `}
                title="Synaptic Vision"
            >
                <Eye size={24} />
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                    <div className="font-semibold">Synaptic Vision</div>
                    <div className="text-gray-400 text-xs">Toggle signal overlay</div>
                </div>
            </button>
        </div>
    );
}
