# Deep inspection — Last Light v0.16

Reviewed commit `8ef5006730b1096abdccee2d5e490c58eb124529` with three independent
Sol reviewers and a root browser inspection. No runtime changes or release in
this pass. The biggest gains now come from reliable interaction, keeping the
physical discovery visible, and making the remembered journey match the play.

## Fix first: demonstrated defects

| Priority | Finding and evidence | Improvement / acceptance check |
| --- | --- | --- |
| P1 | **Survey aiming guide disappears on desktop.** At 1280×720, the aiming element occupied x560/y276, 160×110, but its transformed, scrolling parent occupied y525–688 and clipped it. The game still asks the player to center its amber bearing. Observed during the actual marathon survey; the same renderer serves all five surveys. `src/ui/story-console.css:8–9,41`; `src/main.js:292`. | Move aiming visuals outside the clipped text region or remove the containing-block conflict. Verify every survey above/below the 1000px breakpoint, with the marker actually visible, and complete them without reading source or hidden DOM positions. |
| P1 | **Berry Bowl reverses vertical movement.** Down moved the probe upward; Up moved it downward. Last Chance used the opposite mapping. Root reversed directions to finish both samples. Controller input follows the same source path, though no physical-pad test was performed. `src/ui/landscape.js:433–434,493`; `src/main.js:594,744`. | Make both tools screen-consistent, including pointer ray mapping. Test the same four directions on both tools using keyboard, simulated pad and a real pad. |
| P1 | **Reload loses earned arrival and physical progress.** After reaching the marathon site, Continue after reload required another 11.4m drive from the origin. Saves contain only logical phase and choices; tool state, rover position and captures are absent. `src/session.js:30–31`; `src/main.js:256–259`. | Checkpoint earned arrival and completed work. Restoring an earned location is not autodrive. Test reload during travel, brushing, first sample, comparison and survey. |
| P2 | **Journal/pause discards survey progress.** Root recorded 50% of the marathon survey, opened the journal, closed it, and returned to the initial Survey button. Geological work is preserved, making this inconsistent. `src/main.js:449–450,484–485`. | Preserve captured views and clear only the unfinished steady hold/input. Exercise journal, settings, focus loss and disconnect. |
| P2 | **The late archive choice does not affect the main ending.** Root selected the rover's story; it was present in the journal but absent from the ending. An engine comparison of both archive options produced identical ending lists: first view, layers, blueberries, automatic farewell. `src/ui/experience.js:28–29`. | Include the actual late choice in the visible ending and make its emphasis recognizable without opening another screen. |
| P2 | **Automatic records misdescribe actions.** Observing storm light creates “Light remembered”; the final recovery call creates an unselected “Thank you.” These are remnants of removed choice menus. Confirmed by state-machine probe and final journal. `src/content/story.js:149,260,285–295`. | Author records for the actions now performed: observed sky, compared samples, attempted recovery. Reserve “chosen” for genuine choices. |
| P2 | **Two audio defects weaken tactile/relationship feedback.** Active tools set oscillator frequency to at most 0.006Hz; an audible-frequency branch is unreachable. Separately, immediate Continue can stop the foreground answer motif when the music section changes. Source-confirmed, not auditioned. `src/audio/sound.js:80,96–110,140–144`. | Correct tool pitch and separate foreground signal lifetime from accompaniment changes. Validate pressure response and early replies across Continue, while preserving mute/pause and later silence. |
| P2 | **Second sample does not require the promised release.** A real engine probe recorded both Berry readings while pressure stayed at 1; the first sample never re-arms release. `src/engine/geology-tool.js:66`. | Reuse the release gate after the first sample; verify the displayed instruction and actual readiness agree. |

## Improve the experience next

1. **Keep discoveries connected to their evidence.** Root completed both geology
   tools. Pressing Compare immediately removed the close-up and replaced it with
   the same Mars/Earth sending composition. The later water interpretation then
   appeared away from the inspected feature. Retain the rock and both findings,
   briefly emphasize their relationship, and let the existing thought accompany
   that evidence. Add no panel, compulsory reading step or extra menu. This is a
   witnessed transition and a design hypothesis about comprehension; test by
   asking a fresh player to identify the evidence after receipt.
2. **Restore visual contrast between healthy mission and storm.** The upload
   gradient darkens every early send/receipt by roughly 70% at mid-screen, on top
   of the world vignette. It hides rover/material detail and spends darkness too
   early. Reduce the broad fade, preserve unboxed text contrast, and let weather
   control the scene. The stylized floating globes also dominate realistic assets;
   test a smaller signal display while preserving direction and missing replies.
3. **Prioritize the hero tools over more distant scenery.** Berry Bowl's similarly
   gray faceted grains and detached ring/stem look less convincing than the
   textured slab. Give grains better material/contact variation and make the
   instrument either plausibly connected or explicitly diagrammatic. This is an
   art-direction judgment, not a claim of scientific inaccuracy. Keep the two
   sample zones and removed dust legible.
4. **Give later observations something specific to reveal.** Five surveys use
   fixed camera angles and steady holds. Ordinary day records a bright stone edge
   after generic floor/wheels/rim alignments. Align targets with visible authored
   evidence, remove redundant bearings, and let recovery months visibly accumulate
   unanswered attempts. Test attention/comprehension before adding more tasks.

Suggested order: repair the aiming guide, vertical controls and interruption
losses; then make one geology-to-send sequence feel continuous; then correct
archive payoff and audio. Evaluate that slice before another broad art pass.

## Evidence and limits

Root played a fresh opening, selected the ground, drove manually to both geology
sites, traced both layer paths, brushed Berry Bowl and measured both samples,
compared and sent both discoveries, then drove to the marathon survey. There the
hidden cue, journal reset and reload loss were inspected. This was not a complete
fresh uninterrupted run. Later checks used seeded controller checkpoints to
inspect final observation presentation, archive selection, trigger charge/release,
final recovery and ending/journal. Final observation was not completed in the
fixture; no separate bug is inferred from that test-only behavior.

No captured browser warnings/errors. No GPU benchmark, soundtrack listening
session or physical actuator test; performance and sensory quality remain
unmeasured. Engine probes confirmed the sample-release defect and counterfactual
ending equivalence. No tests or production files were added/changed.

Local screenshot evidence is retained outside the repository in workspace
outputs: audit16-missing-survey-cue.png, audit16-survey-before-pause.png,
audit16-survey-after-pause.png, audit16-berry-tool.png, audit16-comparison.png and
audit16-ending.png.

Independent detail: [systems](GAME-AUDIT-16.md), [story](STORY-AUDIT-16.md),
[presentation/audio](PRESENTATION-AUDIT-16.md).
