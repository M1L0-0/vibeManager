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
### 3. State Management Evolution: Context + Zustand
- **Context**: We need multiple independent grids (Split View) in one app.
- **Decision**: **Instance-based Stores via React Context**.
- **Why**: Singleton Zustand stores (global variables) prevent multiple independent simulations. Creating the store inside a Context Provider allows each "PetriDish" component to have its own isolated physics world.

### 4. Cross-Window Linking: Global Event Bus
- **Context**: Wiring a cell in Window A to a cell in Window B.
- **Decision**: **`window.dispatchEvent` (Custom Events)**.
- **Why**:
    - **Zero Dependencies**: Native browser API.
    - **Decoupling**: The GridStore doesn't need to know about the WindowManager. They just emit/listen for "Link" events.

### 5. Cell Design: Live Gallery vs Static Mockups
- **Context**: Designing new cell aesthetics (Neon, Glass, Organic).
- **Decision**: **Live Component Gallery (`/design`)**.
- **Why**:
    - **Fidelity**: Static images don't show how CSS filters/blurs kill performance. Live code proves it works.
    - **Reusable**: The "Mockup" code *is* the production code. Zero translation time.
    - **Interactive**: We can test animations and interactions immediately.
