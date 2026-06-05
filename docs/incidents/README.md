# Incident notes

Short postmortems for non-obvious bugs and the patterns that fixed them. Use these when debugging similar symptoms (RSC hangs, perpetual "Rendering...", redirect loops, layout waterfalls).

| Date | Title | Symptom |
| --- | --- | --- |
| 2026-06-01 | [Blank dashboard / Rendering after login](./2026-06-01-blank-dashboard-rendering-after-login.md) | Blank main area, sidebar visible, "Rendering..." never settles after email/password login |
| 2026-06-06 | [Blank sign-in on /continue](./2026-06-06-sign-in-continue-blank.md) | Empty form at `/pl/sign-in/continue` after password login on untrusted browser |

When adding a new note, name files `YYYY-MM-DD-short-slug.md` and add a row to this table.
