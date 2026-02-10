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
