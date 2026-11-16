# POLISH-52 — room clearance and geological photo handoff

User feedback: room props clip, monitor signal covers the Oppy note, boxed
Earth text conflicts with the rest of the game, Blueberries should aim more
from above, and sending Last Chance dives into the rock.

Two GPT-6.1 Sol lanes handled physical room and camera changes; root handled
presentation, integration and browser review. No additional Astra agents.

## Changes

- Reserved a right-hand screen margin for the physical note. The exact earlier
  signal markup/animation stays projected on the monitor and is explicitly
  clipped to its plane. The note stays inside portrait framing.
- Corrected notebook/desk intersection and grounded the mouse and headset.
  Tape follows the note's transform.
- Removed Earth-only panel background, border, blur and shadow. Text retains
  the existing unboxed typography and dark text shadow for contrast.
- Blueberries aims toward the nearer comparison surface and fits a tighter
  group of nodules. The camera remains at the actual rover mast. It is a
  steeper oblique view, not a claim to duplicate the source's overhead angle.
- Geological capture exits to a wide rover view. Completed-photo evidence no
  longer forces the old close-up after contact priming. Received saves use
  the same context, without depending on a preceding mast session.
- Collision clearance evaluates alternate azimuths and an elevated fallback
  if the usual following camera is blocked by the outcrop. Camera switches
  happen at the photo handoff; no flight through the rock.
- Decorative button prompts no longer become pointer targets that can be
  detached during active-input changes.

## Critical review and verification

The first portrait review rejected moving the note farther right because it
clipped off-screen. Restored its placement and reduced the signal's right edge.
The first camera matrix caught Last Chance at heading zero retracting to
1.57 m from the rover; collision-aware alternatives corrected it to 5.34 m.

Final mast matrix: all six entry/aim/freeze cases across five scenes passed.
Both Last Chance headings and Blueberries sending/resumed-receipt cases passed
with 0.0000 m drift and 5.34 m resumed distance. Repeated renders and pause/resume
remain stable. Native Last Chance capture, send and receipt showed a clear,
stationary rover composition. Desktop and portrait room inspection found the
note clear of the original signal, with unboxed text. Portrait simulated
controller recovery with reduced motion passed; native portrait call also
reached no reply.

Engine tests: all 33 files passed. Source checks and build passed. Browser
checks are documented in VERIFICATION.md; physical controller feel and a new
complete emotional playthrough are not claimed. Geometry is authored, not a
surveyed reconstruction of the NASA photographs or a real control room.

Final visual critique also rejected Blueberries views that exposed the neck and
deck when the player approached facing away. A trial chassis reorientation was
removed because nearby rocks limited the turn and it changed the player's pose.
The final implementation preserves the driven pose, aims nearer/downward, uses
a tighter sample crop and excludes the rover's first-person body from this one
close sample photograph. The rover returns in the wide sending view. All other
world geometry and the physical camera mount remain present. A late GLB load
can settle the rover; the optical camera now follows that actual mount instead
of retaining its earlier world coordinates. Tests include cold entry and four
Blueberries approach headings. Source vertices independently confirmed the
mast center; that calculation alone was insufficient to prove a clear image.
