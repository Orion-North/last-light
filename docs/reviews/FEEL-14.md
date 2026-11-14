# FEEL-14 — resistance-first trigger audit

2026-11-14. Independent source review only. Scope: maximum supported Feedback 21 resistance during the press, a finite charged confirmation, and existing output cleanup. No physical controller output or browser operation is authorized or performed by this reviewer.

## Proposed behavior and review criteria

The requested change must select Feedback 21 at strength 8 across all ten zones immediately above the existing .03 pressure threshold, keep that resistance during charging, briefly use Vibration 26 only on the charged transition, then restore Feedback 21 strength 8 while held. Using greater vibration frequency alone would not implement greater resistance. The existing send pressure threshold, charge duration and terrain effects should remain unchanged.

Review must verify the 47-byte report and trigger-valid flags only, documented level-minus-one encoding, ten-zone mask, zero reserved fields and no frequency byte on Feedback 21. A charged telemetry refresh must not restart the 180 ms confirmation. Release must disengage each side independently; stale updates at 400 ms, pause, blur, hidden page, haptics off, disconnect and destroy must retain withdrawal behavior.

## Verification status

Initial baseline inspection confirms the existing cleanup and serialization mechanisms; the resistance-first implementation and updated tests were still pending at this report's creation. No new-build pass is claimed yet.

## Final implementation audit

Reviewed the actual v0.14 diff. The effect selector is now `uplink.charged && elapsed < 180`; strength is fixed at 8. A light press above .03 and the complete uncharged squeeze therefore use Feedback 21 with all ten zones selected. The charged edge briefly selects Vibration 26, then returns to Feedback 21 strength 8. Modes replace one another; resistance and vibration are not additive. Existing charged-edge timestamp logic prevents repeated charged telemetry from restarting the burst.

The resistance block encodes zone mask 1023 and packed level-minus-one values `ff ff ff 3f`, representing 8 in all ten zones. Frequency and reserved fields are zero in Feedback 21. Vibration retains the bounded existing 75–85 Hz charged confirmation. Report size, trigger-only valid flags, independent side handling and terrain output are unchanged. Existing serialization, failure suppression and cleanup are untouched; stale telemetry still withdraws at 400 ms, and release/pause/blur/hidden/haptics-off/disconnect/destroy still neutralize output.

Executed the direct controller suite with the explicit project Node runtime: **34/34 tests passed**. Tests cover light/partial/full pressure, both sides, all decoded zone strengths, zero reserved fields, finite charged confirmation, non-restarting refresh, independent release, stale withdrawal and lifecycle cleanup. No implementation defect or publication blocker found in this bounded source/test audit. The change implements greater commanded resistance rather than sustained vibration; actual resistance and comfort on the user's physical device remain unverified by this reviewer. No physical output was sent.
