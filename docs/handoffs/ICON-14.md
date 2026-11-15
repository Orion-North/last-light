> Historical handoff: Windows packaging and its ICO derivative have since been
> removed. The SVG/PNG browser icons remain.

# ICON-14 — Last Light application mark

Owned changes: `public/icons/**`, `desktop/main.js`, the `package:win` icon option in `desktop/package.json`, this handoff. Package version is preserved.

An original code-native vector depicts a readable cream rover silhouette, broad solar deck, three wheels, and warm setting sun against dark Mars. The rounded tile has transparent outer corners. No remote asset, AI raster generation, external upload or new dependency was used. SVG is the design master; PNG derivatives were rendered using installed librsvg and the multi-resolution Windows ICO using installed ImageMagick.

Web integration paths for root:
- `public/icons/favicon.svg` — SVG favicon/master, 512 viewBox.
- `public/icons/favicon-32.png` — 32×32 PNG fallback.
- `public/icons/icon-192.png` — 192×192 installable icon.
- `public/icons/icon-512.png` — 512×512 icon and desktop window icon.
- `public/icons/last-light.ico` — four real frames: 16×16, 32×32, 48×48, 256×256.

Suggested ledger provenance: “Last Light rover and setting sun icon”; original SVG authored by Codex for this project; PNG/ICO derivatives generated locally; no third-party source or licensing claim.

Desktop packaging now passes `--icon=../public/icons/last-light.ico` to Electron Packager. `BrowserWindow` uses the bundled `game/public/icons/icon-512.png`. The existing Windows Actions workflow invokes `npm run package:win` from `desktop`, so its executable icon uses this option without workflow changes. Existing preparation copies all `public` assets into the stage, including icons.

Checks actually run: rendered and visually inspected the 512 PNG; `identify` verifies all PNG dimensions and all four ICO frames; desktop permission policy test passes; desktop/main syntax passes; `desktop/prepare.mjs` succeeds and stages the icons. Windows executable packaging/native shell appearance were not run locally; the Windows Actions build remains the verification of executable resources. HTML/manifest tags and asset ledger remain root-owned.
