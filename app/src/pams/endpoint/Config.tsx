import React, { useState } from 'react';
import { Cell } from '@/lib/vibe-core';
import { Play } from 'lucide-react';

interface EndpointConfigProps {
    cell: Cell;
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export const EndpointConfig: React.FC<EndpointConfigProps> = ({ cell, updateCell }) => {
    const [isTriggering, setIsTriggering] = useState(false);
    const [lastStatus, setLastStatus] = useState<string | null>(null);

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/ingest/${cell.id}`
        : `/api/ingest/${cell.id}`;

    const handleMockTrigger = async () => {
        setIsTriggering(true);
        setLastStatus(null);
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: "Manual Trigger",
                    color: "#a855f7",
                    strength: 1.0
                })
            });

            if (res.ok) {
                setLastStatus("✅ Signal Sent");
            } else {
                setLastStatus("❌ Error");
            }
        } catch (e) {
            setLastStatus("❌ Network Error");
        }
        setIsTriggering(false);

        // Clear status after 2s
        setTimeout(() => setLastStatus(null), 2000);
    };

    return (
        <div className="flex flex-col gap-4 p-2 text-xs text-white">
            <div className="bg-white/5 p-3 rounded-md border border-white/10">
                <div className="text-white/50 mb-1 uppercase tracking-wider font-bold text-[10px]">
                    Webhook URL
                </div>
                <div className="flex items-center gap-2 bg-black/50 p-2 rounded font-mono text-purple-300 break-all select-all">
                    {webhookUrl}
                </div>
                <div className="mt-2 text-white/40 text-[10px]">
                    Send a POST request with JSON body to trigger this cell.
                </div>
            </div>

            <div className="bg-white/5 p-3 rounded-md border border-white/10">
                <div className="text-white/50 mb-2 uppercase tracking-wider font-bold text-[10px]">
                    Mock Testing
                </div>
                <button
                    onClick={handleMockTrigger}
                    disabled={isTriggering}
                    className={`
                        w-full h-9 flex items-center justify-center gap-2 rounded font-medium transition-all
                        ${isTriggering
                            ? 'bg-purple-500/20 text-purple-300/50 cursor-wait'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/25 active:scale-95'
                        }
                    `}
                >
                    <Play size={14} className={isTriggering ? 'animate-spin' : ''} />
                    {isTriggering ? 'Sending...' : 'Test Trigger'}
                </button>
                {lastStatus && (
                    <div className="mt-2 text-center font-medium animate-pulse text-emerald-400">
                        {lastStatus}
                    </div>
                )}
            </div>
        </div>
    );
};
