/**
 * ToolSelector - Left sidebar for selecting UI tools
 */

'use client';

import { useToolStore } from '@/store/tool-store';
import { Hand, Search, Dna } from 'lucide-react';

export function ToolSelector() {
    const { currentTool, setTool } = useToolStore();

    const tools = [
        { id: 'hand' as const, icon: Hand, label: 'Hand Tool', description: 'Interact with cells' },
        { id: 'inspect' as const, icon: Search, label: 'Inspect Tool', description: 'View cell genome' },
        { id: 'genesis' as const, icon: Dna, label: 'Genesis Tool', description: 'Create and arrange cells' },
    ];

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-gray-900/90 backdrop-blur-sm p-3 rounded-xl border border-gray-700 shadow-2xl z-50">
            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = currentTool === tool.id;

                return (
                    <button
                        key={tool.id}
                        onClick={() => setTool(tool.id)}
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
        </div>
    );
}
