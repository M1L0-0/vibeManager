import { Cell } from '@/lib/vibe-core';

interface Props {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

const OPERATIONS = [
    { id: 'AND', label: 'AND (All Inputs)', desc: 'Fires when 2+ inputs arrive together' },
    { id: 'OR', label: 'OR (Any Input)', desc: 'Fires when any input arrives (Repeater)' },
    { id: 'XOR', label: 'XOR (Exclusive)', desc: 'Fires when exactly 1 input arrives' },
    { id: 'NAND', label: 'NAND (Not AND)', desc: 'Inverted AND behavior' },
    { id: 'NOR', label: 'NOR (Not OR)', desc: 'Inverted OR behavior' },
];

export function NeuronConfig({ cell, updateCell }: Props) {
    const currentOp = cell.state.data?.operation || 'AND';

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm text-gray-400 block mb-3">
                    Logic Operation
                </label>
                <div className="space-y-2">
                    {OPERATIONS.map((op) => (
                        <button
                            key={op.id}
                            onClick={() => {
                                updateCell(cell.id, {
                                    state: {
                                        ...cell.state,
                                        data: {
                                            ...cell.state.data,
                                            operation: op.id as any
                                        }
                                    }
                                });
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${currentOp === op.id
                                ? 'bg-cyan-900/40 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-medium ${currentOp === op.id ? 'text-cyan-400' : 'text-gray-200'
                                    }`}>
                                    {op.label}
                                </span>
                                {currentOp === op.id && (
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {op.desc}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-500 italic border-t border-gray-700/50 pt-3">
                Neurons integrate simultaneous signals. Signals arriving within 100ms of each other are processed together.
            </p>
        </div>
    );
}
