# Roadmap & Risks

## Known Pitfalls & Risks 🚧

### 1. Performance Bottleneck (Rendering)
- **Risk**: The application currently uses React to render every single Cell and Particle as a DOM element.
- **Threshold**: Performance degrades noticeably above **300-500 active signals** or **1000+ cells**.
- **Mitigation**: 
    - **Short Term**: `React.memo` and aggressive Zustand selectors.
    - **Long Term**: Migration to `<canvas>` or WebGL (`react-three-fiber`) for the grid layer, keeping React for UI overlays only.

### 2. State Serialization
- **Risk**: `Map` and `Set` objects in Zustand are hard to persist to `localStorage` or send over network (JSON.stringify doesn't handle them).
- **Impact**: Saving/Loading games requires a custom serializer/deserializer.

### 3. Signal "Echo Chambers"
- **Risk**: Two Wave cells next to each other can bounce a signal infinitely, crashing the browser info infinite loops.
- **Mitigation**: Current implementation has `seenSignals` set and `groupImmunity`. However, complex topology might still find edge cases.

## Future Roadmap 🗺️

### v1.10 (Immediate Next)
- [x] **Save/Load System**: Persist grids to local storage.
- [x] **Cross-Window Linking**: Connect cells across different browser windows.
- [ ] **Audio Engine**: Synthesizer cells (AudioContext API).
- [ ] **Logic Gates**: AND, OR, NOT cells for building computers.

### v1.20 (Visual Overhaul)
- [x] **Design Gallery**: Experimental lab for cell aesthetics (`/design`).
- [ ] **Theme Engine**: Apply "Neon", "Glass", or "Retro" themes to the main grid.
- [ ] **Squircle Icons**: Standardize all cell icons.

### v2.0 (The Scale Update)
- [ ] **WebGL Rewrite**: Switch grid rendering to PIXI.js or R3F.
- [ ] **Zoom-to-Context**: Semantic Level of Detail (LOD). Zoom out to see "Clusters" instead of individual cells.
- [ ] **Multiplayer**: Websocket synchronization of grid state.

### Idea Pool 💡
- [ ] **Battery Cell**: Accumulates charge from incoming signals; fires only when fully charged.
- [ ] **Memory Cell**: Stores a binary state (ON/OFF), toggles on signal (Flip-Flop).
- [ ] **Delay Cell**: Buffers a signal for N ticks before releasing it.
- [ ] **Random Cell**: Emits signal to a random neighbor or direction when triggered.
