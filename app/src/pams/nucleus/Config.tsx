import { useState } from 'react';
import { Cell } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { ChevronRight, ChevronDown } from 'lucide-react';

const DNAItem = ({ dna }: { dna: any }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-black/20 rounded border border-white/5 overflow-hidden">
            <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: dna.color }}
                />
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate font-medium">{dna.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{dna.id}</div>
                </div>
                {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </div>

            {expanded && (
                <div className="p-2 border-t border-white/5 bg-black/40">
                    {dna.description && (
                        <div className="text-[10px] text-gray-400 mb-2 italic">
                            {dna.description}
                        </div>
                    )}
                    <div className="text-[10px] text-gray-500 font-mono mb-1">PAYLOAD:</div>
                    <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-40 bg-black/50 p-1 rounded">
                        {JSON.stringify(dna.payload || {}, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export const NucleusConfig = ({ cell: initialCell, updateCell }: { cell: Cell; updateCell: (id: string, updates: Partial<Cell>) => void }) => {
    // Subscribe to the specific cell to ensure we always have fresh state
    const cell = useGridStore((state) => state.cells.get(initialCell.id));

    if (!cell) return <div className="text-red-500">Cell not found</div>;

    const handleAddTestDNA = () => {
        // Create a test DNA bundle
        const testDNA = {
            id: `dna-test-${Date.now()}`,
            name: `Test DNA ${((cell.state.data as any)?.dnaStorage?.length || 0) + 1}`,
            version: '1.0',
            color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Random color for visibility
            description: 'A test DNA bundle injected for verification.',
            payload: {
                timestamp: Date.now(),
                randomData: Math.floor(Math.random() * 1000),
                status: 'verified'
            }
        };

        const currentStorage = (cell.state.data as any)?.dnaStorage || [];
        updateCell(cell.id, {
            state: {
                ...cell.state,
                data: {
                    ...cell.state.data,
                    dnaStorage: [...currentStorage, testDNA]
                }
            }
        });
    };

    const handleClearStorage = () => {
        updateCell(cell.id, {
            state: {
                ...cell.state,
                data: {
                    ...cell.state.data,
                    dnaStorage: []
                }
            }
        });
    };

    const storedDNA = (cell.state.data as any)?.dnaStorage || [];

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-bold text-white mb-2">Nucleus Storage</h3>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handleAddTestDNA}
                    className="px-3 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-200 rounded text-xs border border-green-500/30 transition-colors"
                >
                    + Inject Test DNA
                </button>
                <button
                    onClick={handleClearStorage}
                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded text-xs border border-red-500/30 transition-colors"
                >
                    Clear Storage
                </button>
            </div>

            <div className="mt-4">
                <h4 className="text-xs font-mono text-gray-400 mb-2">STORED BUNDLES ({storedDNA.length})</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {storedDNA.length === 0 ? (
                        <div className="text-xs text-gray-600 italic">Empty storage...</div>
                    ) : (
                        storedDNA.map((dna: any, idx: number) => (
                            <DNAItem key={idx} dna={dna} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
