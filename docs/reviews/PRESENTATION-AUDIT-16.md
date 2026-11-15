# PRESENTATION-AUDIT-16

Source and supplied desktop screenshot review of v0.16. Read shared instructions, README, PLAN, TASKS and CONTRIBUTING. Inspected landscape, shaders, asset ledger, upload/story styles, audio composition and lifecycle. Images: `outputs/last-light-v16-first-reply.png` and `outputs/last-light-v16-discovery.png` in the parent workspace. No independent browser journey, listening session, GPU profile or physical haptic test. Attempting the music test failed because `node` is unavailable in this shell; this is not a failing game test. No runtime edits.

## Ranked improvements

### P1. Restore the invisible mast aiming instrument — browser-reported defect, source-confirmed cause

Root reports the marathon survey reticle absent despite computed display/opacity and a 160×110 bounding rectangle. All five mast surveys use the same nested instrument (`src/main.js:292`). On desktop wider than 1000px, `.interaction-dock` has `transform:translateX(-50%)` and `overflow:auto` (`src/ui/story-console.css:8`). The transform makes it the containing block for the supposedly screen-fixed `.survey-aim`, whose `bottom:42svh` places it above that bottom dock (`:41`); overflow clips the instrument. The player is instructed to center an amber bearing they cannot see. Move the aiming overlay outside the transformed scrolling dock, or remove that containing-block interaction. Validate center/amber marker visibility, actual alignment and recording across all five surveys at 1280×720 and 1920×1080; also check <=1000px, where the dock transform is removed (`:68`). Root owns screenshot/temporary-browser verification. This outranks the art improvements below.

### 1. Recover the physical scene during sending — witnessed presentation bottleneck

Both early-mission screenshots make the rover nearly black. In the geology receipt, the landmark sits behind the rover and the highest-contrast objects are floating UI planets. This reduces the reward for discovering something physical and compresses the later darkness contrast.

The cause is concrete: `src/ui/upload-terminal.css:71` applies a screen-wide gradient with roughly 70% dark opacity at 45% screen height to **every** transmit/received phase. It stacks with the gameplay vignette in `src/ui/style.css:88`. The atmosphere already has authored scene-specific lighting, fog and exposure (`src/ui/landscape.js:962`). Thus healthy early contact gets a strong additional presentation fade unrelated to weather. This is an art/readability finding, not evidence of broken WebGL lighting.

First try a soft gradient confined to the bottom reading region, retain text shadows and unboxed controls, and let the same terrain/rover remain legible across observe → send → receipt. Do not add panels. Validate matching camera captures before/during/after sending in dawn, geology and storm, including controller glyphs and keyboard focus. Preserve a perceptible difference between ordinary mission darkness and actual contact loss.

### 2. Protect the learned musical answer across Continue — source-confirmed interruption path

The answering motif is central feedback, but the receipt exposes Continue immediately (`src/ui/upload-terminal.js:27`). On the first receipt, advancing to geology changes the musical section: `src/main.js:257`, `:266` update scene/narrative; `src/audio/sound.js:140` calls `stopScheduler()`, which stops **all** active voices (`:106`, `:96`). This can cut the response still playing after `finishTransmission()` (`:495`). The authored answer lasts about 1.49 seconds, with a 2.2-second protected accompaniment window (`src/audio/score.js:66`). That protection currently does not protect against section transitions.

Preserve foreground signal voices while changing accompaniment, or make intentional skipping a distinct, documented behavior. Avoid requiring a new long wait for every receipt. Reproduce by sending the first memory then advancing within 0.2–1 seconds; compare against waiting 2.2 seconds. Validate early answer completion, absent late answer, mute/pause cancellation, and no old reply leaking into Earth scenes. Actual listening remains necessary to judge salience and mix.

### 3. Repair the tool oscillator pitch — definite implementation defect

`src/audio/sound.js:80` chooses `toolEnergy * .006` as the motor oscillator frequency whenever the geology tool is active: at full energy this is only 0.006 Hz. The intended-looking `135 + activity.toolPressure * 65` branch later in the same conditional is unreachable because `tool` was already selected. Gain/filter branches still respond, and grit remains, so this is not proof that tools are completely silent. It does prove that the tonal tool feedback is placed below audible pitch.

Use an explicit mode-to-frequency mapping and assert the active tool's frequency lies in its designed audible range. Validate pressure/motion response against idle and trigger charging, then listen at ordinary volume with music enabled. Keep the feedback subordinate to geological observation.

## Art direction opportunity, after those fixes

The NASA rover has genuine visual detail and terrain uses scanned maps, dry roughness floors, instanced debris and coherent sun/shadow direction. Asset provenance is explicit in `public/ASSETS.csv`. Protect these strengths before buying more assets.

The dominant stylized CSS globes (`src/ui/upload-terminal.css:18`, `:20`; continent silhouette in `src/ui/upload-terminal.js:34`) clash with the realistic landscape in both screenshots. Retain the useful Mars/Earth labels, packet direction and wordless answer, but test a smaller, restrained signal instrument aligned with the mast/sky rather than two toy planets centered over the discovery. This is a design hypothesis, not a usability defect. Screenshot comparison and controller playtesting should establish whether the physical find remains the focal point without weakening the explicit Earth handover.

### Hero geology needs a closer art pass — screenshot-supported opportunity

The additional `outputs/audit16-berry-tool.png` reveals a stronger realism bottleneck than the sky: the prominent grains read as similarly gray, visibly faceted pebbles against a much richer scanned slab, and the brush appears as a detached ring/shaft. Source matches the image: shared 12×8 sphere geometry and narrow color variation (`landscape.js:353`, `:379`); the tool is a separate scene group containing a torus and short cylinder (`:387`, `:410`), moved directly to the cursor (`:440`). The rover is deliberately hidden during tool work (`:1453`), so no visible arm connects the action to Opportunity. This is artistic simplification, not a claimed scientific shape error. Prioritize this hero close-up over more distant scenery: refine grain silhouettes/contact/material variation, and choose either a credible cropped instrument connection or clearly diagrammatic reticle. Validate at actual inspection distance while preserving both sample-zone readability and brushed dust removal. More polygons alone will not resolve detached action.

## Performance and lifecycle assessment

No measured frame-rate problem established. Avoid a general optimization pass. A 240×240-cell terrain, fixed 2× pixel-ratio ceiling and 2048 shadow map are identifiable costs (`landscape.js:137`, `:29`, `:559`), while instancing already bounds rock/grain draws. Profile GPU/frame time on the actual Windows/controller target during travel and dust storm before changing fidelity. If over budget, compare pixel ratio 1–2 first; do not reduce hero geology blindly.

Pause/visibility gates stop world updates (`landscape.js:1463`); audio hush cancels queued/active voices (`sound.js:113`) and text articulation avoids transmission/answer windows (`:446`). These are useful existing safeguards. The specific receipt-transition interruption above deserves priority over hypothetical lifecycle rewrites.
