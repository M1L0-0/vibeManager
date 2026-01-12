/**
 * GenomeInspector - Popup for viewing and editing cell parameters
 */

'use client';

import { Cell } from '@/lib/vibe-core';
import { X, Plus, Minus } from 'lucide-react';
import { useGridStore } from '@/store/grid-store';
import { useState } from 'react';
import { DirectionSelector } from './DirectionSelector';
import { ChannelSelector } from './ChannelSelector';
import { TimePicker } from './TimePicker';

interface GenomeInspectorProps {
    cell: Cell;
    onClose: () => void;
}

export function GenomeInspector({ cell, onClose }: GenomeInspectorProps) {
    const updateCell = useGridStore((state) => state.updateCell);

    // Subscribe to live cell updates from the store
    const liveCell = useGridStore((state) => state.cells.get(cell.id)) || cell;
    const timerData = liveCell.dna.id === 'timer' ? liveCell.state.data : null;

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

                            {/* Wave-specific controls */}
                            {liveCell.dna.id === 'wave' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-2">
                                            Chemical Channel
                                        </label>
                                        <ChannelSelector
                                            value={liveCell.state.data?.channel || 'universal'}
                                            onChange={(newChannel) => {
                                                updateCell(liveCell.id, {
                                                    state: {
                                                        ...liveCell.state,
                                                        data: {
                                                            ...liveCell.state.data,
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
                                            <DirectionSelector
                                                value={liveCell.state.data?.directions || [0, 1, 2, 3, 4, 5]}
                                                onChange={(newDirs: number[]) => {
                                                    updateCell(liveCell.id, {
                                                        state: {
                                                            ...liveCell.state,
                                                            data: {
                                                                ...liveCell.state.data,
                                                                directions: newDirs
                                                            }
                                                        }
                                                    });
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Click segments to toggle signal output faces.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-400 block mb-2">
                                            Signal Range ({liveCell.state.data?.range || 10} hops)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                step="1"
                                                value={liveCell.state.data?.range || 10}
                                                onChange={(e) => {
                                                    const newRange = parseInt(e.target.value);
                                                    updateCell(liveCell.id, {
                                                        state: {
                                                            ...liveCell.state,
                                                            data: {
                                                                ...liveCell.state.data,
                                                                range: newRange
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                            />
                                            <span className="text-cyan-400 font-mono w-8 text-right">
                                                {liveCell.state.data?.range || 10}
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
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${(liveCell.state.data?.command || 'TRIGGER') === cmd.id
                                                            ? 'bg-cyan-900/40 border-cyan-500/50'
                                                            : 'bg-gray-700/30 border-transparent hover:bg-gray-700/50 hover:border-gray-600'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="commandPayload"
                                                        value={cmd.id}
                                                        checked={(liveCell.state.data?.command || 'TRIGGER') === cmd.id}
                                                        onChange={(e) => {
                                                            updateCell(liveCell.id, {
                                                                state: {
                                                                    ...liveCell.state,
                                                                    data: {
                                                                        ...liveCell.state.data,
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
                                                        <div className={`font-medium ${(liveCell.state.data?.command || 'TRIGGER') === cmd.id ? 'text-cyan-400' : 'text-gray-200'
                                                            }`}>
                                                            {cmd.label}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {cmd.desc}
                                                        </div>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${(liveCell.state.data?.command || 'TRIGGER') === cmd.id
                                                            ? 'border-cyan-500'
                                                            : 'border-gray-600'
                                                        }`}>
                                                        {(liveCell.state.data?.command || 'TRIGGER') === cmd.id && (
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
                                            value={liveCell.state.data?.speedDelay || 0.1} // Default 0.1s (10 speed)
                                            min={0.05}
                                            max={5.0}
                                            onChange={(newDelay) => {
                                                updateCell(liveCell.id, {
                                                    state: {
                                                        ...liveCell.state,
                                                        data: {
                                                            ...liveCell.state.data,
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
                            )}

                            {/* Timer-specific controls */}
                            {liveCell.dna.id === 'timer' && (
                                <div className="space-y-3">
                                    <div>
                                        <TimePicker
                                            value={liveCell.state.data?.maxTime || 3}
                                            onChange={(newTime) => {
                                                updateCell(liveCell.id, {
                                                    state: {
                                                        ...liveCell.state,
                                                        data: {
                                                            ...liveCell.state.data,
                                                            maxTime: newTime,
                                                            timeRemaining: newTime, // Reset timer
                                                        },
                                                    },
                                                });
                                            }}
                                            label="Timer Duration"
                                        />

                                        {/* Timer Mode Selector (Custom Radio Buttons) */}
                                        <div className="mt-4 space-y-3">
                                            <label className="text-sm text-gray-400 block mb-3">
                                                Timer Mode
                                            </label>

                                            {/* Normal Mode */}
                                            <label
                                                htmlFor="mode-normal"
                                                className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all cursor-pointer group border-2 border-transparent hover:border-orange-500/30"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        id="mode-normal"
                                                        name="timerMode"
                                                        checked={!timerData?.autoRestart && !timerData?.loop}
                                                        onChange={() => {
                                                            updateCell(liveCell.id, {
                                                                state: {
                                                                    ...liveCell.state,
                                                                    data: {
                                                                        ...liveCell.state.data,
                                                                        autoRestart: false,
                                                                        loop: false,
                                                                    },
                                                                },
                                                            });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 peer-checked:border-orange-500 transition-all duration-200 flex items-center justify-center peer-checked:bg-orange-500/20">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-200 font-medium">Normal</div>
                                                    <div className="text-xs text-gray-400">Single use, click to restart</div>
                                                </div>
                                            </label>

                                            {/* Auto-Restart Mode */}
                                            <label
                                                htmlFor="mode-auto"
                                                className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all cursor-pointer group border-2 border-transparent hover:border-orange-500/30"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        id="mode-auto"
                                                        name="timerMode"
                                                        checked={timerData?.autoRestart === true}
                                                        onChange={() => {
                                                            updateCell(liveCell.id, {
                                                                state: {
                                                                    ...liveCell.state,
                                                                    data: {
                                                                        ...liveCell.state.data,
                                                                        autoRestart: true,
                                                                        loop: false,
                                                                    },
                                                                },
                                                            });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 peer-checked:border-orange-500 transition-all duration-200 flex items-center justify-center peer-checked:bg-orange-500/20">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-200 font-medium">Auto-Restart</div>
                                                    <div className="text-xs text-gray-400">Resets automatically, waits for click</div>
                                                </div>
                                            </label>

                                            {/* Loop Mode */}
                                            <label
                                                htmlFor="mode-loop"
                                                className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all cursor-pointer group border-2 border-transparent hover:border-orange-500/30"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        id="mode-loop"
                                                        name="timerMode"
                                                        checked={timerData?.loop === true}
                                                        onChange={() => {
                                                            updateCell(liveCell.id, {
                                                                state: {
                                                                    ...liveCell.state,
                                                                    data: {
                                                                        ...liveCell.state.data,
                                                                        autoRestart: false,
                                                                        loop: true,
                                                                    },
                                                                },
                                                            });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 peer-checked:border-orange-500 transition-all duration-200 flex items-center justify-center peer-checked:bg-orange-500/20">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-200 font-medium">Loop Mode</div>
                                                    <div className="text-xs text-gray-400">Continuously runs and emits signals</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Other cell types */}
                            {liveCell.dna.id !== 'timer' && (
                                <p className="text-gray-500 text-sm italic">
                                    No configurable parameters for this cell type.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
