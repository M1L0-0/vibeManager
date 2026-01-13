import React from 'react';
import { Cell } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';
import { cn } from '@/lib/utils';
import { hexToId } from '@/core/grid/hex';

interface Props {
    cell: Cell; // The currently inspected cell (part of a group)
    updateCell: (id: string, updates: Partial<Cell>) => void;
}

export function StructureEditor({ cell, updateCell }: Props) {
    const cells = useGridStore(state => state.cells);
    const groupId = cell.state.groupId;

    // Find all group members
    const groupMembers = Array.from(cells.values()).filter(c => c.state.groupId === groupId);

    // If no group (fallback), show just this cell
    const members = groupMembers.length > 0 ? groupMembers : [cell];

    // Calculate bounding box to normalize coordinates
    const minQ = Math.min(...members.map(c => c.coord.q));
    const maxQ = Math.max(...members.map(c => c.coord.q));
    const minR = Math.min(...members.map(c => c.coord.r));
    const maxR = Math.max(...members.map(c => c.coord.r));

    // Center offset
    const width = maxQ - minQ + 1;
    const height = maxR - minR + 1;

    // Visual Setup
    const HEX_SIZE = 30;
    const ORIGIN_X = 150;
    const ORIGIN_Y = 150;

    // Helper: Axial to Pixel, simplified for visualizer
    // Hex to Pixel: x = size * (3/2 * q), y = size * (sqrt(3)/2 * q  +  sqrt(3) * r)
    const hexToPixel = (q: number, r: number) => {
        const x = HEX_SIZE * (3 / 2 * q);
        const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        return { x, y };
    };

    // Calculate center of the group in pixel space to center it in SVG
    const centerQ = (minQ + maxQ) / 2;
    const centerR = (minR + maxR) / 2;
    const centerPix = hexToPixel(centerQ, centerR);

    // Toggle direction on a specific cell member
    const toggleCellDirection = (targetCell: Cell, dirIndex: number) => {
        const currentDirs = targetCell.state.data?.directions || [0, 1, 2, 3, 4, 5];
        let newDirs;

        if (currentDirs.includes(dirIndex)) {
            newDirs = currentDirs.filter((d: number) => d !== dirIndex);
        } else {
            newDirs = [...currentDirs, dirIndex].sort();
        }

        updateCell(targetCell.id, {
            state: {
                ...targetCell.state,
                data: {
                    ...targetCell.state.data,
                    directions: newDirs
                }
            }
        });
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-xs text-gray-400 font-mono">
                GROUP SIZE: {members.length} | ID: {groupId?.slice(-6)}
            </div>

            <div className="relative w-full aspect-square max-w-[300px] bg-gray-900/50 rounded-xl border border-gray-700/50 shadow-inner overflow-hidden">
                <svg viewBox="0 0 300 300" className="w-full h-full">
                    {/* Grid Lines / Background (Optional) */}

                    <g transform={`translate(${ORIGIN_X - centerPix.x}, ${ORIGIN_Y - centerPix.y})`}>
                        {members.map(member => {
                            const { x, y } = hexToPixel(member.coord.q, member.coord.r);
                            const isSelected = member.id === cell.id;
                            const directions = member.state.data?.directions || [0, 1, 2, 3, 4, 5];

                            return (
                                <g key={member.id} transform={`translate(${x}, ${y})`}>
                                    {/* Cell Body */}
                                    <polygon
                                        points="-30,0 -15,-26 15,-26 30,0 15,26 -15,26"
                                        fill={member.dna.color}
                                        fillOpacity={isSelected ? 0.8 : 0.4}
                                        stroke={isSelected ? 'white' : 'transparent'}
                                        strokeWidth={2}
                                        className="transition-all"
                                    />

                                    {/* Direction Toggles (Wedges) */}
                                    {[0, 1, 2, 3, 4, 5].map(dir => {
                                        const isActive = directions.includes(dir);
                                        const rot = dir * 60; // 0=E, 1=SE, etc? Standard hex: 0=E, 60=SE

                                        // Wedge for clicking
                                        return (
                                            <g
                                                key={dir}
                                                transform={`rotate(${rot})`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCellDirection(member, dir);
                                                }}
                                                className="cursor-pointer hover:opacity-100"
                                                style={{ opacity: isActive ? 1 : 0.1 }}
                                            >
                                                {/* Visual indicator of output */}
                                                <path
                                                    d="M 20 -10 L 35 0 L 20 10"
                                                    fill="white"
                                                    transform="translate(5, 0)"
                                                />
                                            </g>
                                        );
                                    })}

                                    {/* Cell Icon/ID */}
                                    {isSelected && (
                                        <circle r="5" fill="white" className="animate-pulse" />
                                    )}
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            <p className="text-xs text-gray-500 text-center max-w-[250px]">
                Click the arrows on ANY cell in the group to configure its emission directions.
            </p>
        </div>
    );
}
