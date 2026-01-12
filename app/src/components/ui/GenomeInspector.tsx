/**
 * GenomeInspector - Popup for viewing and editing cell parameters
 */

'use client';

import { Cell } from '@/lib/vibe-core';
import { X } from 'lucide-react';
import { useGridStore } from '@/store/grid-store';
import { REGISTRY } from '@/pams/registry';

interface GenomeInspectorProps {
    cell: Cell;
    onClose: () => void;
}

export function GenomeInspector({ cell, onClose }: GenomeInspectorProps) {
    const updateCell = useGridStore((state) => state.updateCell);

    // Subscribe to live cell updates from the store
    const liveCell = useGridStore((state) => state.cells.get(cell.id)) || cell;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
            onWheel={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="bg-gray-900 border-2 border-gray-700 rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: liveCell.dna.color }}
                            />
                            {liveCell.dna.name}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">{liveCell.dna.description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Cell Info */}
                    <div className="space-y-4">
                        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Cell ID:</span>
                                <span className="text-white font-mono">{liveCell.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Coordinates:</span>
                                <span className="text-white font-mono">({liveCell.coord.q}, {liveCell.coord.r})</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Energy:</span>
                                <span className="text-white">{liveCell.state.energy}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Activity:</span>
                                <span className="text-white">{(liveCell.state.activity * 100).toFixed(0)}%</span>
                            </div>
                        </div>

                        {/* Genome Configuration */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="text-purple-400">🧬</span>
                                Genome Configuration
                            </h3>

                            {/* Dynamic Config Component */}
                            {(() => {
                                const Module = REGISTRY[liveCell.dna.id];
                                if (Module && Module.configComponent) {
                                    const Config = Module.configComponent;
                                    return <Config cell={liveCell} updateCell={updateCell} />;
                                }
                                return (
                                    <p className="text-gray-500 text-sm italic">
                                        No configurable parameters for this cell type.
                                    </p>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
