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
