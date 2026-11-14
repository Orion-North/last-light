# VIEW-10 handoff

Owned changes: `src/ui/landscape.js` and this handoff. No commit or publication.

Added `revealFirstView()` to transition from close rover framing toward a raised horizon composition. `previewMemory(choiceId, sceneId)` accepts first-morning horizon/ground only, preserving the rover as anchor while changing elevation and aim. Identical repeated requests do nothing. `focusRover()` clears the preview; generic inspect preserves an active first-view preview when no geological target exists. Resize refits the active authored view; reduced motion snaps to the same endpoint.

Added idempotent `setRemoteView(active)` for game mode. It stops movement/routes, clears look/investigation/contact state, flushes residual pointer damping, disables orbit/drive/look and uses a wider, distant view of the stationary rover on Mars. This is an authored remembered view, not a literal camera at Earth. Exiting restores the usual close frame; title/ending/reset clear remote mode. Pause, canceled contacts and intro cleanup retain disabled remote controls. No new assets or draw calls.

Integrator owns calls and explanatory presentation. Call remote mode after setMode/setWorld, true only for Earth recovery scenes. It is safe on every render. Call reveal on the first observation action and preview on first-scene choice focus. FocusRover clears preview on scene change. Existing first-scene generic inspect will preserve the revealed view, but contact framing can intentionally replace it with close rover framing; the chosen title/token must carry that continuity in UI.

Verified: Node `--check src/ui/landscape.js` and scoped `git diff --check` passed using bundled Node. Read lifecycle/resize/input paths. No browser/rendered composition, physical controller, motion comfort or actual device-performance check in this lane; root should verify horizon/ground are visibly different at desktop and portrait aspect ratios and that Earth framing survives pause/resize/repeated renders.
