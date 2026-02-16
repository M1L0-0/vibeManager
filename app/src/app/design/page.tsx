'use client';

import { useState } from 'react';
import {
    NeonCell, OrganicCell, GlassCell,
    CrystalCell, FrostedCell, HoloCell,
    SketchCell, RetroCell, RuneCell, MechCell,
    DataStreamCell, WaveformCell, RadarCell, TerminalCell,
    BrutalistCell, LiquidCell, EmitterCell, GlitchCell,
    GlassStandard, GlassActive, GlassWarning, GlassDormant,
    LabStandard, LabActive, LabWarning, LabDormant
} from '@/components/design/CellVariants';
import { NebulaBackground } from '@/components/stage/NebulaBackground';
import { Network, Zap, Cpu, Activity, Box, Database, Sparkles, Hexagon, Layers, PenTool, Hash, Gem, Cog, Terminal, Radio, AlertTriangle, CloudRain, BarChart, Shield, Lock, Power } from 'lucide-react';

export default function DesignPage() {
    const [active, setActive] = useState(false);

    // Mock props for Nebula
    const HEX_SIZE = 40;
    const PATTERN_W = Math.sqrt(3) * HEX_SIZE;
    const PATTERN_H = 3 * HEX_SIZE;

    return (
        <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
            {/* Background Layer */}
            <NebulaBackground
                pan={{ x: 0, y: 0 }}
                zoom={1}
                PATTERN_W={PATTERN_W}
                PATTERN_H={PATTERN_H}
                HEX_SIZE={HEX_SIZE}
                patternId="design-nebula"
            />

            {/* Content Layer */}
            <div className="relative z-10 p-8 h-screen overflow-y-auto">
                <header className="mb-12 border-b border-white/10 pb-4 flex justify-between items-center backdrop-blur-sm bg-black/30 p-6 rounded-2xl">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Cell Design Laboratory</h1>
                        <p className="text-gray-400 mt-2">Experimental visual concepts for VibeManager cells.</p>
                    </div>
                    <button
                        onClick={() => setActive(!active)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${active ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-gray-800 text-white border border-gray-700'}`}
                    >
                        {active ? 'Simulating Activity...' : 'Click to Activate'}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-12 max-w-7xl mx-auto pb-40">

                    {/* Section 8: Sophisticated Glass (New) */}
                    <section className="flex flex-col gap-8 items-center bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl col-span-1 md:col-span-2 ring-1 ring-white/20">
                        <h2 className="text-xl font-light tracking-[0.3em] uppercase text-white mb-4 flex items-center gap-4">
                            <span className="h-[1px] w-12 bg-white/30"></span>
                            Aero Glass OS
                            <span className="h-[1px] w-12 bg-white/30"></span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
                            <GlassStandard color="#38bdf8" label="Idle" icon={Box} isActive={active} />
                            <GlassActive color="#10b981" label="Processing" icon={Cpu} isActive={active} />
                            <GlassWarning color="#f59e0b" label="Blocked" icon={Lock} isActive={active} />
                            <GlassDormant color="#64748b" label="Sleep" icon={Power} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-400 mt-8 text-center max-w-lg font-light">
                            Ultra-premium aesthetic using high-performance backdrop filters. Optimized for clarity and depth.
                            Shows distinct states (Active, Warning, Dormant) while maintaining visual unity.
                        </p>
                    </section>

                    {/* Section 9: Lab Glass (Sterile) - Comparison */}
                    <section className="flex flex-col gap-8 items-center bg-white/10 p-8 rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl col-span-1 md:col-span-2 ring-1 ring-white/40">
                        <h2 className="text-xl font-bold tracking-widest uppercase text-white mb-4 flex items-center gap-4">
                            <Activity size={20} className="text-cyan-300" />
                            STERILE LAB OS
                            <Activity size={20} className="text-cyan-300" />
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
                            <LabStandard color="#22d3ee" label="Culture" icon={Database} isActive={active} />
                            <LabActive color="#34d399" label="Analysis" icon={Activity} isActive={active} />
                            <LabWarning color="#fbbf24" label="Hazard" icon={AlertTriangle} isActive={active} />
                            <LabDormant color="#94a3b8" label="Empty" icon={Box} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-300 mt-8 text-center max-w-lg font-mono">
                            Clinical precision. High-opacity white glass, crisp borders, and zero noise.
                            Designed for high-visibility medical or laboratory interfaces.
                        </p>
                    </section>

                    {/* Section 1: Neon / Cyberpunk */}
                    <section className="flex flex-col gap-8 items-center bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors">
                        <h2 className="text-xl font-mono text-cyan-400 mb-4 flex items-center gap-2"><Cpu size={20} /> &lt;NEON_PROTOCOL&gt;</h2>
                        <div className="grid grid-cols-2 gap-12">
                            <NeonCell color="#06b6d4" label="Cyan-Net" icon={Network} isActive={active} />
                            <NeonCell color="#f472b6" label="Pink-Pulse" icon={Activity} isActive={active} />
                            <NeonCell color="#a855f7" label="Purp-Core" icon={Cpu} isActive={active} />
                            <NeonCell color="#eab308" label="Gold-Data" icon={Database} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-500 mt-8 text-center max-w-xs">
                            High-contrast, tech-focused design. Emphasizes connectivity and data flow.
                        </p>
                    </section>

                    {/* Section 2: Organic / Biomimetic */}
                    <section className="flex flex-col gap-8 items-center bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors">
                        <h2 className="text-xl font-serif text-emerald-400 mb-4 italic flex items-center gap-2"><Sparkles size={20} /> Biomimetic Flow</h2>
                        <div className="grid grid-cols-2 gap-12">
                            <OrganicCell color="#10b981" label="Emerald-Life" icon={Zap} isActive={active} />
                            <OrganicCell color="#f43f5e" label="Rose-Cell" icon={Activity} isActive={active} />
                            <OrganicCell color="#8b5cf6" label="Violet-Bio" icon={Network} isActive={active} />
                            <OrganicCell color="#3b82f6" label="Blue-Aqua" icon={Box} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-500 mt-8 text-center max-w-xs">
                            Soft, natural gradients. Feels alive and breathing. Use of internal organelles.
                        </p>
                    </section>

                    {/* Section 3: Minimal Glass */}
                    <section className="flex flex-col gap-8 items-center bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors">
                        <h2 className="text-xl font-sans text-white mb-4 tracking-widest uppercase text-xs flex items-center gap-2"><Layers size={20} /> Glass UI 1.0</h2>
                        <div className="grid grid-cols-2 gap-12">
                            <GlassCell color="#ffffff" label="Frost-White" icon={Box} isActive={active} />
                            <GlassCell color="#6366f1" label="Indigo-Glass" icon={Database} isActive={active} />
                            <GlassCell color="#ec4899" label="Pink-Shard" icon={Zap} isActive={active} />
                            <GlassCell color="#14b8a6" label="Teal-Pane" icon={Cpu} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-500 mt-8 text-center max-w-xs">
                            Clean, modern, depth-based design. Subtle frosted shapes.
                        </p>
                    </section>

                    {/* Section 4: Advanced Glass */}
                    <section className="flex flex-col gap-8 items-center bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors ring-1 ring-white/10 shadow-2xl shadow-purple-900/10">
                        <h2 className="text-xl font-sans text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-4 font-bold flex items-center gap-2"><Hexagon size={20} /> Glassworks 2.0</h2>
                        <div className="grid grid-cols-2 gap-12">
                            <CrystalCell color="#38bdf8" label="Sky-Prism" icon={Zap} isActive={active} />
                            <FrostedCell color="#fbbf24" label="Amber-Orb" icon={Activity} isActive={active} />
                            <HoloCell color="#e879f9" label="Holo-Flux" icon={Sparkles} isActive={active} />
                            <CrystalCell color="#ef4444" label="Ruby-Shard" icon={Cpu} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-400 mt-8 text-center max-w-xs">
                            Experimental refractive and iridescent materials. High-end visual fidelity.
                        </p>
                    </section>

                    {/* Section 5: Experimental / Stylized */}
                    <section className="flex flex-col gap-8 items-center bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors col-span-1 md:col-span-2 ring-1 ring-amber-500/30">
                        <h2 className="text-xl font-mono text-amber-500 mb-4 font-bold flex items-center gap-2 tracking-tighter"><PenTool size={20} /> EXPERIMENTAL_LAB</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                            <SketchCell color="#fff" label="Blueprint" icon={PenTool} isActive={active} />
                            <RetroCell color="#22c55e" label="8-Bit" icon={Hash} isActive={active} />
                            <RuneCell color="#a855f7" label="Arcane" icon={Gem} isActive={active} />
                            <MechCell color="#f97316" label="Factory" icon={Cog} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-400 mt-8 text-center max-w-md">
                            Radical stylistic departures. Hand-drawn, Voxel, Mystical, and Industrial themes.
                        </p>
                    </section>

                    {/* Section 6: Data Systems (New) */}
                    <section className="flex flex-col gap-8 items-center bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors">
                        <h2 className="text-xl font-mono text-green-500 mb-4 font-bold flex items-center gap-2"><Terminal size={20} /> ::DATA_SYS::</h2>
                        <div className="grid grid-cols-2 gap-12">
                            <DataStreamCell color="#22c55e" label="Matrix" icon={Database} isActive={active} />
                            <WaveformCell color="#6366f1" label="Signal" icon={BarChart} isActive={active} />
                            <RadarCell color="#10b981" label="Scan" icon={Radio} isActive={active} />
                            <TerminalCell color="#cbd5e1" label="Bash" icon={Terminal} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-500 mt-8 text-center max-w-xs">
                            UI-focused designs. CLI terminals, radar sweeps, and data waterfalls.
                        </p>
                    </section>

                    {/* Section 7: Abstract / Modern Art (New) */}
                    <section className="flex flex-col gap-8 items-center bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors">
                        <h2 className="text-xl font-sans text-red-500 mb-4 font-black uppercase flex items-center gap-2"><AlertTriangle size={20} /> Abstract_X</h2>
                        <div className="grid grid-cols-2 gap-12">
                            <BrutalistCell color="#f43f5e" label="Brutal" icon={Box} isActive={active} />
                            <LiquidCell color="#3b82f6" label="Flux" icon={CloudRain} isActive={active} />
                            <EmitterCell color="#eab308" label="Pulse" icon={Radio} isActive={active} />
                            <GlitchCell color="#a855f7" label="Error" icon={AlertTriangle} isActive={active} />
                        </div>
                        <p className="text-xs text-gray-500 mt-8 text-center max-w-xs">
                            High-concept art styles. Brutalist aesthetics, metaball fluids, and glitch effects.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    )
}
