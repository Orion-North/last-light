# Something to show them — Last Light's original score

The score gives Opportunity a small musical identity before the storm takes pieces
of it away. It is composed music rendered through Web Audio, not random ambient
notes. No commercial soundtrack, sample, or transcribed melody is used.

## Musical plan

The five-note **home motif is D4–A4–E4–F♯4–D4**. A reaching fifth is followed by a
more hesitant return. Its opening rhythm, in eighth-note positions, is 0, 3, 5,
8, 12. Soft attacks and spaces between phrases make it a companion to reading.
The phrase is in slow 6/8; tempo stretches as energy fades. A short answering
phrase follows in the brighter sections. Four authored returns alternate a complete statement, solo motif, altered answer,
and answer-led recollection. Each cycle has an additional 7–25-second breathing
gap. The solo statement ends early and leaves a longer unscored space.

| Story | Musical behavior |
| --- | --- |
| Discovery | Warm felt-piano/plucked timbre states the motif. Separated bass notes and one brief upper harmonic occasionally support it; the second return is solo. Open D/add9, B-minor, G, and suspended-A colors suggest wonder. |
| The storm | The same identity is recognizable, but the third lowers and the answer disappears. Fewer supporting layers and more wind leave the phrase exposed. The final image retains only two notes. |
| Earth waits | A quieter recollection returns in a human-feeling register. The frame is spacious rather than threatening. |
| Contact lost / final call | Deliberate silence after the received/narration phase: melody, harmony, cues, and wind are withdrawn. |
| Remembrance | After a short breath, the complete motif returns with gentle upper notes. This honors what remains rather than announcing a victory. |

## Principles and primary references

- Austin Wintory's [GDC session overview on Journey and Monaco](https://www.gdcvault.com/play/1015569/Journey-vs-Monaco-Music-is)
  describes narrative structure and reconciling adaptivity with musicality. Our
  application is a recurring identity whose arrangement follows the story.
- Andrew Prahlow's [official biography](https://www.andrewprahlow.com/bio) describes
  emotive soundscapes grounded in chamber minimalism and familiarity. Our
  application is a small warm ensemble within an enormous unfamiliar landscape.
- The [GDC adaptive orchestral soundtrack session](https://gdcvault.com/play/1013209/Implementing-an-Adaptive-Live-Orchestral)
  emphasizes runtime mixing and testing alongside composition. Our application is
  separate melody, harmony, bass, and environmental layers, with guarded scheduling.

These are design interpretations of the published descriptions, not claims to have
watched full talks or reproduced either composer's work. Prahlow's page was
available through its official indexed text; direct fetching returned an error.

## Implementation and integration

`createSound()` retains its existing calls and adds optional `setActivity` feedback. Call **`setNarrative(sceneIndex, phase)`
after `setScene(environment)`** on every render. Scene 7 and scene 10 become silent
at `received`; scene 11 restores the theme. Indices refer to the current twelve-scene
script; update these cues if its order changes.

An 80 ms scheduler looks only 350 ms ahead. Mute, pause, hidden tabs, scene changes,
and teardown cancel queued/active notes; resumption never bursts through missed
events. Audio requires the existing user gesture. The score is optional and carries
no information needed to finish the story. Browser listening and device-volume
balancing remain part of final integration QA.


## v0.4 sound design

The sustained timbre uses a single filtered triangle voice per note, with at most
one brief harmonic in ordinary phrases. The quieter, softer pluck attack and
solo returns avoid a continuous simulated string section. Remembrance alone adds
a final upper color. No reference-game recording or melody is included.

`cue('investigate')` is a short low mechanical two-step; `observe` marks recording.
`transmit` is a high, short three-pulse gesture. `received` answers with a lower,
rounder A3–D4–F♯4/F4 figure. Per-kind debouncing rejects duplicate events without
suppressing a genuine reply immediately after another interaction. None of these
cues replaces a visible instruction or receipt.

`setActivity({moving, speed, roughness, investigating, contactActive,
contactQuality})` accepts a **complete snapshot**; omitted values become false/0.
Numeric inputs clamp to 0–1. The integration refreshes activity while it occurs.
After 0.8 seconds without a refresh, mechanical/carrier sound fades away. One quiet
filtered triangle oscillator suggests electric wheel loading; a bandpassed copy
of the existing procedural noise supplies surface contact. Investigation suppresses
wheel sound. Active link alignment reuses these same sources: quality raises a
quiet 180–280 Hz carrier and reduces grit, making alignment perceptible by ear.
This is dramatized interaction feedback, not recorded rover audio or radio physics.

There are only three persistent sources (wind, motor/carrier, grit), a single
scheduler, cached mono pluck buffers capped at 24 kHz, and no per-update allocation
of audio sources. Pause/mute/visibility gates cancel score/cue voices, silence the
persistent graph, and do not replay missed notes. Narrative silence also removes
activity feedback; destroy stops all persistent sources and closes the context.

The observable graph tests verify variation/rests, cue distinction, bounded
activity sources, stale-input shutdown, mute/pause/visibility, narrative silence,
and teardown. These tests do not render audio. No headphone, speaker, actual iPad,
or human musical/emotional listening verification was performed for this pass;
levels and pacing still need that listening pass.
