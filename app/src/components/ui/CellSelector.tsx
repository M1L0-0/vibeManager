/**
 * CellSelector - Top bar for selecting cell types in Genesis Tool
 */

'use client';

import { useToolStore } from '@/store/tool-store';
import { REGISTRY, getAllCellTypes } from '@/pams/registry';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Dna, Eraser, Combine, Pointer, Download, Upload } from 'lucide-react';

export function CellSelector() {
    const interaction = useToolStore((state) => state.interaction);
    const setToolGenesis = useToolStore((state) => state.setToolGenesis);
    const setToolGenesisGlue = useToolStore((state) => state.setToolGenesisGlue);
    const setToolGenesisTransplant = useToolStore((state) => state.setToolGenesisTransplant);

    // Only show when in Genesis mode
    if (!interaction.type.startsWith('GENESIS')) return null;

    // Helper to determine active "sub-tool" or mode
    // interaction.type could be 'GENESIS_IDLE' (Spawn), 'GENESIS_TRANSPLANT_IDLE' (Transplant), 'GENESIS_GLUING_*' (Glue)

    const isSpawnMode = interaction.type === 'GENESIS_IDLE';
    const isGlueMode = interaction.type.startsWith('GENESIS_GLUING');
    const isTransplantMode = interaction.type.startsWith('GENESIS_TRANSPLANT') || interaction.type === 'GENESIS_DRAGGING' || interaction.type === 'GENESIS_HOLDING';

    const activeCellId = interaction.type === 'GENESIS_IDLE' ? interaction.dna.id : null;

    const cellTypes = getAllCellTypes();

    const handleSelectCell = (cellId: string) => {
        const pam = REGISTRY[cellId];
        if (pam) {
            setToolGenesis(pam.dna);
        }
    };

    return (
        <div className="fixed left-28 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-2xl z-40 max-h-[80vh] overflow-y-auto w-64 animate-in fade-in slide-in-from-left-4 duration-200">
            <h3 className="text-white font-semibold flex items-center gap-2 pb-2 border-b border-gray-700 mb-2">
                <Dna size={18} className="text-purple-400" />
                Genesis Lab
            </h3>

            {/* Mode Switcher */}
            <div className="flex bg-gray-800 p-1 rounded-lg mb-4">
                <button
                    onClick={() => {
                        // Default to Stem Cell for Spawn Mode if switching back
                        const stem = REGISTRY['stem'];
                        setToolGenesis(stem.dna);
                    }}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1",
                        isSpawnMode ? "bg-purple-600 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                    title="Spawn new cells"
                >
                    <Dna size={14} /> Spawn
                </button>
                <button
                    onClick={() => setToolGenesisTransplant()}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1",
                        isTransplantMode ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                    title="Move cells (Drag & Drop)"
                >
                    <Pointer size={14} /> Move
                </button>
                <button
                    onClick={() => setToolGenesisGlue()}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1",
                        isGlueMode ? "bg-green-600 text-white shadow-md" : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                    title="Connect cells"
                >
                    <Combine size={14} /> Glue
                </button>
            </div>

            {/* List of Cells (Only in Spawn Mode) */}
            {isSpawnMode && (
                <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">Available Cells</div>

                    {cellTypes.map((pam) => {
                        // Dynamically resolve icon from Lucide
                        const IconComponent = (pam.dna.icon && (LucideIcons as any)[pam.dna.icon]) || LucideIcons.Circle;
                        const isSelected = activeCellId === pam.dna.id;

                        return (
                            <button
                                key={pam.dna.id}
                                onClick={() => handleSelectCell(pam.dna.id)}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg transition-all border text-left group",
                                    isSelected
                                        ? "bg-gray-800 border-purple-500/50 ring-1 ring-purple-500/50"
                                        : "bg-transparent border-transparent hover:bg-gray-800 hover:border-gray-700"
                                )}
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: pam.dna.color }}
                                >
                                    <IconComponent size={16} className="text-white mix-blend-plus-lighter" />
                                </div>
                                <div>
                                    <div className={cn("font-medium text-sm", isSelected ? "text-white" : "text-gray-300")}>
                                        {pam.dna.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 leading-tight">
                                        {pam.dna.description}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Instructions for other modes */}
            {isTransplantMode && (
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 text-center">
                    <Pointer size={32} className="mx-auto text-blue-400 mb-2 opacity-80" />
                    <h4 className="text-sm font-medium text-blue-200 mb-1">Transplant Mode</h4>
                    <p className="text-xs text-gray-400">
                        Drag and drop cells to move them to new locations.
                    </p>
                </div>
            )}

            {isGlueMode && (
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 text-center">
                    <Combine size={32} className="mx-auto text-green-400 mb-2 opacity-80" />
                    <h4 className="text-sm font-medium text-green-200 mb-1">Glue Mode</h4>
                    <p className="text-xs text-gray-400 mb-2">
                        Click two adjacent cells to merge them into a group.
                    </p>
                    {interaction.type === 'GENESIS_GLUING_TARGET' && (
                        <div className="text-xs text-green-400 font-bold animate-pulse">
                            Select second cell...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
