import { Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';

interface PropagationOptions {
    defaultDelay?: number; // Default 0.1s
    visualActivity?: number; // Default 0.8
    allowedDirections?: number[]; // Explicit override
    color?: string; // Particle color
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
    options: PropagationOptions = {}
): boolean {
    const {
        defaultDelay = 0.1,
        visualActivity = 0.8
    } = options;

    // Validate signal type
    if (signal.type !== 'wave' || !signal.waveId) return false;

    // --- CRITICAL FIX: Fetch fresh state to prevent stale-reference deduplication failure ---
    const freshCell = useGridStore.getState().cells.get(cell.id) || cell;
    const seenSignals = freshCell.state.seenSignals || new Set<string>();

    if (seenSignals.has(signal.waveId)) {
        return false;
    }

    // Check Group Immunity (don't react to signals from own group)
    if (cell.state.groupId && signal.sourceGroupId === cell.state.groupId) {
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
    // Priority: Signal Payload > Local Config > Default (All 6)
    const allowedDirections = signal.payload?.allowedDirections ||
        cell.state.data?.directions ||
        options.allowedDirections ||
        [0, 1, 2, 3, 4, 5];

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
        speed: propagateSpeed
    };

    // Dispatch propagation
    // We use getState() to access actions outside React context if needed, 
    // but this function is likely called from within an effect or event handler.
    useGridStore.getState().propagateSignal(cell.id, nextSignal, {
        speed: propagateSpeed,
        type: 'arc',
        directions: allowedDirections,
        color: options.color
    });

    // Update Cell State (Visual Feedback + Seen Set)
    useGridStore.getState().updateCell(cell.id, {
        state: {
            ...cell.state,
            activity: visualActivity,
            seenSignals: newSeenSignals
        }
    });

    // Auto-reset activity after delay to allow visual pulse without storing every frame
    setTimeout(() => {
        useGridStore.getState().updateCell(cell.id, {
            state: {
                activity: 0
            }
        });
    }, 300);

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
        command?: string; // 'TRIGGER', etc
        inheritLastFired?: boolean; // If true, checks cooldown
    } = {}
) {
    const now = Date.now();

    // Cooldown check
    if (options.inheritLastFired) {
        const lastFired = cell.state.data?.lastFired || 0;
        if (now - lastFired < 150) return;
    }

    const waveId = `wave-${now}-${Math.random()}`;
    const delay = cell.state.data?.speedDelay || 0.1;
    const speed = options.speed || (1 / Math.max(0.01, delay));

    const signal: Signal = {
        id: `signal-${now}-${Math.random()}`,
        type: signalType,
        strength: options.strength || 1.0,
        sourceId: cell.id,
        timestamp: now,
        waveId: waveId,
        channelId: cell.state.data?.channel || 'universal',
        range: options.range ?? (cell.state.data?.range !== undefined ? cell.state.data.range : 10),
        command: options.command as any || cell.state.data?.command,
        sourceGroupId: cell.state.groupId,
        speed: speed,
        payload: {
            message: 'Impulse',
            originCell: cell.id,
            allowedDirections: cell.state.data?.directions || [0, 1, 2, 3, 4, 5],
            ...payload
        },
    };

    // Mark as seen locally
    const currentSeen = cell.state.seenSignals ? new Set(cell.state.seenSignals) : new Set<string>();
    currentSeen.add(waveId);

    // Propagate
    useGridStore.getState().propagateSignal(cell.id, signal, {
        speed: speed,
        type: 'arc', // Default
        directions: signal.payload.allowedDirections,
        color: options.color
    });

    // Update State
    useGridStore.getState().updateCell(cell.id, {
        state: {
            activity: 1.0,
            seenSignals: currentSeen,
            data: {
                ...cell.state.data,
                lastFired: options.inheritLastFired ? now : cell.state.data?.lastFired
            }
        },
    });

    // Auto-reset activity
    setTimeout(() => {
        useGridStore.getState().updateCell(cell.id, {
            state: { activity: 0 }
        });
    }, 300);

    return waveId;
}
