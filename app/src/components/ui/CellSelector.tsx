/**
 * CellSelector - Top bar for selecting cell types in Genesis Tool
 */

'use client';

import { useToolStore } from '@/store/tool-store';
import { getAllCellTypes } from '@/pams/registry';
import { useEffect } from 'react';

export function CellSelector() {
    const { editorMode, selectedCellDNA, setEditorMode, setSelectedCellDNA } = useToolStore();

    // Get all available cell types from registry
    const availableCells = getAllCellTypes();

    // Auto-select first cell type when in spawn mode and nothing is selected
    useEffect(() => {
        if (editorMode === 'spawn' && !selectedCellDNA) {
            setSelectedCellDNA(availableCells[0].dna);
        }
    }, [editorMode, selectedCellDNA, setSelectedCellDNA]);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-2xl z-40 animate-slide-down" style={{ minWidth: '600px' }}>
            <div className="flex items-center gap-4">
                {/* Mode Toggle */}
                <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setEditorMode('spawn')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${editorMode === 'spawn'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                            }`}
                    >
                        🧪 Spawn
                    </button>
                    <button
                        onClick={() => setEditorMode('transplant')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${editorMode === 'transplant'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                            }`}
                    >
                        🔬 Transplant
                    </button>
                    <button
                        onClick={() => setEditorMode('glue')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${editorMode === 'glue'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                            }`}
                    >
                        🔗 Glue
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-700" />

                {/* Content Area with Fixed Dimensions */}
                <div className="relative" style={{ width: '420px', height: '44px' }}>
                    {/* Cell Type Selector (fades in/out based on mode) */}
                    <div className={`absolute inset-0 flex gap-2 transition-opacity duration-200 ${editorMode === 'spawn' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                        {availableCells.map((pamModule) => {
                            const isSelected = selectedCellDNA?.id === pamModule.dna.id;
                            return (
                                <button
                                    key={pamModule.dna.id}
                                    onClick={() => setSelectedCellDNA(pamModule.dna)}
                                    disabled={editorMode !== 'spawn'}
                                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all border-2 ${isSelected
                                        ? 'border-purple-500 bg-purple-500/20 shadow-lg'
                                        : 'border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: pamModule.dna.color }}
                                    />
                                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'
                                        }`}>
                                        {pamModule.dna.name}
                                    </span>

                                    {/* Tooltip */}
                                    {editorMode === 'spawn' && (
                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700 z-50">
                                            {pamModule.dna.description}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Transplant Mode Instructions (fades in/out) */}
                    <div className={`absolute inset-0 flex items-center text-sm text-gray-400 italic transition-opacity duration-200 ${editorMode === 'transplant' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                        Drag cells to new positions
                    </div>
                </div>
            </div>
        </div>
    );
}
