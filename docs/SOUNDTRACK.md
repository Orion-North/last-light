# Something to show them — original adaptive score

## Composer's brief

Opportunity needs a recognizable identity before its routine breaks. The score
moves from curiosity to familiarity, then loses its ability to complete a phrase.
Earth's music remembers the rover without pretending it has answered. The ending
holds both the discoveries and the machine in the same ensemble. This is original
procedural cinematic music, with authored pitches/rhythms, no borrowed recordings,
no external samples, no network requests and no runtime AI.

## Themes and dramatic arrangement

The home call is **D4–A4–E4–F♯4–D4**, at eighth-note positions **0, 3, 5, 8, 12**.
The upward fifth reaches outward; the ninth and third find a tentative home.
The answer ends through B3 toward D4. Slow 6/8 gives the rover a walking breath.
Four returns include a full call/answer, thinner accompanied call, changed answer and
answer-led recollection. Long composed rests let place and player action lead.

| Scene family | Composition and orchestration |
| --- | --- |
| First wonder | Felt/harp home theme, open D/add9, B-minor, G and A colors; connected organ triads, moving string dyads, sustained low roots and a restrained uneven pulse. |
| Geology (indices 1–2) | Separate **D5–E5–A5–F♯5–E5–D5** strata cell at positions 1,4,7,13,17,21. Inharmonic glass makes close observation sparkle. A quiet descending felt counterline answers later; open fifth/ninth voicings leave room for detail. |
| Lived routine / sunset | **A3–D4–F♯4–E4** rocks in repeated groups, later rising to A4. The reaching call has become practiced middle-register work. Harmony shifts under it without a big cinematic swell. |
| Storm | Home pitches return displaced to positions 0,4,9,17,28; F♯ becomes F and the final note falls to C♯ instead of resolving home. Alternating returns omit that ending entirely. Low D/B♭/A harmony contains a close semitone; no bright glass counterline. Wind occupies more space as the ensemble withdraws. |
| Fading | Only D4 and E4 remain, eleven eighths apart, above three faint remnants of the former harmony. Unfinished is the point. |
| Earth waits | A different reed timbre descends **A3–F♯3–E3–D3**. B/G roots and suspended inner voices keep this human recollection distinct from the rover call. Martian wind is absent. |
| Narrative silence | Indices 7 and 10 at `received` cancel all scheduled/active voices, wind and mechanical sound. No replacement drone or success sound. |
| Remembrance | Complete home identity returns after 1.8 seconds. The first answer opens toward D5 rather than closing down; high glass recalls the geological cell within the same phrase. It acknowledges the discoveries without a triumphant fanfare. |

Ordinary phrases occupy eight bars (48 eighths), followed by 5–20 seconds of
additional space depending on section/return. The second statement ends early
and rests longer. Exploration can therefore remain unhurried without a constant
melodic loop. Authored score data is in `src/audio/score.js`.

## Instrument and sound design

The score uses cached stereo instruments generated locally at up to 24 kHz:

- Organ: eight harmonics, three subtly detuned voices and breathing sidebands.
- Strings and pads: independently phased harmonic ensembles with staggered entries.
- Bass: centered low harmonic foundation, finite release and no permanent drone.
- Felt/harp, inharmonic glass and reed: decaying foreground colors for the authored
  home, geology and Earth themes; pulse is a softer, shorter accompanying figure.

Sustains use seamless periodic buffers around 2.35 seconds, each played by one
finite source. Decaying colors last 2.4 seconds; written durations bound voices
but do not make a naturally decayed note sustain. The LRU cache holds 48 buffers,
about 22 MiB at its maximum rate. Asynchronous preparation warms one buffer per
task during a section's opening breath, without starting voices. It cancels on
replacement and lifecycle stops. This is a synthetic ensemble, not sampled
orchestral performance.

A 2.6-second stereo convolution room supplies restrained depth. Both dry and wet
returns pass through the score gate; transmission, silence, pause, hidden tabs
and mute discard the room tail instead of letting it reappear after a hold.
Foreground cues remain close and dry. Firsthand space-film references and the
critical listening priorities are recorded in [SCORE-18](reviews/SCORE-18.md).

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
   four-note departure, slower lower-register real receipt.
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

