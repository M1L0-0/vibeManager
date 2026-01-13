import { Cell } from '@/lib/vibe-core';
import { ChannelSelector } from '@/components/ui/ChannelSelector';
import { DirectionSelector } from '@/components/ui/DirectionSelector';
import { StructureEditor } from '@/components/ui/StructureEditor';
import { TimePicker } from '@/components/ui/TimePicker';

interface Props {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export function WaveConfig({ cell, updateCell }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm text-gray-400 block mb-2">
                    Chemical Channel
                </label>
                <ChannelSelector
                    value={cell.state.data?.channel || 'universal'}
                    onChange={(newChannel) => {
                        updateCell(cell.id, {
                            state: {
                                ...cell.state,
                                data: {
                                    ...cell.state.data,
                                    channel: newChannel
                                }
                            }
                        });
                    }}
                />
            </div>

            <div>
                <label className="text-sm text-gray-400 block mb-2">
                    Signal Direction
                </label>
                <div className="bg-gray-700/30 p-4 rounded-xl flex justify-center">
                    {cell.state.groupId ? (
                        <StructureEditor cell={cell} updateCell={updateCell} />
                    ) : (
                        <DirectionSelector
                            value={cell.state.data?.directions || [0, 1, 2, 3, 4, 5]}
                            onChange={(newDirs: number[]) => {
                                updateCell(cell.id, {
                                    state: {
                                        ...cell.state,
                                        data: {
                                            ...cell.state.data,
                                            directions: newDirs
                                        }
                                    }
                                });
                            }}
                        />
                    )}
                </div>
                {!cell.state.groupId && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Click segments to toggle signal output faces.
                    </p>
                )}
            </div>

            <div>
                <label className="text-sm text-gray-400 block mb-2">
                    Signal Range ({cell.state.data?.range || 10} hops)
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={cell.state.data?.range || 10}
                        onChange={(e) => {
                            const newRange = parseInt(e.target.value);
                            updateCell(cell.id, {
                                state: {
                                    ...cell.state,
                                    data: {
                                        ...cell.state.data,
                                        range: newRange
                                    }
                                }
                            });
                        }}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-cyan-400 font-mono w-8 text-right">
                        {cell.state.data?.range || 10}
                    </span>
                </div>
            </div>

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

            <div>
                <TimePicker
                    label="Signal Speed (Delay per hop)"
                    value={cell.state.data?.speedDelay || 0.1} // Default 0.1s (10 speed)
                    min={0.05}
                    max={5.0}
                    onChange={(newDelay) => {
                        updateCell(cell.id, {
                            state: {
                                ...cell.state,
                                data: {
                                    ...cell.state.data,
                                    speedDelay: newDelay
                                }
                            }
                        });
                    }}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Time it takes for the signal to travel to the next cell.
                </p>
            </div>
        </div>
    );
}
