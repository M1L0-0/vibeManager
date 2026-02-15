import { Cell } from '@/lib/vibe-core';

interface Props {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export function PixelConfig({ cell, updateCell }: Props) {
    const data = cell.state.data || {};
    // Defaults
    const persistence = data.persistence !== false; // Default true (Canvas Mode)

    return (
        <div className="space-y-4">
            {/* Persistence Toggle */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all cursor-pointer">
                <div>
                    <div className="text-sm font-medium text-gray-200">Canvas Mode</div>
                    <div className="text-xs text-gray-400">Hold color after signal ends</div>
                </div>
                <input
                    type="checkbox"
                    checked={persistence}
                    onChange={(e) => {
                        updateCell(cell.id, {
                            state: {
                                ...cell.state,
                                data: { ...data, persistence: e.target.checked }
                            }
                        });
                    }}
                    className="w-5 h-5 rounded border-gray-500 text-orange-500 focus:ring-orange-500/50 bg-gray-800"
                />
            </label>

        </div>
    );
}
