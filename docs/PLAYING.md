# How to play

[Play Last Light](https://orion-north.github.io/last-light/) · [Controller setup](CONTROLLERS.md) · [Back to the project](../README.md)

You are Opportunity, exploring Mars and sending discoveries home. Follow the destination marker, investigate what you find, then send the observation to Earth. There is no exploration timer: take time to look around.

## Getting started

Use a desktop browser with WebGL 2. Connect a standard gamepad and press a button to let the browser detect it, or use keyboard and mouse. The opening introduces the mission. Assistance is available deliberately through Pause → Help with this activity. On-screen prompts follow the input you are using, even with a controller still connected. Keyboard keys appear when you type or use the mouse; intentional controller input restores its glyphs.

| Activity | Controller |
| --- | --- |
| Drive | Left stick; R2 forward / L2 reverse during travel |
| Look or aim a tool | Right stick |
| Interact or compare readings | Cross / A |
| Trace, brush, or measure | Hold R2 while following the on-screen instruction |
| Send | Release both triggers, squeeze L2 + R2 and hold until charged, then release both |
| Memories | Square / X |
| Pause and settings | Options / Start |

Cross/A continues after a transmission result. The two-trigger gesture is the controller sending interaction; switching to keyboard or mouse reveals the Send button. See [all mappings and feedback options](CONTROLLERS.md).

With keyboard and mouse, use WASD or arrow keys to drive, drag to look, and follow the displayed tool prompts. Drag directly across the rock to trace or brush, or hold Space while using the arrow keys. Enter interacts, compares completed readings, captures a picture or sends when that action is ready. Escape opens settings; J opens Memories. Buttons remain available for story actions.

## Investigations

**Last Chance:** follow both dotted layer paths with the tool while holding R2. Compare their directions when both are traced.

**Berry Bowl:** sweep across the dusty patch until enough surface is exposed. Move onto each unread ring, stop moving, and hold the tool steady to take a reading. Release between readings, then compare them.

Other observations use the rover’s view: align with the indicated subject and keep the view steady. Completed work is retained when you pause.

## Saving, sound, and photos

Progress saves in this browser on this device. Use **Continue your journey** when returning; **Start anew** resets the journey. Clearing site data removes local progress.

Music and effects are enabled by default and start with your first interaction. The sound toggle mutes them; an explicit mute is remembered on this browser. The camera icon in the upper-right downloads a PNG of the 3D view without the interface. It does not change mission progress.

## If something does not work

- **Controller not detected:** press a button after connecting, then check Settings. The game accepts standard browser Gamepad mappings.
- **No vibration or trigger resistance:** check the separate capability/status messages and follow [controller setup](CONTROLLERS.md). Input can work even when feedback is unavailable.
- **Cannot send:** release both triggers first, squeeze and hold until the prompt changes, then release both. Reconnecting or resuming requires a fresh release.
- **3D cannot start:** check hardware acceleration and WebGL 2 availability. The game shows a story fallback if graphics initialization fails.
- **Unexpected layout or movement:** [report a bug](https://github.com/Orion-North/last-light/issues/new/choose) with the scene, browser, device, and steps. A screenshot helps.


## Discovery camera

The landing site, Last Chance, Berry Bowl, Perseverance Valley and final sky
observation each lead into the rover camera. The landing-site memory choice stays
part of your archive.
Drag or use the arrow keys/right stick to frame the discovery, then choose **Take
picture** (Enter or the controller’s right bumper: R1 / RB). Framing is forgiving and
has no timer. The captured frame pauses, dissolves into a credited original NASA image, holds so you can see it, then
fades into the original Mars–Earth sending instrument. **Send** or the usual
two-trigger squeeze/release starts the familiar signal journey and Earth reply.
The photo clears as the transmission begins; there is no extra review menu.
Photo credits and source links remain in Memories. The camera stays in the world you explore. Its terrain is an artistic interpretation; the original photographs have their own viewpoints.

Pause preserves the captured frame. Reload before sending returns to camera framing
without repeating the investigation; received observations remain available after
reload. Reduced motion in Settings quiets the camera/reveal transitions.

There are no inline skip buttons. Pause → Help with this activity opens a separate
confirmation, initially focused on keeping the current activity. Assisted
investigations are marked in the journal. Graphics/capture failure offers a
historical-image alternative; missing imagery does not block the story.
