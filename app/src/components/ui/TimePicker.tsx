import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface TimePickerProps {
    value: number; // in seconds
    onChange: (seconds: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
}

export function TimePicker({ value, onChange, min = 0.1, max = 60, step = 0.1, label = 'Duration' }: TimePickerProps) {
    const [unit, setUnit] = useState<'seconds' | 'minutes' | 'hours'>('seconds');
    const [inputValue, setInputValue] = useState(String(value));

    // Valid units for current value range
    // If value is small, default to seconds. If large, default to minutes/hrs?
    // For now, keep state local.

    // Sync input when external value changes
    useEffect(() => {
        setInputValue(String(convertFromSeconds(value, unit)));
    }, [value, unit]);

    const convertToSeconds = (val: number, fromUnit: 'seconds' | 'minutes' | 'hours'): number => {
        switch (fromUnit) {
            case 'minutes': return val * 60;
            case 'hours': return val * 3600;
            default: return val;
        }
    };

    const convertFromSeconds = (seconds: number, toUnit: 'seconds' | 'minutes' | 'hours'): number => {
        switch (toUnit) {
            case 'minutes': return seconds / 60;
            case 'hours': return seconds / 3600;
            default: return seconds;
        }
    };

    const displayValue = convertFromSeconds(value, unit);

    const handleDurationChange = (newDuration: number) => {
        const clamped = Math.max(min, Math.min(max * 3600, newDuration)); // rough max clamp
        onChange(clamped);
    };

    const handleInputChange = (val: string) => {
        setInputValue(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            handleDurationChange(convertToSeconds(parsed, unit));
        }
    };

    const handleUnitChange = (newUnit: 'seconds' | 'minutes' | 'hours') => {
        setUnit(newUnit);
        // Recalculate input value for new unit
        setInputValue(String(convertFromSeconds(value, newUnit)));
    };

    const getStep = () => {
        if (unit === 'hours') return 0.01;
        if (unit === 'minutes') return 0.1;
        return 0.1;
    };

    const handleIncrement = () => {
        const s = getStep();
        const newValue = parseFloat(inputValue) + s;
        handleInputChange(String(newValue.toFixed(2)));
    };

    const handleDecrement = () => {
        const s = getStep();
        const newValue = Math.max(0, parseFloat(inputValue) - s);
        handleInputChange(String(newValue.toFixed(2)));
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-sm text-gray-400 block mb-2">
                    {label}
                </label>

                {/* Slider */}
                <div className="flex items-center gap-3 mb-3">
                    <input
                        type="range"
                        min={unit === 'hours' ? 0.01 : unit === 'minutes' ? 0.1 : 0.1}
                        max={unit === 'hours' ? 1 : unit === 'minutes' ? 60 : 60}
                        step={getStep()}
                        value={displayValue}
                        onChange={(e) => handleDurationChange(convertToSeconds(parseFloat(e.target.value), unit))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-cyan-400 font-mono w-16 text-right">
                        {displayValue.toFixed(unit === 'seconds' ? 1 : 2)}{unit === 'seconds' ? 's' : unit === 'minutes' ? 'm' : 'h'}
                    </span>
                </div>

                {/* Input Control */}
                <div className="space-y-2">
                    {/* Unit Selector */}
                    <div className="flex gap-1 bg-gray-700/50 p-1 rounded-lg">
                        {(['seconds', 'minutes', 'hours'] as const).map((u) => (
                            <button
                                key={u}
                                type="button"
                                onClick={() => handleUnitChange(u)}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${unit === u
                                    ? 'bg-cyan-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                    }`}
                            >
                                {u.charAt(0).toUpperCase() + u.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Input with Plus/Minus */}
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
                            min="0"
                            step={getStep()}
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onBlur={() => setInputValue(String(convertFromSeconds(value, unit)))}
                            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            </div>
        </div>
    );
}
