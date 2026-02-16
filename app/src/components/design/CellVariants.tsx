'use client';

import { motion } from 'framer-motion';
import { HEX_SIZE, hexToPixel } from '@/core/grid/hex';
import React, { useEffect, useState } from 'react';

// Shared Props
interface CellVariantProps {
    color: string;
    isActive?: boolean;
    label?: string;
    icon?: React.ComponentType<any>;
}

const hexPath = () => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = HEX_SIZE * Math.cos(angle);
        const y = HEX_SIZE * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')} Z`;
};

// --- Variant 1: Neon Circuit (Cyberpunk) ---
export function NeonCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                {/* Glow Filter */}
                <defs>
                    <filter id={`neon-glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <pattern id="circuit-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 0 5 L 10 5 M 5 0 L 5 10" stroke={color} strokeWidth="0.5" opacity="0.2" />
                    </pattern>
                </defs>

                {/* Base Hex */}
                <path d={hexPath()} fill="#050505" stroke={color} strokeWidth={isActive ? 3 : 1} filter={`url(#neon-glow-${color})`}
                    className="transition-all duration-300"
                />

                {/* Internal Circuit Lines */}
                <path d={hexPath()} fill="url(#circuit-pattern)" opacity={0.6} />

                {/* Active Core */}
                <motion.circle
                    r={HEX_SIZE * 0.4}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={isActive ? { scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Icon */}
                {Icon && (
                    <foreignObject x={-10} y={-10} width={20} height={20}>
                        <div className="text-white flex items-center justify-center w-full h-full">
                            <Icon size={16} />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-mono text-gray-400">{label || 'NEON'}</div>
        </div>
    );
}


// --- Variant 2: Organic Biomimetic (Soft) ---
export function OrganicCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                <defs>
                    <radialGradient id={`organic-grad-${color}`} x1="30%" y1="30%" x2="70%" y2="70%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                    </radialGradient>
                </defs>

                {/* Membrane (Soft Stroke) */}
                <path d={hexPath()} fill={`url(#organic-grad-${color})`} stroke={color} strokeWidth={0} opacity={0.6} />

                {/* Nucleus / Organelle */}
                <motion.circle
                    r={HEX_SIZE * 0.5}
                    fill={color}
                    opacity={0.4}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Random smaller organelles */}
                <circle cx={HEX_SIZE * 0.3} cy={-HEX_SIZE * 0.2} r={3} fill="white" opacity={0.3} />
                <circle cx={-HEX_SIZE * 0.2} cy={HEX_SIZE * 0.3} r={2} fill="white" opacity={0.2} />

                {/* Icon (Soft) */}
                {Icon && (
                    <foreignObject x={-10} y={-10} width={20} height={20}>
                        <div className="text-white flex items-center justify-center w-full h-full drop-shadow-md">
                            <Icon size={18} />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-sans text-gray-400 font-light tracking-wide">{label || 'ORGANIC'}</div>
        </div>
    );
}

// --- Variant 3: Glassmorphism (Modern UI) ---
export function GlassCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <div style={{ width: HEX_SIZE * 2, height: HEX_SIZE * 1.8 }} className="relative flex items-center justify-center">
                {/* Since SVG filters for blur are expensive, let's try CSS backdrop-filter on a hex-clip-path div */}
                <div
                    className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center"
                    style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        background: `linear-gradient(135deg, ${color}22 0%, ${color}05 100%)`,
                        border: isActive ? `1px solid ${color}88` : '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Inner sheen */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    {/* Icon */}
                    {Icon && <Icon size={20} color={isActive ? color : 'white'} className="opacity-90" />}
                </div>
            </div>
            <div className="absolute -bottom-6 w-full text-center text-xs font-semibold text-gray-500 uppercase">{label || 'GLASS'}</div>
        </div>
    );
}

