# Last Light

A playable, real-time 3D story about NASA's Opportunity rover: discovery,
attachment, a fading signal, and the things that remain.

**Playable v0.8.** [Play on GitHub Pages](https://orion-north.github.io/last-light/). Built with parallel Codex agents. The game uses NASA's
textured rover model, a navigable original Mars environment, an original adaptive
score, and a complete three-act story. No account or AI API is needed by the game
itself. A hosting provider may apply its own access gate.

[Download the Windows preview](https://github.com/Orion-North/last-light/releases/download/windows-preview/LastLight-Windows-x64.zip) · [Windows setup](docs/WINDOWS.md)

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

- Two brief, skippable passages carry the mission from 2004 to 2015 and 2018; mission-age captions and a subtle rover finish retain those years.
- A skippable twelve-second in-engine opening introduces the rover, geological evidence and sending memories home. Reduced motion keeps the view still.
- Scene meaning and the next action sit in the main composition. Close rover framing and a compact left-side glyph guide keep attention on the world.
- Release both triggers, then squeeze L2 + R2 together to send. Pressure closes the instrument; a brief full squeeze commits once. No touchpad click or cursor aiming. A button alternative remains available.
- Controller-first: left stick drives during travel and selects in menus; right stick looks and aims. Keyboard/touch remain supported.
- Follow six local observation markers. Manual travel is about 35% faster, with gentle acceleration and braking; assisted driving is available.
- Drive, reveal a geological feature and hold the view steady, choose a memory, then squeeze both triggers to send a memory home. Geological targets are
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
  Optional original DualSense USB adaptive triggers are in Settings. iPad uses standard trigger squeezes or the button alternative. Hardware
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
