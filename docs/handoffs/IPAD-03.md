# IPAD-03 — tablet touch layout

Owned paths: `src/ui/play.css` and this handoff. Landscape ownership released to integrator. No commit or publication.

Changes:

- Appended capability-based `pointer:coarse` overrides, preserving existing fine-pointer desktop layout.
- Touch action buttons, choices, header controls, and directional pad now have at least 48 px targets. Drive buttons retain touch-action behavior and suppress text selection/callouts; the existing input model is unchanged.
- Added safe-area-aware header/edge/bottom spacing, stable viewport-height limits, scrollable interaction/ending/modal panels, and visible touch/controller hints.
- At up to 900 px width, controls occupy a separate full-width bottom lane and the interaction dock sits above that lane. At up to 700 px, a predictable two-column action row, four-button drive row, and hint row prevent the previous 601–850 px side-by-side overlap.
- Wider tablet landscape keeps the dock left and controls right, with bounded widths. Tablet portrait puts mission conditions below the heading; compact layouts remove the optional brand subtitle to protect header controls.
- A shorter-height touch rule tightens text/panel spacing. No device user-agent detection, new controls, packages, or assets.

Checks actually run:

- `git diff --check -- src/ui/play.css`: passed.
- Inspected stylesheet ordering, global `box-sizing:border-box`, and `[hidden] { display:none !important }`; new grid/flex rules preserve hidden controls.
- Reviewed lane dimensions at 820×1180 and 1180×820 plus 390×844: 48 px controls fit the allocated lanes, with dock clearance reserved independently. This was arithmetic/source review, not a browser rendering test.
- Checked for installed CSS parsers; none available. Did not install anything. Browser parse/computed-style validation remains with integrator.

Limits / next action:

Integrator owns browser checks at 820×1180, 1180×820, shorter browser-chrome heights, 601–850 widths, and 390×844. Check full choose/transmit/receipt text, visible focus, journal/settings, and hidden controller drive pad. Actual iPad Safari safe-area reporting, browser chrome, multitouch handling, GPU load, and controller feel require the user's device test. Touch target size and viewport emulation alone do not establish physical-device behavior.

## Explicit touch-preference integration

Converted the appended touch rules to `body.touch-controls` selectors; width/height breakpoints remain intact. The integrator owns auto-detection using `any-pointer:coarse` and the persistent “Larger touch controls” setting. This makes the exact layout available for desktop-browser QA and iPad with attached input devices. An explicit touch preference now displays the drive pad even alongside `controller-connected`, supporting mixed input. Without the class, original fine-pointer styling applies. No blocks duplicated. Repeated `git diff --check`: passed; browser computed-style verification remains with integrator.
