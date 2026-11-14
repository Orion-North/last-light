# TEXT-14 — quieter sending interface

Changed only `src/ui/upload-terminal.js`, `src/ui/upload-terminal.css`, `tests/engine/upload-terminal.test.js`, and this handoff.

Removed the duplicate route over the planets, memory eyebrow labels, compressed-distance tag, path status captions, repeated footer statuses and three-step prose sequence. Sending now has one waiting status instead of both a generic sending status and waiting prose. The memory title and ready-stage meaning, planets and direction animation, learned call/reply marks and missing answer, actual receipt response and Continue remain. Direction remains available through the signal map's accessible label. Controller trigger glyphs, one live instruction, progress hooks and trigger-only ready state remain intact. Removed unused styles and centered the remaining action footer.

Verification: upload-terminal direct suite **9/9 passed**; project check **43 JS syntax checks / 12 scene contracts / assets and NASA GLB/license passed**. Render contracts now check absence of duplicate prose while preserving receipt meaning, input commitment, one memory title, one sending status and accessible endpoints. No gesture or haptics changes, physical output, browser verification or publication performed. Integrator owns visual QA.
