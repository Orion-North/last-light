# SOURCE-40 — three more authentic Opportunity observations

2026-11-15, branch feature/mission-photo-scenes. Owned files only; no commits or
publication. Preserved the original Last Chance and Berry Bowl files/content,
adding their exact aspect ratios (447/333 and 768/512) and frameLabel strings.
Added first-morning, ordinary-day and last-image metadata with aspect 1.

All three new files are unmodified original official JPEGs, visually inspected
with view_image. Total additional bytes: **696,600**. No generated substitutes,
colorization, crop, reconstruction or restoration of missing final-image pixels.

## Asset ledger entries for root

| Local asset | Exact download URL | Credit | Size |
| --- | --- | --- | --- |
| public/images/discoveries/first-morning.jpg | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia05/pia05149/PIA05149.jpg | NASA/JPL/Cornell | 118122 bytes; 1024×1024 |
| public/images/discoveries/perseverance-valley.jpg | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia21/pia21725/PIA21725.jpg | NASA/JPL-Caltech | 259783 bytes; 1024×1024 |
| public/images/discoveries/last-image.jpg | https://assets.science.nasa.gov/content/dam/science/psd/mars/downloadable_items/4/42559_PIA22929_PANCAMSOL5111_1P581919922EFFD2FCP2682L8M1.jpg | NASA/JPL-Caltech/Cornell/ASU | 318695 bytes; 1024×1024 |

NASA educational/informational image use, source-specific credits, no endorsement;
see https://www.nasa.gov/nasa-brand-center/images-and-media/ and
https://www.jpl.nasa.gov/jpl-image-use-policy . Source and file checks 2026-11-15.

## Verified sources and historical qualification

- https://science.nasa.gov/photojournal/a-curious-landscape/ (PIA05149): genuine
  Pancam view southwest, late Martian afternoon at the landing site. Published
  January 25, 2004; exact acquisition timestamp is not asserted. Metadata says
  January 2004 and explicitly distinguishes the real afternoon from the story's
  imagined morning. Grayscale landscape, no rover hardware, not a collage.
- https://science.nasa.gov/resource/view-back-uphill-after-entering-perseverance-valley/
  (PIA21725): genuine Navcam photograph July 18, 2017, sol 4793. Solar panel and
  wheel tracks visible; slight north tilt improved available solar power during
  southern autumn. Root aligns the ordinary-day story to this 2017 observation. Do not describe
  it as a 2018 photo or Pancam photo.
- https://science.nasa.gov/resource/opportunitys-last-message/ (PIA22929): genuine
  June 10, 2018 sol 5111 left Pancam solar-filter view toward the hidden Sun.
  Speckles are camera noise. Black bottom quarter is missing transmission data;
  it must remain black, not be restored or represented as terrain/shadow. It is
  the incomplete final full-frame transmission, not the last exposure: later
  exposures reached Earth as thumbnails. Source caption and metadata preserve
  that distinction. Not a photograph of stars.

## Composition sent immediately to MODEL-40 and root

- First: white sky upper ~30%; dark crater rim slopes gently down to the right;
  pale flattened bedrock slabs across middle/right; dark granular soil foreground.
- Ordinary: uphill slope nearly fills frame, tiny sky wedge upper left; two dark
  wheel tracks retreat toward upper left/middle; rear solar panel fills lower
  ~30%, calibration post at x40% y72%; sunlight from left, shadow toward right.
- Last: featureless very dark gray noisy upper ~75%; exact black lower ~25%.
  No horizon and no visible Sun. The darkening sky is the appropriate authored
  scene; missing-data black pixels belong to the historical image only.

## Checks / integration

All files opened successfully in view_image; dimensions verified by JPEG header
inspection. Metadata fields and JPEG signatures checked with Python. Full JS
import/source/build/browser checks remain root-owned. Do not retain exploratory
PIA05144 portrait or PIA22074 wide mosaic: those temporary downloads were replaced
in place; the final paths above contain only the selected compact observations.
