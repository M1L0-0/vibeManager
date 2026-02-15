/**
 * HexCell Component - Renders a single hexagonal cell
 */

'use client';

import { memo } from 'react';
import { Cell, PamDNA } from '@/lib/vibe-core';
import { hexToPixel, HEX_SIZE } from '@/core/grid/hex';
import { getPamModule } from '@/pams/registry';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface HexCellProps {
    cell: Cell;
    onClick: (cell: Cell) => void;
    onRightClick?: (cell: Cell) => void;
    onMouseDown?: (cell: Cell) => void;
    onMouseUp?: (cell: Cell) => void;
    connectedSides?: boolean[]; // Array of 6 booleans, true if connected to group neighbor
    isSelected?: boolean;
    showDebugOverlay?: boolean;
}

// Memoized HexCell to prevent unnecessary re-renders of the entire grid
export const HexCell = memo(function HexCell({
    cell,
    onClick,
    onRightClick,
    onMouseDown,
    onMouseUp,
    connectedSides = [false, false, false, false, false, false],
    isSelected = false,
    showDebugOverlay = false
}: HexCellProps) {
    const position = hexToPixel(cell.coord);
    // Removed legacy local activity decay effect. Activity is now driven by store updates.

    // Generate hexagon path (pointy-top orientation)
    const hexPath = () => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6; // Rotate by -30° for pointy-top
            const x = HEX_SIZE * Math.cos(angle);
            const y = HEX_SIZE * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        return `M ${points.join(' L ')} Z`;
    };

    return (
        <motion.g
            transform={`translate(${position.x}, ${position.y})`}
            onClick={(e) => {
                e.stopPropagation();
                onClick(cell);
            }}
            onMouseDown={(e) => {
                // e.stopPropagation(); // Allow bubbling so Viewport can start selection drag
                onMouseDown?.(cell);
            }}
            onMouseUp={(e) => {
                // e.stopPropagation(); // Allow bubbling so Viewport can end selection
                onMouseUp?.(cell);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRightClick?.(cell);
            }}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            data-cell-id={cell.id}
        >
            {/* Selection Highlight */}
            {isSelected && (
                <motion.path
                    d={hexPath()}
                    fill="none"
                    stroke="#00ffff"
                    strokeWidth={4}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                />
            )}

            {/* Cell body */}
            {/* Cell body - background only */}
            <motion.path
                d={hexPath()}
                fill={(cell.state.data as any)?.displayColor || cell.dna.color}
                stroke="none"
                initial={{ opacity: 0.8 }}
                animate={{
                    opacity: 0.6 + cell.state.activity * 0.4,
                }}
                whileHover={{
                    opacity: 0.95,
                }}
                whileTap={{
                    opacity: 0.5,
                }}
                transition={{ duration: 0.2 }}
            />

            {/* Cell Borders - Only draw unconnected sides */}
            {Array.from({ length: 6 }).map((_, i) => {
                if (connectedSides[i]) return null; // Don't draw border if connected

                const startAngle = (Math.PI / 3) * i - Math.PI / 6;
                const endAngle = (Math.PI / 3) * ((i + 1) % 6) - Math.PI / 6;

                const startX = HEX_SIZE * Math.cos(startAngle);
                const startY = HEX_SIZE * Math.sin(startAngle);
                const endX = HEX_SIZE * Math.cos(endAngle);
                const endY = HEX_SIZE * Math.sin(endAngle);

                return (
                    <motion.line
                        key={i}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#ffffff"
                        strokeWidth={1} // Base stroke width
                        strokeLinecap="round"
                        initial={{ opacity: 0.8 }} // Match previous opacity
                        whileHover={{ strokeWidth: 2 }} // Hover effect on borders
                    />
                );
            })}

            {/* Pulse ring for activity (Signal or Timer) */}
            {(cell.state.activity > 0 || (cell.dna.id === 'timer' && (cell.state.data as any)?.isRunning)) && (
                <motion.circle
                    r={HEX_SIZE * 0.8}
                    fill="none"
                    stroke={cell.dna.color}
                    strokeWidth={3}
                    initial={{ opacity: 1, scale: 0.8 }}
                    animate={
                        (cell.dna.id === 'timer' && (cell.state.data as any)?.isRunning)
                            ? {
                                opacity: [0.2, 1, 0.2],
                                scale: [0.8, 1.2, 0.8],
                                transition: {
                                    /* 
                                     * Dynamic duration based on timeRemaining would be cool but requires passing it down.
                                     * For now, standard pulse is fine.
                                     */
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }
                            : {
                                opacity: 0,
                                scale: 1.5,
                                transition: { duration: 0.6 }
                            }
                    }
                />
            )}

            {/* DNA Storage Visual - Multi-Hex Grid */}
            {/* DNA Storage Visual - Hex Spiral Grid */}
            {(cell.state.data as any)?.dnaStorage?.length > 0 && (
                <g>
                    {((cell.state.data as any).dnaStorage as PamDNA[]).slice(0, 19).map((dna, index) => {
                        let q = 0, r = 0;
                        if (index > 0) {
                            let ring = 1;
                            let count = 0;
                            while (true) {
                                const ringSize = ring * 6;
                                if (index <= count + ringSize) {
                                    const remaining = index - count - 1;
                                    const side = Math.floor(remaining / ring);
                                    const step = remaining % ring;

                                    // Start at corner for Ring R: q = -ring, r = ring (Direction 4 * ring)
                                    // Wait, Direction 4 is (-1, 1). 
                                    // Let's verify start position for standard spiral walk.
                                    // Classic hex spiral: Center -> (0,0).
                                    // Step 1: (0, -1)? No, (1, 0)?
                                    // Let's map side 0 to Direction 5 (0,1)?
                                    // Actually, let's use a known sequence generator logic inline to be safe.

                                    // Custom Spiral Logic for visual packing:
                                    // Start at (-ring, ring).
                                    // Walk 6 sides.
                                    // Side 0: Dir(0, -1)? No.
                                    // Let's use the vectors that worked in my mind:
                                    // Dirs: 5(0,1), 0(1,0), 1(1,-1), 2(0,-1), 3(-1,0), 4(-1,1)

                                    const moveDirs = [
                                        { q: 0, r: -1 },   // Side 0: Up
                                        { q: 1, r: -1 },   // Side 1: Up Right
                                        { q: 1, r: 0 },    // Side 2: Down Right
                                        { q: 0, r: 1 },    // Side 3: Down
                                        { q: -1, r: 1 },   // Side 4: Down Left
                                        { q: -1, r: 0 }    // Side 5: Up Left
                                    ];

                                    // Start point: (-ring, ring)? That's Bottom-Left corner?
                                    // Let's trace Side 0 from there. (-R, R) + (0, -1) -> (-R, R-1). Up.
                                    // This seems to trace the Left edge upwards.
                                    // Let's assume start is Bottom Left corner (-R, R).

                                    let currentQ = -ring;
                                    let currentR = ring;

                                    // Special handle: If Side 0, we start walking UP.
                                    // If Side 1, we start at Top Left corner (-R, 0)? 
                                    // Wait. Side 0 walk R steps UP -> End at (-R, 0).
                                    // Side 1 walk R steps UP-RIGHT -> End at (0, -R).
                                    // Side 2 walk R steps DOWN-RIGHT -> End at (R, -R).
                                    // Side 3 walk R steps DOWN -> End at (R, 0).
                                    // Side 4 walk R steps DOWN-LEFT -> End at (0, R).
                                    // Side 5 walk R steps UP-LEFT -> End at (-R, R). Back to start.

                                    // This forms a closed loop. Correct.

                                    // Apply full sides
                                    for (let s = 0; s < side; s++) {
                                        currentQ += moveDirs[s].q * ring;
                                        currentR += moveDirs[s].r * ring;
                                    }

                                    // Apply steps
                                    currentQ += moveDirs[side].q * (step + 1);
                                    currentR += moveDirs[side].r * (step + 1);

                                    q = currentQ;
                                    r = currentR;
                                    break;
                                }
                                count += ringSize;
                                ring++;
                            }
                        }

                        // Convert axial to pixel
                        const scale = 0.18;
                        const spread = HEX_SIZE * 0.19;
                        const x = spread * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
                        const y = spread * ((3 / 2) * r);

                        return (
                            <motion.path
                                key={`dna-${index}`}
                                d={hexPath()}
                                fill={dna.color}
                                stroke="#ffffff"
                                strokeWidth={2}
                                initial={{ opacity: 0, scale: 0, x, y }}
                                animate={{ opacity: 1, scale: scale, x, y }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                    delay: index * 0.02
                                }}
                            />
                        );
                    })}
                </g>
            )}

            {/* Generic Label (e.g. for Timer) */}
            {(() => {
                const pam = getPamModule(cell.dna.id);
                const label = pam?.getLabel?.(cell);

                if (!label) return null;

                return (
                    <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize={20}
                        fontWeight="bold"
                        fontFamily="monospace"
                        y={3}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        {label}
                    </text>
                );
            })()}

            {/* Debug Overlay */}
            {showDebugOverlay && (
                <g style={{ pointerEvents: 'none' }}>
                    <text
                        y={-12}
                        textAnchor="middle"
                        fill="#00ff00"
                        fontSize={8}
                        fontFamily="monospace"
                        fontWeight="bold"
                    >
                        {cell.coord.q},{cell.coord.r}
                    </text>
                    <text
                        y={15}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.7)"
                        fontSize={6}
                        fontFamily="monospace"
                    >
                        {cell.id.slice(0, 4)}
                    </text>
                </g>
            )}

            {/* Group Indicator (Link Icon) - Removed as per user request for clean look, walls removal is enough */}


        </motion.g>
    );
}, (prev, next) => {
    // Custom comparison function

    // Check cell identity and properties that matter for rendering
    if (prev.cell.id !== next.cell.id) return false;
    if (prev.cell.dna.color !== next.cell.dna.color) return false;
    if ((prev.cell.state.data as any)?.displayColor !== (next.cell.state.data as any)?.displayColor) return false;
    if (prev.cell.state.activity !== next.cell.state.activity) return false;
    if (prev.cell.state.energy !== next.cell.state.energy) return false;
    if (prev.isSelected !== next.isSelected) return false; // Check selection
    if (prev.showDebugOverlay !== next.showDebugOverlay) return false;

    // Check custom render dependencies form PAM
    const pam = getPamModule(prev.cell.dna.id);
    if (pam?.getRenderDependencies) {
        const prevDeps = pam.getRenderDependencies(prev.cell);
        const nextDeps = pam.getRenderDependencies(next.cell);

        if (prevDeps.length !== nextDeps.length) return false;
        // Shallow comparison of dependencies
        if (prevDeps.some((dep: any, i: number) => dep !== nextDeps[i])) return false;
    }

    // Fallback/Legacy explicit check for Timer (can technically be removed now if all PAMs implement deps correctly, but keeping as safety)
    if (prev.cell.dna.id === 'timer') {
        if (prev.cell.state.data?.timeRemaining !== next.cell.state.data?.timeRemaining) return false;
        if ((prev.cell.state.data as any)?.isRunning !== (next.cell.state.data as any)?.isRunning) return false;
    }

    // Check DNA Storage (Generic)
    const prevStorage = (prev.cell.state.data as any)?.dnaStorage;
    const nextStorage = (next.cell.state.data as any)?.dnaStorage;
    if (prevStorage !== nextStorage) {
        if (prevStorage?.length !== nextStorage?.length) return false;
        if (prevStorage?.length > 0 && nextStorage?.length > 0) {
            if (prevStorage[0].color !== nextStorage[0].color) return false;
        }
    }

    // Check connectedSides deep equality
    if (prev.connectedSides === next.connectedSides) return true;
    if (!prev.connectedSides || !next.connectedSides) return false;
    if (prev.connectedSides.length !== next.connectedSides.length) return false;

    return prev.connectedSides.every((val, i) => val === next.connectedSides![i]);
});
