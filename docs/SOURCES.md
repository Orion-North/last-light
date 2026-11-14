# Challenge and source notes

Reviewed 2026-11-14. Sources support the first playable's historical notes and
science interactions. Paraphrases below are not quotations. NASA-linked source
credits do not imply endorsement of the game's fictional dialogue or generated art.

## Challenge fit

**C1 — [Official challenge](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/)**
and [Resources tab](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources).
Both tabs were read in the browser after automated fetching failed.

The brief invites an engaging educational story about retired exploration
hardware, its purpose, and the science it enabled, for school-age and casual
audiences. Web experiences and games are explicitly welcome. It emphasizes
historical accuracy, narrative, and a connection between engineering and discovery.
Its resource list includes Spirit and Opportunity. A single-rover project fits;
covering multiple missions is not required. Our age target, length, and three-act
structure are design choices, not official requirements. Submission rules and
event-specific deadlines still need checking before release.

## Evidence register

| ID | Primary source | Verified use |
| --- | --- | --- |
| N1 | [NASA Opportunity overview](https://science.nasa.gov/mission/mer-opportunity/) | Designed for 90 sols; last contact June 10, 2018; mission declared complete February 13, 2019; 45.16 km traveled; search for evidence of past water |
| N2 | [NASA/JPL mission-end announcement](https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/) | Dust storm ended communication; more than 1,000 recovery commands; final commands sent February 12, 2019 |
| N3 | [NASA: Opportunity's Last Message](https://science.nasa.gov/resource/opportunitys-last-message/) | A dark, partial full-frame Pancam image was transmitted June 10, 2018; distinguish it from later thumbnail images |
| N4 | [NASA Spirit and Opportunity mission](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) | Challenge-linked mission reference; starting point for instrument and discovery research |
| N5 | [NASA rover science instruments](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/) | Pancam's paired cameras and panoramic imaging; microscopic imager and rock abrasion tool functions |
| N6 | [JPL: Ripples in Rocks Point to Water](https://www.jpl.nasa.gov/images/pia05482-ripples-in-rocks-point-to-water/) | Pancam and microscopic-imager views of Last Chance showed crossing layers interpreted as evidence of ancient flowing water |
| N7 | [NASA: Discovery Served Up in a Bowl](https://science.nasa.gov/resource/discovery-served-up-in-a-bowl/) | Berry Bowl brushing on sol 48 enabled spectrometer comparisons of cleared rock and hematite-rich spherules; evidence supported formation involving water |
| N8 | [NASA: Opportunity's Marathon Journey](https://science.nasa.gov/resource/opportunitys-marathon-journey/) | Marathon distance of 42.195 km surpassed on sol 3968, March 24, 2015 |
| N9 | [NASA rover science highlights](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/) | Opportunity's hematite concretions contributed evidence of ancient water; do not conflate Spirit's discoveries with Opportunity's |

## Accuracy rules for the story

- June 2018 contact loss and February 2019 mission closure are different events.
  Make the epilogue's time jump explicit.
- Describe a mission that greatly exceeded its design life and a sustained recovery
  effort, not engineers casually abandoning a working rover.
- Inner thoughts, memory selection, power choices, and compressed time are fiction.
  Label them as dramatization. Power values must not masquerade as telemetry.
- Do not label a poetic line as the rover's literal final words without a primary
  source. Prefer original, clearly fictional writing and the actual image record.
- Two instrument-to-discovery connections are implemented: Last Chance imaging
  and cross-lamination (N6), then Berry Bowl brushing and spectroscopy (N7).
  The script separates observing a clue from combining evidence to interpret it.
  It never treats a camera image alone as proof of mineral composition or life.
- For dates near midnight, record the time zone when citing a landing date; do not
  silently mix NASA's local-time and UTC dates.

## First playable narrative conventions

`src/content/story.js` contains twelve scenes: four discovery scenes, four storm
scenes, three Earth-side recovery scenes, and a final archive epilogue. The script
compresses 2004–2019 into an imagined experience; generic early-mission and
pre-storm labels avoid assigning invented actions to precise real mission sols.
Dates/sols used explicitly are source-backed: 48, 3968, and 5111.

All rover inner thoughts and messages introduced as “Earth, imagined” are original
fiction. No text claims to reproduce the rover's supposed last spoken words.
The last-image scene describes the actual incomplete transmitted frame but labels
the in-game rendition as dramatized. There is no claim the player selects actual
onboard files or affects real power use. The archive represents remembrance.

After June 10, 2018, the viewpoint explicitly changes to Earth. Outgoing calls and
silence must not be rendered as newly received rover telemetry. The last recovery
call and the mission-end announcement remain distinct dates. The script states
that no player choice could prevent or cause the historical loss of contact.

Scenes expose source IDs for factual notes. N5 supplies additional first-scene
camera context; N1 supplies that scene's 90-sol mission fact. NASA sources remain
available through the in-game credits/source list. No external site is required
to advance through the locally bundled narrative.

## Asset provenance

Use [the asset ledger](../public/ASSETS.csv). Each shipped asset needs its path,
source URL, creator/credit, usage terms, modifications, and verification date.
Generated assets should identify the tool/model and prompt record. This repository
does not assume all material hosted by NASA has identical reuse terms.

## Rover model and distribution credits

**A1 — [NASA Spirit and Opportunity rover model](https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/).**
The official resource credits **NASA/JPL-Caltech**. The downloaded file is
`24883_MER_static.glb`, stored as `public/models/opportunity.glb`, with its texture
images embedded. The inspected file is 11,910,084 bytes; the original model alone
exceeds the earlier 10 MB whole-game target. The integrator should update that
target or load the model after the lightweight entry screen.

Direct download:
[NASA GLB](https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24883_MER_static.glb).

**A2 — [NASA images and media guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/).**
NASA's guidance explicitly covers files used for 3D models, including textures and
polygon data, and describes educational/informational uses. It asks users to
acknowledge NASA, avoid suggesting endorsement, and respect separately identified
third-party rights. The model resource identifies NASA/JPL-Caltech and does not
display a separate third-party copyright restriction. These are source notes,
not a blanket license claim about every NASA-hosted item.

Recommended in-game credit: **“Rover model: NASA/JPL-Caltech. Terrain, lighting,
sound, and narrative are artistic interpretations. This independent project is
not endorsed by NASA.”** Use the NASA name for source attribution, not the NASA
insignia as the project's own logo.

**A3 — [Three.js r180 MIT license](https://github.com/mrdoob/three.js/blob/r180/LICENSE).**
The vendored copy is in `vendor/three/LICENSE`, credited to the three.js authors
2010–2025. Preserve that copyright and permission notice in distributed copies.
The NASA model, original game code, and generated artwork are separate entries
in [the asset ledger](../public/ASSETS.csv); the MIT notice is not their license.

The environment is original procedural terrain, not NASA elevation data. Audio
is original Web Audio synthesis, not a recording from Mars or a reference game's
soundtrack. [ART.md](ART.md) records the generated fallback poster and its prompt.
[INSPIRATION.md](INSPIRATION.md) records design references without importing assets.

## Agent tooling reference

[Antigravity customization documentation](https://antigravity.google/docs/commands/learn)
lists workspace `AGENTS.md` and `GEMINI.md` among rule locations. The repository
uses a small `GEMINI.md` pointer and a manual onboarding fallback; no external
agent tool was run during setup.

## v0.4 sky reference

- NASA, [What Do Sunrises and Sunsets Look Like on Mars?](https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/), checked 2026-11-14. Supports warm dusty daytime color and localized blue near the low Sun. The shader is an artistic approximation, not atmospheric simulation or NASA imagery.
- The drawn radio beam/target is a play aid for an imagined link-orientation action.
  Radio is not visible light and the target does not calculate Earth's real position.
  Alignment cannot alter Opportunity's historical loss of contact.
