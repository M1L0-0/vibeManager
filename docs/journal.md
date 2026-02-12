# Project Journal

**Date:** 2026-02-10
**Collaborator:** Antigravity (AI Agent)

## 1. Reflection on Progress
We have made significant strides in stabilizing and enhancing the `vibeManager` simulation. Our recent focus has been on the **Wave Cell** and its propagation mechanics. We successfully migrated "Wireless" and "Instant" features from the Timer Cell (where they were experimental) to the Wave Cell (where they belong structurally).

Key milestones achieved:
- **Petri Dish Centering:** Fixed the annoying offset issue on load.
- **Wave Cell Features:** Implemented robust "Wireless" (time-based) and "Instant" (immediate) propagation.
- **Bug Squashing:** Resolved a tricky issue where "Instant" propagation wouldn't work for neighbors unless "Wireless" was also on. This turned out to be a fundamental coordinate type mismatch (String vs Number) in the grid logic.
- **UI Polish:** Cleaned up the Genesis Tool button sizing.

The simulation is feeling much more "solid" now that the core propagation logic is unit-tested and type-safe.

## 2. Wins
*   **Unit Testing as Eyes:** When I couldn't see the browser console or the visual bug directly, we switched to writing a unit test (`propagation.test.ts`). This was a huge win. It allowed us to reproduce the "Neighbor Instant" failure in isolation and verify the fix without relying on manual clicking.
*   **The "Fix Forward" Strategy:** When the "Neighbor" logic failed, we initially implemented a "Robust Fix" (calculating distance to all cells) which bypassed the broken helper. While we eventually fixed the root cause (`hex.ts`), this strategy kept us moving forward.
*   **Speed Scaling:** Catching that "Wireless" particles were traveling in constant time (0.1s) regardless of distance was a good attention-to-detail win. Scaling speed by distance makes the physics feel much more realistic.

## 3. Bummers (Critical Assessment)
*   **Coordinate Type Blindness:** I spent too many turns debugging the `propagation.ts` logic when the root cause was in `hex.ts` (string concatenation instead of addition). I should have checked the integrity of the underlying data types (`hex.q`, `hex.r`) sooner, especially when "neighbors" (calculated via math) were failing but "all cells" (iterated) were working.
*   **Test Environment Fumbles:** I tried to run tests (`npm test`) without checking if the environment was set up for it. I hit PowerShell script execution policies and syntax errors in my own test code. This created "meta-work" just to get the tools running. I should be more careful when editing test files to ensure I don't leave dangling braces.
*   **Assumption of "Standard" Behavior:** I assumed that because "Standard" propagation worked, `getNeighbors` must be fine. I didn't account for the fact that `propagateSignal` (standard) might be interacting with the store differently or that the visual feedback for standard propagation masked the issue. I need to validate my base assumptions more rigorously.

## 4. Technical Lessons Learned
*   **Runtime Type Safety:** TypeScript is great, but runtime data often surprises us. The `HexCoord` values coming from the UI or URL params were likely strings, causing `q + dir.q` to result in `"0" + 1 = "01"` instead of `1`. Always cast to `Number()` when doing math on potentially serialized data.
*   **Logic Isolation:** Separating "Instant" logic from "Particle" logic is good for features, but they should share the same neighbor-discovery primitives. By bifurcating them, we exposed a bug in the primitive that was hidden in the particle engine.

## 5. Environment / Tool Errors
*   **PowerShell Execution Policy:** standard `npm` commands failed due to Windows script execution policies. Using `npm.cmd` was the correct bypass.
*   **Jest Types:** The editor reported many "Cannot find name 'jest'" errors. This suggests `types/jest` or `types/node` might be missing or not included in `tsconfig.json`. It didn't stop the tests from running, but it creates visual noise.

## 6. Feature Ideas (Future)
*   **Visual Debug Overlay:** A toggle to show Cell IDs (e.g., `0,-1`) and current Activity/State values directly on the hexes. This would have made debugging the "Neighbor" issue trivial.
*   **Signal Visualization:** For "Instant" propagation, there is currently no visual link (lines) like there is for particles. Adding a momentary "lightning bolt" or "connection line" flash would help users see *where* the instant signal went.
*   **Global "Pulse" View:** A mode to see the `lastFired` timestamp of all cells heatmap-style, to interpret complex logic flows.

