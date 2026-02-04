/**
 * HexCell Component - Renders a single hexagonal cell
 */

'use client';

import { memo } from 'react';
import { Cell } from '@/lib/vibe-core';
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
}

// Memoized HexCell to prevent unnecessary re-renders of the entire grid
export const HexCell = memo(function HexCell({
    cell,
    onClick,
    onRightClick,
    onMouseDown,
    onMouseUp,
    connectedSides = [false, false, false, false, false, false]
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
                e.stopPropagation();
                onMouseDown?.(cell);
            }}
            onMouseUp={(e) => {
                e.stopPropagation();
                onMouseUp?.(cell);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRightClick?.(cell);
            }}
            style={{ cursor: 'pointer', userSelect: 'none' }}
        >
            {/* Cell body */}
            {/* Cell body - background only */}
            <motion.path
                d={hexPath()}
                fill={cell.dna.color}
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

            {/* Pulse ring for activity */}
            {cell.state.activity > 0 && (
                <motion.circle
                    r={HEX_SIZE * 0.8}
                    fill="none"
                    stroke={cell.dna.color}
                    strokeWidth={3}
                    initial={{ opacity: 1, scale: 0.8 }}
                    animate={{
                        opacity: 0,
                        scale: 1.5,
                    }}
                    transition={{ duration: 0.6 }}
                />
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

            {/* Group Indicator (Link Icon) - Removed as per user request for clean look, walls removal is enough */}

            {/* Energy indicator (small dot) - hidden for timer cells */}
            {cell.dna.id !== 'timer' && (
                <circle
                    r={3}
                    fill="#ffffff"
                    opacity={cell.state.energy / 100}
                />
            )}
        </motion.g>
    );
}, (prev, next) => {
    // Custom comparison function

    // Check cell identity and properties that matter for rendering
    if (prev.cell.id !== next.cell.id) return false;
    if (prev.cell.dna.color !== next.cell.dna.color) return false;
    if (prev.cell.state.activity !== next.cell.state.activity) return false;
    if (prev.cell.state.energy !== next.cell.state.energy) return false;

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
    }

    // Check connectedSides deep equality
    if (prev.connectedSides === next.connectedSides) return true;
    if (!prev.connectedSides || !next.connectedSides) return false;
    if (prev.connectedSides.length !== next.connectedSides.length) return false;

    return prev.connectedSides.every((val, i) => val === next.connectedSides![i]);
});
