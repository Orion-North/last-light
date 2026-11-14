# CAMERA-04 / ART-04 landscape integration

Owned paths: `src/ui/landscape.js` and this handoff. No additional materials module. Local `develop/v0.4`; no commit, main change, publication, or interaction with the user's live browser.

Motion/camera:

- Uses `createDriveMotion().step({forward,turn,assisted},delta)` every frame, including manual release/braking frames. Assisted motion retains exact previous speed/turn scales.
- New public `stopDrive()` clears input, route, and internal velocity immediately. Called on pause/blur, mode change, zero power/signal, context loss, reset, and arrival. Collision resets velocity; actual displacement speed (zero when blocked) feeds surface/haptic events. A final zero-speed event is emitted on stopping.
- Starting manual/assisted movement during inspection returns smoothly to the remembered pre-inspection orbit/zoom. Camera destination follows the rover during that transition. Reduced motion places it immediately. Explicit camera reset, user orbit, target retention, portrait fitting, collision and route contracts remain available.

Visuals:

- Three separately eroded rock geometries replace the repeated smooth sphere: broad fracture planes, asymmetric erosion, welded vertices, and geometry-derived normals. They remain instanced (three rock-field draw calls), with brighter varied mineral tint rather than dark silhouettes.
- Slightly brighter neutral fill/environment response keeps rock relief and rover hardware readable. Pixel ratio cap remains 1.5.
- Shared asynchronous PBR loader configures sRGB albedo / linear data maps, bounded 4× anisotropy, repeat, normal strength, cleanup, and procedural fallbacks. Final asset paths and budgets recorded below.

Checks actually run:

- Runtime Node `--check src/ui/landscape.js`: passed.
- All seven `tests/engine/drive-motion.test.js` tests: passed.
- Temporary extracted-landscape integration probe: gradual start, continued braking after input release, exact rest, retained follow-camera tween during movement, and collision-aware zero-speed telemetry passed.
- Generated all three rock variants using the vendored Three.js and BufferGeometryUtils in Node. Every position, normal, and UV finite; 183 indexed vertices per variant, bounding radii 1.105/1.131/1.108 m before instance scale.
- Reproduced original seeded rock distribution and new target collision circles; all six sequential goals remained reachable on the assisted-drive 0.8 m grid, including midpoint clearance at 1 m margin.
- `git diff --check -- src/ui/landscape.js`: passed.

Limits: these are source/numeric checks, not browser rendering or physical controller/iPad tests. Integrator should preview the draft separately from the user's active v0.3 game, verify map loading and visual balance, orbit/zoom return, paused/disconnected drift, all routes, and iPad performance. Actual iPad Safari GPU memory and frame rate remain unmeasured.

## Independent spatial scrutiny (source review)

1. Destinations still depend heavily on floating markers in a fairly uniform rock field. Distinct physical silhouettes and a deliberate approach apron would make the outcrops understandable before UI naming; numerical route reachability does not establish navigation clarity.
2. Steering remains chassis-relative under a freely orbiting camera. After a wide orbit, stick-forward can feel lateral or camera-facing. A small grounded heading cue or explicit camera reset could clarify this without silently overriding the player's orbit.

The current inspection camera always looks at its OrbitControls pivot, which is the geological feature. Therefore an angular “aim confidence” would remain effectively one and cannot honestly support an aiming challenge. A grounded viewpoint task could instead measure whether the feature's exposed face is readable at a useful distance and let the player deliberately inspect after releasing the stick. Actual reticle aiming would first require decoupling camera view direction from the observation pivot, with touch/keyboard equivalents. This initial review informed the subsequently authorized viewpoint-based investigation described below; independent reticle aiming remains unimplemented.

## Scanned surfaces and sky integration

ART-04 supplied Poly Haven CC0 maps: `public/textures/ground/{albedo,normal,roughness}.jpg` from rocks_ground_05 (3 m scan), and corresponding `public/textures/rock/` maps from rock_boulder_cracked (1.4 m scan). All six JPEG dimensions verified from headers as 1024×1024, totaling 5,075,233 bytes. Estimated RGBA8 texture residency with mipmaps is 32 MiB for this added set; this excludes the existing rover/environment/render targets and is not a measured GPU allocation. Ground repeats every 3 m; rock repeats approximately per 1.27 m. Rock maps are shared by all field instances, pebbles, laminae, backer and Berry Bowl plate. No extra scanned mesh/downloads in this lane. Original procedural maps remain error fallbacks. Asset provenance is ART-04/root-owned.

