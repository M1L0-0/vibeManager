import { createDemo } from './dish-factory';

// --- DEMO 1: STEM CELL (Basic Conductor) ---
const demoStem = createDemo('Stem Cell', (f) => {
    // A simple line of stem cells
    // Timer needs range > 1 to guarantee it hits the stem cell firmly, but standard range 1 should work for neighbors.
    // However, if the Stem Cell re-emits, it needs to ensure it doesn't decay to 0 immediately if logic was flawed.
    // Let's give the Timer a healthy range of 10 just to be safe and clear.
    f.spawn(-2, 0, 'timer', { label: 'Click Me', isRunning: false, command: 'TRIGGER', range: 10 });
    f.spawn(-1, 0, 'stem');
    f.spawn(0, 0, 'stem', { label: 'Conductor' });
    f.spawn(1, 0, 'stem');
    f.spawn(2, 0, 'pixel', { displayColor: '#ffffff' });
});

// --- DEMO 2: TIMER CELL (Clock) ---
const demoTimer = createDemo('Timer Cell', (f) => {
    // Three timers with different intervals
    f.spawn(-2, 0, 'timer', { label: '0.5s', maxTime: 0.5, isRunning: true, loop: true });
    f.spawn(0, 0, 'timer', { label: '1.0s', maxTime: 1.0, isRunning: true, loop: true });
    f.spawn(2, 0, 'timer', { label: '2.0s', maxTime: 2.0, isRunning: true, loop: true });

    // Connected to pixels to show the rhythm
    f.spawn(-2, 1, 'pixel', { displayColor: '#f87171' }); // Red
    f.spawn(0, 1, 'pixel', { displayColor: '#4ade80' }); // Green
    f.spawn(2, 1, 'pixel', { displayColor: '#60a5fa' }); // Blue
});

// --- DEMO 3: WAVE CELL (Broadcaster) ---
const demoWave = createDemo('Wave Cell', (f) => {
    // Central Wave Emitter
    // ENABLE WIRELESS so it hits the non-adjacent satellites!
    f.spawn(0, 0, 'wave', { label: 'TX', range: 20, wireless: true });
    // Trigger it automatically
    f.spawn(0, 1, 'timer', { label: 'Pulse', maxTime: 2.0, isRunning: true, loop: true });

    // Satellites scattered around
    const satellites = [
        { q: 0, r: -3 }, { q: 3, r: -3 }, { q: 3, r: 0 },
        { q: 0, r: 3 }, { q: -3, r: 3 }, { q: -3, r: 0 }
    ];

    satellites.forEach(pos => {
        // Satellites don't need wireless to RECEIVE, but the TX needs it to SEND.
        // Giving them labels.
        f.spawn(pos.q, pos.r, 'pixel', { displayColor: '#c084fc', label: 'RX' });
    });
});

// --- DEMO 4: NEURON CELL (Logic) ---
const demoNeuron = createDemo('Neuron Cell', (f) => {
    // AND Gate Construction
    f.spawn(0, 0, 'neuron', { operation: 'AND', label: 'AND' });

    // Output
    f.spawn(1, 0, 'pixel', { displayColor: '#10b981', label: 'True' });

    // Inputs - Synchronized to fire together naturally
    // Input A (Neighbor NW) -> 4 seconds (User Request)
    f.spawn(0, -1, 'timer', { label: 'A (4s)', maxTime: 4.0, isRunning: true, loop: true });

    // Input B (Neighbor SW) -> 2 seconds
    f.spawn(-1, 1, 'timer', { label: 'B (2s)', maxTime: 2.0, isRunning: true, loop: true });
});

// --- DEMO 5: PIXEL CELL (Display) ---
const demoPixel = createDemo('Pixel Cell', (f) => {
    // Central Pulse with 3 surrounding pixels
    f.spawn(0, 0, 'timer', { label: 'Pulse', maxTime: 0.8, isRunning: true, loop: true });

    // Triangle formation around center
    f.spawn(0, -1, 'pixel', { displayColor: '#ef4444', label: 'R' }); // Top-Rightish
    f.spawn(-1, 1, 'pixel', { displayColor: '#22c55e', label: 'G' }); // Bottom-Left
    f.spawn(1, 0, 'pixel', { displayColor: '#3b82f6', label: 'B' }); // Right
});

// --- LEGACY COMPLEX DEMOS (Rebuilding with Factory for consistency) ---

const demoLogicLab = createDemo('Logic Lab', (f) => {
    // AND Gate
    f.spawn(0, 0, 'neuron', { operation: 'AND', label: 'AND' });
    f.spawn(2, 0, 'pixel', { displayColor: '#10b981', label: 'OUT' });
    f.spawn(1, 0, 'stem');
    f.spawn(-3, 0, 'timer', { maxTime: 2.0, label: 'A', isRunning: true, loop: true });
    f.spawn(-2, 0, 'stem');
    f.spawn(-1, 0, 'stem');

    // OR Gate
    const row = 5;
    f.spawn(0, row, 'neuron', { operation: 'OR', label: 'OR' });
    f.spawn(2, row, 'pixel', { displayColor: '#f59e0b', label: 'OUT' });
    f.spawn(1, row, 'stem');
    // Inputs... simplifying for factory
});

