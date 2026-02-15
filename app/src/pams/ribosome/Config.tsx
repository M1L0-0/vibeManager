import React, { useState, useEffect } from 'react';
import { Cell } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';

export const RibosomeConfig = ({ cell: initialCell, updateCell }: { cell: Cell; updateCell: (id: string, updates: Partial<Cell>) => void }) => {
    // Fresh state
    const cell = useGridStore((state) => state.cells.get(initialCell.id)) || initialCell;
    const template = (cell.state.data as any)?.dnaTemplate || {
        name: 'New Packet',
        color: '#00ccff',
        payload: { msg: 'Hello' }
    };

    const [jsonError, setJsonError] = useState<string | null>(null);
    const [jsonText, setJsonText] = useState(JSON.stringify(template.payload, null, 2));

    // Sync local state when external state changes
    useEffect(() => {
        setJsonText(JSON.stringify(template.payload, null, 2));
    }, [template.payload]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateData({ name: e.target.value });
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateData({ color: e.target.value });
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setJsonText(newVal);
        try {
            const parsed = JSON.parse(newVal);
            setJsonError(null);
            updateData({ payload: parsed });
        } catch (err) {
            setJsonError((err as Error).message);
        }
    };

    const updateData = (updates: any) => {
        updateCell(cell.id, {
            state: {
                ...cell.state,
                data: {
                    ...cell.state.data,
                    dnaTemplate: {
                        ...template,
                        ...updates
                    }
                }
            }
        });
    };

    return (
        <div className="p-4 space-y-4 text-xs">
            <h3 className="font-bold text-white mb-2">DNA Synthesizer</h3>

            <div className="space-y-2">
                <label className="block text-gray-400">Packet Name</label>
                <input
                    type="text"
                    value={template.name}
                    onChange={handleNameChange}
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-gray-400">Color Tag</label>
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={template.color}
                        onChange={handleColorChange}
                        className="h-6 w-8 bg-transparent border-none"
                    />
                    <input
                        type="text"
                        value={template.color}
                        onChange={handleColorChange}
                        className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-white font-mono"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-gray-400">JSON Payload</label>
                <textarea
                    value={jsonText}
                    onChange={handleJsonChange}
                    className={`w-full h-32 bg-black/30 border ${jsonError ? 'border-red-500' : 'border-white/10'} rounded px-2 py-1 text-white font-mono text-[10px]`}
                    spellCheck={false}
                />
                {jsonError && (
                    <div className="text-red-400 text-[10px]">{jsonError}</div>
                )}
            </div>

            <div className="pt-2 border-t border-white/10 text-gray-500 italic">
                Click the cell to broadcast this packet to neighbors.
            </div>
        </div>
    );
};