Added a weathered backer to Last Chance and reduced small background rubble/pebbles on the two approach aprons without changing random consumption or collision circles. Integrated SKY-04's `createSky(THREE,{own,sunDirection})` module in place of the inline sky, preserving palette uniforms and PMREM setup. Sky module is owned by SKY-04; no overlapping writes.

## Authorized active investigation

Public contract: `setInvestigation(activeBool)`. Only Last Chance and Berry Bowl activate; setter starts after `inspect()`, stops all drive motion, and begins oblique to the actual exposed feature. Ending investigation preserves the observation target. Driving is blocked while active; orbit, touch drag, zoom, and `setLook()` remain available. Parent must coordinate the camera-reset action while active (end investigation first, or disable that action).

While active and unpaused, emits bubbling `inspection-sample` events about 10 times per second with `{quality, steady, hint}`:

- Last Chance quality uses the actual camera-to-feature direction against the layered face's +Z normal. Berry Bowl uses the +Y normal of the grain-bearing upper surface. Broad smooth angle thresholds reward a readable physical view, not arbitrary reticle alignment.
- Distance quality uses the actual range relative to the existing FOV/aspect fit; this preserves attainability in phone portrait. Hints are “Turn toward the layered face”, “Look down at the grains”, “Move closer”, “Pull back a little”, and “Hold this view”.
- `steady` measures actual camera direction and relative camera movement over each sample interval, so controller, keyboard, mouse and touch are treated alike. Camera tweening is never steady. Root owns dwell accumulation, accessibility assistance, progress, interpretation and completion; the renderer never awards an answer automatically.
- Scientific honesty: this is viewpoint/readability interaction with illustrative geometry. It does not simulate rover instruments, mineral identification, a real surveying task, or independent proof of ancient water.

Additional checks actually run:

- Isolated investigation probe passed for oblique starts, exposed-face improvement, distance hints, actual-movement steadiness, both targets, and explicit stop retaining the target.
- JPEG header dimensions/byte totals verified in Node. Python image inspection was unavailable because Pillow is not installed; no package installed.
- Full `scripts/check.mjs`: passed (28 JS syntax checks, 12 scene contracts, local entry assets, NASA GLB and vendor license).
- Runtime syntax and scoped whitespace checks repeated after final integration: passed.

Remaining verification: shader compilation, actual PBR appearance, asset network requests, repeated investigation lifecycle, physical controller feel, full browser routes, mobile target framing and GPU/performance measurements require the integrator's separate preview/device playtest. No live-game browser interaction performed.

## Dry-surface correction after browser review

Integrator observed an unacceptable broad wet/silver reflection. A high material roughness scalar did not prevent dark scanned roughness pixels from producing low final roughness. Added a pinned Three.js shader remap after `roughnessmap_fragment`: ground final roughness is `[.9,1]`; rock/outcrop final roughness is `[.85,1]`. This preserves restrained map variation with a physically dry floor. Ground/rock metalness is explicitly zero, environment intensity is reduced to .18/.35 respectively, and ground normal strength drops to .45 to avoid glitter. No source image edits or additional textures.

Runtime syntax, whitespace, and isolated shader-source checks passed: exact pinned chunk exists and is replaced, and map inputs across `[0,1]` keep the promised high roughness floor. Actual browser shader compilation/reflection appearance remains the integrator's check after reload.

## Tiling and geological readability refinement

Reviewed the integrator's actual `last-light-v04-draft.jpg`: distant ground resolved into regular gravel rows; strong red/orange scanned fractures competed with authored lamination. Ground now blends the original near 3 m sample with a rotated differently scaled sample under broad spatial variation. Fine albedo contrast fades from 12–55 m, normal detail from 10–45 m; low-frequency tones preserve distant terrain form. Cost is one additional albedo lookup plus bounded math, no additional image/geometry allocations. The high roughness floor remains in the composed shader.

Authored sediment materials now use lighter, desaturated tan-gray base colors, low-contrast luminance-derived scanned grain, and .14 generic normal strength. This leaves physical lamination relief responsible for readable crossing layers instead of treating unrelated scanned cracks as evidence. Field rocks retain their scanned character. Root's palette-dependent environment fading is preserved.

Syntax/whitespace and composed pinned-shader source probes passed: terrain map/normal replacements, sediment map replacement, and dry roughness floor all present. Browser shader compilation and improved final visual quality remain the integrator's verification; no browser touched in this lane.