// --- Variant 4: Crystal Prism (Sharp, Hard Glass) ---
export function CrystalCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                <defs>
                    <linearGradient id={`crystal-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                        <stop offset="50%" stopColor={color} stopOpacity="0.1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="crystal-refract">
                        <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    </filter>
                </defs>

                {/* Back Facet */}
                <path d={hexPath()} fill={color} opacity={0.1} transform="scale(0.9)" />

                {/* Main Body */}
                <path d={hexPath()} fill={`url(#crystal-grad-${color})`} stroke="white" strokeWidth={1.5} strokeOpacity={0.8} />

                {/* Internal Prism Lines */}
                <path d="M 0,-20 L 17,10 L -17,10 Z" fill="none" stroke="white" strokeWidth={0.5} opacity={0.3} />
                <path d="M 0,20 L -17,-10 L 17,-10 Z" fill="none" stroke="white" strokeWidth={0.5} opacity={0.3} />

                {/* Prismatic Hightlight */}
                <path d="M -20,-10 L 0,-20 L 20,-10" fill="none" stroke="white" strokeWidth={2} opacity={isActive ? 0.8 : 0.2} />

                {/* Icon */}
                {Icon && (
                    <foreignObject x={-10} y={-10} width={20} height={20}>
                        <div className="text-white flex items-center justify-center w-full h-full drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                            <Icon size={18} />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-serif italic text-gray-300">{label || 'CRYSTAL'}</div>
        </div>
    );
}

// --- Variant 5: Frosted Orb (Soft, Matte) ---
export function FrostedCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                <defs>
                    <radialGradient id={`frosted-grad-${color}`} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                    </radialGradient>
                    <filter id="blur-edge">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
                    </filter>
                </defs>

                {/* Soft Shadow */}
                <circle r={HEX_SIZE * 0.9} fill={color} opacity={0.3} filter="url(#blur-edge)" transform="translate(0, 4)" />

                {/* Orb Body (Clipped to Hex usually, but let's do a Sphere inside Hex) */}
                {/* Actual Hex Frame */}
                <path d={hexPath()} fill="none" stroke={color} strokeWidth={1} opacity={0.2} />

                {/* Central Orb */}
                <circle
                    r={HEX_SIZE * 0.8}
                    fill={`url(#frosted-grad-${color})`}
                    stroke="white"
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    className="backdrop-blur-sm"
                />

                {/* Active Pulse (Soft) */}
                {isActive && (
                    <circle r={HEX_SIZE * 0.8} fill="none" stroke={color} strokeWidth={2} opacity={0.5}>
                        <animate attributeName="r" values={`${HEX_SIZE * 0.8};${HEX_SIZE * 0.9};${HEX_SIZE * 0.8}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                )}

                {/* Icon */}
                {Icon && (
                    <foreignObject x={-10} y={-10} width={20} height={20}>
                        <div className="text-white flex items-center justify-center w-full h-full opacity-90">
                            <Icon size={18} />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-sans font-light text-gray-400">{label || 'FROST'}</div>
        </div>
    );
}

// --- Variant 6: Holographic (Iridescent) ---
export function HoloCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <div style={{ width: HEX_SIZE * 2, height: HEX_SIZE * 1.8 }} className="relative flex items-center justify-center">
                <div
                    className="absolute inset-0 flex items-center justify-center overflow-hidden"
                    style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    {/* Holo Gradient */}
                    <div
                        className="absolute inset-0 opacity-40 mix-blend-overlay"
                        style={{
                            background: `linear-gradient(45deg, ${color}, cyan, magenta, yellow)`,
                            backgroundSize: '400% 400%',
                            animation: isActive ? 'holo-shift 2s linear infinite' : 'holo-shift 10s ease infinite'
                        }}
                    />

                    {/* Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent h-[200%] w-full animate-scanline pointer-events-none" />

                    {/* Icon */}
                    {Icon && <Icon size={20} className="text-white drop-shadow-lg z-10" />}
                </div>
            </div>
            <style jsx>{`
                @keyframes holo-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes scanline {
                    0% { transform: translateY(-50%); }
                    100% { transform: translateY(0%); }
                }
                .animate-scanline {
                    animation: scanline 3s linear infinite;
                }
            `}</style>
            <div className="absolute -bottom-6 w-full text-center text-xs font-mono font-bold text-white tracking-widest">{label || 'HOLO'}</div>
        </div>
    );
}

// --- Variant 7: Sketch (Blueprint) ---
export function SketchCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                <defs>
                    <filter id="sketch-wiggle">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                    </filter>
                    <marker id="arrow-head" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill="none" stroke={color} strokeWidth="1" />
                    </marker>
                </defs>

                {/* Background Grid (Blueprint) */}
                <path d={hexPath()} fill={color} fillOpacity={0.1} stroke="none" />

                {/* Wobbly Outline */}
                <path d={hexPath()} fill="none" stroke={color} strokeWidth={2} filter="url(#sketch-wiggle)" strokeLinecap="round" strokeDasharray="5,2" />

                {/* Construction Lines */}
                <line x1={-HEX_SIZE} y1={-HEX_SIZE} x2={HEX_SIZE} y2={HEX_SIZE} stroke={color} strokeWidth={0.5} opacity={0.3} strokeDasharray="2,2" />
                <line x1={HEX_SIZE} y1={-HEX_SIZE} x2={-HEX_SIZE} y2={HEX_SIZE} stroke={color} strokeWidth={0.5} opacity={0.3} strokeDasharray="2,2" />

                {/* Measurements */}
                {isActive && (
                    <g opacity={0.7}>
                        <line x1={HEX_SIZE + 5} y1={-HEX_SIZE / 2} x2={HEX_SIZE + 5} y2={HEX_SIZE / 2} stroke={color} strokeWidth={1} markerEnd="url(#arrow-head)" markerStart="url(#arrow-head)" />
                        <text x={HEX_SIZE + 15} y={0} fill={color} fontSize={6} fontFamily="monospace" transform="rotate(90, 50, 0)">40px</text>
                    </g>
                )}

                {/* Icon (Sketchy) */}
                {Icon && (
                    <foreignObject x={-10} y={-10} width={20} height={20}>
                        <div className="text-white flex items-center justify-center w-full h-full">
                            <Icon size={18} strokeWidth={2.5} className="opacity-80" />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-mono text-gray-400 italic" style={{ fontFamily: '"Courier New", Courier, monospace' }}>{label || 'SKETCH'}</div>
        </div>
    );
}

// --- Variant 8: Retro (8-Bit) ---
export function RetroCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <div style={{ width: HEX_SIZE * 2, height: HEX_SIZE * 1.8 }} className="relative flex items-center justify-center">
                {/* Pixel Art Hex Approximation */}
                <div
                    className="absolute inset-0"
                    style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        background: '#111',
                        border: `4px solid ${color}` // Pseudo border (won't work well with clip-path, use inner div)
                    }}
                >
                    {/* Inner Pixel Grid */}
                    <div
                        className="w-full h-full opacity-30"
                        style={{
                            backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
                            backgroundSize: '4px 4px'
                        }}
                    />

                    {/* Active State: Blinking Background */}
                    {isActive && (
                        <div className="absolute inset-0 bg-white mix-blend-overlay animate-pulse opacity-20" />
                    )}
                </div>

                {/* Thick Border (Simulated via SVG to match Hex) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${HEX_SIZE * 2} ${HEX_SIZE * 1.8}`}>
                    <path
                        d={`M ${HEX_SIZE} 2 L ${HEX_SIZE * 2 - 2} ${HEX_SIZE * 0.45 + 2} L ${HEX_SIZE * 2 - 2} ${HEX_SIZE * 1.35 - 2} L ${HEX_SIZE} ${HEX_SIZE * 1.8 - 2} L 2 ${HEX_SIZE * 1.35 - 2} L 2 ${HEX_SIZE * 0.45 + 2} Z`}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        shapeRendering="crispEdges" // Pixelate
                    />
                </svg>

                {/* Icon */}
                {Icon && (
                    <div className="z-10 relative">
                        <Icon size={24} color={isActive ? dataToColor(label || '') : color} className="drop-shadow-md" style={{ shapeRendering: 'crispEdges' }} />
                    </div>
                )}
            </div>
            <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-gray-500 uppercase tracking-widest" style={{ fontFamily: '"Press Start 2P", monospace' }}>{label || 'RETRO'}</div>
        </div>
    );
}

function dataToColor(str: string) {
    // Deterministic color for fun
    return 'white';
}

// --- Variant 9: Rune (Mystic) ---
export function RuneCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                <defs>
                    <filter id="stone-texture">
                        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" in="noise" result="coloredNoise" />
                        <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
                    </filter>
                    <filter id={`runic-glow-${color}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Stone Base */}
                <path d={hexPath()} fill="#292524" stroke="none" />
                <path d={hexPath()} fill="black" stroke="none" filter="url(#stone-texture)" opacity={0.5} />

                {/* Outer Engraving */}
                <path d={hexPath()} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />

                {/* Runic Circle */}
                <circle r={HEX_SIZE * 0.7} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2,4" opacity={0.6} >
                    {isActive && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite" />}
                </circle>

                {/* Inner Glyph (Icon) */}
                {Icon && (
                    <g filter={`url(#runic-glow-${color})`}>
                        <foreignObject x={-12} y={-12} width={24} height={24}>
                            <div className="text-white flex items-center justify-center w-full h-full">
                                <Icon size={20} color={color} strokeWidth={2} />
                            </div>
                        </foreignObject>
                    </g>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs text-amber-100 font-serif tracking-widest opacity-70">{label || 'RUNE'}</div>
        </div>
    );
}

// --- Variant 10: Mech (Industrial) ---
export function MechCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                <defs>
                    <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#555" />
                        <stop offset="50%" stopColor="#ddd" />
                        <stop offset="100%" stopColor="#555" />
                    </linearGradient>
                    <pattern id="grill" width="4" height="4" patternUnits="userSpaceOnUse">
                        <rect width="4" height="4" fill="#222" />
                        <circle cx="2" cy="2" r="1" fill="#444" />
                    </pattern>
                </defs>

                {/* Main Chassis */}
                <path d={hexPath()} fill="url(#metal-grad)" stroke="#333" strokeWidth={2} />

                {/* Inner Grill */}
                <path d={hexPath()} fill="url(#grill)" transform="scale(0.8)" opacity={0.8} />

                {/* Rotating Gear Ring */}
                <g opacity={0.6}>
                    <circle r={HEX_SIZE * 0.6} fill="none" stroke={color} strokeWidth={4} strokeDasharray="8,4">
                        {isActive && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite" />}
                    </circle>
                </g>

                {/* Bolts */}
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <circle key={i} r={2} fill="#111" transform={`rotate(${deg}) translate(${HEX_SIZE - 4}, 0)`} />
                ))}

                {/* Icon (LED Display) */}
                {Icon && (
                    <g>
                        <rect x={-10} y={-10} width={20} height={20} rx={4} fill="#000" />
                        <foreignObject x={-8} y={-8} width={16} height={16}>
                            <div className="text-white flex items-center justify-center w-full h-full">
                                <Icon size={14} color={isActive ? color : '#333'} />
                            </div>
                        </foreignObject>
                    </g>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>{label || 'MECH'}</div>
        </div>
    );
}

