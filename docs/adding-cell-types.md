# Adding New Cell Types to VibeManager

## Automated Registration

New cell types are **automatically** registered in the Genesis Tool! Just follow these steps:

### 1. Create Your Cell Module

Create a new file in `app/src/pams/your-cell-name/index.ts`:

```typescript
import { PamModule } from '@/lib/vibe-core';

export const YourCell: PamModule = {
    dna: {
        id: 'yourcell',
        name: 'Your Cell',
        version: '1.0.0',
        color: '#ff6b6b',  // Choose your color
        icon: 'Sparkles',   // lucide-react icon name
        description: 'Does something amazing',
    },
    
    // ✅ CORRECT INITIALIZATION PATTERN
    onSpawn: (cell) => {
        // ALWAYS use spread syntax to merge defaults with existing data.
        // DO NOT check "if (!cell.state.data)" because it initializes as empty object {} !
        cell.state.data = {
            myDefaultProp: 100,
            someSetting: 'value',
            ...cell.state.data // Valid overrides/hydration
        };
    },
    
    onClick: (cell) => {
        // Handle click behavior
    },
    
    // Optional lifecycle methods
    onTick: (cell, deltaTime) => {},
    onSignal: (cell, signal) => {},
};
```

### 2. Register in PAM Registry

Open `app/src/pams/registry.ts` and add your cell:

```typescript
import { YourCell } from '@/pams/yourcell';  // Import your cell

export const PAM_REGISTRY: Record<string, PamModule> = {
    'stem': StemCell,
    'timer': TimerCell,
    'wave': WaveCell,
    'yourcell': YourCell,  // Add this line
};
```

### 3. That's It!

Your cell will now automatically appear in:
- ✅ Genesis Tool cell selector (Spawn mode)
- ✅ HexGrid cell interactions
- ✅ All cell-type lookups throughout the app

**No other changes needed!**

---

## Why This Works

The PAM registry exports two functions:

```typescript
// Get all cell types as array (for Genesis Tool)
export const getAllCellTypes = (): PamModule[]

// Get specific cell by ID (for HexGrid)
export const getPamModule = (cellId: string): PamModule | undefined
```

Both `CellSelector` and `HexGrid` import from the registry, so updating the registry automatically updates everything.

---

## Example: Adding a "Reactor Cell"

1. Create `app/src/pams/reactor/index.ts`:
```typescript
export const ReactorCell: PamModule = {
    dna: {
        id: 'reactor',
        name: 'Reactor Cell',
        color: '#10b981',
        description: 'Generates energy pulses',
    },
    // ... implementation
};
```

2. Update `app/src/pams/registry.ts`:
```typescript
import { ReactorCell } from '@/pams/reactor';

export const PAM_REGISTRY: Record<string, PamModule> = {
    'stem': StemCell,
    'timer': TimerCell,
    'wave': WaveCell,
    'reactor': ReactorCell,  // ← Just add this!
};
```

3. Done! The Reactor Cell now appears in the Genesis Tool.

---

## ⚠️ CRITICAL: The Registry Pitfall

When implementing features that iterate over cell types (like Tickers, Renderers, or Inspectors), **NEVER hardcode the list of cells**.

**❌ BAD:**
```typescript
const CELLS = { stem: StemCell, timer: TimerCell }; // Hardcoded list
```

**✅ GOOD:**
```typescript
import { REGISTRY } from '@/pams/registry'; // Always use the central registry
```

Failure to use the central registry means new cell types will be "invisible" to that feature, causing bugs like:
- Cells not updating (`onTick` never called)
- Cells failing to render
- Interaction logic broken

**Always import `REGISTRY` or `getAllCellTypes()` from `@/pams/registry`.**

---
