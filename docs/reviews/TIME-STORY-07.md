# TIME-STORY-07 — make duration perceptible

## Selected implementation after independent scrutiny

The proposal below records the initial design exploration. The integrator chose
two rover-life seams: **7 seconds from blueberries (2004) to marathon (2015),
then 3 seconds from marathon to ordinary-day (2018)**. The proposed Earth montage
below is rejected: it would summarize February before the final call and repeat
an already legible waiting beat. Existing Earth date/subtitle copy carries the
eight-month recovery effort instead. No third passage or new ritual interaction.

Implemented `src/content/time.js` with `missionTime(sceneId)` and
`timePassage(fromId, toId)`, plus five small story copy edits. Existing heading
replacement retains exact milestone dates and sols; coarse operational ages are
0/11/14 years and freeze at 14 for Earth scenes. The first bridge labels its
middle fragment `IMAGINED ROUTINE`; historical endpoints come from NASA. Root
owns camera/light/skip/pause integration. Three content tests pass; browser and
integration checks remain with the integrator.

Scope: narrative/pacing proposal only; no runtime edits. Read AGENTS, README,
PLAN, TASKS, CONTRIBUTING, `src/content/story.js`, and relevant `src/main.js`
render/advance paths. Primary NASA chronology checked 2026-11-14.

## Diagnosis

The twelve scenes cover three very different scales:

| Scenes | Time represented | Current live impression |
| --- | --- | --- |
| first-morning, stone-ripples, blueberries | January–early 2004, ending sol 48 | Three nearby discoveries |
| marathon | March 24, 2015, sol 3968 | Another short local drive |
| ordinary-day | Generic pre-storm 2018 | The immediately following afternoon |
| dust, smaller-world, last-image | Early June through June 10, 2018, sol 5111 | Three increasingly dark actions |
| earth-listens, months | After contact loss; recovery over months | Two more adjacent interactions |
| last-call, what-remains | February 12 and 13, 2019 | A call and its conclusion |

The game already contains the right history. The live presentation hides much
of its duration: `renderGame` shows subtitle/discovery/response, while paragraphs
about thousands of mornings and weeks becoming months live in the optional
journal. `act(NEXT)` immediately renders the next observation. A small date
changes above a nearly continuous landscape; travel and the same upload rhythm
suggest a single outing. Four discovery beats carry fourteen years; four storm
beats carry days. Longer prose or slower driving would not repair that grammar.

## Recommended bounded revision

### 1. Two purposeful ellipses, maximum about twelve seconds combined

**Primary: after blueberries receipt, before marathon observation (7 seconds).**
After the player deliberately continues, briefly leave traversal. Repeat a
familiar rover/camera silhouette across three separated still compositions:
morning light, low winterlike light, a later warm horizon. Match rover framing,
not literal terrain position; change ground/ridge composition or cut through a
brief dark interval so this does not assert eleven years at Berry Bowl.

Exact caption sequence:

- `2004 → 2015` / `Mornings became years.`
- `Wake. Look. Send something home.`
- `Eleven years later · SOL 3968` / `Still another horizon.`

No intermediate dated incidents, numbered transmissions, simulated sol counter,
or new tasks. One familiar receipt motif can accompany the middle image; the
images and captions must communicate the complete idea muted. These are imagined
routine fragments, not documentary footage. Then land directly in the existing
marathon observation, with no additional confirmation screen.

**Secondary: after earth-listens receipt, before months observation (4–5 seconds).**
Reuse the last silent Mars view as an explicitly Earth-side remembered image,
not a waking rover. Two quiet cuts/lighting states and one continuing empty
channel establish continued effort rather than another simulated rover day.

Exact caption sequence:

- `EARTH · JUNE 2018 → FEBRUARY 2019`
- `Eight months of trying to hear from you.`
- `More than 1,000 recovery commands. No reply.`

