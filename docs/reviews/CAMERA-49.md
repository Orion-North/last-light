# CAMERA-49 / INPUT-50 — camera transition audit

Three GPT-6.1 Sol lanes handled runtime, presentation and independent review.
Root natively traced both Last Chance paths and compared them. The settled mast
was ready/clear at the seeded pose; entry visibly passed through neck and deck.
The fix switches directly to the physical sensor eye, target and lens together.
It preserves the rover model and uses no speculative head-removal workaround.

The renderer fixture checks six scene/heading cases across all five cameras:
entry and settled/aimed eye error are zero to four decimals, aiming responds, and
frozen drift is zero. It includes Last Chance headings zero and pi. This does not
claim testing every possible driven pose. Readiness/collision mismatch was audited;
no blocked settled pose was reproduced in these cases.

Independent review also found arrows held during Compare carried into aiming.
Only held keys are latched until release; a fresh different arrow works. Tests
exercise production events through the tool comparison. Controller capture now
uses right bumper R1/RB, with connection/rearm release gates. Primary cannot capture.

Photo presentation now separates captured frame 700 ms, dissolve 700 ms, fully opaque
NASA image 1250 ms, and handoff 650 ms. Shutter paints before WebGL readback. Reduced
motion preserves both readable static beats. Pause/background, cancel during the
paint boundary, rebind, preheld shutter, premature send and receipt are tested.
Original sending/audio remain distinct and player initiated.
