import { Cell } from '@/lib/vibe-core';
import { ChannelSelector } from '@/components/ui/ChannelSelector';
import { DirectionSelector } from '@/components/ui/DirectionSelector';
import { StructureEditor } from '@/components/ui/StructureEditor';
import { TimePicker } from '@/components/ui/TimePicker';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export function StandardConfigSection({ cell, updateCell }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const data = cell.state.data || {};

    // Helper to update specific data fields
    const updateData = (updates: Record<string, any>) => {
        updateCell(cell.id, {
            state: {
                ...cell.state,
                data: {
                    ...cell.state.data,
                    ...updates
                }
            }
        });
    };

    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-colors text-left"
            >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <Settings2 size={16} className="text-cyan-400" />
                    Standard Properties
                </div>
                {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
            </button>

            {isExpanded && (
                <div className="p-4 space-y-6 border-t border-gray-700 bg-gray-900/30">

                    {/* Identity */}
                    <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5 uppercase tracking-wide">
                            Label Override
                        </label>
                        <input
                            type="text"
                            value={data.label || ''}
                            placeholder={cell.dna.name}
                            onChange={(e) => updateData({ label: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    {/* Signal Channel */}
                    <div>
                        <label className="text-xs text-gray-400 font-medium block mb-2 uppercase tracking-wide">
                            Chemical Channel
                        </label>
                        <ChannelSelector
                            value={(data.channel as any) || 'universal'}
                            onChange={(channel) => updateData({ channel })}
                        />
                    </div>

                    {/* Directions */}
                    <div>
                        <label className="text-xs text-gray-400 font-medium block mb-2 uppercase tracking-wide">
                            Signal Output
                        </label>
                        <div className="bg-gray-800/80 p-4 rounded-xl flex justify-center border border-gray-700">
                            {cell.state.groupId ? (
                                <StructureEditor cell={cell} updateCell={updateCell} />
                            ) : (
                                <DirectionSelector
                                    value={data.directions || [0, 1, 2, 3, 4, 5]}
                                    onChange={(directions) => updateData({ directions })}
                                />
                            )}
                        </div>
                    </div>

                    {/* Physics */}
                    <div className="space-y-4">
                        {/* Range */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wide mb-2">
                                <span>Signal Range</span>
                                <span className="text-cyan-400 font-mono">{data.range ?? 10} hops</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                step="1"
                                value={data.range ?? 10}
                                onChange={(e) => updateData({ range: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>

                        {/* Speed */}
                        <div>
                            <TimePicker
                                label="Signal Delay (Speed)"
                                value={data.speedDelay || 0.1}
                                min={0.05}
                                max={5.0}
                                onChange={(speedDelay) => updateData({ speedDelay })}
                            />
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
