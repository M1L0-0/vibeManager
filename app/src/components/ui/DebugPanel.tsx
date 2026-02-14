'use client';

import { useToolStore } from '@/store/tool-store';
import { useGridStore } from '@/store/grid-store';
import { motion, AnimatePresence } from 'framer-motion';

export function DebugPanel() {
    const { debugSelectedId, view } = useToolStore();
    const gridStore = useGridStore();

    if (!view.showDebugOverlay) return null;

    // Get the first selected cell (if any)
    const selectedId = debugSelectedId;
    const cell = selectedId ? gridStore.cells.get(selectedId) : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed bottom-4 right-4 w-80 bg-black/80 backdrop-blur-md border border-red-500/30 rounded-lg p-4 text-xs font-mono text-green-400 pointer-events-none select-none z-50 overflow-hidden"
            >
                <h3 className="text-red-400 font-bold mb-2 border-b border-red-500/30 pb-1">VIBE OS KERNEL DEBUG</h3>

                {cell ? (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">ID:</span>
                            <span>{cell.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">COORD:</span>
                            <span>q:{cell.coord.q}, r:{cell.coord.r}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">DNA:</span>
                            <span style={{ color: cell.dna.color }}>{cell.dna.name}</span>
                        </div>

                        <div className="mt-2 text-gray-400 border-t border-gray-700 pt-1">STATE_DUMP:</div>
                        <pre className="overflow-auto max-h-40 bg-black/50 p-2 rounded text-[10px] text-gray-300">
                            {JSON.stringify(cell.state, null, 2)}
                        </pre>

                        <div className="mt-2 text-gray-400 border-t border-gray-700 pt-1">SIGNALS ({cell.signals.length}):</div>
                        {cell.signals.length > 0 ? (
                            <div className="space-y-1">
                                {cell.signals.map(s => (
                                    <div key={s.id} className="bg-red-900/20 p-1 rounded">
                                        [{s.type}] {s.id.slice(0, 4)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-gray-600 italic">No active signals</span>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-500 italic py-4 text-center">
                        NO_TISSUE_SELECTED
                        <br />
                        Select a cell to inspect kernel state.
                    </div>
                )}

                <div className="mt-4 pt-2 border-t border-red-500/10 text-[9px] text-red-500/50 flex justify-between">
                    <span>MEM: {gridStore.cells.size} CELLS</span>
                    <span>PARTICLES: {gridStore.particles.length}</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
