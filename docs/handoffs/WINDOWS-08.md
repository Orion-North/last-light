# WINDOWS-08 — portable Windows preview

Implemented on shared develop/v0.8 without commits. This explicit user expansion
supersedes the earlier web-only desktop deferral. Allowed paths only:
desktop/**, .github/workflows/windows.yml, docs/WINDOWS.md, this handoff.

## Result

Isolated desktop/package.json/package-lock.json pins Electron45.3.2 (official
stable queried November14,2026) and @electron/packager20.3.0. Local npm CI verified.
No root package, game code or game dependency changes. prepare.mjs copies the full
game/asset/vendor tree into ignored stage/game. Packaging uses ASAR and produces
portable LastLight-win32-x64 with LastLight.exe; no installer/admin requirement.

Custom secure standard last-light://game protocol preserves module/asset URLs,
contains decoded paths and sets CSP (self scripts plus import-map hash).
Renderer sandbox/isolation enabled, Node integration disabled. Network resources,
webviews, remote navigation and scripted popups denied. Isolated preload exposes
no bridge; only trusted HTTPS link clicks send a narrow IPC message checked
against exact app main frame before external-browser opening.

HID permission checks are restricted to local app main frame. Existing game
Settings requestDevice flow opens native confirmation with only original Sony
VID054c/PID0ce6 and504-bit USB gamepad descriptor. Device permissions require the
exact chosen interface this run, never broad VID/PID automatic grants. Cancellation,
unknown devices, Bluetooth descriptor and Edge fail closed. Existing game driver
owns report bytes and lifecycle reset; wrapper adds no HD audio/haptics or new
protocol modes.

Windows workflow triggers relevant main/develop source pushes or manual dispatch,
uses npm ci, desktop policy/game tests, Windows package assembly then real packaged
launch smoke, and only then ZIP+SHA256 upload artifact. Main pushes also publish
windows-preview prerelease assets; manual publish_release=true does likewise.
Stable asset name: LastLight-Windows-x64.zip. Release notes record build commit
and Actions run. Artifact retention30days. Root owns committing/pushing/monitoring
Windows CI; this lane did not publish anything.

## Checks actually run

- desktop/tests/policy.test.js:4/4 pass (origin, path traversal, HID allowlist,
  external links).
- npm ci with generated lock: successful,52packages.
- prepare.mjs: successful full game copy,21MB.
- @electron/packager cross-assembly Windows x64: successful, Electron45.3.2.
  Portable folder378MB, executable239MB, ASAR21MB. Verified ASAR contains host,
  preload, game main/index, rover GLB, vendored Three and asset ledger74entries.
- Pinned Electron45.3.2 Linux hidden smoke: exit0, secure:true, hid:true,
  sandbox:true, game:true, world:ready, local:true, scriptMime:true, cssMime:true,
  rover:true, rendererErrors:[]. Strict smoke catches console errors, uncaught
  CDP exceptions, preload/load failures and verifies actual NASA3D readiness. It
  caught and fixed CSP blocking embedded GLB texture blobs; connect-src allows
  blob while webRequest still restricts blobs to own local origin. Normal Chromium sandbox was retained;
  command sandbox initially prevented startup, then approved outside-sandbox run
  succeeded. No --no-sandbox or security weakening was used.
- JS syntax checks main/preload/prepare/smoke and git diff --check: pass.

## Limits and next action

Windows executable assembled but not run on this Linux host. Windows CI will run
the packaged smoke before publication. No physical DualSense, Windows HID access,
force feel, unplug cleanup or actual USB dialog tested. No code signing or Store
packaging; preview is unsigned. Hardware output and force feel remain explicitly
experimental. Source references/build/user instructions: docs/WINDOWS.md.

Temporary tools/node_modules/stage/release are ignored beneath desktop; only
source, lock, tests, documentation and workflow should be committed. Root should
publish the workflow and monitor Windows CI, then share the stable release URL
and exact checksum once smoke/package/upload complete.
