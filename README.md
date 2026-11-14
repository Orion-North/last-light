# Last Light

A playable, real-time 3D story about NASA's Opportunity rover: discovery,
attachment, a fading signal, and the things that remain.

**Playable v0.5.** [Play on GitHub Pages](https://orion-north.github.io/last-light/). Built with parallel Codex agents. The game uses NASA's
textured rover model, a navigable original Mars environment, an original adaptive
score, and a complete three-act story. No account or AI API is needed by the game
itself. A hosting provider may apply its own access gate.

## Run locally

Install Node.js 22 or newer (development used 24.22.1), then:

```sh
node scripts/serve.mjs
```

Open `http://localhost:4173`. No dependency installation is required: the pinned
Three.js 0.180.0 runtime and necessary loaders are vendored with the MIT license.

```sh
node scripts/check.mjs
node tests/engine/game.test.js
node tests/engine/session.test.js
node tests/engine/music.test.js
node tests/engine/controller.test.js
node tests/engine/surface.test.js
node scripts/build.mjs
```

The build writes `dist/`, ready for any static host. Serve over HTTP; ES modules
and the rover model will not work reliably by opening `index.html` as a file.
WebGL 2 is required for the 3D experience; an explicitly labeled accessible story
fallback is available if graphics fail. The draft adds 5.08 MB of 1K scanned surface maps to the original assets;
the detailed NASA model alone is 11.91 MB. The optional poster adds about 2 MB.

## Play

- Controller-first: left stick drives during travel and selects in menus; right stick looks and aims. Keyboard/touch remain supported.
- Follow six local observation markers. Assisted driving is available.
- Drive, reveal a geological feature and hold the view steady, choose a memory, then swipe a memory upward through the uplink terminal. Geological targets are
  authored 3D reconstructions with readable layers and grains. There is no
  photography system. Brief thoughts appear as centered cinematic captions; discovered science and
  memories remain available in the optional journal (J / □).
- A visible signal receipt accompanies Earth's replies. Later calls go
  unanswered, including with sound off. Pause cancels pending sends safely.
- Conditions are qualitative, not a survival countdown. Exploration does not
  consume power. Your chosen memories appear again in the ending.
- DualSense: left stick or R2/L2 drive; right stick looks; × interacts; D-pad
  selects; ○ goes back; △ resets camera; Options pauses.
- Terrain rumble follows surface roughness, slope load, speed, and blocked wheels.
  Optional original DualSense USB touchpad uploads and adaptive triggers are in Settings. iPad uses right-stick or button uploads. Hardware
  feel remains untested; see [controller support](docs/CONTROLLERS.md).
- Sound begins on entering the story unless you opt out; mute anytime.
- Escape opens settings and pauses. Reduced motion, restart, and local progress
  saving are included. The ending contains your downloadable memory archive.

The 10–15 minute target is provisional after reducing mandatory reading;
exploration and time spent in the optional journal change the duration. All thoughts,
conversations, navigation, terrain, and power/signal displays are dramatized.
Mission dates and science link to primary NASA sources.

## Project guide

- [Short plan](docs/PLAN.md) and [architecture](docs/ARCHITECTURE.md).
- [NASA sources](docs/SOURCES.md), [asset credits](public/ASSETS.csv),
  [inspiration](docs/INSPIRATION.md), and [soundtrack design](docs/SOUNDTRACK.md).
- [Shared agent instructions](AGENTS.md), [collaboration workflow](CONTRIBUTING.md),
  and [task board](docs/TASKS.md).
- [Verification and limitations](docs/VERIFICATION.md).
- [iPad Air playtest](docs/IPAD-PLAYTEST.md) and [GitHub Pages deployment](docs/DEPLOYMENT.md).

Open this folder in Codex, Claude, or Antigravity. Their entry files point to the
same shared instructions. Use bounded tasks and separate worktrees or disjoint
files; one integrator manages shared contracts and publication.

Rover model: NASA/JPL-Caltech. This independent project is not affiliated with or
endorsed by NASA. Third-party notices remain with their assets. Source-code
licensing is undecided; do not assume the project's code or artwork shares NASA
material's usage terms.
