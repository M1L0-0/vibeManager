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

We split state management into two primary stores to separate **World State** from **UI/Interaction State**.

#### A. Grid Store (The World)
Manages the "physical" reality of the simulation.
- **`cells`**: `Map<string, Cell>` - The biological entities.
- **`particles`**: `Array<Particle>` - Flying signals.
- **`physics`**: Movement rules and collision logic.

#### B. Tool Store (The Interface)
Manages how the user interacts with the world, using a **Finite State Machine (FSM)**.

**Interaction State (`interaction`)**:
Mutually exclusive modes that define what happens when you click.
- `HAND_IDLE`: Default pointer. Clicks trigger cell actions.
- `INSPECT_IDLE`: Clicks open the Genome Inspector.
- `GENESIS_IDLE`: Spawns new cells (DNA selected).
- `GENESIS_TRANSPLANT_IDLE`: Drag-and-drop or Click-to-move cells.
- `GENESIS_DRAGGING`: Currently dragging a cell.
- `GENESIS_HOLDING`: Holding a cell for click-to-place transplant.
- `GENESIS_GLUING_SOURCE`: Selecting first cell for glue.
- `GENESIS_GLUING_TARGET`: Selecting second cell for glue.

**View State (`view`)**:
Independent toggles that overlay information without changing interaction rules.
- `showSynapticVision`: Toggles signal particle visibility (and speed controls).
- (Future): `showHeatmap`, `showGridLines`.

### 3. PAM Architecture (Programmable Active Modules)
Every cell in the grid is an instance of a **PAM**.
- **DNA Catalog**: `app/src/pams/dna-catalog.ts` - separating metadata from logic to avoid circular deps.
- **Modules**: `app/src/pams/*` - The behavior implementation (`onSignal`, `onTick`).

**Structure**:
```typescript
interface PamModule {
  dna: PamDNA;
  onSpawn?: (cell) => void;
  onSignal?: (cell, signal) => void;
  onTick?: (cell, deltaTime) => void;
  configComponent?: React.Component; // UI for "Genome Inspector"
}
```

## Data Flow

### Signal Cycle
1. **Trigger**: A cell (e.g., Timer) or User Action creates a Signal.
2. **Dispatch**: stored in `GridStore`.
3. **Propagation Logic**: calculated in `propagation.ts`.
    - Deduplication (seenSignals).
    - Direction filtering.
    - Speed calculation.
4. **Visuals**: `Particles` are spawned to visualize the travel time.
5. **Arrival**: When particle reaches target, `onSignal` is called on the target cell.
6. **Reaction**: The target cell processes the signal and may emit new ones.

## External I/O System (VibeOps)

### 1. Ingest API (Webhooks)
- **Endpoint**: `POST /api/ingest/[cellId]`
- **Purpose**: Allows external systems (GitHub, Cron, bash scripts) to trigger cells.
- **Flow**:
    1.  Request hits Next.js API Route.
    2.  Route validates and broadcasts payload to `SSEManager` (server-side).
    3.  `SSEManager` pushes event to all connected clients via `/api/events`.

### 2. Client-Side Relay
- **Component**: `SSEManager` (client singleton).
- **Flow**:
    1.  `EndpointCell` subscribes to `SSEManager` on spawn.
    2.  `SSEManager` listens to `EventSource` from `/api/events`.
    3.  On event, `EndpointCell` triggers a local Signal (Impulse).

## Genesis System
The Genesis Tool is a multi-mode editor:
1.  **Spawn**: Places new cells (Stem, Timer, Wave).
2.  **Move (Transplant)**: Swaps two cells' positions + states. Supports both **Drag-and-Drop** and **Click-Pickup-Click-Drop**.
3.  **Glue**: Merges two adjacent cells into a shared `groupId`, allowing them to share immunity and structure.
