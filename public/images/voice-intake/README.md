# Voice intake — nagrywanie (tło świetlne)

Umieść grafikę efektu świetlnego w **tym folderze**:

```
public/images/voice-intake/
```

## Nazwy plików (ważne — dokładnie tak)

| Plik | Kiedy używany |
|------|----------------|
| `recording-glow-dark.webp` | Dark mode (lub fallback w light) |
| `recording-glow-light.webp` | Light mode (opcjonalnie) |
| `recording-glow.webp` | Jeden plik na oba tryby (opcjonalnie) |

Wystarczy **jeden** plik — np. samo `recording-glow-dark.webp` (aplikacja spróbuje go też w light mode).

## Wymagania

- Format: WebP (lub PNG — wtedy zmień rozszerzenie w `src/features/voice-intake/lib/recording-visual-assets.ts`)
- Przezroczyste tło
- ~640×640 px, kwadrat

## Sprawdzenie

Po `npm run dev` otwórz w przeglądarce:

`http://localhost:3000/images/voice-intake/recording-glow-dark.webp`

Jeśli widzisz obrazek — ścieżka jest OK.
