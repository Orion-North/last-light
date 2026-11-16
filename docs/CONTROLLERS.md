# Controller setup

[Play](https://orion-north.github.io/last-light/) · [How to play](PLAYING.md) · [Implementation and tuning history](CONTROLLER-IMPLEMENTATION.md)

Connect a controller by USB or Bluetooth, then press a button. Last Light uses the browser’s standard Gamepad mapping. Input, ordinary vibration, and USB adaptive triggers are separate capabilities; support for one does not imply the others.

## Current controls

| Control | Action |
| --- | --- |
| Left stick | Drive during travel; navigate menus |
| R2 / L2 | Forward / reverse during travel |
| Right stick | Look, aim tools, or scroll supported menus |
| R2 | Trace, brush, or measure during investigations |
| Both triggers | Release to arm, squeeze and hold to charge, release both to send |
| Cross / A | Interact, compare readings, or continue after a result |
| Circle / B | Back / leave exploration view |
| Square / X | Memories |
| Options / Start | Pause / settings |
| D-pad | Navigate menus |

Use both triggers for the controller sending gesture. Prompts follow your current input: keyboard or mouse use shows keycaps and the button alternative while the controller remains connected. An idle stick or trigger does not switch them back. Disconnecting the controller while it is in use pauses the journey; a fresh release is required after reconnecting.

## Ordinary vibration

Enable vibration in Settings. The game checks for the browser’s `dual-rumble` support and uses it for terrain, tool, and transmission feedback. If Settings says vibration is unavailable, that browser/device combination has not exposed a usable actuator. The game remains playable.

USB vibration was confirmed by the project’s playtester in Chrome on CachyOS. This is not a claim of compatibility across every operating system, controller, or browser. These effects are ordinary controller rumble, not native PS5 audio-driven HD haptics.

## Optional DualSense USB trigger effects

1. Connect an **original Sony DualSense** by USB.
2. Open Settings in a browser that exposes WebHID, on HTTPS or localhost.
3. Use the USB connection button and select the controller in the browser’s device chooser.
4. Check the USB status and enable vibration.

The current implementation accepts the original DualSense USB descriptor only. Bluetooth adaptive output, DualSense Edge, and other controller models are not supported by this connection path. OS device permissions or another application can prevent access.

Sending requests resistance from the start of each trigger press, with a brief vibration at full charge before resistance resumes. Each side disengages when released. Maximum requested protocol strength is not a measured physical force; the current force tuning still needs hardware playtesting.

Tracing the dotted layers gives short R2 resistance bumps as the probe crosses each dot, with relief between bumps. Brushing uses an irregular R2 texture that follows actual sweeping movement and dust. Holding still, leaving the trace, or releasing R2 stops these tool effects; L2 remains free. At very fast sweeps, close contacts blend/coalesce instead of playing a delayed queue. Without USB trigger access, supported controllers receive short ordinary rumble cues instead.

Pausing, losing focus, disconnecting, or switching vibration off stops feedback. Software cleanup after a browser crash or physical unplug is best effort.

## For developers

See [implementation and historical tuning notes](CONTROLLER-IMPLEMENTATION.md) for APIs, report layouts, research sources, and tests. Historical sending patterns there are superseded by the current controls above. Automated tests verify logic and report bytes; they cannot establish physical feel or OS device access.

In Memories, use the D-pad or left stick to select an entry, Cross / A to expand or collapse it, and the right stick to scroll. Circle / B or Square / X closes the journal.
