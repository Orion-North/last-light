# SCORE-18 — space-film research and score critique

Scope: source/code review for v0.18. No soundtrack melodies, recordings or samples are licensed or borrowed by this recommendation.

## Firsthand references and interpretation

[Roger Sayer’s project account](https://www.rogersayer.org/projects) identifies him as the original *Interstellar* organ soloist and Temple Church’s Harrison & Harrison as the recorded instrument. It also reproduces Zimmer’s assessment of the performer’s humanity. This supports an organ/performance reference; it does **not** establish a synthesis recipe. Our translation is a warm sustained harmonic body with individual voice phrasing, breathing entries and a surrounding acoustic. Simply adding a recognizable organ patch would miss the performance lesson.

In a [direct interview with Steven Price](https://eclipsemagazine.com/gravity-composer-steve-price-talks-with-michelle-about-creating-the-epic-score/), the *Gravity* composer describes music serving emotional and sound-design roles, tension from changing/pulsating textures, spatial movement, and processing cello and voice into unfamiliar textures while retaining a human quality. Our translation is slow timbral development and purposeful ensemble motion tied to the rover’s story. This is conceptual inspiration, not permission to reproduce its notes or sound recordings.

## Baseline diagnosis

The pre-v0.18 `score.js` already has original themes, chapter variants and deliberately missing answers. The complaint is therefore more specific than “there is no composition.” Most phrases present a single lead against two or three isolated bass notes. Sustained accompaniment is usually one short note at the first chord; the “string” implementation is one filtered triangle oscillator. Cached instruments are mono decaying partials, panned narrowly by pitch, with no reverberant acoustic. These choices plausibly produce disconnected, exposed tones even when the pitch structure is thoughtful. That is a structural diagnosis, not a listening verdict.

## Concrete direction

- Retain the original home identity; build connected inner voices beneath it. Hold common tones between harmonies, move one voice at a time, and let the bass persist while the upper texture changes.
- Use independent attacks and releases so a chord breathes as an ensemble. Swell across several bars, then thin the orchestration; avoid a static pad throughout the journey.
- Give bright exploration a soft pulse and glass detail above a warm body. Let routine settle into a recognizably repeated accompaniment. Make storm tension arise from displaced pulse, darker overlapping harmony and changing spectrum, then remove those supports during fading.
- Keep Earth distinct and intimate. Remembrance can restore a fuller home phrase with geological color; the emotional event is recognition, not maximum loudness.
- Add stereo depth through restrained source placement and decorrelated late reflections. Keep low bass centered; avoid sustained bright partials competing with thoughts or action feedback. Maintain transmission ducking and explicit silence, including reverb tails.
- Audition scenes as sequences: first phrase, second return, transmission, storm, loss, Earth call, remembrance. Check headphones, mono and ordinary speakers. A prettier isolated patch cannot demonstrate dramatic continuity.

## Verification boundary

This review distinguishes code evidence from perceived quality. Event counts, overlapping voices, stereo difference, bounded peaks and lifecycle tests can establish implementation properties. They cannot establish warmth, recognizability, emotional effect, or a balanced speaker mix. Root’s offline Web Audio exports provide reviewable audio artifacts; exporting and measuring them alone is not a human listening session. Final code review is recorded below.


## Integrated v0.18 review

Reviewed final `score.js`, `instruments.js`, `space.js` and their routing in `sound.js`. Connected organ voicings, sustained bass, staggered string dyads, pulse variation and storm attrition now address the baseline orchestration problem. Stereo instrument buffers plus a decorrelated convolution room add depth. The complete room return passes through score ducking; explicit silence and lifecycle hush flush its tail. No definite correctness blocker was found in this review.

Three audition priorities remain: Earth’s accompaniment keeps bright-scene gains while its reed lead is quieter; sustained harmony may mask that intimate line. Bright phrases repeat sixteen pulse notes in the lead’s register, so verify that movement does not become an insistent sequencer. Nonloop lead buffers end after 2.4 seconds while written durations reach 4.8 seconds and harmony sustains longer, so check that the theme retains projection. These are code-based risks, not confirmed audible defects. No human listening was performed by this reviewer. A local music-test invocation could not run because `node` was unavailable on this shell’s PATH; the integrator owns executable verification and audio exports.