// --- Variant 11: DataStream (Matrix) ---
export function DataStreamCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    const [matrix, setMatrix] = useState<{ char: string, opacity: number }[][]>([]);

    useEffect(() => {
        // Initial hydration
        setMatrix(generateMatrix());
    }, []);

    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setMatrix(generateMatrix());
        }, 100);
        return () => clearInterval(interval);
    }, [isActive]);

    const generateMatrix = () => {
        return [0, 1, 2].map(() =>
            Array.from({ length: 8 }).map(() => ({
                char: Math.random() > 0.5 ? '1' : '0',
                opacity: Math.random()
            }))
        );
    };

    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <div style={{ width: HEX_SIZE * 2, height: HEX_SIZE * 1.8 }} className="relative flex items-center justify-center">
                {/* Mask Container */}
                <div
                    className="absolute inset-0 bg-black border border-green-900/50"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                    {/* Falling Text */}
                    <div className="flex justify-around w-full h-full opacity-50 pt-2">
                        {matrix.length > 0 ? matrix.map((col, i) => (
                            <div key={i} className="text-[8px] font-mono leading-none text-green-500/60 flex flex-col items-center">
                                {col.map((cell, j) => (
                                    <span key={j} style={{ opacity: cell.opacity }}>{cell.char}</span>
                                ))}
                            </div>
                        )) : (
                            // SSR / Initial Fallback (Deterministic)
                            [0, 1, 2].map(i => (
                                <div key={i} className="text-[8px] font-mono leading-none text-green-500/60 flex flex-col items-center">
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <span key={j} style={{ opacity: 0.5 }}>0</span>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Active Overlay */}
                    {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent animate-pulse" />
                    )}

                    {/* Icon */}
                    {Icon && <Icon size={20} color={color} className="absolute z-10 drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]" />}
                </div>
            </div>
            <div className="absolute -bottom-6 w-full text-center text-xs font-mono text-green-500 tracking-tighter">{label || 'DATA'}</div>
        </div>
    );
}

