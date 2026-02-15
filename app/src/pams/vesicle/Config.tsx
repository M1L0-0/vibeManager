import React, { useState, useEffect } from 'react';
import { Cell } from '@/lib/vibe-core';
import { Play, Link } from 'lucide-react';

interface VesicleConfigProps {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export const VesicleConfig: React.FC<VesicleConfigProps> = ({ cell, updateCell }) => {
    const [isTriggering, setIsTriggering] = useState(false);
    const [lastStatus, setLastStatus] = useState<string | null>(null);

    // Local state for inputs to avoid stuttering updates
    const [url, setUrl] = useState(cell.state.data?.url || '');
    const [method, setMethod] = useState(cell.state.data?.method || 'POST');
    const [body, setBody] = useState(cell.state.data?.body || '{\n  "message": "Hello from Vibe!"\n}');

    // Sync from cell if it changes externally (e.g. Link Tool)
    useEffect(() => {
        if (cell.state.data?.url !== undefined && cell.state.data.url !== url) {
            setUrl(cell.state.data.url);
        }
    }, [cell.state.data?.url]);

    const handleSave = () => {
        updateCell(cell.id, {
            state: {
                ...cell.state,
                data: {
                    ...cell.state.data,
                    url,
                    method,
                    body
                }
            }
        });
    };

    const handleTest = async () => {
        setIsTriggering(true);
        setLastStatus(null);
        handleSave(); // Ensure data is saved before testing

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: ['GET', 'HEAD'].includes(method) ? undefined : body
            });

            if (res.ok) {
                setLastStatus("✅ Sent");
            } else {
                setLastStatus(`❌ ${res.status}`);
            }
        } catch (e) {
            setLastStatus("❌ Error");
        }
        setIsTriggering(false);
        setTimeout(() => setLastStatus(null), 2000);
    };

    return (
        <div className="flex flex-col gap-3 p-2 text-xs text-white">
            {/* Target URL */}
            <div className="bg-white/5 p-2 rounded border border-white/10">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-white/50 text-[10px] uppercase font-bold">Target URL</label>
                    <Link size={10} className="text-white/30" />
                </div>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={handleSave}
                    placeholder="https://api.example.com/webhook"
                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-purple-300 font-mono text-[10px] focus:outline-none focus:border-purple-500"
                />
            </div>

            {/* Method & Test */}
            <div className="flex gap-2">
                <div className="w-1/3 bg-white/5 p-2 rounded border border-white/10">
                    <label className="block text-white/50 text-[10px] uppercase font-bold mb-1">Method</label>
                    <select
                        value={method}
                        onChange={(e) => {
                            setMethod(e.target.value);
                            // Delayed save handled by effect or manual trigger? 
                            // React state updates are batched, but let's save immediately for select
                            updateCell(cell.id, {
                                state: { ...cell.state, data: { ...cell.state.data, method: e.target.value } }
                            });
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded px-1 py-1 text-white text-[10px] focus:outline-none"
                    >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DEL</option>
                    </select>
                </div>

                <div className="w-2/3">
                    <button
                        onClick={handleTest}
                        disabled={isTriggering || !url}
                        className={`
                            w-full h-full flex items-center justify-center gap-2 rounded border border-white/10 font-medium transition-all
                            ${isTriggering || !url
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/25'
                            }
                        `}
                    >
                        {isTriggering ? <Play size={12} className="animate-spin" /> : <Play size={12} />}
                        {lastStatus || (isTriggering ? 'Sending...' : 'Test Send')}
                    </button>
                </div>
            </div>

            {/* Body */}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div className="bg-white/5 p-2 rounded border border-white/10 h-32 flex flex-col">
                    <label className="text-white/50 text-[10px] uppercase font-bold mb-1">JSON Body</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onBlur={handleSave}
                        className="flex-1 w-full bg-black/50 border border-white/10 rounded p-2 text-white/80 font-mono text-[10px] resize-none focus:outline-none focus:border-purple-500 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30"
                        spellCheck={false}
                    />
                </div>
            )}
        </div>
    );
};
