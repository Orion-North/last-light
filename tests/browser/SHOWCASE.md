# Gameplay showcase capture

Local production-game capture fixture, excluded from the shipped build. Open `showcase.html` through the dev server; load/start each clip, then advance at 24 frames per second. The iframe runs the real game with a private in-memory save store, scripted standard-gamepad inputs and virtual rendering time. Crop the 1280×720 iframe below the 40px toolbar. No production autoplay or save changes.

Cut: opening 0–8s; driving 8–14; layers 14–24; brushing 24–34; samples/send 34–48; storm 48–56; last image 56–66; final recovery call 66–76; ending 76–80. Ending spoilers included at user request. Scene checkpoints compress the full game; this is not one continuous human playthrough.

`showcase-audio.html` exports an edited stereo arrangement from the production score, instruments and radio motifs, not live game audio. Signal events: 40.333 send, 42.750 reply, 60.250 partial signal, 70.250 unanswered Earth call. The final unanswered windows are silent. The MP4 uses 4× audio gain and a limiter, with opening/closing video fades.

2026-11-15 verification: 1,920 captured frames; 80s H.264 1280×720 at 24 fps, stereo AAC. All three transmission states and closing remembrance visually checked; soundtrack export reports finite stereo data and zero samples in unanswered windows. Repository syntax/assets checks passed. Capture exposed text reveal being paused during exploration; production behavior retained.

Capture backend intermittently included the 40px toolbar despite the requested crop. Export normalizes each frame using toolbar detection, crops to the common 1280×680 game area, and adds 20px top/bottom letterboxing. Original captured frames are retained alongside the MP4.
