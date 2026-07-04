# Kindsight background music

Big screen is the only audio surface. Each phase folder is a playlist:

- `lobby/`   plays while players join
- `writing/` plays during writing rounds
- `wrapup/`  plays on wrap-up / highlight wall

Every track in a folder plays in order (alphabetical by filename); when the last
one finishes it loops back to the first and the whole folder keeps cycling. A
folder with a single track just loops that track gaplessly. The skip button
advances to the next track in the folder.

(No `briefing/` or `reveal/` folder: briefing ducks the current phase to 20%,
reveal is silence.)

Drop audio files (`.mp3` recommended, ~128 kbps) directly in each folder, then
run `node tools/gen-music-manifest.mjs` (also runs automatically on build).
Prefer `.mp3` over `.wav`: wav is uncompressed and bloats the Pages bundle. Aim
to keep the whole `music/` tree under ~40 MB.

## Track licenses (required before public launch)

Only royalty-free or licensed tracks. One line per file:

| File | Source | License |
|------|--------|---------|
| lobby/Nice and Friendly Story.mp3 | | |
| writing/AudioHarvest_Warm-Acoustic-Guitar_Short-01_69sec.mp3 | | |
| writing/Sentimental Acoustic.mp3 | | |
| writing/Warm Acoustic Inspiring.mp3 | | |
| writing/Welcome Home.mp3 | | |
| wrapup/Acoustic Chill.mp3 | | |
