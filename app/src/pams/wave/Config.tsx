import { Cell } from '@/lib/vibe-core';

interface Props {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export function WaveConfig({ cell, updateCell }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm text-gray-400 block mb-3">
                    Command Payload
                </label>
                <div className="space-y-2">
                    {[
                        { id: 'TRIGGER', icon: '⚡', label: 'Trigger', desc: 'Activates the target' },
                        { id: 'RESET', icon: '↺', label: 'Reset', desc: 'Resets state to initial' },
                        { id: 'PAUSE', icon: '⏸', label: 'Pause', desc: 'Toggles active state' }
                    ].map((cmd) => (
                        <label
                            key={cmd.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${(cell.state.data?.command || 'TRIGGER') === cmd.id
                                ? 'bg-cyan-900/40 border-cyan-500/50'
                                : 'bg-gray-700/30 border-transparent hover:bg-gray-700/50 hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="commandPayload"
                                value={cmd.id}
                                checked={(cell.state.data?.command || 'TRIGGER') === cmd.id}
                                onChange={(e) => {
                                    updateCell(cell.id, {
                                        state: {
                                            ...cell.state,
                                            data: {
                                                ...cell.state.data,
                                                command: e.target.value
                                            }
                                        }
                                    });
                                }}
                                className="sr-only"
                            />
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-lg shadow-inner">
                                {cmd.icon}
                            </div>
                            <div className="flex-1">
                                <div className={`font-medium ${(cell.state.data?.command || 'TRIGGER') === cmd.id ? 'text-cyan-400' : 'text-gray-200'
                                    }`}>
                                    {cmd.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {cmd.desc}
                                </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${(cell.state.data?.command || 'TRIGGER') === cmd.id
                                ? 'border-cyan-500'
                                : 'border-gray-600'
                                }`}>
                                {(cell.state.data?.command || 'TRIGGER') === cmd.id && (
                                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                )}
                            </div>
                        </label>
                    ))}
                </div>
            </div>


            {/* Wireless / Through-End Toggle */}
            <div className="space-y-3 p-3 rounded-lg border border-gray-700 bg-gray-800/30">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-gray-200 font-medium">Wireless</div>
                        <div className="text-xs text-gray-500">Signal travels through empty space</div>
                    </div>
                    <button
                        onClick={() => {
                            updateCell(cell.id, {
                                state: {
                                    ...cell.state,
                                    data: {
                                        ...cell.state.data,
                                        wireless: !cell.state.data?.wireless
                                    }
                                }
                            });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cell.state.data?.wireless ? 'bg-cyan-500' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cell.state.data?.wireless ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Instant Toggle */}
                <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
                    <div>
                        <div className="text-gray-200 font-medium">Instant Delivery</div>
                        <div className="text-xs text-gray-500">Zero-delay signal transmission</div>
                    </div>
                    <button
                        onClick={() => {
                            updateCell(cell.id, {
                                state: {
                                    ...cell.state,
                                    data: {
                                        ...cell.state.data,
                                        instant: !cell.state.data?.instant
                                    }
                                }
                            });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cell.state.data?.instant ? 'bg-yellow-500' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cell.state.data?.instant ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div >
    );
}
