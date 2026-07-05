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

## Track licenses

All tracks are licensed via Envato Elements (background music embedded in this
app as the licensed "End Product"). Envato Elements does not require attribution;
the credits below are courtesy. Proof-of-license certificates (with licensee name
and item license codes) are kept privately in `licenses/music/`, not committed.

| File | Source (Envato Elements) | Author | License |
|------|--------------------------|--------|---------|
| lobby/Nice and Friendly Story.mp3 | [Nice and Friendly](https://app.envato.com/item/b1df605f-153a-47f0-be79-1c31ef42a044) | SteelSound | Envato Elements |
| writing/AudioHarvest_Warm-Acoustic-Guitar_Short-01_69sec.mp3 | [Warm Acoustic Guitar](https://app.envato.com/item/2b023f8e-9469-4f34-abf9-895390803adf) | audioharvest | Envato Elements |
| writing/Sentimental Acoustic.mp3 | [Acoustic](https://app.envato.com/item/05677d5d-36ca-4115-b0cf-7093a64c8625) | HeartDrumMachine | Envato Elements |
| writing/Warm Acoustic Inspiring.mp3 | [Warm Acoustic Inspiring](https://app.envato.com/item/5677dfbf-1c7a-4d14-ba28-d361e13bd064) | Neoclassic | Envato Elements |
| writing/Welcome Home.mp3 | [Welcome Home](https://app.envato.com/item/906b0996-f8ca-4702-85c9-4eda6503c765) | Basspartout | Envato Elements |
| wrapup/Acoustic Chill.mp3 | [Acoustic Chill](https://app.envato.com/item/d2ad6534-a67b-44a8-b8b2-17cf3070d24e) | VICTORMUSIC | Envato Elements |

License terms: https://elements.envato.com/license-terms . Note the Elements
license does not permit end users to extract these tracks for standalone use, so
do not expose them as direct downloads outside the app's background playback.
