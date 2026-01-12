import React from 'react';
import { ChannelId, CHANNEL_LIST } from '@/core/grid/channels';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ChannelSelectorProps {
    value?: ChannelId;
    onChange: (value: ChannelId) => void;
    className?: string;
}

export function ChannelSelector({ value = 'universal', onChange, className }: ChannelSelectorProps) {
    return (
        <div className={cn("grid grid-cols-2 gap-2", className)}>
            {CHANNEL_LIST.map((channel) => {
                const isSelected = value === channel.id;

                return (
                    <button
                        key={channel.id}
                        onClick={() => onChange(channel.id)}
                        className={cn(
                            "relative flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left",
                            isSelected
                                ? "border-white/50 bg-white/10"
                                : "border-transparent bg-gray-700/50 hover:bg-gray-700 hover:border-gray-600"
                        )}
                    >
                        {/* Color Dot */}
                        <div
                            className="w-4 h-4 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                            style={{ backgroundColor: channel.color, boxShadow: isSelected ? `0 0 10px ${channel.color}` : undefined }}
                        />

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                            <div className={cn("text-xs font-bold", isSelected ? "text-white" : "text-gray-300")}>
                                {channel.name}
                            </div>
                        </div>

                        {isSelected && <Check size={14} className="text-white shrink-0" />}
                    </button>
                );
            })}
        </div>
    );
}
