# iPad Air playtest

Target: 11-inch iPad Air M4, Safari, landscape first; portrait also supported.
Use the GitHub Pages link in README after deployment. The game has no login,
backend or runtime AI. The first load includes the roughly 12 MB NASA rover.

Touch controls are selected automatically when a coarse pointer is available.
Settings → Larger touch controls also enables them with a keyboard/controller
attached. Hold arrows to drive; drag the world to look, pinch to zoom. Autodrive
is available. Tap Begin to start audio; mute and reduced motion are in Settings.

The renderer caps device pixel ratio at 1.5 to avoid rendering the entire native
Retina resolution. Layout respects safe areas and stable viewport height. All
touch actions use at least 48 px buttons; the game supports rotation.

## A five-minute first check

1. Open in Safari, tap Begin, and confirm the textured rover loads and audio starts.
2. Hold forward and turn together; release both, drag to orbit, then use Autodrive.
3. At Last Chance, inspect the crossing layers. Rotate the iPad: the target should
   remain framed and the choices should remain reachable.
4. Choose a memory; Send should be a separate action. Pause during a send, then
   resume and retry. Repeat once with sound off.
5. Reload and Continue. Your discovery/memory should survive. Open Journal to
   retrieve the NASA source without revealing the next undiscovered scene.

For the full journey, note whether the missing reply feels different from the
earlier receipt, and whether the ending recalls choices you remember making.
Report where you hesitated, any input that stuck, and whether motion becomes
choppy after several minutes. Emotional effect and sustained device performance
need this real-device check; desktop viewport tests do not establish Safari FPS.

DualSense controls may be used if iPadOS exposes the gamepad. Vibration depends
on browser support; USB adaptive triggers and native HD haptics are not promised
on iPad. The deferred desktop edition is unchanged.

Device dimensions reference: [Apple's M4 iPad Air specifications](https://support.apple.com/en-us/126471).
The 820×1180 and 1180×820 CSS test sizes approximate its 1640×2360 display at 2×;
Safari chrome and split view can reduce available space.
