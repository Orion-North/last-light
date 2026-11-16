# First-playable architecture

The user explicitly chose real-time 3D. The original 2D proposal is superseded.

**Runtime:** Browser ES modules, JavaScript with JSDoc, Three.js 0.180.0, WebGL 2,
semantic HTML/CSS overlays, and Web Audio. Vendored modules avoid CDN dependencies
at play time. A small Node server/build script replaces the proposed Vite setup;
there are no npm dependencies to install. Node 24.22.1 was used for development.

**Assets:** NASA/JPL-Caltech's actual textured MER model (11.91 MB), original
procedural terrain, rocks, sky, dust, and tracks. The generated landscape is a
labeled graphics-failure fallback only. The budget is revised from under 10 MB to
under 20 MB for the first version to retain the detailed rover. GLB optimization
and mobile profiling remain future improvements.

## Modules

| Path | Responsibility |
| --- | --- |
| `src/content/story.js` | Twelve scenes, choices, memory text, primary source register |
| `src/engine/game.js` | Pure, guarded observe/choose/transmit/advance state machine |
| `src/session.js` | Validated save reconstruction from legal choices |
| `src/ui/landscape.js` | Real 3D world, NASA GLB, camera, terrain collision, driving, waypoints |
| `src/ui/style.css` / `integration.css` | Responsive narrative and mission overlays |
| `src/audio/sound.js` | Original adaptive score, ambience, cues, audio lifecycle |
| `src/main.js` | DOM, input, scene/world/music integration, dialogs and saving |
| `scripts/` | Local HTTP preview, syntax/content/asset checks, static packaging |

The environment is a compact artistic reconstruction, not a surveyed Martian
location. Six navigation goals make observations spatial; collision-aware assisted
driving offers an alternative to manual input. All valid narrative paths lead to
the historical outcome. Choices affect the memory archive, not survival.

Scene state is independent of rendering and audio. Losing graphics or sound does
not corrupt the story. Reload restores narrative progress; rover position resets
to the local starting point. Restart clears the narrative and 3D journey. Local
storage is optional; failure does not prevent play.

The soundtrack uses original synthesized instruments and motifs, without external
music downloads or live generation. It changes with narrative phase; mute/pause
must silence both scheduled music and ambience.

## Verification

Pure state tests cover all 2,048 real choice paths, persistence, invalid actions,
pause/restart, and audio lifecycle. Browser QA covers the integrated experience;
see [the verification record](VERIFICATION.md) for observed behavior and limits.
No claim of every device/browser is implied by a successful desktop preview.

The static build preserves relative asset paths and third-party licenses. Sites
identity is tracked in `.openai/hosting.json`; credentials are never stored in Git.

## v0.2 input and presentation

`src/input/controller.js` owns browser Gamepad polling, optional USB WebHID
trigger effects, short terrain rumble, and hardware lifecycle cleanup.
`src/input/surface.js` samples the rendered height surface for roughness and
simplified incline load; `landscape.js` emits that telemetry during travel.
The renderer exposes `setLook({x,y})` for right-stick camera movement.
`main.js` combines keyboard/touch/gamepad drive input, maps controller actions to
the visible interaction or modal, and retains the existing state/save contract.

Brief scene/choice fields are presentation-only additions. Scan → choice sends
immediately through existing CHOOSE and TRANSMIT transitions; legacy saved
transmit phases remain playable. Full narrative and science live in a paused
journal. `play.css` supplies the compact HUD and the shortened ending. No native
desktop runtime or waveform haptics implementation is included.

## Photography in the playable world

The discovery camera uses the same scene, terrain, objects, lighting and rover
as driving and investigations. Its eye moves to the actual rover mast and aims at
existing world targets. It does not load a separate scene or substitute deck.
Original NASA images appear only after capture. Missing data belongs to the
historical image, not to the live camera view. The same upload terminal and
musical call/reply follow the photograph. Source details remain in Memories.

`world-geology-refinement.js` improves the existing landmark meshes and grains
in place. The refinements are visible while driving and investigating as well as
photographing. Tool contact surfaces and collision remain part of the same world.