## v0.12 — a learned question and the missing answer

Foreground sending now has its own short authored melody, repeated unchanged in
ordinary discoveries: D5–A5–E5–F♯5, at 0/.24/.48/.84 seconds. A real receipt replies
A4–F♯4–E4–D4 with the same rhythm, settling home. These are original short phrases,
separate from the cinematic score. The final partial send stops after E5;
it never plays the answer. Earth recovery attempts retain the full recognizable
question, now voiced by the human side, followed by an empty 2.2-second answer
window. No failure beep substitutes for the missing voice.

`beginTransmission(mode)` begins the question and holds accompaniment at zero;
`finishTransmission(mode)` releases that hold after the answer window. Modes are
`normal`, `partial`, and `call`. Only a pending ordinary send, completed normally
before the loss-of-contact scenes, gets an answer. The runtime must call finish
at the actual receipt/result, not automatically after a musical timer. Legacy
`cue('transmit')`/`cue('received')` delegate to this paired protocol. Archive actions
do not use it. Mute, pause, visibility loss and destruction cancel scheduled
voices and the pending reply; resuming never fabricates an acknowledgment.

Tool activity accepts `toolActive`, `toolPressure`, and `toolMotion` in the existing
replacement activity object. A restrained triangle friction tone and very low
filtered grit reuse the existing persistent motor graph, gated by pressure times
motion. Stationary or stale tool input falls silent, and contact takes priority.
No per-frame source allocation or added noise loop is introduced.

Verification: 17 deterministic Web Audio graph/clock tests pass, including exact
question recurrence, descending reply, Earth question during narrative silence,
empty answer interval, partial truncation, cancellation, fixed graph tool activity
and stale-input cleanup. This is structural verification; no listening/audition
or hardware claim is made for this pass. Human listening remains necessary to
judge recognition, mix balance and the emotional effect of the absent reply.

`cancelTransmission()` clears a pending send or answer hold without answering,
cancels its scheduled voices, and restarts the appropriate score after a short
breath. Idle cancellation is harmless. Runtime navigation/title cancellation
must call this even when the audio context itself remains active. Ordinary and
Earth-call travel should share the same 2.4-second result time, establishing a
fixed place where the learned answer appears or goes missing.


## v0.18 — cinematic ensemble and measured browser audition

The arrangement now connects four harmonic changes with organ triads, moving
string dyads and low roots, plus restrained irregular pulse. Alternate statements
retain open harmony instead of exposing a lone tone. Earth removes the pulse;
storm progressively loses notes, sustain and energy; fading has only five events.
Explicit silence stays empty. The new score keeps the exact learned send/reply
melodies and clears room tails before their expected answer window.

Seven families were rendered in full and thin variations through the real browser
OfflineAudioContext (14 checks). Finite samples, stereo variation and peak bounds
passed; a fractional-onset default-gain spike was found and fixed in that process.
The local audition page exports production-graph WAVs. Structural and signal
checks do not establish emotional quality or perceived balance. Listen especially
for the Earth reed against sustained harmony and the repeated pulse's restraint.
See VERIFICATION.md for metrics and reviews/SCORE-18.md for research and critique.

## Terminal voice refinement

Oppy's imagined thoughts now arrive as individual characters with short clause
and sentence pauses. Quiet dry electronic key sounds vary deterministically with
the character; the first key has a small rounded startup cue. These are local
voice articulations, separate from the learned radio call/reply motif. Mute,
pause, hidden/suspended audio and narrative silence suppress them; reduced motion
shows the complete line immediately with no typing cues. Controls remain usable
while text types, and assistive technology receives the whole thought at once.

## Storm pressure (STORM-53)
The wind increasingly masks the music through the storm scenes. Early dust
retains a recognizable phrase; the later storm loses pulse, strings and phrase
endings, then the final-image scene leaves widely spaced, darkened fragments.
Stereo gusts swell slowly under a fixed master/compressor. They yield around
the original radio question and reply, then return. Earth contact-loss silence
remains explicit. Oppy's current terminal ticks are unchanged by this release;
emotion-specific speaking tones are planned separately.
