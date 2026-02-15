import { Cell, Signal } from '@/lib/vibe-core';
import { getNeighbors, hexDistance } from '@/core/grid/hex';

interface PropagationOptions {
    defaultDelay?: number; // Default 0.1s
    visualActivity?: number | false; // Default 0.8, false to disable
    allowedDirections?: number[]; // Explicit override
    color?: string; // Particle color
    wireless?: boolean; // If true, propagates through empty space
    instant?: boolean; // If true, skips particle simulation and delivers immediately
}

/**
 * Standardized logic for propagating a wave signal through a cell.
 * Handles deduplication, speed calculation, and state updates.
 * 
 * @returns true if propagation occurred, false if duplicate or ignored
 */
export function handleStandardWavePropagation(
    cell: Cell,
    signal: Signal,
    options: PropagationOptions = {},
    gridStore: any
): boolean {
    const {
        defaultDelay = 0.1,
        visualActivity = 0.8
    } = options;

    // Validate signal type (must have waveId to support propagation)
    if (!signal.waveId) return false;

    // --- CRITICAL FIX: Fetch fresh state to prevent stale-reference deduplication failure ---
    const freshCell = gridStore.getState().cells.get(cell.id) || cell;
    const seenSignals = freshCell.state.seenSignals || new Set<string>();

    if (seenSignals.has(signal.waveId)) {
        return false;
    }

    // Check Group Immunity (don't react to signals from own group)
    if (cell.state.groupId && signal.sourceGroupId === cell.state.groupId) {
        return false;
    }

    // Check Conductivity (New Standard Property)
    // Default to TRUE if undefined (Standard Cells are conductive by default)
    // If explicitly false, block propagation.
    if (cell.state.data?.conductive === false) {
        return false;
    }

    // Mark as seen
    // FORCE MUTATION on the fresh object reference to ensure synchronous consistency in this tick
    if (freshCell.state.seenSignals) {
        freshCell.state.seenSignals.add(signal.waveId);
    } else {
        freshCell.state.seenSignals = new Set([signal.waveId]);
    }

    // Also create new Set for safe React update
    const newSeenSignals = new Set(seenSignals);
    newSeenSignals.add(signal.waveId);

    // Determine Directions
    // Priority: 
    // 1. Dominant Signal (Preserves Momentum/Payload Directions)
    // 2. Signal Payload (Standard)
    // 3. Local Config
    // 4. Default (All 6)

    // Physics: Dominance
    const isLocalDominant = cell.state.data?.dominance === 'DOMINANT';
    const isSignalDominant = signal.dominance === 'DOMINANT';
    const nextDominance: 'DOMINANT' | 'RECESSIVE' = (isLocalDominant || isSignalDominant) ? 'DOMINANT' : 'RECESSIVE';

    let allowedDirections = [0, 1, 2, 3, 4, 5];
    let nextColor = options.color || signal.payload?.color;

    if (isSignalDominant) {
        // Dominant Signal: IMMUTABLE MOMENTUM
        // Ignores local cell direction constraints.
        // If the signal has specific payload directions (momentum), use them.
        allowedDirections = signal.payload?.allowedDirections || [0, 1, 2, 3, 4, 5];
        // Preserves original color (already set in NextColor from payload)
    } else {
        // Recessive Signal: MUTABLE
        // Subject to local cell constraints
        // Cell Directions take priority over Signal Momentum for Recessive signals.
        allowedDirections = cell.state.data?.directions ||
            signal.payload?.allowedDirections ||
            options.allowedDirections ||
            [0, 1, 2, 3, 4, 5];

        // Subject to local color overrides (if cell has specific color)
        // (Logic handled in propagateSignal or below if we want to enforce it here)
        // For now, particle color is usually derived from signal payload or channel.
    }

    // Determine Speed
    // 1. Local Customization (if signficantly different from default)
    // 2. Signal Speed (Pass-through)
    // 3. Default Speed

    const localDelay = cell.state.data?.speedDelay;
    const isLocalCustomized = localDelay !== undefined && Math.abs(localDelay - defaultDelay) > 0.001;

    let propagateSpeed = 10.0; // Default

    if (isLocalCustomized && localDelay) {
        propagateSpeed = 1 / Math.max(0.01, localDelay);
    } else if (signal.speed) {
        propagateSpeed = signal.speed;
    }

    // Create next signal (inject speed)
    const nextSignal = {
        ...signal,
        speed: propagateSpeed,
        dominance: nextDominance
    };

    // Dispatch propagation
    if (options.instant) {
        if (options.wireless) {
            // Wireless Instant
            const allCells = gridStore.getState().getAllCells();
            allCells.forEach((target: Cell) => {
                if (target.id === cell.id) return;
                if (signal.range && signal.range < 1000) {
                    const dist = hexDistance(cell.coord, target.coord);
                    if (dist > signal.range) return;
                }
                gridStore.getState().deliverSignal(target.id, nextSignal);
            });
        } else {
            // Neighbor Instant
            // Robustness Fix: Use distance check instead of key lookup
            const allCells = gridStore.getState().getAllCells();
            allCells.forEach((target: Cell) => {
                if (target.id === cell.id) return;
                const dist = hexDistance(cell.coord, target.coord);
                if (Math.abs(dist - 1) < 0.1) {
                    gridStore.getState().deliverSignal(target.id, nextSignal);
                }
            });
        }
    } else {
        gridStore.getState().propagateSignal(cell.id, nextSignal, {
            speed: propagateSpeed,
            type: 'arc',
            directions: allowedDirections,
            color: options.color || signal.payload?.color, // Use payload color if local option is missing
            wireless: options.wireless
        });
    }

    // Update Cell State (Visual Feedback + Seen Set)
    const updates: any = {
        seenSignals: newSeenSignals
    };

    if (visualActivity !== false) {
        updates.activity = visualActivity;
    }

    gridStore.getState().updateCell(cell.id, {
        state: {
            ...freshCell.state, // Fix: Use fresh state to preserve previous sync updates (e.g. Pixel Color)
            ...updates
        }
    }, { skipHistory: true });

    // Auto-reset activity after delay to allow visual pulse without storing every frame
    if (visualActivity !== false) {
        setTimeout(() => {
            gridStore.getState().updateCell(cell.id, {
                state: {
                    activity: 0
                }
            }, { skipHistory: true });
        }, 300);

    }

    return true;
}

