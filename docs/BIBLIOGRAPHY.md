# Bibliography and resource links

Consolidated 2026-11-15 from the source register, asset ledger, controller notes,
art/music documentation, reviews and handoffs. This separates factual references,
files distributed with the game, and creative inspiration. A reference link does
not mean its images, recordings, fonts or code were copied. See [SOURCES.md](SOURCES.md)
for historical claims and dramatization rules, and [ASSETS.csv](../public/ASSETS.csv)
for file-level credits and terms.

## Challenge and science references

- NASA International Space Apps Challenge: [NASA's Discarded Equipment Storytelling](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/) and [resources tab](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources). Project brief; not an asset license.
- NASA Science, [Opportunity](https://science.nasa.gov/mission/mer-opportunity/) (N1). Mission lifetime, travel distance and chronology.
- NASA/JPL, [NASA's Opportunity Rover Mission on Mars Comes to End](https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/) (N2). Recovery effort and mission closure.
- NASA Science, [Opportunity's Last Message](https://science.nasa.gov/resource/opportunitys-last-message/) (N3). Actual final partial full-frame image; the game interpretation is dramatized.
- NASA Science, [Mars Exploration Rovers: Spirit and Opportunity](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) (N4), [science instruments](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/) (N5), and [science highlights](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/) (N9). Mission, instrument and discovery context.
- NASA/JPL, [Ripples in Rocks Point to Water](https://www.jpl.nasa.gov/images/pia05482-ripples-in-rocks-point-to-water/) (N6); [legacy Photojournal PIA05482 catalog](https://photojournal.jpl.nasa.gov/catalog/pia05482). Last Chance cross-lamination and annotated interpretation.
- NASA Science, [“Last Chance” Evidence of Ancient Water Flow](https://science.nasa.gov/photojournal/last-chance-evidence-of-ancient-water-flow/). Geology interaction reference.
- NASA Science, [Clues to Wet History in Texture of a Martian Rock](https://science.nasa.gov/resource/clues-to-wet-history-in-texture-of-a-martian-rock/). Rock texture and concretions reference.
- NASA Science, [Discovery Served Up in a Bowl](https://science.nasa.gov/resource/discovery-served-up-in-a-bowl/) (N7). Berry Bowl brushing and spectrometer comparison.
- NASA Science, [A Berry Bowl of Martian Spherules](https://science.nasa.gov/image-article/apod-2025-june-22-a-berry-bowl-of-martian-spherules/). Visual reference for the spherule-rich indentation.
- NASA Science, [Opportunity's Marathon Journey](https://science.nasa.gov/resource/opportunitys-marathon-journey/) (N8). Marathon milestone and sol/date context.
- NASA Science, [What Do Sunrises and Sunsets Look Like on Mars?](https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/). Warm dusty sky and localized blue near the low Sun; the shader is artistic, not a physical simulation.

## Bundled external art, software and reuse terms

- NASA/JPL-Caltech, [Spirit and Opportunity Rover, 3D Model](https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/) (A1). Shipped as `public/models/opportunity.glb`, including embedded textures. [Direct original GLB, 24883_MER_static.glb](https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24883_MER_static.glb).
- NASA, [Images and Media](https://www.nasa.gov/nasa-brand-center/images-and-media/) (A2). NASA media guidance covers 3D texture and polygon data; preserve source credit and avoid implied endorsement. Do not generalize this to separately credited third-party NASA-hosted material.
- three.js authors, [three.js r180 source](https://github.com/mrdoob/three.js/tree/r180) and [r180 MIT license](https://github.com/mrdoob/three.js/blob/r180/LICENSE) (A3). Vendored runtime/loaders; retain the notice in `vendor/three/LICENSE`.
- Rob Tuytel / Poly Haven, [Rocks Ground 05](https://polyhaven.com/a/rocks_ground_05). Unmodified 1K JPEG maps in `public/textures/ground/`.
- Dario Barresi and Dimitrios Savva / Poly Haven, [Rock Boulder Cracked](https://polyhaven.com/a/rock_boulder_cracked). Unmodified 1K JPEG maps in `public/textures/rock/`.
- Poly Haven, [Asset License](https://polyhaven.com/license): CC0. Local notice: `public/textures/CC0-1.0.txt`; download metadata and checksums are in each texture directory's `provenance.json`. These are terrestrial surfaces artistically applied to Mars, not NASA terrain data.

All six shipped texture downloads:

| Local file | Original download |
| --- | --- |
| `public/textures/ground/albedo.jpg` | [Rocks Ground 05 diffuse, 1K JPEG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rocks_ground_05/rocks_ground_05_diff_1k.jpg) |
| `public/textures/ground/normal.jpg` | [Rocks Ground 05 OpenGL normal, 1K JPEG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rocks_ground_05/rocks_ground_05_nor_gl_1k.jpg) |
| `public/textures/ground/roughness.jpg` | [Rocks Ground 05 roughness, 1K JPEG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rocks_ground_05/rocks_ground_05_rough_1k.jpg) |
| `public/textures/rock/albedo.jpg` | [Rock Boulder Cracked diffuse, 1K JPEG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_boulder_cracked/rock_boulder_cracked_diff_1k.jpg) |
| `public/textures/rock/normal.jpg` | [Rock Boulder Cracked OpenGL normal, 1K JPEG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_boulder_cracked/rock_boulder_cracked_nor_gl_1k.jpg) |
| `public/textures/rock/roughness.jpg` | [Rock Boulder Cracked roughness, 1K JPEG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_boulder_cracked/rock_boulder_cracked_rough_1k.jpg) |

## Technical and controller references

These informed implementation; listing a research page does not assign its terms
to the original project code. Community protocol findings are not browser or Sony guarantees.

- W3C, [Gamepad specification](https://w3c.github.io/gamepad/). Mapping, axes/buttons and polling.
- MDN, [GamepadHapticActuator: playEffect()](https://developer.mozilla.org/en-US/docs/Web/API/GamepadHapticActuator/playEffect). Browser rumble parameters/support.
- Chrome for Developers, [WebHID](https://developer.chrome.com/docs/capabilities/hid) and [receiving input reports](https://developer.chrome.com/docs/capabilities/hid#receive_input_reports). Device chooser, secure context and report handling.
- nondebug, [DualSense Explorer source](https://github.com/nondebug/dualsense/blob/main/dualsense-explorer.html). USB descriptor/report-layout research reference.
- stealth-alex, [DualSense HID output protocol research](https://gist.github.com/stealth-alex/10a8e7cc6027b78fa18a7f48a0d3d1e4). Historical trigger-valid-bit reference; its incomplete mode-26 description is superseded by the following references in current implementation notes.
- Nielk1, [trigger-effect factories and protocol notes](https://gist.github.com/Nielk1/6d54cc2c00d2201ccb8c2720ad7538db). Current trigger encoding basis.
- Valve, [published DualSense interface, Steamworks SDK 155 in Proton 11.0](https://github.com/ValveSoftware/Proton/blob/proton_11.0/lsteamclient/steamworks_sdk_155/isteamdualsense.h). Positions, amplitude and frequency reference.
- Linux kernel, [hid-playstation.c](https://github.com/torvalds/linux/blob/master/drivers/hid/hid-playstation.c). Sony-authored driver/report reference.
- Apple, [iPad Air specifications](https://support.apple.com/en-us/126471). Device-dimension reference used in the iPad playtest notes.
- GitHub Docs, [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Deployment reference, not a game asset.

## Design and music inspiration — consulted, not bundled

- thatgamecompany, [Journey](https://thatgamecompany.com/journey/). Scale, journey and emotional pacing.
- Mobius Digital, [Outer Wilds](https://www.mobiusdigitalgames.com/outer-wilds.html). Curiosity, observation and instrument-led discovery.
- 11 bit studios / Starward Industries, [The Invincible](https://11bitstudios.com/games/the-invincible/) and [official Steam store description](https://store.steampowered.com/app/731040/The_Invincible/). Tangible scientific tools and remote reporting.
- Okomotive, [FAR: Lone Sails](https://far-game.com/). Attachment through machinery and repeated routine.
- Campo Santo, [Firewatch: About / FAQ](https://www.firewatchgame.com/about/). Radio as human connection.
- Jenova Chen, [Designing Journey, GDC](https://www.gdcvault.com/play/1017700/Designing); [second session listing cited in the emotion review](https://www.gdcvault.com/play/1018751/Designing). Both resolve to the same session title and overview; retained to account for both review links.
- Kelsey Beachum, [Independent Games Summit: Sparking Curiosity-Driven Exploration Through Narrative in 'Outer Wilds', GDC](https://www.gdcvault.com/play/1027008), and [presentation slides](https://media.gdcvault.com/GDC%2B2021/beachum_gdc_2021%281%29.pdf). Curiosity-led narrative reference.
- Dino Ignacio, [Crafting Destruction: The Evolution of the Dead Space User Interface, GDC](https://www.gdcvault.com/play/1018819/contactUs). Instrument/interface design reference; unusual URL retained from the review.
- GDC, [Firewatch level-design session listing cited in the UX review](https://www.gdcvault.com/play/1022108/Level-Design-in-a-Day). The review consulted the abstract, not the full talk.
- Playdead, [Rendering of INSIDE, GDC presentation PDF](https://media.gdcvault.com/gdc2016/Presentations/Gjoel_Svendsen_Rendering_of_Inside.pdf). Visual hierarchy reference; the review records incomplete PDF retrieval.
- PlayStation Blog, [Dead Space hands-on details upgraded and expanded horror gameplay](https://blog.playstation.com/2022/10/14/dead-space-hands-on-details-upgraded-and-expanded-horror-gameplay/). World-preserving interface inspiration.
- Roger Sayer, [Projects: Interstellar](https://www.rogersayer.org/projects). Firsthand organ/performance account; conceptual score reference.
- Eclipse Magazine, [Gravity Composer Steve Price Talks With Michelle About Creating the Epic Score](https://eclipsemagazine.com/gravity-composer-steve-price-talks-with-michelle-about-creating-the-epic-score/). Direct composer interview, consulted for texture, motion and music/sound-design relationships.

No reference-game or film recordings, melodies, samples, models, textures, dialogue,
layouts or fonts are distributed. The score, cues, wind and mechanical sound are
original procedural Web Audio synthesis, documented in [SOUNDTRACK.md](SOUNDTRACK.md).
Typography uses system fonts; there are no downloaded font files to credit.

## Original project material and historical exclusions

Narrative, fictional rover thoughts, compressed teaching interactions, terrain
geometry, sky/lighting, interface art, vector marks, glyphs and procedural audio
are project-authored material developed with AI assistance. Historical facts are
separately sourced above. Gameplay screenshots, hero and social preview are
captures of the game and retain the NASA/JPL-Caltech and Poly Haven underlying
asset credits. Original project code/art terms remain as recorded in the asset
ledger; do not infer that NASA guidance, CC0 or three.js's MIT license covers them.

The earlier AI-generated `mars-landscape.png` poster/failure fallback is removed
from the current distribution. Its historical prompt is not a current external
resource or a shipped-asset credit. Removing that raster does not mean the
project was developed without AI assistance.

## Verification notes

Key primary pages re-opened through the web tool on 2026-11-15: NASA Opportunity,
NASA rover model, both Last Chance pages above, both Poly Haven assets and license,
both Journey GDC listings, Beachum's GDC listing, and Sayer's project account.
This verifies those page identities/content, not every external download or a
complete viewing of linked talks. Remaining URLs are preserved from repository
research/provenance records and are not newly certified as live. The challenge
page could not be accessed through that tool during this pass (the earlier source
register records browser access); the Dino Ignacio GDC URL timed out. Keep those
links as recorded and verify manually before a formal submission. Dynamic GitHub
`main`/`master` links may change; the Three.js and Valve references identify
release branches/tags. Localhost test pages, project navigation URLs and agent
setup documentation are deliberately excluded from this game-resource bibliography.
