# Windows preview

A portable Windows x64 edition bundles the same game and assets. It adds a
Chromium/Electron host for trying the existing experimental original-DualSense
USB trigger resistance and vibration. It does not add native HD haptic audio.
The web edition uses the same effects when its browser supports WebHID.

## Try it

Download `LastLight-Windows-x64.zip` from the **Build Windows portable app**
Actions run, or from the `windows-preview` prerelease when one is published.
Extract the entire ZIP, open `LastLight-win32-x64`, and run `LastLight.exe`.
Keep its supporting files together. No installer or administrator access is needed.
The preview is unsigned; Windows may show its usual unknown-publisher prompt.
Only run a build you trust. It is not Microsoft Store packaged or code signed.

Connect an **original Sony DualSense by USB cable**, press a controller button,
open the game's Settings, enable vibration, and select **Connect DualSense USB
features**. Confirm the matching device in the native dialog. L2 + R2 squeeze
uploads use standard analog input; USB opt-in adds experimental resistance and
a finite trigger-vibration crescendo near full charge. Release both to send.
Cancel or use **Disconnect USB features** at any time. Pausing, blur, leaving the
upload, or disabling feedback releases resistance. The game retains keyboard,
mouse, screen-button and standard-controller alternatives.

Bluetooth and DualSense Edge are deliberately excluded from adaptive output.
Other standard controllers can provide ordinary input and supported rumble.
Other controller software or Windows HID access restrictions may prevent the
USB connection; close competing controller tools before retrying. Physical
force feel and Windows USB hardware behavior still require a real-device test.
The desktop wrapper alone does not make native PS5 HD haptics available.

Game saves live in Electron's per-user app data, separately from browser saves.
The portable folder is movable, but saves are not stored alongside the executable.
The game runs from bundled files; no live website or account is required.
Explicit HTTPS source-link clicks open the system browser.

## Build and verify

Use Node 24 and npm on Windows. No root-package changes are needed:

```powershell
cd desktop
npm ci
npm test
npm run package:win
npm run smoke:win
```

`prepare-game` copies `index.html`, `src`, `public`, and `vendor` into the ignored
`desktop/stage/game` tree, preserving import/asset paths and credits. Packaging
adds the pinned Electron runtime and creates `desktop/release/LastLight-win32-x64`.
Electron makes the ZIP substantially larger than the roughly 20 MB game assets.
The wrapper uses Electron **45.3.2** and `@electron/packager` **20.3.0**, with exact
versions and npm integrity hashes in `desktop/package-lock.json`.

`.github/workflows/windows.yml` runs on relevant source pushes and manual
**workflow_dispatch**. It tests the desktop policy and game, packages Windows x64,
launches a short packaged smoke check, and uploads a ZIP plus SHA-256 checksum.
The smoke check verifies local game initialization, secure context, WebHID API
presence, absence of renderer Node globals, actual 3D rover readiness, local JS/CSS
MIME types, and the NASA GLB header. Renderer console errors, uncaught exceptions,
preload/load failures or 3D fallback fail the smoke; it does not emulate a controller.
Artifacts last 30 days. Pushes to `main` publish a convenient downloadable preview asset after smoke
passes. Manual runs also publish when **publish_release = true**. This creates or updates the
`windows-preview` prerelease asset; it does not make a production release or
replace the web deployment. Check the run's commit before publishing.

## Desktop boundary

The secure standard `last-light://game` protocol serves only bundled game paths,
rejecting decoded traversal. Relative imports, textures and models retain their
existing URLs. A content security policy permits bundled scripts, a hash for the
existing import map, local assets (including embedded rover texture blobs) and
required inline styles. The renderer has
`contextIsolation:true`, `sandbox:true`, `nodeIntegration:false`, and no exposed
Node/IPC bridge. The narrow isolated preload forwards only trusted HTTPS link
clicks; the main process checks the exact sending frame and URL before opening
an external browser. Scripted popups and untrusted navigation are denied. Network
subresources are blocked; the game does not fetch remote code or assets.

HID checks accept only the app's own main frame. The device chooser event occurs
only after the game's existing `navigator.hid.requestDevice` Settings action.
A native confirmation lists matching Sony VID `054c`, PID `0ce6` interfaces with
the existing 504-bit USB gamepad descriptor. Unknown IDs, Edge and Bluetooth
layouts are rejected. Device permission checks require the exact interface chosen
in this run; there is no vendor-wide auto-grant or persisted device allowlist.
The renderer still performs its existing descriptor checks and serializes output.
The wrapper does not change report bytes, force limits or lifecycle cleanup.

## Primary references

- [Electron stable releases](https://releases.electronjs.org/?channel=stable):
  stable runtime version checked on November 14, 2026.
- [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol):
  privileged standard/secure scheme and local-file response handling.
- [Electron session API](https://www.electronjs.org/docs/latest/api/session):
  HID selection, per-origin permission checks and device permission decisions.
- [Electron HID device structure](https://www.electronjs.org/docs/latest/api/structures/hid-device):
  interface identity and report collections.
- [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security):
  renderer sandbox, isolation, navigation and external URL boundaries.
- [Controller protocol and hardware limits](CONTROLLERS.md).
