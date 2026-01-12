/**
 * HexCell Component - Renders a single hexagonal cell
 */

'use client';

import { Cell } from '@/lib/vibe-core';
import { hexToPixel, HEX_SIZE } from '@/core/grid/hex';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface HexCellProps {
    cell: Cell;
    onClick: (cell: Cell) => void;
}

export function HexCell({ cell, onClick }: HexCellProps) {
    const position = hexToPixel(cell.coord);
    const activityRef = useRef(cell.state.activity);

    // Animate activity decay
    useEffect(() => {
        if (cell.state.activity > 0) {
            const timer = setTimeout(() => {
                activityRef.current = Math.max(0, cell.state.activity - 0.05);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [cell.state.activity]);

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
            onClick={() => onClick(cell)}
            style={{ cursor: 'pointer' }}
        >
            {/* Cell body */}
            <motion.path
                d={hexPath()}
                fill={cell.dna.color}
                stroke="#ffffff"
                strokeWidth={1}
                initial={{ opacity: 0.8 }}
                animate={{
                    opacity: 0.6 + cell.state.activity * 0.4,
                }}
                whileHover={{
                    opacity: 0.95,
                    strokeWidth: 2,
                }}
                whileTap={{
                    opacity: 0.5,
                }}
                transition={{ duration: 0.2 }}
            />

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

            {/* Energy indicator (small dot) */}
            <circle
                r={3}
                fill="#ffffff"
                opacity={cell.state.energy / 100}
            />
        </motion.g>
    );
}
