# Independent browser playtest — FIX-17

**Blocked; no gameplay claims.** Requested independent playthrough used the
isolated origin `http://localhost:4173/?controller=off`, preserving the root
reviewer's separate `127.0.0.1` storage. The server was not modified or stopped.

CUA `createBrowserTab("iab", ..., {visible:false})` returned:

> Browser is not available: iab

A subsequent CUA inventory returned `apps: []` and `browsers: []`. Therefore this
agent could not open the game, manually drive, investigate, inspect screenshots,
or complete comparison/send/receipt. No screenshots were created. No physical
haptics output was requested or triggered.

Root browser QA must establish visual clarity and actual interaction behavior.
Prior source/engine review is recorded separately in `INTEGRATION-17.md`; it is
not an independent playthrough and cannot establish enjoyment or emotional impact.
