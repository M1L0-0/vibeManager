import React, { useState } from 'react';
import { useGridStore } from '@/store/grid-store';
import { Play, Radio, ChevronRight, Settings2 } from 'lucide-react';

export const EndpointDashboard: React.FC = () => {
    const cells = useGridStore((state) => state.cells);
    const [collapsed, setCollapsed] = useState(false);
    const [triggerStates, setTriggerStates] = useState<Record<string, string>>({});

    // Global Signal Config
    const [signalColor, setSignalColor] = useState('#a855f7');
    const [signalRange, setSignalRange] = useState(5);

    // Filter for Endpoint Cells
    const endpoints = Array.from(cells.values()).filter(c => c.dna.id === 'endpoint');

    if (endpoints.length === 0) return null;

    const handleTrigger = async (cellId: string) => {
        setTriggerStates(prev => ({ ...prev, [cellId]: 'loading' }));

        const webhookUrl = `/api/ingest/${cellId}`;

        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: "Dashboard Trigger",
                    color: signalColor,
                    range: signalRange,
                    strength: 1.0
                })
            });

            if (res.ok) {
                setTriggerStates(prev => ({ ...prev, [cellId]: 'success' }));
            } else {
                setTriggerStates(prev => ({ ...prev, [cellId]: 'error' }));
            }
        } catch (e) {
            setTriggerStates(prev => ({ ...prev, [cellId]: 'error' }));
        }

        setTimeout(() => {
            setTriggerStates(prev => {
                const next = { ...prev };
                delete next[cellId];
                return next;
            });
        }, 2000);
    };

    return (
        <div className={`
            fixed right-4 top-20 z-40 flex flex-col items-end pointer-events-none
            ${collapsed ? 'w-10' : 'w-72'}
            transition-all duration-300
        `}>
            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="pointer-events-auto bg-black/80 text-white p-2 rounded-l-md shadow-xl border border-white/10 mb-2 hover:bg-black"
                title="Toggle VibeOps Dashboard"
            >
                {collapsed ? <Radio size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Main Panel */}
            <div className={`
                pointer-events-auto
                bg-black/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden
                flex flex-col w-full
                ${collapsed ? 'opacity-0 translate-x-10 h-0' : 'opacity-100 translate-x-0'}
                transition-all duration-300
            `}>
                <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-gradient-to-r from-purple-900/50 to-transparent">
                    <Radio className="text-purple-400" size={16} />
                    <span className="font-bold text-sm text-white tracking-wider">VIBEOPS</span>
                    <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                        {endpoints.length}
                    </span>
                </div>

                {/* Signal Configuration */}
                <div className="p-3 bg-white/5 border-b border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Settings2 size={12} /> Signal Configuration
                    </div>

                    {/* Color Picker */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-300">Color</span>
                        <div className="flex gap-1">
                            {['#a855f7', '#ef4444', '#22c55e', '#3b82f6', '#eab308'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSignalColor(c)}
                                    className={`w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform ${signalColor === c ? 'ring-1 ring-white' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input
                                type="color"
                                value={signalColor}
                                onChange={(e) => setSignalColor(e.target.value)}
                                className="w-4 h-4 p-0 border-0 rounded-full overflow-hidden cursor-pointer ml-1"
                            />
                        </div>
                    </div>

                    {/* Range Slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-300">
                            <span>Range</span>
                            <span className="font-mono text-cyan-400">{signalRange === 50 ? '∞' : signalRange}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={signalRange}
                            onChange={(e) => setSignalRange(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                </div>

                {/* Cell List */}
                <div className="p-2 space-y-2 max-h-[50vh] overflow-y-auto">
                    {endpoints.map(cell => (
                        <div key={cell.id} className="bg-white/5 p-3 rounded border border-white/5 hover:border-purple-500/30 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-xs font-mono text-purple-300 truncate w-32" title={cell.id}>
                                        {cell.id.slice(0, 8)}...
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                        {cell.state.data?.label || "Endpoint Node"}
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${cell.state.activity > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/10'}`} />
                            </div>

                            <button
                                onClick={() => handleTrigger(cell.id)}
                                disabled={triggerStates[cell.id] === 'loading'}
                                className={`
                                    w-full h-8 flex items-center justify-center gap-2 rounded text-xs font-medium transition-all
                                    ${triggerStates[cell.id] === 'loading' ? 'bg-white/10 cursor-wait' : ''}
                                    ${triggerStates[cell.id] === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : ''}
                                    ${triggerStates[cell.id] === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : ''}
                                    ${!triggerStates[cell.id] ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg active:scale-95' : ''}
                                `}
                            >
                                {triggerStates[cell.id] === 'loading' && <Play size={12} className="animate-spin" />}
                                {triggerStates[cell.id] === 'success' && "Sent!"}
                                {triggerStates[cell.id] === 'error' && "Failed"}
                                {!triggerStates[cell.id] && <><Play size={12} fill="currentColor" /> Trigger</>}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