// For now, let's keep the complex ones simple or just use the new ones.
// The user asked for "a demo petri dish for each cell".

// --- DEMO 6: NUMBER DISPLAY (7-Segment Logic) ---
const demoNumbers = createDemo('Numbers', (f) => {
    // 1. The Display (Pixel Cells in "Temporary" Mode)
    // Layout: 7 segments (A-G)
    // We use a small hex layout for the digit.
    /*
         A
       F   B
         G
       E   C
         D
    */
    const color = '#3b82f6'; // Blue display
    const opts = { persistence: false, displayColor: '#111111' }; // Dark base

    // Segment Coordinates (Relative to center)
    // A (Top)
    f.spawn(0, -2, 'pixel', { ...opts, label: 'A' });
    // B (Top Right)
    f.spawn(1, -1, 'pixel', { ...opts, label: 'B' });
    // C (Bottom Right)
    f.spawn(1, 1, 'pixel', { ...opts, label: 'C' });
    // D (Bottom)
    f.spawn(0, 2, 'pixel', { ...opts, label: 'D' });
    // E (Bottom Left)
    f.spawn(-1, 1, 'pixel', { ...opts, label: 'E' });
    // F (Top Left)
    f.spawn(-1, -1, 'pixel', { ...opts, label: 'F' });
    // G (Center)
    f.spawn(0, 0, 'pixel', { ...opts, label: 'G' });

    // 2. The Keypad (Timers as Buttons)
    // We place them below the display
    const btnY = 5;
    for (let i = 0; i < 10; i++) {
        const x = (i % 5) * 2 - 4;
        const y = btnY + Math.floor(i / 5) * 2;
        f.spawn(x, y, 'timer', {
            label: `${i}`,
            paused: true,
            isRunning: false,
            channel: 'universal',
            color: '#22c55e' // Green buttons
        });

        // 3. Logic Wiring (Diodes)
        // This is the hard part - wiring button 'i' to specific segments.
        // We use "wireless" propagation for the demo to keep it clean?
        // OR we spawn hidden diodes?
        // The user asked for "stem cell click" -> display.
        // With wireless signals, we can target specific coordinates!
        // But our signals usually target ALL neighbors or ALL cells (if wireless).
        // To target specific pixels, we'd need channel separation or directional diodes.

        // Let's use the 'wireless' instant transmission feature of the new physics engine?
        // Wait, 'propagation.ts' has wireless/instant support.
        // But typical "Timer" pulse is radial.

        // BETTER APPROACH: "Wire" it using Diodes (Stem Cells)
        // but that requires A LOT of cells.

        // CHEAT FOR DEMO:
        // We can use the 'targets' payload if we supported it.
        // Or, we can just position the buttons and assume the user will "trace" the path.
        // BUT the user asked for a WORKING version.

        // Let's build a SIMPLE version: Just 1, 2, 3 using visible wire paths.
        // 1: B, C
        // 2: A, B, G, E, D
        // 3: A, B, G, C, D

        // Actually, let's use the new "Diode" feature I added.
        // We can place diodes to direct the signal.
        // But for 10 numbers, the wiring is spaghetti.

        // ALTERNATIVE: Use "Channels" ?
        // If Segment A listens to Channel A...
        // But Cells only have 1 channel.

        // OK, for this specific demo, let's use a "Decoder" column.
        // Button -> Decoder Stem -> Fan out to Segments.
    }

    // REDO: Let's make a simplified 1-2-3 demo to prove the concept without 1000 cells.
    // Clear previous keypad
});

