/**
 * ToolSelector - Left sidebar for selecting UI tools
 */

'use client';

import { useGlobalUIStore } from '@/store/global-ui-store';
import { getAllCellTypes } from '@/pams/registry';
import { GlassButton, GlassPanel } from './Glass';
import { Hand, Search, Dna, Eye, Sparkles, Eraser, BoxSelect, Bug, Link } from 'lucide-react';
import { motion } from 'framer-motion';

export function ToolSelector() {
    const {
        activeToolId,
        setActiveTool,
        showNebula,
        toggleNebula,
        showDebugOverlay,
        toggleDebugOverlay
    } = useGlobalUIStore();

    const tools = [
        { id: 'hand', icon: Hand, label: 'Hand Tool', description: 'Interact with cells' },
        { id: 'select', icon: BoxSelect, label: 'Selection Tool', description: 'Select area to Copy/Paste' },
        { id: 'inspect', icon: Search, label: 'Inspect Tool', description: 'View cell genome' },
        { id: 'genesis', icon: Dna, label: 'Genesis Tool', description: 'Create and arrange cells' },
        { id: 'link', icon: Link, label: 'Link Tool', description: 'Connect Sender to Target' },
        { id: 'eraser', icon: Eraser, label: 'Eraser Tool', description: 'Remove cells' },
    ];

    const getActiveTool = () => activeToolId;
    const handleSelectTool = (id: string) => setActiveTool(id);

    // Wait, the previous code had `setTool(tool.id)`.
    // I need to implement `handleSelectTool` correctly.

    // Let's assume we can just import StemCell.

    return (
        <GlassPanel className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-3 z-50 pointer-events-auto">
            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeToolId === tool.id;

                return (
                    <GlassButton
                        key={tool.id}
                        onClick={() => handleSelectTool(tool.id)}
                        isActive={isActive}
                        activeVariant="purple"
                        className="group relative w-14 h-14"
                        title={tool.label}
                    >
                        <Icon size={24} />
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                            <div className="font-semibold">{tool.label}</div>
                            <div className="text-gray-400 text-xs">{tool.description}</div>
                        </div>
                    </GlassButton>
                );
            })}


            {/* Nebula Toggle */}
            <GlassButton
                onClick={toggleNebula}
                isActive={showNebula}
                activeVariant="purple"
                className="group relative w-14 h-14"
                title="Nebula Background"
            >
                <Sparkles size={24} />
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                    <div className="font-semibold">Nebula</div>
                    <div className="text-gray-400 text-xs">Toggle background FX</div>
                </div>
            </GlassButton>

            {/* Debug Toggle */}
            <GlassButton
                onClick={toggleDebugOverlay}
                isActive={showDebugOverlay}
                activeVariant="red"
                className="group relative w-14 h-14"
                title="Debug Overlay"
            >
                <Bug size={24} />
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
                    <div className="font-semibold">Debug Kernel</div>
                    <div className="text-gray-400 text-xs">Show Grid Coordinates</div>
                </div>
            </GlassButton>
        </GlassPanel>
    );
}