// --- Variant 12: Waveform (Audio) ---
export function WaveformCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                {/* Dark Base */}
                <path d={hexPath()} fill="#1e1b4b" stroke={color} strokeWidth={1} />

                {/* Waveform Lines */}
                <g transform="translate(0, 5)">
                    {[-15, -5, 5, 15].map((x, i) => (
                        <rect
                            key={i}
                            x={x}
                            y={-10}
                            width={4}
                            height={20}
                            fill={color}
                            className="origin-center"
                            opacity={0.8}
                        >
                            {isActive && (
                                <animateTransform
                                    attributeName="transform"
                                    type="scale"
                                    values="1 1; 1 0.2; 1 1"
                                    dur={`${0.5 + i * 0.1}s`}
                                    repeatCount="indefinite"
                                    additive="sum"
                                />
                            )}
                        </rect>
                    ))}
                </g>

                {/* Icon */}
                {Icon && (
                    <foreignObject x={-10} y={-25} width={20} height={20}>
                        <div className="text-white flex items-center justify-center w-full h-full">
                            <Icon size={14} color="white" />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-sans text-indigo-400">{label || 'WAVE'}</div>
        </div>
    );
}

// --- Variant 13: Radar (Scanner) ---
export function RadarCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <div style={{ width: HEX_SIZE * 2, height: HEX_SIZE * 1.8 }} className="relative flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-green-950"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 border border-green-500/30 rounded-full scale-50" />
                    <div className="absolute inset-0 border border-green-500/30 rounded-full scale-75" />
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-green-500/30" />
                    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-green-500/30" />

                    {/* Sweep */}
                    {isActive && (
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: `conic-gradient(from 0deg, transparent 0deg, ${color} 60deg, transparent 60deg)`,
                                animation: 'radar-spin 2s linear infinite',
                                opacity: 0.5
                            }}
                        />
                    )}

                    {/* Blip */}
                    <div className={`absolute top-[30%] left-[60%] w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_red] ${isActive ? 'animate-ping' : 'opacity-0'}`} />

                    {/* Icon */}
                    {Icon && <Icon size={20} className="absolute z-10 text-green-100 opacity-80" />}
                </div>
            </div>
            <style jsx>{`
                @keyframes radar-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div className="absolute -bottom-6 w-full text-center text-xs font-mono text-green-400">{label || 'RADAR'}</div>
        </div>
    );
}

// --- Variant 14: Terminal (CLI) ---
export function TerminalCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <div style={{ width: HEX_SIZE * 2, height: HEX_SIZE * 1.8 }} className="relative flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-gray-900 border-2 border-gray-600"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                    <div className="p-3 pt-6 text-[8px] font-mono text-gray-300 leading-tight">
                        <span className="text-blue-400">root@vibe</span>:<span>~#</span><br />
                        <span>exec {label?.toLowerCase() || 'cmd'}</span><br />
                        <span className="text-green-400">{isActive ? 'Running...' : 'Ready'}</span>
                        <span className="animate-pulse inline-block w-1.5 h-2 bg-gray-300 ml-1 align-middle"></span>
                    </div>
                </div>
                {/* Icon Badge */}
                {Icon && (
                    <div className="absolute top-2 right-8 bg-gray-700 p-0.5 rounded text-white">
                        <Icon size={12} />
                    </div>
                )}
            </div>
            <div className="absolute -bottom-6 w-full text-center text-xs font-mono bg-gray-800 text-white px-1 rounded">{label || 'bash'}</div>
        </div>
    );
}

// --- Variant 15: Brutalist (Stark) ---
export function BrutalistCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                {/* Hard Shadow */}
                <path d={hexPath()} fill="black" transform="translate(6, 6)" />

                {/* Main Body */}
                <path d={hexPath()} fill={isActive ? color : '#e5e5e5'} stroke="black" strokeWidth={3} />

                {/* Icon */}
                {Icon && (
                    <foreignObject x={-15} y={-15} width={30} height={30}>
                        <div className="flex items-center justify-center w-full h-full">
                            <Icon size={24} color="black" strokeWidth={3} />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-sm font-black text-black bg-white border-2 border-black inline-block px-1 transform -rotate-2 shadow-[2px_2px_0_black]">{label || 'RAW'}</div>
        </div>
    );
}

// --- Variant 16: Liquid (Metaball) ---
export function LiquidCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>

                {/* Container */}
                <path d={hexPath()} fill="#0f172a" stroke="none" />

                {/* Blobs */}
                <g filter="url(#goo)">
                    <circle r={15} fill={color} opacity={0.8} />
                    <circle r={10} fill={color} opacity={0.8}>
                        <animateTransform attributeName="transform" type="translate" values="10 0; -5 10; 10 0" dur="4s" repeatCount="indefinite" />
                    </circle>
                    {isActive && (
                        <circle r={8} fill={color} opacity={0.8}>
                            <animateTransform attributeName="transform" type="translate" values="-10 -5; 5 -10; -10 -5" dur="1s" repeatCount="indefinite" />
                        </circle>
                    )}
                </g>

                {/* Icon */}
                {Icon && (
                    <foreignObject x={-10} y={-10} width={20} height={20}>
                        <div className="text-white flex items-center justify-center w-full h-full drop-shadow-md">
                            <Icon size={18} />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-sans italic text-blue-300">{label || 'FLUID'}</div>
        </div>
    );
}

// --- Variant 17: Emitter (Radio) ---
export function EmitterCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <svg width={HEX_SIZE * 2.2} height={HEX_SIZE * 2.2} viewBox={`-${HEX_SIZE * 1.1} -${HEX_SIZE * 1.1} ${HEX_SIZE * 2.2} ${HEX_SIZE * 2.2}`} className="overflow-visible">
                {/* Core */}
                <circle r={10} fill={color} />

                {/* Waves */}
                {isActive && [0, 1, 2].map(i => (
                    <circle key={i} r={10} fill="none" stroke={color} strokeWidth={2}>
                        <animate attributeName="r" from="10" to="35" dur="1.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                    </circle>
                ))}

                {/* Icon */}
                {Icon && (
                    <foreignObject x={-8} y={-8} width={16} height={16}>
                        <div className="text-white flex items-center justify-center w-full h-full">
                            <Icon size={12} />
                        </div>
                    </foreignObject>
                )}
            </svg>
            <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-gray-500">{label || 'SIGNAL'}</div>
        </div>
    );
}

// --- Variant 18: Glitch (Distortion) ---
export function GlitchCell({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return (
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
            <div style={{ width: HEX_SIZE * 2, height: HEX_SIZE * 1.8 }} className="relative flex items-center justify-center">
                {/* Main Glitch Body */}
                <div
                    className={`absolute inset-0 bg-purple-900 border border-purple-500 ${isActive ? 'animate-glitch' : ''}`}
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                    {/* RGB Split Layers (Fake) */}
                    {isActive && (
                        <>
                            <div className="absolute inset-0 bg-red-500 mix-blend-screen opacity-50 translate-x-[2px]" style={{ clipPath: 'inherit' }} />
                            <div className="absolute inset-0 bg-blue-500 mix-blend-screen opacity-50 translate-x-[-2px]" style={{ clipPath: 'inherit' }} />
                        </>
                    )}

                    {/* Noise Texture */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] filter contrast-150" />

                    {/* Icon */}
                    {Icon && <Icon size={20} className="relative z-10 text-white" />}
                </div>
            </div>
            <style jsx>{`
                @keyframes glitch-anim {
                    0% { transform: translate(0) }
                    20% { transform: translate(-2px, 2px) }
                    40% { transform: translate(-2px, -2px) }
                    60% { transform: translate(2px, 2px) }
                    80% { transform: translate(2px, -2px) }
                    100% { transform: translate(0) }
                }
                .animate-glitch {
                    animation: glitch-anim 0.3s steps(2, end) infinite;
                }
            `}</style>
            <div className="absolute -bottom-6 w-full text-center text-xs font-mono text-purple-400 line-through decoration-red-500">{label || 'ERR'}</div>
        </div>
    );
}
// --- Variant 19: Advanced Glass (Sleek / Aero) ---
// Base component for the sophisticated glass look
// --- Geometry Constants ---
const SQRT3 = 1.73205;
const HEX_WIDTH = HEX_SIZE * SQRT3;
const HEX_HEIGHT = HEX_SIZE * 2;

// --- Variant 19: Advanced Glass (Sleek / Aero) ---
// Base component for the sophisticated glass look
function AdvancedGlassBase({
    color,
    isActive: initialActive,
    label,
    icon: Icon,
    mode = 'standard'
}: CellVariantProps & { mode?: 'standard' | 'active' | 'warning' | 'dormant' }) {

    // Internal state for individual interaction
    const [isActive, setIsActive] = useState(initialActive);

    // Sync with parent prop
    useEffect(() => {
        setIsActive(initialActive);
    }, [initialActive]);

    // Mode-specific styles
    const styles = {
        standard: {
            bg: 'rgba(255, 255, 255, 0.03)',
            iconColor: 'text-white/90'
        },
        active: {
            bg: `${color}15`, // Hex transparency ~10%
            iconColor: 'text-white'
        },
        warning: {
            bg: '#f59e0b15',
            iconColor: 'text-amber-200'
        },
        dormant: {
            bg: 'rgba(0, 0, 0, 0.6)',
            iconColor: 'text-white/20'
        }
    };

    const currentStyle = styles[mode];
    // Dynamic border color: Use the cell's color instead of white for the "Crystal" look
    const baseBorderColor = mode === 'dormant' ? 'rgba(255,255,255,0.1)' : color;

    // Pointy-Topped Hexagon Path
    const cx = HEX_WIDTH / 2;
    const cy = HEX_HEIGHT / 2;
    // Vertices: Top, TopRight, BtmRight, Btm, BtmLeft, TopLeft
    const pathD = `
        M ${cx} 1 
        L ${HEX_WIDTH - 1} ${HEX_HEIGHT * 0.25 + 0.5} 
        L ${HEX_WIDTH - 1} ${HEX_HEIGHT * 0.75 - 0.5} 
        L ${cx} ${HEX_HEIGHT - 1} 
        L 1 ${HEX_HEIGHT * 0.75 - 0.5} 
        L 1 ${HEX_HEIGHT * 0.25 + 0.5} 
        Z
    `;

    return (
        <div
            onClick={() => setIsActive(!isActive)}
            className="relative group cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 active:brightness-90 select-none"
        >
            <div style={{ width: HEX_WIDTH, height: HEX_HEIGHT }} className="relative flex items-center justify-center">

                {/* 1. Refraction Layer (The "Glass" Body) */}
                <div
                    className={`absolute inset-0 backdrop-blur-md backdrop-saturate-150 ${mode !== 'dormant' ? 'shadow-xl' : ''} transition-all duration-300`}
                    style={{
                        backgroundColor: currentStyle.bg,
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        boxShadow: isActive ? `0 0 30px ${color}50` : 'none',
                        // Fresnel Mask with slightly softer center
                        maskImage: 'radial-gradient(circle at center, black 30%, rgba(0,0,0,0.85) 100%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 30%, rgba(0,0,0,0.85) 100%)'
                    }}
                >
                    {/* Dichroic / Iridescent Overlay (The "Crystal" effect) */}
                    <div
                        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none transition-opacity duration-500 group-hover:opacity-60"
                        style={{
                            background: `linear-gradient(135deg, transparent 0%, ${color}40 50%, transparent 100%)`
                        }}
                    />

                    {/* Noise Texture */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    {/* Sheen Animation on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-sheen pointer-events-none" />
                </div>

                {/* 2. Border Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`0 0 ${HEX_WIDTH} ${HEX_HEIGHT}`}>
                    {/* Outer Border - Colored Glass Edge */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke={baseBorderColor}
                        strokeWidth="1.5"
                        strokeOpacity={mode === 'active' ? 0.8 : 0.4}
                        className="transition-all duration-300 group-hover:stroke-opacity-80"
                        style={{ filter: isActive ? `drop-shadow(0 0 4px ${color})` : 'none' }}
                    />

                    {/* Inner Bevel - Subtle Refraction Line */}
                    <path
                        d={`M ${cx} 4 L ${HEX_WIDTH - 4} ${HEX_HEIGHT * 0.25 + 2} L ${HEX_WIDTH - 4} ${HEX_HEIGHT * 0.75 - 2} L ${cx} ${HEX_HEIGHT - 4} L 4 ${HEX_HEIGHT * 0.75 - 2} L 4 ${HEX_HEIGHT * 0.25 + 2} Z`}
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        strokeOpacity="0.2"
                    />

                    {/* Active Pulse Ring */}
                    {isActive && (
                        <path
                            d={pathD}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeOpacity="0.6"
                        >
                            <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="stroke-width" values="1;5;1" dur="2s" repeatCount="indefinite" />
                        </path>
                    )}
                </svg>

                {/* 3. Highlight / Sheen (Top-Left) - Softened */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none opacity-50 mix-blend-overlay"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 50% 50%, 0% 25%)' }}
                />

                {/* 4. Active Core Glow - Deep & Rich */}
                {isActive && (
                    <div
                        className="absolute inset-0 rounded-full blur-2xl opacity-60 mix-blend-screen"
                        style={{ background: `radial-gradient(circle, ${color}, transparent 65%)` }}
                    />
                )}

                {/* 5. Icon - Sharp & Contrast */}
                {Icon && (
                    <div className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'scale-100 opacity-90'}`}>
                        <Icon size={22} color={mode === 'active' ? 'white' : color} strokeWidth={1.5} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes sheen {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .group:hover .group-hover\:animate-sheen {
                    animation: sheen 0.8s ease-in-out;
                }
             `}</style>
            <div className="absolute -bottom-8 w-full text-center group-hover:translate-y-1 transition-transform">
                <span
                    className={`text-[10px] tracking-widest uppercase font-sans ${isActive ? 'text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-400'}`}
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                    {label || 'GLASS'}
                </span>
            </div>
        </div>
    );
}

export function GlassStandard({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <AdvancedGlassBase color={color} isActive={isActive} label={label} icon={Icon} mode="standard" />;
}

export function GlassActive({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <AdvancedGlassBase color={color} isActive={true} label={label} icon={Icon} mode="active" />;
}

export function GlassWarning({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <AdvancedGlassBase color={color} isActive={isActive} label={label} icon={Icon} mode="warning" />;
}

export function GlassDormant({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <AdvancedGlassBase color={color} isActive={false} label={label} icon={Icon} mode="dormant" />;
}

// --- Variant 20: Lab Glass (Sterile / Clinical) ---
// Base component for the clean, medical look
function LabGlassBase({
    color,
    isActive: initialActive,
    label,
    icon: Icon,
    mode = 'standard'
}: CellVariantProps & { mode?: 'standard' | 'active' | 'warning' | 'dormant' }) {

    const [isActive, setIsActive] = useState(initialActive);

    useEffect(() => {
        setIsActive(initialActive);
    }, [initialActive]);

    const styles = {
        standard: {
            bg: `${color}15`, // Light tint even in standard
            iconColor: 'text-white'
        },
        active: {
            bg: `${color}45`, // Stronger color (45% opacity) for "Colored Glass" look
            iconColor: 'text-white'
        },
        warning: {
            bg: '#f59e0b45',
            iconColor: 'text-white'
        },
        dormant: {
            bg: 'rgba(255, 255, 255, 0.05)',
            iconColor: 'text-white/40'
        }
    };

    const currentStyle = styles[mode];
    // Always specific sterlie colors
    const baseBorderColor = mode === 'active' ? color : 'rgba(255,255,255,0.8)';
    const glowColor = mode === 'active' ? color : 'rgba(255, 255, 255, 0.4)';

    // Geometry
    const cx = HEX_WIDTH / 2;
    const cy = HEX_HEIGHT / 2;
    const pathD = `
        M ${cx} 1 
        L ${HEX_WIDTH - 1} ${HEX_HEIGHT * 0.25 + 0.5} 
        L ${HEX_WIDTH - 1} ${HEX_HEIGHT * 0.75 - 0.5} 
        L ${cx} ${HEX_HEIGHT - 1} 
        L 1 ${HEX_HEIGHT * 0.75 - 0.5} 
        L 1 ${HEX_HEIGHT * 0.25 + 0.5} 
        Z
    `;

    return (
        <div
            onClick={() => setIsActive(!isActive)}
            className="relative group cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 select-none"
        >
            <div style={{ width: HEX_WIDTH, height: HEX_HEIGHT }} className="relative flex items-center justify-center">

                {/* 1. Body - Clean & Bright */}
                <div
                    className={`absolute inset-0 backdrop-blur-sm ${mode !== 'dormant' ? 'shadow-lg' : ''} transition-all duration-300`}
                    style={{
                        backgroundColor: currentStyle.bg,
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        boxShadow: isActive ? `0 0 30px ${glowColor}` : 'none',
                    }}
                >
                    {/* No Noise, No Iridescence - just pure gradient to white */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>

                {/* 2. Border - Crisp & Technical */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`0 0 ${HEX_WIDTH} ${HEX_HEIGHT}`}>
                    {/* Main Border */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke={baseBorderColor}
                        strokeWidth="1.5"
                        strokeOpacity={mode === 'active' ? 1 : 0.6}
                        className="transition-all duration-300"
                    />

                    {/* Tech Markers (Corners) */}
                    <path
                        d={`M ${cx} 1 L ${cx + 5} 1 M ${cx} ${HEX_HEIGHT - 1} L ${cx - 5} ${HEX_HEIGHT - 1}`}
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeOpacity="0.8"
                    />
                </svg>

                {/* 3. Highlight - Sharp & Glossy */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 50% 50%, 0% 25%)', opacity: 0.7 }}
                />

                {/* 4. Icon - High Contrast */}
                {Icon && (
                    <div className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                        <Icon size={22} color={mode === 'active' ? 'white' : 'white'} strokeWidth={2} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} />
                    </div>
                )}
            </div>

            {/* Label - Monospace / Technical */}
            <div className="absolute -bottom-8 w-full text-center group-hover:translate-y-1 transition-transform">
                <span className={`text-[9px] tracking-[0.2em] font-mono ${isActive ? 'text-white font-bold' : 'text-gray-300'}`}>
                    {label || 'LAB-01'}
                </span>
            </div>
        </div>
    );
}

export function LabStandard({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <LabGlassBase color={color} isActive={isActive} label={label} icon={Icon} mode="standard" />;
}

export function LabActive({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <LabGlassBase color={color} isActive={true} label={label} icon={Icon} mode="active" />;
}

export function LabWarning({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <LabGlassBase color={color} isActive={isActive} label={label} icon={Icon} mode="warning" />;
}

export function LabDormant({ color, isActive, label, icon: Icon }: CellVariantProps) {
    return <LabGlassBase color={color} isActive={false} label={label} icon={Icon} mode="dormant" />;
}