This is the recovery campaign as a whole, summarized before its final-call beat;
the following last-call scene still names February 12 and the ending February
13. Avoid claiming all commands occurred by an unspecified earlier month. Keep
the source-backed command count in the existing months discovery too only if
the repeated number is useful; otherwise replace that live line with
`The images and measurements still have things to tell us.` and retain the fact
in its optional observation.

Both ellipses need immediate Skip, keyboard/touch/controller activation,
pause-safe timing, and static reduced-motion presentation. Persist the destination
scene before playback so reload cannot trap/replay the bridge. Skipping must
leave the final date/age in the ordinary heading. If scope only permits one,
choose the eleven-year bridge; it repairs the largest discontinuity.

Downside: even short montages add passive time and can feel sentimental. Do not
extend either to fill the 10–15 minute target. An image/light change is required;
a seven-second title card alone is reading, not accumulated life.

### 2. Refine existing date labels and repeat one evolving line

Replace the existing sol eyebrow rather than add another clock or HUD row.
Retain exact sourced sols and distinguish Earth waiting from rover operation:

| Scene | Proposed existing eyebrow | Proposed existing subtitle |
| --- | --- | --- |
| first-morning | `2004 · FIRST MORNING · SOL 01` | keep existing |
| stone-ripples | `2004 · THE FIRST MONTHS` | keep existing |
| blueberries | `2004 · SOL 48` | keep existing |
| marathon | `2015 · ELEVEN YEARS ON MARS · SOL 3968` | `Wake. Look. Send. Still another horizon.` |
| ordinary-day | `2018 · FOURTEEN YEARS ON MARS` | `Wake. Look. Send. The work has become familiar.` |
| dust | `EARLY JUNE 2018 · THE STORM` | keep existing |
| smaller-world | `JUNE 2018 · THE LAST DAYS OF CONTACT` | keep existing |
| last-image | `JUNE 10, 2018 · SOL 5111 · LAST CONTACT` | keep existing |
| earth-listens | `EARTH · AFTER JUNE 10, 2018` | `Look. Call. Listen. No answer.` |
| months | `EARTH · EIGHT MONTHS OF RECOVERY` | `The signal has stopped. The discoveries remain.` |
| last-call | existing February 12 date | keep existing |
| what-remains | existing February 13 date | keep existing |

The motif belongs to existing subtitles and transitions, not an added checklist
or mandatory daily ritual. The familiar structure changing from sending to
listening supplies meaning to repeated inputs. Do not repeat it at every scene.
At ordinary-day arrival, the heading/year change must be clearly visible before
the action dock draws attention; no third montage is needed for 2015→2018.

Downside: longer eyebrows can wrap on phones. Prefer year/age over a decorative
chapter label at narrow widths, and never remove the Earth viewpoint. Ages are
coarse descriptions of mission history, not a clock advancing while the player
explores. `FIRST MONTHS` avoids inventing a precise Last Chance sol.

## Facts and fiction

NASA records marathon distance on March 24, 2015, sol 3968, eleven years and two
months after landing: [Opportunity’s Marathon Journey](https://science.nasa.gov/resource/opportunitys-marathon-journey/).
NASA/JPL records last contact June 10, 2018, over 1,000 recovery commands, an
eight-month recovery effort, final commands February 12, 2019, and mission
completion February 13: [mission-end announcement](https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/).
These are chronology anchors. The exact repeated wake/look/send wording,
lighting, transitions, machine feelings, and selected ordinary days are fiction.
Keep the existing dramatization credit; do not attach exact intermediate sols to
the montage or imply continued rover activity after June 10.

## Scrutiny and acceptance

Independent critic correctly challenged adding a duplicate persistent age clock
and holding one historical location across eleven years. This proposal replaces
the current date presentation and matches rover framing across changed scenery.
The second bridge uses Earth waiting, giving duration a different emotional
function instead of repeating the first montage.

Verify first play, skip, pause midway, saved resume, restart, muted play, reduced
motion and narrow viewport. A player should identify that Berry Bowl and marathon
are eleven years apart, and that Earth tried for months after the rover stopped.
Actual emotional effect still requires human playtesting. No runtime tests or
browser checks were run for this document-only proposal.
