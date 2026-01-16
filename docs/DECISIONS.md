# Decision Log

This document records the "Why" behind architectural and product decisions.

## Technical Decisions

### 1. Hexagonal Grid vs Square Grid
- **Context**: We needed a grid for cell simulation.
- **Decision**: **Hexagonal (Pointy-topped)**.
- **Why**: 
    - Equidistant neighbors (6 vs 4/8 in square).
    - Biologically more plausible (honeycombs, packaging).
    - Better aesthetic for "organic" growth.

### 2. State Management: Zustand vs Redux/Context
- **Context**: The simulation state (`cells`, `signals`) updates 60 times per second.
- **Decision**: **Zustand**.
- **Why**:
    - **Performance**: Selectors allow components to subscribe to *slices* of state, preventing full app re-renders on every tick.
    - **Simplicity**: No boilerplate providers wrapping the root.
    - **Transient Updates**: Supports "transient" updates (updating refs without triggering renders) which is crucial for the animation loop.

### 3. Canvas vs DOM Rendering
- **Context**: Rendering thousands of cells and particles.
- **Decision**: **Hybrid (Currently DOM-heavy)**.
- **Why**: 
    - **Development Speed**: easier to debug standard HTML/SVG elements.
    - **Styling**: TailwinCSS makes UI easy.
    - **Trade-off**: We accept a lower cell-count limit (~500-1000) for now. Future migration to WebGL/Canvas is planned (see ROADMAP).

## Business / Product Decisions

### 1. "PAM" (Programmable Active Modules) Branding
- **Context**: Naming the entities.
- **Decision**: Call them **PAMs**, referring to "Cells" only as the container.
- **Why**: strict biological naming ("mitochondria", "nucleus") limits creativity. "Modules" implies engineering + biology hybrid, fitting the "Cellular OS" theme.

### 2. Genesis Tool vs Inventory
- **Context**: How to add cells.
- **Decision**: **Genesis Tool** (God-mode pointer).
- **Why**: Drag-and-drop from a sidebar (Inventory) is standard, but a "Brush" or "Wand" feel is more immersive for painting life onto the grid.