/**
 * Helper to generate and emit a new signal (Impulse) from a cell.
 * Handles seenSignals logic, ID generation, and state updates.
 */
export function createImpulse(
    cell: Cell,
    signalType: string = 'wave',
    payload: any = {},
    options: {
        strength?: number;
        range?: number;
        speed?: number; // Override calculated speed
        color?: string; // Particle color
        type?: 'linear' | 'arc' | 'wobble'; // Movement pattern
        command?: string; // 'TRIGGER', etc
        inheritLastFired?: boolean; // If true, checks cooldown
        wireless?: boolean; // If true, propagates through empty space
        instant?: boolean; // If true, skips particle simulation and delivers immediately
    } = {},
    gridStore: any
) {
    const now = Date.now();
    const data = cell.state.data;
    // console.log('⚡ createImpulse called for', cell.id);

    // Cooldown check
    if (options.inheritLastFired) {
        const lastFired = data?.lastFired || 0;
        if (now - lastFired < 150) {
            // console.warn('⚡ createImpulse aborted: Cooldown');
            return;
        }
    }

    const waveId = `wave-${now}-${Math.random()}`;

    // Physics Resolution: Options > Data > Default
    const delay = data?.speedDelay || 0.1;
    const speed = options.speed || (1 / Math.max(0.01, delay));
    const range = options.range ?? (data?.range !== undefined ? data.range : 1); // Default 1 (was 100) per user request
    const channelId = data?.channel || 'universal';
    const directions = data?.directions || [0, 1, 2, 3, 4, 5];
    const command = options.command as any || data?.command;

    // console.log('⚡ createImpulse Params:', { speed, range, directions });

    const signal: Signal = {
        id: `signal-${now}-${Math.random()}`,
        type: signalType,
        strength: options.strength || 1.0,
        sourceId: cell.id,
        timestamp: now,
        waveId: waveId,
        channelId: channelId,
        range: range,
        command: command,
        sourceGroupId: cell.state.groupId,
        speed: speed,
        payload: {
            message: 'Impulse',
            originCell: cell.id,
            allowedDirections: directions,
            color: options.color, // Persist initial color in payload
            ...payload
        },
    };

    // Mark as seen locally
    const currentSeen = cell.state.seenSignals ? new Set(cell.state.seenSignals) : new Set<string>();
    currentSeen.add(waveId);

    // Auto-reset activity
    // Use data.activityDecay if we want to customize this later, but for now fixed
    setTimeout(() => {
        gridStore.getState().updateCell(cell.id, {
            state: { activity: 0 }
        }, { skipHistory: true });
    }, 300);

    // Instant Propagation Logic
    if (options.wireless && options.instant) {
        // Instant Wireless (God Mode)
        // console.log('⚡ Wireless Instant Propagation');
        const allCells = gridStore.getState().getAllCells();
        const start = Date.now();
        let deliveredCount = 0;

        allCells.forEach((target: Cell) => {
            if (target.id === cell.id) return;
            // Respect range if specified (though usually instant implies global or range-limited)
            if (options.range && options.range < 1000) { // arbitrary threshold for "global"
                const dist = hexDistance(cell.coord, target.coord);
                if (dist > options.range) return;
            }

            // Deliver directly
            gridStore.getState().deliverSignal(target.id, signal);
            deliveredCount++;
        });

        // console.log(`⚡ Instant Propagation from ${cell.id} to ${deliveredCount} cells in ${Date.now() - start}ms`);
        return waveId;
    }

    if (options.instant) {
        // Instant Neighbor Propagation
        // Robustness Fix: Iterate all cells and check physical distance (dist == 1)
        // This avoids issues where getNeighbors() + hexToId() fails due to coordinate type mismatches (string vs number)
        const allCells = gridStore.getState().getAllCells();
        let deliveredCount = 0;

        allCells.forEach((target: Cell) => {
            if (target.id === cell.id) return;

            const dist = hexDistance(cell.coord, target.coord);
            // Neighbor means distance is exactly 1
            if (Math.abs(dist - 1) < 0.1) {
                console.log(`⚡ Found neighbor ${target.id} at dist ${dist}, delivering signal`);
                gridStore.getState().deliverSignal(target.id, signal);
                deliveredCount++;
            }
        });

        if (deliveredCount === 0) {
            console.warn(`⚡ Instant Propagation: No neighbors found for ${cell.id} at ${cell.coord.q},${cell.coord.r}`);
        }

        return waveId;
    }

    // console.log('⚡ Calling propagateSignal with:', signal);

    // Propagate (Standard / Particle)
    gridStore.getState().propagateSignal(cell.id, signal, {
        speed: speed,
        type: options.type || 'arc', // Default to arc if not specified
        directions: directions,
        color: options.color,
        wireless: options.wireless
    });

    // Update State
    gridStore.getState().updateCell(cell.id, {
        state: {
            activity: 1.0,
            seenSignals: currentSeen,
            data: {
                ...cell.state.data,
                lastFired: options.inheritLastFired ? now : data?.lastFired
            }
        },
    }, { skipHistory: true });
    return waveId;
}

