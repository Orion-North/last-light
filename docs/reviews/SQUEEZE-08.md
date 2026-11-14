# SQUEEZE-08 independent review

Scope: read-only runtime critique, with this review as the sole owned write path.

## Three refinements before integration

1. **Make arming legible.** Both triggers must first return below the release threshold on entry, resume, reconnection, or cancellation. Use the lesser of L2/R2 as effective squeeze so one finger cannot finish. When held on entry, show “Release both triggers” before “Squeeze L2 + R2”; do not leave an apparently dead instrument. Commit once after the brief full-pressure settle, and require a fresh release before another attempt.
2. **Make pleasure physical, not punitive.** The two halves should track independent trigger pressures, visibly meeting only with both hands. Releasing early opens them without error, lost progress, or a failure sound. Use a small number of one-shot rumble detents with hysteresis/rearm, rather than repeated per-frame pulses. Mild resistance should grow toward closure without making the >=.82 threshold inaccessible. Keep the button fallback visible, focusable, and verbally equivalent.
3. **Keep local satisfaction separate from Earth.** Closure means the player committed the memory; receipt remains a later, separate event. Partial/no reply cannot be called delivered, connected, or successful. Earth-side recovery and archive actions must retain their existing labels and historical outcome, rather than accidentally becoming a rover upload after June 10, 2018.

## Existing sound: bounded integration

`src/audio/sound.js` already exposes `setActivity({contactActive, contactQuality})`. Active contact brings a quiet motor tone from 180 to 280 Hz as quality rises and reduces grit to zero. It smooths parameters over roughly 80–150 ms, expires stale activity after 0.8 s, and respects pause, hidden state, mute, and narrative silence.

Map current effective analog pressure to this existing quality parameter while squeezing; use zero/false on release, cancellation, transmission, pause, disconnect, and leaving the screen. Refresh it on real controller samples, rather than driving sound from the .35-second dwell timer. This gives a tactile tightening layer without writing another audio system or changing the score. Keep `transmit` and `received` cues in their existing semantic roles; do not reuse the receipt cue as a squeeze detent. No audio source edits are proposed.

## Browser and device claims

Keep standard Gamepad analog input separate from optional USB HID resistance. Existing controller documentation already scopes adaptive resistance to opt-in original DualSense USB in a browser exposing WebHID, rejects Edge/Bluetooth output, and says hardware feel is untested. Preserve that specificity. Do not promise adaptive resistance on iPad or describe ordinary dual-rumble as native PS5 HD haptics. A rejected vibration/HID write must leave the gesture and accessible button fully usable.

## Pending audit

Awaiting landed input, presentation, and integrator changes. Source inspection only so far; no tests, browser playthrough, or hardware feel check claimed.

## New story hierarchy direction

The important correction is a central reading sequence, not placing every HUD item in the middle. At 1200px and 820px widths, put mission date, scene title, and the current directive in one narrow upper-center group (roughly 620px maximum). Keep date small, title about 28–34px, and the directive a readable 15–17px sans line with a small cue rather than a bordered objective card. On short-height desktop, reduce the title and top spacing. On portrait, permit two directive lines rather than clipping.

Preserve the center of the rover and the investigation target as visual space. Place the brief scientific discovery in lower center when it arrives, replacing the immediate action text temporarily; let the choice interaction take over that region. Do not show a repeated phase label, objective sentence, and dock paragraph all saying the same thing. Optional conditions and journal remain peripheral. Upload mode should continue to hide the scene/objective cluster because the instrument already supplies a title and instruction.

First landed input/presentation inspection: independent pressure halves, suppressed uplink camera/terrain input, mild 24–48 resistance, separate tension/lock pulses, and preserved recovery/archive labels match the direction. Integration remains pending. Minor requested correction: progress accessibility labels should describe call/archive modes rather than always say “Memory send commitment.”

## Landed integration audit

Source audit of `src/engine/squeeze.js` and `src/main.js`: lesser-trigger pressure, real-neutral arming, >=.82 pressure with .35-second settling, .05-second timestep cap, one-shot detents, and rearming after commit are present. Pause calls `stopContact()` and resets the gesture; invalid/synthetic input resets rather than arming. Effective analog pressure drives existing contact audio for actual rover reply/partial modes, preserving recovery silence. Accessible direct-send input remains present. No blocking source issue found in this bounded review.

Hierarchy follow-up sent to integrator: fixed `.waypoint-hud` at top175px/left60% can collide with the new upper-center headline/directive. Hide its redundant name or move the distance into a subordinate line; check right-side flight conditions for overlap at 820px landscape. Browser measurements remain required.

Checks attempted: `node tests/engine/squeeze.test.js`, controller tests, and upload-terminal tests could not execute because `node` is absent from this shell PATH. No browser or hardware test performed by this reviewer. Integrator owns final visual/runtime verification and any configured runtime path.

## Final source follow-up

The integrator's final `rover-move` sound guard preserves squeeze contact activity instead of overwriting it with idle movement. Contact teardown clears audio and controller output. The final journey stylesheet loads last and overrides the prior absolute objective geometry; redundant waypoint text is hidden and optional conditions move above the central title group. Prior source-level hierarchy concerns are resolved, subject to the integrator's browser measurements.

Desktop read-only review: custom-protocol resources stay within the bundled root, the renderer is sandboxed and isolated, HID approval is local-main-frame and session/device-specific, and the HID descriptor matches the original USB DualSense restriction. No functional HID blocker is apparent from source. Minor usability limitation: the preload's external-link handler requires `event.isTrusted`, so a gamepad-generated JavaScript `.click()` on a NASA/source link cannot open the external browser. Native mouse/keyboard activation remains available; this does not block the story. Hardware resistance and Windows hardware behavior remain unverified here.
