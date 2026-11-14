# ART-04 — dry ground and rock PBR assets

- Owner: asset acquisition agent; shared `develop/v0.4` checkout, disjoint paths.
- Allowed paths: `public/textures/`, `public/models/rocks/`, this handoff. No source edits, commit, or publication.
- Delivered: six unmodified official 1K JPEG maps (albedo, OpenGL normal, roughness), 5,075,233 bytes total. `public/textures/ground/` uses Rocks Ground 05 by Rob Tuytel; `public/textures/rock/` uses Rock Boulder Cracked by Dario Barresi (processing) and Dimitrios Savva (photography). Each directory includes exact source URLs, MD5, size, license and verification date in `provenance.json`. Original CC0 legal text retained as `public/textures/CC0-1.0.txt`.
- Official verification: https://polyhaven.com/a/rocks_ground_05 describes dry gravel/stony soil, physical width 3m; https://polyhaven.com/a/rock_boulder_cracked describes weathered orange stone, physical height 1.4m. https://polyhaven.com/license confirms all asset textures/models are CC0 and permits redistribution. No preview/site artwork was downloaded. These are terrestrial reference surfaces, artistic Mars materials rather than NASA data or precise reconstructions.
- Integration: exact paths `public/textures/ground/{albedo,normal,roughness}.jpg` and `public/textures/rock/{albedo,normal,roughness}.jpg`. Albedo sRGB; normal/roughness linear; GL normal orientation. Start ground tiling at one repeat per 3 world metres and rock surface at one repeat per 1.4m. Tune normal strength conservatively so investigation features remain legible. Six RGBA GPU textures with mipmaps cost about 32MiB before driver overhead. Paths and scale sent to geometry agent.
- Actual checks: all six files match official API MD5 and byte size; JPEG headers confirm 1024×1024. Licensing and individual asset pages read via web tool. Metadata downloaded from `api.polyhaven.com/files/rocks_ground_05` and `/files/rock_boulder_cracked`. Initial network request failed DNS; approved escalated downloads succeeded. PIL unavailable, so dimensions verified via JPEG SOF headers using Python standard library instead. Original legal text file exists (>5KB).
- Limitations: no in-game visual/browser/GPU test by this lane; integration must check tiling, colors, normal strength and memory. Optional scanned rock mesh deferred: good surface maps fit requested 4–6MB budget without adding model download/complexity. No external executable or dependency installed.
- Next action: integrator add ledger rows below, verify renderer color spaces and visual quality; publish only if explicitly requested.

Proposed ledger rows (adapt column order to current ledger):

```csv
public/textures/ground/albedo.jpg|public/textures/ground/normal.jpg|public/textures/ground/roughness.jpg,https://polyhaven.com/a/rocks_ground_05,Rob Tuytel / Poly Haven,CC0-1.0,Unmodified official 1K JPEG PBR maps; artistic Mars terrain application,2026-11-14
public/textures/rock/albedo.jpg|public/textures/rock/normal.jpg|public/textures/rock/roughness.jpg,https://polyhaven.com/a/rock_boulder_cracked,Dario Barresi and Dimitrios Savva / Poly Haven,CC0-1.0,Unmodified official 1K JPEG PBR maps; artistic Mars rock application,2026-11-14
```
