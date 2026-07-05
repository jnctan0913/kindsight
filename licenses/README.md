# Licenses (private)

Drop the actual license certificates, receipts, and purchase records here:
music tracks, fonts, icons, stock art, the reference template, anything with
usage terms.

## Important: this folder is gitignored

The Kindsight repo is **public**. Vendor certificates usually contain your real
name, a purchase code, and an order number, so the certificate files must not be
committed. Everything in this folder except this README is gitignored and stays
on your machine only.

Because these files are not in version control, **back them up separately** (a
personal drive or password manager). If the machine is lost, they are gone.

## What goes where

| Item | Location | Committed? |
|------|----------|------------|
| Certificate / receipt / purchase code (PDF, screenshot) | `licenses/` | No (local only) |
| Public attribution: source + license type + link | `public/music/README.md` table | Yes |

Attribution is the only part a license normally requires to be visible. Keep the
human-readable credit in the public README; keep the proof-of-purchase here.

## Suggested layout

```
licenses/
  music/     one file per track, named to match public/music/<phase>/<file>
  fonts/
  art/
```
