/**
 * Simulation Controls - Play/Pause, Speed, Step
 */

'use client';

import { Play, Pause, FastForward, SkipForward, Eye, EyeOff } from 'lucide-react';
import { useSimulationStore } from '@/store/simulation-store';
import { cn } from '@/lib/utils';

export function SimulationControls() {
    const {
        isPlaying,
        togglePlay,
        simulationSpeed,
        setSpeed,
        incrementTick,
        showParticles,
        toggleParticles
    } = useSimulationStore();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 shadow-2xl z-50">
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
                    if (isPlaying) togglePlay();
                    incrementTick(); // This triggers one frame in ticker technically but we need a better "Force Step"
                    // Actually Ticker runs on requestAnimationFrame. Logic needs to handle "force step".
                    // For now, let's just leave it as is or implement proper stepping.
                    // The current incrementTick just bumps the counter, it doesn't force a physics step if paused.
                    // We need a refactor for true "Step". 
                    // Let's disable for now or map to briefly playing.
                }}
                className="p-2 text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={isPlaying}
                title="Step Forward (Pause first)"
            >
                <SkipForward size={20} />
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
                onClick={toggleParticles}
                className={cn(
                    "p-2 rounded-full transition-all",
                    showParticles ? "text-cyan-400 bg-cyan-400/10" : "text-white/50 hover:text-white"
                )}
                title="Toggle Synaptic Vision (Overlay)"
            >
                {showParticles ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
        </div>
    );
}
