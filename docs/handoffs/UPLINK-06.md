# UPLINK-06 — open transmission instrument

Owned changes: `src/ui/upload-terminal.js`, `src/ui/upload-terminal.css`, `tests/engine/upload-terminal.test.js`, this handoff. No commit or publication.

Replaced the boxed terminal with a sparse spatial composition: large serif memory title, original circular/parabolic SVG antenna diagram, tiny destination above a visible signal axis, and a packet that moves along that axis with the existing gesture progress. Transparent instrument rings keep the real Mars renderer visible. The diagram is interface artwork, not a claim that the artifact geometry has improved. Recovery points toward Opportunity; remembrance points toward the mission archive. Quiet outcomes extinguish the destination glow. Existing four modes and three stages retain truthful status/action labels.

## Primary references and interpretation

- [PlayStation / Sony, Dead Space hands-on](https://blog.playstation.com/2022/10/14/dead-space-hands-on-details-upgraded-and-expanded-horror-gameplay/) describes projected menus that preserve real-time immersion. **Design inference:** retain the visible world and make sending resemble operating one instrument rather than opening a dashboard. We did not copy their graphics or claim this screen-space instrument is diegetic 3D.
- [Mobius Digital, Outer Wilds](https://www.mobiusdigitalgames.com/outer-wilds.html) describes tracking mysterious audio with the Signal Scope. **Design inference:** a single destination, bearing, and signal path can communicate purpose more concretely than multiple information panels. Our memory transmission mechanic and antenna drawing are original.

No external assets downloaded. Inline SVG is original code-native interface geometry; no generated bitmap was needed.

## Contracts and verification

`renderUploadTerminal` signature, `.upload-terminal`, root `--upload-progress`, `.upload-terminal__body` gesture region, `#upload-progress`, transmit/next actions, and escaping are preserved. No event handlers, timers, lifecycle, cancellation, or controller logic changed. Ready upload modes retain touch-action suppression; keyboard/button access remains available. Focus outline, 46px minimum button height, responsive phone/tablet/short-height styling, and both reduced-motion paths remain.

Ran `/home/_0r1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/engine/upload-terminal.test.js`: **4/4 passed**, including all twelve lifecycle renderings and destination semantics. Browser visual QA, hardware controller/touch feel, 820×1180, and actual phone contrast/fit remain integration checks; CSS inspection alone does not establish these. Root owns screenshot review and broader integration.
