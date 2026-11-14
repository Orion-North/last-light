# ASSETS-01 — 3D asset provenance and inspiration

- Agent / owner: story subagent.
- Allowed paths: `docs/INSPIRATION.md`, `public/ASSETS.csv`, `docs/SOURCES.md`, this file.
- Work performed: reviewed official NASA model and media guidance; read the local
  GLB asset metadata and Three.js MIT notice; documented three game references.
- Files changed: all four allowed paths. No game code changed; no commit made.
- NASA model: official credit is NASA/JPL-Caltech. Use that credit in-game and
  identify the landscape/narrative as interpretations; avoid implying endorsement.
- Three.js: r180 / 0.180.0; retain `vendor/three/LICENSE` in the deployed package.
- Ledger: six entries covering rover model, Three.js, original procedural
  environment, original synthesized sound, generated fallback poster, and favicon.
- Design: Journey for scale/solitude; Outer Wilds for curiosity and attachment;
  The Invincible for tangible scientific machinery. Original assets and writing;
  references do not authorize copying game materials.
- Checks: CSV columns and unique IDs; referenced local paths; Markdown local
  links; and whitespace checked. No browser or final package inspection in this task.
- Caution: the inspected NASA GLB is 11,910,084 bytes with twelve embedded texture
  images, exceeding the old 10 MB total target before other assets. Reconcile the
  budget and/or stage its load. Keep real-time 3D as the primary experience; the
  generated image is a fallback only.
- Fetch note: the publisher page for The Invincible returned 403 to direct fetch;
  its official indexed search result supplied the hard-science-fiction and
  instrument-driven description. No third-party review was used for the design note.
