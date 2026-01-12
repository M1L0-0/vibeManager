/**
 * GenomeInspector - Popup for viewing and editing cell parameters
 */

'use client';

import { Cell } from '@/lib/vibe-core';
import { X, Plus, Minus } from 'lucide-react';
import { useGridStore } from '@/store/grid-store';
import { useState } from 'react';

interface GenomeInspectorProps {
    cell: Cell;
    onClose: () => void;
}

export function GenomeInspector({ cell, onClose }: GenomeInspectorProps) {
    const updateCell = useGridStore((state) => state.updateCell);

    // Subscribe to live cell updates from the store
    const liveCell = useGridStore((state) => state.cells.get(cell.id)) || cell;

    // Timer-specific state
    const timerData = liveCell.dna.id === 'timer' ? liveCell.state.data : null;
    const [timerDuration, setTimerDuration] = useState(timerData?.maxTime || 3);
    const [inputValue, setInputValue] = useState(String(timerData?.maxTime || 3));
    const [unit, setUnit] = useState<'seconds' | 'minutes' | 'hours'>('seconds');

    // Helper functions for unit conversion
    const convertToSeconds = (value: number, fromUnit: 'seconds' | 'minutes' | 'hours'): number => {
        switch (fromUnit) {
            case 'minutes': return value * 60;
            case 'hours': return value * 3600;
            default: return value;
        }
    };

    const convertFromSeconds = (seconds: number, toUnit: 'seconds' | 'minutes' | 'hours'): number => {
        switch (toUnit) {
            case 'minutes': return seconds / 60;
            case 'hours': return seconds / 3600;
            default: return seconds;
        }
    };

    // Get display value in current unit
    const displayValue = convertFromSeconds(timerDuration, unit);

    const handleTimerDurationChange = (newDuration: number) => {
        // Clamp between 0.1 and 60 seconds
        const clampedDuration = Math.max(0.1, Math.min(3600, newDuration));
        setTimerDuration(clampedDuration);
        setInputValue(String(convertFromSeconds(clampedDuration, unit)));

        // Update the cell's timer data
        updateCell(liveCell.id, {
            state: {
                ...liveCell.state,
                data: {
                    ...liveCell.state.data,
                    maxTime: clampedDuration,
                    timeRemaining: clampedDuration, // Reset timer
                },
            },
        });
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
            handleTimerDurationChange(convertToSeconds(parsed, unit));
        }
    };

    const handleUnitChange = (newUnit: 'seconds' | 'minutes' | 'hours') => {
        setUnit(newUnit);
        setInputValue(String(convertFromSeconds(timerDuration, newUnit)));
    };

    const handleIncrement = () => {
        const step = unit === 'hours' ? 0.1 : unit === 'minutes' ? 1 : 0.1;
        const newValue = parseFloat(inputValue) + step;
        handleInputChange(String(newValue));
    };

    const handleDecrement = () => {
        const step = unit === 'hours' ? 0.1 : unit === 'minutes' ? 1 : 0.1;
        const newValue = Math.max(0.1, parseFloat(inputValue) - step);
        handleInputChange(String(newValue));
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
            onWheel={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
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

                        {/* Timer-specific controls */}
                        {liveCell.dna.id === 'timer' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">
                                        Timer Duration
                                    </label>

                                    {/* Slider */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <input
                                            type="range"
                                            min={unit === 'hours' ? '0.01' : unit === 'minutes' ? '0.1' : '0.1'}
                                            max={unit === 'hours' ? '1' : unit === 'minutes' ? '60' : '60'}
                                            step={unit === 'hours' ? '0.01' : unit === 'minutes' ? '0.1' : '0.1'}
                                            value={displayValue}
                                            onChange={(e) => handleTimerDurationChange(convertToSeconds(parseFloat(e.target.value), unit))}
                                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                        <span className="text-orange-400 font-mono w-16 text-right">
                                            {displayValue.toFixed(unit === 'seconds' ? 1 : 2)}{unit === 'seconds' ? 's' : unit === 'minutes' ? 'm' : 'h'}
                                        </span>
                                    </div>

                                    {/* Enhanced Number Input with Custom Controls */}
                                    <div className="space-y-2">
                                        {/* Unit Selector */}
                                        <div className="flex gap-1 bg-gray-700/50 p-1 rounded-lg">
                                            {(['seconds', 'minutes', 'hours'] as const).map((u) => (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    onClick={() => handleUnitChange(u)}
                                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${unit === u
                                                        ? 'bg-orange-500 text-white shadow-lg'
                                                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {u.charAt(0).toUpperCase() + u.slice(1)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Input with Custom Buttons */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleDecrement}
                                                className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all hover:shadow-lg active:scale-95"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input
                                                type="number"
                                                min="0.1"
                                                step={unit === 'hours' ? '0.01' : unit === 'minutes' ? '0.1' : '0.1'}
                                                value={inputValue}
                                                onChange={(e) => handleInputChange(e.target.value)}
                                                onBlur={() => setInputValue(String(displayValue))}
                                                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.0"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleIncrement}
                                                className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all hover:shadow-lg active:scale-95"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>

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
    );
}
