'use client';

import { motion } from 'framer-motion';
import { HEX_SIZE, hexToPixel } from '@/core/grid/hex';

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
