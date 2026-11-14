# SKY-04 — Martian atmosphere

- Agent / owner: SKY-04
- Branch / worktree: shared checkout, `develop/v0.4`.
- Allowed paths: `src/ui/sky.js`, this handoff.
- Changes: a self-contained static sky shader adds layered dusty horizon haze, subtle stretched high-altitude veils, a localized cool halo around the low sun, and a softened solar disk. Existing palettes retain control of transitions, including darkness and storms. Effects use procedural arithmetic without texture fetches, animation, raymarching, or postprocessing.
- Files changed: `src/ui/sky.js`, `docs/handoffs/SKY-04.md`.
- Interface: `createSky(THREE, { own, sunDirection })` returns `{ mesh, uniforms }`; uniforms retain the existing `top`, `horizon`, `lower`, `sunDirection`, `sunColor`, and `sunStrength` keys. The mesh geometry and material can be reused for the existing PMREM. GEO-03 integrated this contract.
- Checks actually run: bundled Node `--check src/ui/sky.js` passed; `node scripts/check.mjs` passed (28 JS syntax checks, scene contracts and asset checks).
- Unrun checks / limitations: GLSL compilation and visual appearance have not been checked in a browser; the procedural artistic interpretation needs review across day, storm, sunset, and night, and real iPad M4 performance is unmeasured. The existing PMREM is created once and does not follow subsequent palette changes.
- Commit: none.
- Next action: integrator should run integrated browser/shader checks and review on target hardware before publication.

Integrator review: shader compiled and rendered in the isolated local browser.
NASA color reference verified: [What do sunrises and sunsets look like on Mars?](https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/).
The shader is an artistic approximation of dust scattering, not a physical
atmosphere simulation. Static environment lighting now fades with storm/night
palettes to avoid bright daytime reflections in darkness.
