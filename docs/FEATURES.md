# Features

## 1. Grid Mechanics
- **Infinite Canvas**: The grid is conceptually infinite, though memory is limited by visited cells.
- **Pan & Zoom**: Users can drag to pan and scroll to zoom relative to the mouse pointer.
- **Axial Coordinates**: The grid uses a `(q, r)` addressing system.

## 2. Cell Types
The genesis of the system comes with several pre-installed cell types ("PAMs").

### 🌱 Stem Cell (`stem`)
- **Role**: The source of life.
- **Behavior**: Emits a `pulse` signal periodically.
- **Features**: Acts as a permanent signal generator.

### ⏱️ Timer Cell (`timer`)
- **Role**: Precise rhythmic control.
- **Behavior**: Counts down and emits a signal.
- **Configurable**:
    - **Duration**: Set delay in seconds.
    - **Loop**: Auto-restart or One-shot.
- **Interaction**: Click to start/stop manually. Right-click to reset.

### 🌊 Wave Cell (`wave`)
- **Role**: Transmission medium.
- **Behavior**: Propagates any received signal to all neighbors (or configured directions).
- **Features**:
    - **Directional Control**: Can be configured to emit only in specific directions (0-5).

## 3. Tools
Located in the sidebar, these tools allow interaction with the grid.

### 👆 Select Tool (Hand)
- **Mode**: Interaction.
- **Function**: Click cells to trigger their primary action (e.g., start a Timer).
- **Secondary**: Drag to pan the grid.

### 🧬 Genesis Tool (DNA)
- **Mode**: Creation.
- **Functions**:
    - **Spawn**: Click empty hexes to create new cells.
    - **Transplant**: Drag existing cells to move them.
    - **Menu**: Open the "Cell Selector" to choose which type to spawn.

### 🔍 Inspector Tool (Magnifying Glass)
- **Mode**: Configuration.
- **Function**: Click a cell to open the **Genome Inspector**.
- **Genome Inspector**: A popup UI to edit cell-specific parameters (Speed, loop settings, etc.).

## 4. Visualizations
- **Signal Particles**: Animated dots traveling along grid edges to visualize data flow.
- **Cell Activity**: Cells pulse visually when processing signals.
- **Overlays**: Direction indicators show where signals will travel.
