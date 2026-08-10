/**
 * HexCell Component - Renders a single hexagonal cell
 */

'use client';

import { memo, useMemo } from 'react';
import { Cell, PamDNA } from '@/lib/vibe-core';
import { hexToPixel, HEX_SIZE, getNeighbors, hexToId } from '@/core/grid/hex';
import { getPamModule } from '@/pams/registry';
import { motion } from 'framer-motion';

interface HexCellProps {
    cell: Cell;
    groups: Map<string, Set<string>>;
    onClick: (cell: Cell) => void;
    onRightClick?: (cell: Cell) => void;
    onMouseDown?: (cell: Cell) => void;
    onMouseUp?: (cell: Cell) => void;
    isSelected?: boolean;
    showDebugOverlay?: boolean;
}

// Memoized HexCell to prevent unnecessary re-renders of the entire grid
export const HexCell = memo(function HexCell({
    cell,
    groups,
    onClick,
    onRightClick,
    onMouseDown,
    onMouseUp,
    isSelected = false,
    showDebugOverlay = false
}: HexCellProps) {
    const position = hexToPixel(cell.coord);

    // Memoize connectedSides calculation
    // This ensures that even if 'cell' changes (e.g. activity), we don't recalculate this unless
    // the structure (groups) or position changes.
    const connectedSides = useMemo(() => {
        const groupId = cell.state.groupId;
        if (!groupId) return [false, false, false, false, false, false];

        const groupMembers = groups.get(groupId);
        if (!groupMembers) return [false, false, false, false, false, false];

        const neighborCoords = getNeighbors(cell.coord);
        return neighborCoords.map(nCoord => {
            const nId = hexToId(nCoord);
            return groupMembers.has(nId);
        });
    }, [cell.coord, cell.state.groupId, groups]);

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

                                    const moveDirs = [
                                        { q: 0, r: -1 },   // Side 0: Up
                                        { q: 1, r: -1 },   // Side 1: Up Right
                                        { q: 1, r: 0 },    // Side 2: Down Right
                                        { q: 0, r: 1 },    // Side 3: Down
                                        { q: -1, r: 1 },   // Side 4: Down Left
                                        { q: -1, r: 0 }    // Side 5: Up Left
                                    ];

                                    let currentQ = -ring;
                                    let currentR = ring;

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
                    {/* Overflow Counter */}
                    {((cell.state.data as any).dnaStorage?.length || 0) > 19 && (
                        <g transform="translate(0, 1)">
                            <circle r="10" fill="rgba(0,0,0,0.6)" />
                            <text
                                y="5"
                                textAnchor="middle"
                                fontSize="14"
                                fontWeight="bold"
                                fill="white"
                                style={{ pointerEvents: 'none' }}
                            >
                                {((cell.state.data as any).dnaStorage?.length)}
                            </text>
                        </g>
                    )}
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

    // CRITICAL OPTIMIZATION: Check groups reference
    if (prev.groups !== next.groups) return false;

    // Check custom render dependencies form PAM
    const pam = getPamModule(prev.cell.dna.id);
    if (pam?.getRenderDependencies) {
        const prevDeps = pam.getRenderDependencies(prev.cell);
        const nextDeps = pam.getRenderDependencies(next.cell);

        if (prevDeps.length !== nextDeps.length) return false;
        // Shallow comparison of dependencies
        if (prevDeps.some((dep: any, i: number) => dep !== nextDeps[i])) return false;
    }

    // Fallback/Legacy explicit check for Timer
    if (prev.cell.dna.id === 'timer') {
        if (prev.cell.state.data?.timeRemaining !== next.cell.state.data?.timeRemaining) return false;
        if ((prev.cell.state.data as any)?.isRunning !== (next.cell.state.data as any)?.isRunning) return false;
    }

    // Check DNA Storage matches
    const prevStorage = (prev.cell.state.data as any)?.dnaStorage;
    const nextStorage = (next.cell.state.data as any)?.dnaStorage;
    if (prevStorage !== nextStorage) {
        if (prevStorage?.length !== nextStorage?.length) return false;
        if (prevStorage?.length > 0 && nextStorage?.length > 0) {
            if (prevStorage[0].color !== nextStorage[0].color) return false;
        }
    }

    return true;
});