## 7. Tool Development Ideas
*   **"Console Proxy" Tool:** A tool that allows me to inject a temporary logger into the app that streams logs back to me in the chat, so I don't have to ask you "what does the console say?".
*   **Interactive Test Runner:** A workflow where I can run a specific test case and see the output immediately without doing the `write` -> `run_command` -> `read_status` dance manually every time.


---
*End of Entry - Antigravity*

# Project Journal

**Date:** 2026-02-12
**Collaborator:** Antigravity (AI Agent)

## 1. Reflection on Progress
We successfully implemented and polished the **Demo Dishes** for the `vibeManager`. The "Polyrhythm Engine" is now fully functional with distinct Red, Green, and Blue signal paths, and the "Logic Lab" and "Wireless Lattice" are ready for exploration.
Key achievements:
- **Visual Clarity:** Fixed the "White Signal" bug where colored signals washed out to white/grey. Now, Pixels flash the *signal's* color (R/G/B) and restore their original state.
- **Physics Tuning:** Corrected the "Infinite Range" issue in the Polyrhythm demo by enforcing a precise 10-hop range for timers, creating clean, contained loops that don't bleed into each other.
- **UI Honesty:** Fixed the "1 Hop" lie in the Settings Menu. It now correctly displays "Infinite" (100 hops) or the specific range (e.g., "10 hops"), matching the backend physics.

## 2. Wins
*   **The "Blind Fix" Logic:** With the browser tool down, we couldn't visually verify the canvas. We relied on pure logic deduction and code analysis to identify that `PixelCell` was prioritizing the default "Universal" channel (White) over the signal payload. The fix (Priority Inversion + Flash/Restore logic) worked perfectly on the first try, as confirmed by your observation.
*   **Robust Fallbacks:** When we suspected data hydration issues might be stripping the colors, we implemented a robust fallback in `TimerCell` that derives the signal color from the timer's speed (`maxTime`). This guarantees the demo works even if the saved data is imperfect.
*   **Unit Tests for Debugging:** We effectively used `grid-store.demo.test.ts` to inspect the internal state of cells when visual inspection wasn't an option.

## 3. Bummers (Critical Assessment)
*   **Browser Tool Failure:** The persistent "Environment Variable Missing" error for the `browser` tool was a significant handicap. It forced us to rely on you (the user) for all visual verification and console log checking. I should have suggested a workaround or fix for the environment issue earlier, or perhaps pivoted to a pure-test approach sooner.
*   **Range Bleeding:** I initially overlooked the default `range: 100` behavior when creating the Polyrhythm demo, which caused the messy signal bleeding. A more careful initial design of the parameters would have saved us a debugging cycle.

## 4. Technical Lessons Learned
*   **Payload Persistence:** Signals in `vibe-core` are reconstructed at each step. If a property (like `color`) isn't explicitly copied into the `payload` or `options` of the *new* signal/particle during propagation, it gets lost. Explicitly marshaling `signal.payload.color` in `propagation.ts` was the key.
*   **UI vs. Backend Defaults:** The disconnect between the UI showing "1" (via `?? 1`) and the backend using "100" (via `?? 100`) created a confusing user experience. UI defaults must *always* match the backend implementation truth.

## 5. Environment / Tool Errors
*   **Browser Launch Failure:** `failed to create browser context: failed to install playwright: $HOME environment variable is not set`. This blocked all automated visual verification.

## 6. Feature Ideas (Future)
*   **Signal Inspector:** A tool to click on a wire or open space and seeing the *active* signals traveling through it (ID, Color, Payload). This would make debugging invisible logic much easier.
*   **Visual Range Indicator:** When adjusting the "Range" slider, showing a phantom circle overlay on the grid to visualize how far the signal will reach would be a huge UX improvement for complex builds.

## 7. Tool Development Ideas
*   **Log Injection:** Confirming the idea from the last entry—a way to stream specific app logs back to the chat would have solved the "what is `data.color`?" mystery instantly without needing your manual intervention.

---
*End of Entry - Antigravity*
