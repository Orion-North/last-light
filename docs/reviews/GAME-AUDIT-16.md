# GAME-AUDIT-16 — systems and player agency

Scope: independent source inspection of v0.16; required project instructions and plan read. One bounded engine probe executed with bundled Node. No browser playthrough, soundtrack audition, physical controller test, runtime edits or commits. Parent integrator owns browser confirmation. Ranked findings below distinguish implementation facts from design inference.

## 1. Berry Bowl reverses vertical tool controls (P1)

**Browser evidence, parent integrator:** in the actual Berry tool, ArrowDown held for 320 ms moved the probe from screen y320 to y260. Last Chance moved downward with Down. **Source confirmation:** `src/main.js:594` maps Down to positive tool y; controller input forwards positive right-stick `lookY` the same way (`:744`). `src/engine/geology-tool.js:38` increases cursor y. Berry renders that as world negative z (`src/ui/landscape.js:433`), away from its camera at positive z (`:493`), hence upward on screen. Last Chance instead maps positive y to lower world height (`:434`).

**Impact:** the second investigation reverses learned movement immediately before steady probe positioning. The root had to reverse keyboard directions to finish sampling. Controller follows the same source path; no physical-pad trial is claimed.

**Improve:** make both tools' vertical input screen-consistent. Keep pointer ray mapping (`src/ui/landscape.js:1194`) coherent when correcting the coordinate transform; a global input inversion would break Last Chance.

## 2. Reload loses the player's current physical work (P1)

**Proven implementation:** `src/session.js:30–31` saves only scene index, logical phase and choice IDs. It never stores rover position/heading, arrival, cleared dust, traced paths, readings, survey captures, or investigation stage. On a new renderer the rover starts at `(0,0)` (`src/ui/landscape.js:619`); `src/main.js:256–259` marks any restored observation with a destination as not reached. For example, reloading during Berry Bowl comparison loses both readings and sends the player from the origin to the site again. Later saved journeys likewise resume from the opening location rather than their preceding landmark.

**Reproduce:** drive to Berry Bowl, brush, collect two readings, reload before Compare; Continue. Check location and tool stage. Parent integrator separately confirmed at Marathon: reload/Continue changed earned arrival back to “Drive to The next horizon,” from the origin. Berry-specific browser sequence unexecuted here.

**Improve:** checkpoint physical work and arrival alongside logical progress, or at minimum resume at the current destination once arrival was earned. A short authored journey should preserve effort across ordinary browser interruption. Preserve deliberate manual travel; restoring earned arrival is not autodrive.

## 3. Pause erases survey captures but preserves geological work (P2)

**Proven call path:** `src/main.js:484–485` calls `cancelScan()` for every non-geology pause. `src/main.js:449–450` deletes the survey and resets its captured-step count. Resume does not reconstruct that survey. Settings, journal, focus loss and controller disconnect all use pause. By contrast, geology remains live and its data survives.

**Reproduce:** record two of the three ordinary-day bearings, open Journal, close it. The survey must be started again with zero captures. Opening the optional historical context therefore undoes observation progress precisely when players may want to understand it.

**Parent browser confirmation:** Marathon reached 50%; opening and closing Journal returned to the Survey button and lost the capture. Evidence: `outputs/audit16-survey-before-pause.png` and `outputs/audit16-survey-after-pause.png`.

**Improve:** preserve completed bearings and survey identity; clear only the incomplete steady-hold interval and input. Keep send cancellation and fresh-release gating unchanged.

## 4. Berry Bowl does not enforce its promised release between readings (P2)

**Proven by engine probe:** after brushing, release once, read bedrock with pressure `1`, move to the grain target while keeping pressure `1`, hold still: both readings are recorded and stage becomes `compare`. `src/engine/geology-tool.js:66` appends the first reading without arming `needsRelease`; tracing does arm it at line 51. README explicitly asks for release between readings.

This is a rhythm/feedback inconsistency, not an exploit that changes history. The same held operation silently changes from one measurement to another; players following the stated stop/release rhythm receive no distinct readiness event.

**Improve:** use the existing release gate after the first sample, with the existing instruction. No extra control or screen is needed. Probe output: `[bedrock] sample`, then `[bedrock, grains] compare`, with no intervening release.

## 5. Later observations primarily reward following an indicator (design risk)

**Proven mechanism:** all five mast profiles are fixed yaw/pitch sequences (`src/engine/fieldwork.js:2–21`), accepted by angular tolerance and a short steady hold (`:35–40`). Renderer samples only camera direction and steadiness (`src/ui/landscape.js:1209–1223`), not the named terrain or light. Ordinary day asks three indicator alignments; the last image asks one. There is no player inference comparable to the two visibly distinct geology tools.

**Inference requiring playtesting:** the repeated central amber-bearing task may train attention onto the HUD rather than the valley and changing atmosphere. Arbitrary angle variation alone may not earn five meaningful observations. The existing single final hold is appropriately restrained; do not add busywork there.

**Improve:** assess whether each earlier bearing reveals a distinct readable world change; remove redundant bearings when it does not. Strengthen framing of existing evidence before adding any interaction. Story reviewer owns the separate issue of fixed archive records versus what was observed.

## Retained strengths and limits

Trigger-only sending is explicitly guarded; historical outcome cannot change through choices. Geology preserves work across pause, fresh-release gating exists, and authoritative restoration replays legal transitions instead of trusting stored state. No finding here warrants restoring controller button sends, adding choice menus, panels, survival failure, or autonomous driving. A suspected blur softlock and obsolete objective-text mismatch were withdrawn after tracing the actual focus handler and call sites. The findings above are not evidence of subjective physical feel or emotional success.
