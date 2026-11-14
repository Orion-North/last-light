# Something to show them — original adaptive score

## Composer's brief

Opportunity needs a recognizable identity before its routine breaks. The score
moves from curiosity to familiarity, then loses its ability to complete a phrase.
Earth's music remembers the rover without pretending it has answered. The ending
holds both the discoveries and the machine in the same ensemble. This is original
procedural chamber music, with authored pitches/rhythms, no borrowed recordings,
no external samples, no network requests and no runtime AI.

## Themes and dramatic arrangement

The home call is **D4–A4–E4–F♯4–D4**, at eighth-note positions **0, 3, 5, 8, 12**.
The upward fifth reaches outward; the ninth and third find a tentative home.
The answer ends through B3 toward D4. Slow 6/8 gives the rover a walking breath.
Four returns include a full call/answer, unaccompanied call, changed answer and
answer-led recollection. Long composed rests let place and player action lead.

| Scene family | Composition and orchestration |
| --- | --- |
| First wonder | Felt/harp home theme, open D/add9, B-minor, G and A colors; isolated low roots and a brief filtered triangle harmonic. |
| Geology (indices 1–2) | Separate **D5–E5–A5–F♯5–E5–D5** strata cell at positions 1,4,7,13,17,21. Inharmonic glass makes close observation sparkle. A quiet descending felt counterline answers later; open fifth/ninth voicings leave room for detail. |
| Lived routine / sunset | **A3–D4–F♯4–E4** rocks in repeated groups, later rising to A4. The reaching call has become practiced middle-register work. Harmony shifts under it without a big cinematic swell. |
| Storm | Home pitches return displaced to positions 0,4,9,17,28; F♯ becomes F and the final note falls to C♯ instead of resolving home. Alternating returns omit that ending entirely. Low D/B♭/A harmony contains a close semitone; no bright glass counterline. Wind occupies more space as the ensemble withdraws. |
| Fading | Only D4 and E4 remain, eleven eighths apart, with no bass or sustained layer. Unfinished is the point. |
| Earth waits | A different reed timbre descends **A3–F♯3–E3–D3**. B/G roots and suspended inner voices keep this human recollection distinct from the rover call. Martian wind is absent. |
| Narrative silence | Indices 7 and 10 at `received` cancel all scheduled/active voices, wind and mechanical sound. No replacement drone or success sound. |
| Remembrance | Complete home identity returns after 1.8 seconds. The first answer opens toward D5 rather than closing down; high glass recalls the geological cell within the same phrase. It acknowledges the discoveries without a triumphant fanfare. |

Ordinary phrases occupy eight bars (48 eighths), followed by 7–25 seconds of
additional space depending on section/return. The second statement ends early
and rests longer. Exploration can therefore remain unhurried without a constant
melodic loop. Authored score data is in `src/audio/score.js`.

## Instrument and sound design

Three cached mono instrument families render locally at up to 24 kHz:

- Felt/harp: five slightly inharmonic decaying partials, faster high-partial decay,
  a deterministic short felt transient and a softened onset.
- Glass: fundamental plus 2.756× and 5.404× partials with independent damping;
  a shorter scored duration and a restrained level keep sparkle from becoming UI.
- Reed: odd-partial emphasis and a slower breath onset in the middle/low register.

A filtered triangle harmonic supports occasional chords. This deliberately small
synthetic ensemble does not claim to be recorded piano or orchestral strings.
The three persistent environmental/activity sources remain wind, wheel/carrier
triangle and filtered grit. Terrain updates allocate no new voices. Investigation
suppresses wheels. Pressure builds late with the held-charge fraction, then falls
to a finite charged tail. All mechanical/radio sound is dramatized feedback,
not a recording of Mars or a model of radio physics.

## Adaptive implementation and mix hierarchy

`createSound()` preserves its public API. Call `setScene(environment)` followed by
`setNarrative(sceneIndex, phase)` on render. Scene 11 takes precedence for the
ending; the two explicit silences override everything. Geology is selected by
indices 1–2 in a bright environment. Update this mapping if scene order changes.

Section transitions discard the former queue and active notes, take a 0.7-second
breath, then begin the new arrangement. They are deliberate phrase resets rather
than claimed seamless crossfades. Same-section phase changes preserve musical
continuity. An 80 ms scheduler looks 350 ms ahead; resumed/throttled time never
fires a backlog. Remembrance has its longer initial breath.

Musical instruments feed a separate score bus. Recording, charge, send and real
receipt cues briefly duck that bus to 43%; active pressure also ducks it. Smooth
recovery restores space after the cue. Environmental/mechanical/cue routes bypass
the score duck and share the conservative master/compressor. This establishes:

1. Action feedback: low investigation latch, short charge confirmation, rising
   three-pulse departure, slower lower-register real receipt.
2. Score: identity and dramatic structure, yielding while the player sends.
3. Place/activity: restrained terrain, carrier and wind, with Earth free of Mars wind.

Receipt cues are explicitly blocked on Earth-side indices 8 onward, even if an
integration mistakenly requests one. Visible receipt semantics remain authoritative;
sound never grants success and all actions work muted. Per-kind debounce bounds
repeated cues without swallowing a different adjacent event.

Mute, pause and hidden tabs cancel all finite voices/timers and silence persistent
sources. Destroy also stops those sources, closes the context and removes the
visibility listener. Resume starts a fresh phrase. Construction does not create
an AudioContext; user activation remains required.

## Verification and listening status

SOUND-11: 13 deterministic Node music tests pass, including original lifecycle,
activity and silence coverage plus distinct authored chapter material, bounded
orchestration, solo returns, cancelled transitions, Earth receipt prevention,
Earth wind removal and score duck/recovery. Source/build checks are recorded in
the handoff. Tests observe graph/scheduling and generated nonzero sample buffers;
they do **not** establish perceived mix quality, musical emotion or hardware sound.
No actual listening session, headphone/speaker balancing, audio audition export,
physical controller check or public playtest interaction was performed for this
pass. A human full-game listening pass remains necessary, particularly for glass
brightness, low reed audibility and the dramatic duration of rests.
