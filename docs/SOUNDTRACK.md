# Something to show them — Last Light's original score

The score gives Opportunity a small musical identity before the storm takes pieces
of it away. It is composed music rendered through Web Audio, not random ambient
notes. No commercial soundtrack, sample, or transcribed melody is used.

## Musical plan

The five-note **home motif is D4–A4–E4–F♯4–D4**. A reaching fifth is followed by a
more hesitant return. Its opening rhythm, in eighth-note positions, is 0, 3, 5,
8, 12. Soft attacks and spaces between phrases make it a companion to reading.
The phrase is in slow 6/8; tempo stretches as energy fades. A short answering
phrase follows in the brighter sections. Each cycle has an additional 7–15-second
breathing gap, so the listener is not surrounded by a continuous melody.

| Story | Musical behavior |
| --- | --- |
| Discovery | Warm felt-piano/plucked timbre states the motif. Low bass and soft, slowly bowed string-like voices add layers beneath it. Open D/add9, B-minor, G, and suspended-A colors suggest wonder. |
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

`createSound()` retains its existing API. Call **`setNarrative(sceneIndex, phase)`
after `setScene(environment)`** on every render. Scene 7 and scene 10 become silent
at `received`; scene 11 restores the theme. Indices refer to the current twelve-scene
script; update these cues if its order changes.

An 80 ms scheduler looks only 350 ms ahead. Mute, pause, hidden tabs, scene changes,
and teardown cancel queued/active notes; resumption never bursts through missed
events. Audio requires the existing user gesture. The score is optional and carries
no information needed to finish the story. Browser listening and device-volume
balancing remain part of final integration QA.
