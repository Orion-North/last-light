# SCIENCE-37 — authentic discovery photographs

Completed 2026-11-15 on shared branch `improve/discovery-camera`. No commits or
deployment. Owned paths only: `src/content/discovery-photos.js`,
`public/images/discoveries/`, this handoff.

## Delivered

`discoveryPhotos` is keyed by `stone-ripples` and `blueberries`; each entry exports
the agreed title, instrument, date, credit, sourceUrl, src, alt, caption and
discovery strings. Relative image URLs begin `./public/` for the existing page
and static build. The caption explicitly distinguishes the player's authored
reconstruction from the historical photograph. Both photographs were inspected
visually using view_image after download.

## Asset ledger entries for integrator

Both files preserve the downloaded JPEG bytes: no crops, resizing, recoloring,
generated content or other modifications. Combined payload: **87,791 bytes**.

| Path | Original image URL | Source and credit | Bytes / dimensions |
| --- | --- | --- | --- |
| `public/images/discoveries/last-chance.jpg` | https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA05482.jpg | https://www.jpl.nasa.gov/images/pia05482-ripples-in-rocks-point-to-water/ — NASA/JPL/Cornell | 21,804 / 447×333 |
| `public/images/discoveries/berry-bowl.jpg` | https://assets.science.nasa.gov/content/dam/science/psd/mars/downloadable_items/3/5/35718_Sol048B-PIA05634.jpg | https://science.nasa.gov/resource/discovery-served-up-in-a-bowl/ — NASA/JPL-Caltech/Cornell | 65,987 / 768×512 |

Use: educational/informational NASA/JPL imagery, with source-specific credits;
no endorsement implied. Existing project NASA media policy source:
https://www.nasa.gov/nasa-brand-center/images-and-media/ and JPL image-use policy:
https://www.jpl.nasa.gov/jpl-image-use-policy . These are source-attributed NASA
images, not blanket claims that every NASA-hosted asset has the same license.
Source pages and download links checked 2026-11-15.

## Fact verification and dates

- Last Chance's primary page identifies the displayed rock and Pancam, and
  explains the small scale and geometry that favor water over wind. Its March 2,
  2004 header is not treated as the acquisition date. The same page describes
  ancillary Pancam/MI figures acquired on different sols. Metadata therefore
  uses “Early mission · 2004.”
- Berry Bowl's page identifies an approximate true-color Pancam rendering and
  brushing of Near Empty on sol 48, followed by spectrometer comparison. Its
  March 25, 2004 publication header is not used as the image acquisition date.
  Metadata uses “Early mission · 2004” and separately labels brushing on sol 48.
- A photograph does not itself measure hematite. The discovery text links the
  brush to spectrometer comparisons, and treats water as a supported
  interpretation rather than proof from the photograph alone.

## Creative framing guidance

- Last Chance: look down at a pale oblong rock filling the center, its long axis
  broadly horizontal, gray ground around it and another rock toward upper right.
  Keep the horizon out of frame. The historic image is modest resolution;
  preserve its 447×333 aspect and avoid giant full-screen enlargement.
- Berry Bowl: a downward, near-overhead rock view; pale circular brush mark just
  left/below center, dark grains clustered to its right and scattered around the
  slab. The real image includes some rover hardware at the bottom edge.
- Use `object-fit: contain` for the historic image. Match broad composition,
  then reveal the difference; do not imply the reconstructed terrain or player
  camera exactly reproduces NASA's observation.

## Checks and integration limits

Downloaded both original images from links on verified official NASA/JPL source
pages, checked JPEG signatures/dimensions visually, and checked metadata field
presence and local image existence with Python. Node was unavailable in this
agent's shell, so JavaScript import validation remains for root. Full integration,
asset ledger update, source checks, build and browser flow remain root-owned.
