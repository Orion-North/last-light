# First playable contract

Implementation uses dependency-free browser ES modules (JavaScript + JSDoc),
so it can run on any static host. No package installation required.

## Content export: src/content/story.js

Export `scenes` array and `sources` array. Scenes have:
- id string, act number 1/2/3, chapter string, sol string, title string
- text string (2–4 brief paragraphs separated by double newline)
- thought string (optional intimate first-person line, fictional)
- environment: dawn | day | sunset | storm | night | earth
- power number 0–100 (dramatized), signal number 0–100
- actionLabel string (e.g. Observe the outcrop)
- observation: { title, text, fact?, sourceId? }
- choices: array of { id, label, detail, memory: {title, text}, reply }
- transmission string (Earth reply, clearly dramatized)
- end boolean optional on the final epilogue scene
- approachTitle optional, used before discovery to avoid revealing its answer
- receiptMode optional: reply | partial | silence | archive; defaults from signal
Content 10–12 scenes, two choices each except epilogue; final epilogue can have zero.
Scene flow: observe -> choose -> transmit -> next. Final end scene shows archive.
Avoid wall-of-text. 10–15 minutes is pacing target; first-play pacing needs playtesting.
Sources: {id, title, url, credit?}. Export `credits` string optional.

## Engine export: src/engine/game.js

`createState()` returns {sceneIndex:0, phase:'observe', memories:[], selected:null,
paused:false, complete:false}.
`transition(state, action, scenes)` pure function. Actions:
{type:'OBSERVE'} -> choose; {type:'CHOOSE', choiceId} -> transmit and stores memory;
{type:'TRANSMIT'} -> received; {type:'NEXT'} -> next scene observe (end scene -> complete);
{type:'PAUSE'}, {type:'RESUME'}, {type:'RESTART'}.
Guard invalid transitions and paused actions, never mutate inputs.
Memories = [{sceneId, choiceId, title, text}]. selected = choice id or null.
End scene should be complete on entering and still available by sceneIndex.

## Audio export: src/audio/sound.js

`createSound()` returns { start(), setMuted(boolean), setScene(environment),
cue(kind), pause(), resume(), destroy() }. start/resume may return promises; guard
unsupported Web Audio. No network audio. Procedural restrained ambient sound.

## Visual export: src/ui/landscape.js and src/ui/style.css

`createLandscape(canvas)` returns {setScene(environment, {power, signal}?),
setReducedMotion(boolean), setPaused(boolean), destroy()}. Real Three.js/WebGL2 world, NASA rover GLB, driving and orbit controls.
Additional API: setMode, setDrive, focusRover, inspect, setWaypoint, setObservationTarget, travelToWaypoint,
reset. Emits world-status, rover-move, waypoint-reached.
Observation targets persist independently of the navigation marker. Set one on
scene entry (including resume) before inspect. Changing target releases inspection.
The generated image is a graphics-failure fallback only.

## Interaction waits and presentation

`createInteractionWait()` owns at most one pending callback; cancel on pause,
title, or restart. A cancelled wait leaves the saved engine phase at `transmit`,
ready for the player to retry. Waiting never advances the story in the background.
Discovery entries unlock after OBSERVE; all previous observations remain readable.

Root owns index.html and src/main.js and all integration. Visual owns style.css
and landscape.js only. HTML layout IDs/classes supplied in task.
