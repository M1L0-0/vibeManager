# Architecture

## High-Level Overview

**VibeManager** is a web-based "Cellular Operation System" built on **Next.js**. It simulates a hex-grid world where programmable cells interact via signal propagation.

The architecture emphasizes a **hybrid approach**:
- **React/DOM** for UI overlays, tools, and static cell rendering.
- **Canvas (Potential/Future)** for high-performance rendering of particles and signals (currently DOM/framer-motion).
- **Zustand** for centralized, reactive state management outside the React render cycle where performance matters.

```mermaid
graph TD
    User[User Interaction] --> Tools[Tools (FSM)]
    Tools --> FSM[Tool Store (Interaction State)]
    Tools --> View[Tool Store (View State)]
    FSM --> GridStore[Grid Store (Zustand)]
    View --> GridStore
    GridStore --> Grid[Hex Grid Renderer]
    GridStore --> GameLoop[Simulation Loop]
    GameLoop --> Propagation[Signal System]
    Propagation --> GridStore
```

## Core Concepts

### 1. HexGrid System
We use an **Axial Coordinate System** (`q`, `r`) for the grid. This allows for efficient neighbor lookups and distance calculations.
- **Reference**: [Red Blob Games](https://www.redblobgames.com/grids/hexagons/)
- **File**: `app/src/core/grid/hex.ts`

### 2. State Management Architecture

We use a **Hybrid Store Pattern** to support **Multi-Window Isolation**:

#### A. Local Stores (Per-Window / Per-PetriDish)
Each simulation window (or "PetriDish") has its own isolated instance of these stores, provided via React Context (`SimulationProvider`).
- **`GridStore`**: The physics world (cells, signals).
- **`ToolStore`**: The user interaction state (FSM).
- **Why?**: Allows multiple independent simulations on the same screen (e.g., Split View).

#### B. Global Store (App-Wide)
Manages state that must be shared across all windows.
- **`GlobalUIStore`**: Manages the singleton `ToolSelector` and synchronization between windows.
- **Why?**: The user expects the "Selected Tool" to be consistent across the app, even if they click into a different window.

### 3. Cross-Window Communication (The Vibe Bus)
To enable interactions like **Linking Cells across Windows**, we use a custom Global Event Bus.

- **Event**: `vibe-link-cell`
- **Payload**: `{ cellId, position, type: 'SOURCE' | 'TARGET' }`
- **Mechanism**: `window.dispatchEvent` / `window.addEventListener`
- **Flow**:
    1. User clicks "Source" in Window A.
    2. Window A dispatches `vibe-link-cell` (SOURCE).
    3. Global store updates UI.
    4. User clicks "Target" in Window B.
    5. Window B dispatches `vibe-link-cell` (TARGET).
    6. Both windows receive the visual cues.

## PAM Architecture (Programmable Active Modules)
Every cell in the grid is an instance of a **PAM**.
- **DNA Catalog**: `app/src/pams/dna-catalog.ts`
- **Modules**: `app/src/pams/*`

**Vesicle / Network Cells**:
Special cells like `vesicle` use the `signal.payload` to transmit real data (JSON) between cells, acting as the "Network Layer" of the OS.

## Genesis System
The Genesis Tool is a multi-mode editor:
1.  **Spawn**: Places new cells.
2.  **Move (Transplant)**: Swaps positions.
3.  **Glue**: Merges cells.
4.  **Link**: Connects cells (including across windows) via the **Link Tool**.

## Design Gallery (`/design`)
A dedicated route for developing and showcasing cell aesthetics.
- **Live Components**: Renders actual React components (`NeonCell`, `GlassCell`, etc.) instead of static images.
- **Purpose**: A "Style Guide" ensuring visual consistency before merging into the main grid.
