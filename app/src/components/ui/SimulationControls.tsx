/**
 * Simulation Controls - Play/Pause, Speed, Step
 */

'use client';

import { Play, Pause, StepForward, Download, Eye, EyeOff, Save, FolderOpen, Undo, Redo } from 'lucide-react';
import { useEffect } from 'react';
import { useSimulationStore } from '@/store/simulation-store';
import { useGridStore } from '@/store/grid-store';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { useToolStore, useToolStoreApi } from '@/store/tool-store';
import { useGridStoreApi } from '@/store/grid-store';
import { useGlobalUIStore } from '@/store/global-ui-store';
import { pixelToHex } from '@/core/grid/hex';
import { DishLibraryModal } from './DishLibraryModal';
import { libraryDB } from '@/store/library-db';
import { generateGridThumbnail } from '@/lib/thumbnail-generator';

export function SimulationControls() {
    const isPlaying = useSimulationStore(s => s.isPlaying);
    // const setIsPlaying = useSimulationStore(s => s.setIsPlaying); // Unused in destructure but used in code?
    const togglePlay = useSimulationStore(s => s.togglePlay);
    const simulationSpeed = useSimulationStore(s => s.simulationSpeed);
    const setSpeed = useSimulationStore(s => s.setSpeed);
    const incrementTick = useSimulationStore(s => s.incrementTick);

    // We need setIsPlaying too
    const setIsPlaying = useSimulationStore(s => s.setIsPlaying);

    const exportGrid = useGridStore(s => s.exportGrid);
    const importGrid = useGridStore(s => s.importGrid);
    const getAllCells = useGridStore(s => s.getAllCells);
    const undo = useGridStore(s => s.undo);
    const redo = useGridStore(s => s.redo);
    const history = useGridStore(s => s.history);
    const copy = useGridStore(s => s.copy);
    const paste = useGridStore(s => s.paste);

    const selection = useToolStore(s => s.selection);
    const pan = useToolStore(state => state.view.pan);
    const zoom = useToolStore(state => state.view.zoom);

    const toolStoreApi = useToolStoreApi();
    const gridStoreApi = useGridStoreApi();

    const fileInputRef = useRef<HTMLInputElement>(null); // This ref is no longer used for upload, but kept for now if needed elsewhere.

    // Undo/Redo Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore shortcuts if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            // Check for Cmd+C / Ctrl+C
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                const selection = toolStoreApi.getState().selection;
                if (selection.size > 0) {
                    // Copy from Local Grid -> Global Store
                    const cells = gridStoreApi.getState().copy(selection);
                    useGlobalUIStore.getState().setClipboard(cells);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                // Set Global Tool to Paste
                useGlobalUIStore.getState().setActiveTool('paste');
            }
            if (e.key === 'Escape') {
                useGlobalUIStore.getState().setActiveTool('hand');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, copy, paste, selection, pan, zoom, toolStoreApi, gridStoreApi]);

    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const handleExport = () => {
        const jsonString = exportGrid();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibe-check-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                importGrid(content);
                // Optionally pause simulation on load
                setIsPlaying(false);
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const handleSaveToLibrary = async () => {
        const name = prompt("Name your dish:");
        if (!name) return;

        const cells = getAllCells();
        const thumbnail = await generateGridThumbnail(cells);
        const data = exportGrid();

        await libraryDB.saveDish({
            id: `dish-${Date.now()}`,
            name,
            timestamp: Date.now(),
            thumbnail,
            data
        });

        // alert('Saved to Incubator!'); // Optional feedback
        // Maybe open library to show it?
        setIsLibraryOpen(true);
    };

    // const setTool = useToolStore((state) => state.setToolHand); // Not used for toggle anymore
    const toggleSynapticVision = useToolStore(s => s.toggleSynapticVision);
    const view = useToolStore(s => s.view);
    const showParticles = view.showSynapticVision;

    return (
        <>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 shadow-2xl z-50 pointer-events-auto max-w-[90%] overflow-x-auto scrollbar-hide">
                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className={cn(
                        "p-3 rounded-full transition-all hover:scale-110 active:scale-95",
                        isPlaying ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Step Forward (only when paused) */}
                <button
                    onClick={() => {
                        if (isPlaying) setIsPlaying(false);
                        incrementTick();
                    }}
                    className="p-2 text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={isPlaying}
                    title="Step Forward (Pause first)"
                >
                    <StepForward size={20} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Speed Control */}
                <div className="flex items-center gap-2 px-2">
                    <span className="text-xs font-mono text-white/50 w-8 text-right">
                        {simulationSpeed.toFixed(1)}x
                    </span>
                    <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={simulationSpeed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Toggle Synaptic Vision */}
                <button
                    onClick={toggleSynapticVision}
                    className={cn(
                        "p-2 rounded-full transition-all",
                        showParticles ? "text-cyan-400 bg-cyan-400/10" : "text-white/50 hover:text-white"
                    )}
                    title="Toggle Synaptic Vision (Overlay)"
                >
                    {showParticles ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
                <div className="w-px h-8 bg-white/10 mx-2" />

                <div className="flex items-center gap-1">
                    <button
                        onClick={undo}
                        disabled={history.past.length === 0}
                        className="p-2 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4" />
                    </button>
                    <button
                        onClick={redo}
                        disabled={history.future.length === 0}
                        className="p-2 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <button
                        onClick={handleSaveToLibrary}
                        title="Save to Incubator"
                        className="p-2 rounded-full transition-all text-white/50 hover:text-white"
                    >
                        <Save className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setIsLibraryOpen(true)}
                        title="Open Incubator"
                        className="p-2 rounded-full transition-all text-white/50 hover:text-white"
                    >
                        <FolderOpen className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleExport}
                        title="Export to File"
                        className="p-2 rounded-full transition-all text-white/50 hover:text-white"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>

            </div>
            <DishLibraryModal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
        </>
    );
}
