'use client';

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SimulationProvider } from '@/components/simulation/SimulationProvider';
import { PetriDish } from '@/components/simulation/PetriDish';
import { Plus, X, Columns, Rows } from 'lucide-react';
import { ToolSelector } from '@/components/ui/ToolSelector';
import { CellSelector } from '@/components/ui/CellSelector';

// --- Types ---

type LayoutNode =
    | { type: 'LEAF'; id: string }
    | { type: 'SPLIT'; direction: 'horizontal' | 'vertical'; first: LayoutNode; second: LayoutNode; id: string };

// --- Window Manager Component ---

export function WindowManager() {
    const [layout, setLayout] = useState<LayoutNode>({ type: 'LEAF', id: 'window-1' });
    const [activeWindowId, setActiveWindowId] = useState<string>('window-1');

    // Helper to split a specific window
    const splitWindow = (targetId: string, direction: 'horizontal' | 'vertical') => {
        setLayout((prev) => {
            const recursiveSplit = (node: LayoutNode): LayoutNode => {
                if (node.type === 'LEAF') {
                    if (node.id === targetId) {
                        const newId = `window-${Date.now()}`;
                        return {
                            type: 'SPLIT',
                            direction,
                            first: node,
                            second: { type: 'LEAF', id: newId },
                            id: `split-${Date.now()}`,
                        };
                    }
                    return node;
                } else {
                    return {
                        ...node,
                        first: recursiveSplit(node.first),
                        second: recursiveSplit(node.second),
                    };
                }
            };
            return recursiveSplit(prev);
        });
    };

    // Helper to close a window
    const closeWindow = (targetId: string) => {
        // If it's the last window, don't close it (or reset?)
        // Logic: Find parent split, replace split with the *other* child
        setLayout((prev) => {
            if (prev.type === 'LEAF') {
                // Can't close the last window? Or reset?
                return prev;
            }

            const recursiveClose = (node: LayoutNode): LayoutNode | null => {
                if (node.type === 'LEAF') {
                    return node.id === targetId ? null : node;
                }

                const firstResult = recursiveClose(node.first);
                const secondResult = recursiveClose(node.second);

                if (firstResult === null) return secondResult!; // First was deleted, return second (promoted up)
                if (secondResult === null) return firstResult!; // Second was deleted, return first

                // Both exist, update children
                return {
                    ...node,
                    first: firstResult,
                    second: secondResult
                };
            };

            const res = recursiveClose(prev);
            // If we closed the root's only children and it returned null (shouldn't happen if we catch leaf above)
            return res || prev;
        });
    };

    // Recursive Renderer
    const renderNode = (node: LayoutNode) => {
        if (node.type === 'LEAF') {
            return (
                <div key={node.id} className="relative w-full h-full border border-slate-800">
                    {/* Window Header / Controls */}
                    <div className="absolute top-0 right-0 z-50 flex gap-1 p-1 bg-black/50 backdrop-blur rounded-bl-lg border-l border-b border-white/10">
                        <button onClick={() => splitWindow(node.id, 'horizontal')} className="p-1 hover:bg-white/10 rounded" title="Split Vertical">
                            <Columns size={12} className="text-white/70" />
                        </button>
                        <button onClick={() => splitWindow(node.id, 'vertical')} className="p-1 hover:bg-white/10 rounded" title="Split Horizontal">
                            <Rows size={12} className="text-white/70" />
                        </button>
                        <button onClick={() => closeWindow(node.id)} className="p-1 hover:bg-red-500/20 text-red-400 rounded" title="Close Window">
                            <X size={12} />
                        </button>
                    </div>

                    {/* Content */}
                    <SimulationProvider>
                        <PetriDish windowId={node.id} />
                    </SimulationProvider>
                </div>
            );
        }

        return (
            <PanelGroup
                key={node.id}
                direction={node.direction}
                className="h-full w-full"
            >
                <Panel minSize={10}>
                    {renderNode(node.first)}
                </Panel>
                <PanelResizeHandle
                    className={`bg-slate-800 hover:bg-blue-500 transition-colors flex justify-center items-center ${node.direction === 'horizontal'
                            ? 'w-1.5 h-full cursor-col-resize'
                            : 'w-full h-1.5 cursor-row-resize'
                        }`}
                />
                <Panel minSize={10}>
                    {renderNode(node.second)}
                </Panel>
            </PanelGroup>
        );
    };

    return (
        <div className="w-screen h-screen bg-black text-white overflow-hidden relative">
            <ToolSelector />
            <CellSelector />
            {renderNode(layout)}
        </div>
    );
}
