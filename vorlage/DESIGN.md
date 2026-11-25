# DESIGN.md · <Projektname>

> Stand: <TT.MM.JJJJ>. Gilt für alles Sichtbare. `scripts/pruefen.mjs` liest die Tabelle Farben und meldet jede Hex-Farbe im Code, die dort nicht steht.

## Farben

Die Werte unten sind Beispiele. Ersetze sie durch die Farben deines Projekts. Die beiden Kommentarzeilen bleiben stehen, das Skript liest dazwischen.

<!-- pruefen:farben -->
| Token | Wert | Wofür |
|---|---|---|
| grund | #ffffff | Hintergrund |
| flaeche | #f5f5f5 | Karten, Abschnitte |
| text | #1a1a1a | Fließtext, Überschriften |
| text-leise | #5c5c5c | Bildunterschriften, Labels |
| akzent | #c8102e | ein Element je Fläche: Button, Label, Linie |
<!-- /pruefen:farben -->

## Schrift

- Überschriften: <Schrift>, Schnitte <500 bis 700>
- Text: <Schrift>, 16 px, Zeilenhöhe 1,6
- Schriften selbst hosten (Fontsource oder `public/fonts/`). Keine Requests an Google Fonts.

## Raster und Abstände

- Mobile first. Jede Seite ab 390 px Breite prüfen.
- Abstände in Schritten von <8> px. Seitenrand mobil <16> px.
- Radius: <0>.

## Bausteine

| Baustein | Datei | Regel |
|---|---|---|
| Button | `src/components/Button.astro` | eine Hauptaktion je Abschnitt |
| Karte | `src/components/Karte.astro` | <Regel> |
| Label | `src/components/Label.astro` | Versalien erlaubt, höchstens drei Wörter |

## Regeln

- Versalien nur für kurze Labels, nie für Navigation, Buttons oder Links.
- Text braucht mindestens 4,5:1 Kontrast zum Hintergrund.
- Icons aus einem Set, keine Emojis auf der Website.

## Änderungen

| Datum | Was | Freigabe |
|---|---|---|
| <TT.MM.JJJJ> | Erste Fassung | <Name> |
