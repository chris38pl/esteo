# Voice intake - image assets

Place WebP files in this folder. Paths are defined in `src/features/voice-intake/lib/recording-visual-assets.ts`.

## Files

| File | Use |
| --- | --- |
| `recording-glow-dark.webp` | Recording halo - dark mode (fallback in light) |
| `recording-glow-light.webp` | Recording halo - light mode |
| `recording-glow.webp` | Optional single-file fallback |
| `understand-your-project.webp` | Summary (“Podsumowanie”) hero |
| `error-owl-dark.webp` | Error screen - dark mode |
| `error-owl-light.webp` | Error screen - light mode |

## Requirements

- Transparent background (glow + owl + hero)
- Recording glow: ~640×640 px square
- Theme pairs (owl, glow): tune separately for light/dark contrast

## Verify locally

After `npm run dev`:

- `http://localhost:3000/images/voice-intake/recording-glow-dark.webp`
- `http://localhost:3000/images/voice-intake/understand-your-project.webp`
- `http://localhost:3000/images/voice-intake/error-owl-light.webp`

## Docs

Full feature documentation: [`docs/features/voice-intake.md`](../../../docs/features/voice-intake.md)
