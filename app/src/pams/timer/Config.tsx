import { Cell } from '@/lib/vibe-core';
import { TimePicker } from '@/components/ui/TimePicker';

interface Props {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export function TimerConfig({ cell, updateCell }: Props) {
    const timerData = cell.state.data;

    return (
        <div className="space-y-3">
            <div>
                <TimePicker
                    value={cell.state.data?.maxTime || 3}
                    onChange={(newTime) => {
                        updateCell(cell.id, {
                            state: {
                                ...cell.state,
                                data: {
                                    ...cell.state.data,
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
                                    updateCell(cell.id, {
                                        state: {
                                            ...cell.state,
                                            data: {
                                                ...cell.state.data,
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
                                    updateCell(cell.id, {
                                        state: {
                                            ...cell.state,
                                            data: {
                                                ...cell.state.data,
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
                                    updateCell(cell.id, {
                                        state: {
                                            ...cell.state,
                                            data: {
                                                ...cell.state.data,
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
    );
}