// Real implementation of Number Display (Compact Cluster)
const demoNumbersReal = createDemo('Number Logic', (f) => {

    // 1. The 7-Segment Display (Compact Hex Cluster)
    // G at Center (0,0)
    // Ring of 6 around it:
    // A (Top Left): (0, -1)
    // B (Top Right): (1, -1)
    // C (Right): (1, 0)
    // D (Bottom Right): (0, 1)
    // E (Bottom Left): (-1, 1)
    // F (Left): (-1, 0)

    // Note: This is a "Hex Digit".
    // A=TopLeft, B=TopRight, C=Right, D=LowRight, E=LowLeft, F=Left.
    // Standard 7-seg: A=Top, B=TopRight, C=BotRight, D=Bot, E=BotLeft, F=TopLeft, G=Mid.
    // Our mapping:
    // Top ~ A(0,-1) + B(1,-1)
    // Bot ~ E(-1,1) + D(0,1)
    // But let's stick to 1 cell per segment label logic found in standard mapping.

    // Let's use:
    // G = Center
    // A = (0, -1) [Top-ish]
    // B = (1, -1) [Top-Right]
    // C = (1, 0)  [Bottom-Right-ish] -> Actually (1,0) is East. (0,1) is SE.
    // Let's use:
    // A: 0, -1 (NW)
    // B: 1, 0 (E)  <- Right Side
    // C: 0, 1 (SE) <- Bottom Right
    // D: -1, 1 (SW) <- Bottom Left
    // E: -1, 0 (W) <- Left Side
    // F: Not perfect match.

    // Let's stick to visual relative positions:
    const segs = {
        G: { q: 0, r: 0 },   // Center
        A: { q: 0, r: -1 },  // NW (Top Left)
        B: { q: 1, r: -1 },  // NE (Top Right)
        C: { q: 1, r: 0 },   // E (Right)
        D: { q: 0, r: 1 },   // SE (Bottom Right)
        E: { q: -1, r: 1 },  // SW (Bottom Left)
        F: { q: -1, r: 0 }   // W (Left)
    };
    /*
        A B
       F G C
        E D
    */
    // This looks like a tilted hexagon. Good enough!

    const opts = { persistence: false, displayColor: '#222222', color: '#111111' };

    Object.entries(segs).forEach(([label, pos]) => {
        f.spawn(pos.q, pos.r, 'pixel', { ...opts, label });
    });

    // 2. Segment Toggles (Surrounding Ring)
    // Radius 2
    f.spawn(0, -2, 'timer', { label: 'A', color: '#4b5563' }); // Above A
    f.spawn(2, -2, 'timer', { label: 'B', color: '#4b5563' }); // Right of B
    f.spawn(1, 1, 'timer', { label: 'C', color: '#4b5563' }); // SE of C (Moved from 2,0 to avoid wire collision)
    f.spawn(0, 2, 'timer', { label: 'D', color: '#4b5563' }); // Below D
    f.spawn(-2, 2, 'timer', { label: 'E', color: '#4b5563' }); // Left of E
    f.spawn(-2, 0, 'timer', { label: 'F', color: '#4b5563' }); // Left of F

    // 3. MASTER "8" BUTTON (Bottom)
    // Position: (0, 4)
    f.spawn(0, 4, 'timer', { label: '8/ALL', color: '#f59e0b' });

    // Wireless TX at (0, 3)
    f.spawn(0, 3, 'wave', {
        label: 'TX',
        wireless: true,
        range: 5,
        speedDelay: 0.1
    });
    // Wire (0,4) -> (0,3). 
    // Neighbors of (0,4): (0,3) is NW. (1,3) is NE. (1,4) E...
    // Yes (0,3) is neighbor.
    // f.spawnDiode(0, 4, [4], { color: '#f59e0b' }); // REMOVED: Duplicate of Timer at 0,4. Timer hits 0,3 naturally.

    // 4. "1" BUTTON (Right)
    // Activates B (1, -1) and C (1, 0).
    // Position: (4, 0)
    f.spawn(4, 0, 'timer', { label: '1', color: '#22c55e' });

    // Path to C (1, 0): (4, 0) -> (3, 0) -> (2, 0) -> (1, 0)
    // Path to B (1, -1): (4, 0) -> (3, -1) -> (2, -1) -> (1, -1)

    // Splitter at (4, 0) itself? No, Timer emits omni.
    // Use Stem at (3, 0) to split?
    // (4, 0) reaches (3, 0) [W] and (3, 1) [SW] and (4, -1) [NW]? 
    // No, (4,0) neighbors: (5,0), (4,1), (3,1), (3,0), (4,-1), (5,-1).
    // So (3, 0) is neighbor.

    // Splitter at (3, 0):
    // 1. West to (2, 0) -> (1, 0) [C]
    // 2. NW to (3, -1) -> (2, -1) -> (1, -1) [B]
    f.spawn(3, 0, 'stem', { directions: [3, 4] });

    // Path C
    f.spawnDiode(2, 0, [3]); // West -> (1, 0) [C]

    // Path B
    f.spawnDiode(3, -1, [3]); // West -> (2, -1)
    f.spawnDiode(2, -1, [3]); // West -> (1, -1) [B]?
    // Neighbors of (2, -1): (1, -1) is West neighbor?
    // q-1, r? (2-1, -1) = (1, -1). Yes, Direction 3 (West).
    // So (2, -1) -> (1, -1) is valid.
});

export const DEFAULT_DISHES = [
    {
        id: 'demo-stem',
        name: 'Demo: Stem Cell',
        timestamp: Date.now(),
        thumbnail: '',
        data: demoStem,
        folder: 'Demos'
    },
    {
        id: 'demo-timer',
        name: 'Demo: Timer',
        timestamp: Date.now(),
        thumbnail: '',
        data: demoTimer,
        folder: 'Demos'
    },
    {
        id: 'demo-wave',
        name: 'Demo: Wave Physics',
        timestamp: Date.now(),
        thumbnail: '',
        data: demoWave,
        folder: 'Demos'
    },
    {
        id: 'demo-neuron',
        name: 'Demo: Logic Gates',
        timestamp: Date.now(),
        thumbnail: '',
        data: demoNeuron,
        folder: 'Demos'
    },
    {
        id: 'demo-pixel',
        name: 'Demo: Pixel Art',
        timestamp: Date.now(),
        thumbnail: '',
        data: demoPixel,
        folder: 'Demos'
    },
    {
        id: 'demo-numbers',
        name: 'Demo: Number Display',
        timestamp: Date.now(),
        thumbnail: '',
        data: demoNumbersReal,
        folder: 'Demos'
    }
];
