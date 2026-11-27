# Lessons

Jede Korrektur wird hier ein Eintrag, mit Beleg. Nur was im Projekt passiert ist, keine allgemeinen Tipps.

Status:

- `offen`: einmal passiert.
- `bestätigt`: Jemand hat die Regel bestätigt, oder sie ist ein zweites Mal passiert.
- `übernommen in <datei>`: steht jetzt als Regel in `CLAUDE.md`, `DESIGN.md` oder als Prüfung in `scripts/pruefen.mjs`. Der Eintrag bleibt stehen.

Claude liest vor jeder Session alle Einträge mit Status `offen` oder `bestätigt`.

## Vorlage

```
### L-000 · Kurztitel
- Datum: TT.MM.JJJJ
- Beleg: Seite, Datei oder Commit
- Was passiert ist: ein Satz
- Regel: ein Satz im Imperativ
- Status: offen
```

## Einträge

### L-001 · Feste Weiterleitungen nicht mit Astro.redirect
- Datum: <beim Kopieren ersetzen oder Eintrag löschen>
- Beleg: Beispiel aus einem anderen Projekt. Die Startseite leitete nach Sprache weiter und zeigte vorher zwei Sekunden „Redirecting from …“.
- Was passiert ist: `Astro.redirect` baut für statische Seiten eine Zwischenseite mit Wartezeit.
- Regel: Feste Weiterleitungen in `netlify.toml` oder `public/_redirects` eintragen.
- Status: übernommen in `CLAUDE.md` und `scripts/pruefen.mjs`

### L-002 · Nach einem Umzug der Adressen jeden Link prüfen
- Datum: <beim Kopieren ersetzen oder Eintrag löschen>
- Beleg: Beispiel aus einem anderen Projekt. Alle Seiten zogen in einen Sprachordner um, dazu kamen 20 Weiterleitungen. Das Skript prüfte 12 Seiten, 238 interne Verweise und alle Weiterleitungen. Absichtlich eingebaute Fehler hat es alle gefunden.
- Was passiert ist: Bei vielen geänderten Adressen sieht niemand mehr von Hand, ob jeder Link, jeder Anker und jede Weiterleitung ein Ziel hat.
- Regel: Nach jedem Build `npm run check` laufen lassen, nach dem Deploy die Weiterleitungen mit `curl -I` ansehen.
- Status: übernommen in `CLAUDE.md` und `scripts/pruefen.mjs` (Regel `links`)

### L-003 · Ein Player überlebt den Seitenwechsel nur ohne Umweg
- Datum: <beim Kopieren ersetzen oder Eintrag löschen>
- Beleg: Beispiel aus einem anderen Projekt mit Musikplayer am unteren Rand und `ClientRouter` (Astro 5.18). Gelesen in `astro/dist/transitions/swap-functions.js`, gemessen im Browser.
- Was passiert ist: Auch mit `transition:persist` brach die Musik beim Seitenwechsel ab. Astro ersetzt den ganzen `<body>` und hängt bewahrte Elemente danach wieder ein. Ein Rahmen (iframe) lädt dabei neu.
- Regel: Soll ein Rahmen den Seitenwechsel überleben, in `astro:before-swap` ein eigenes `event.swap` setzen, das nur den übrigen Seiteninhalt tauscht und den Rahmen stehen lässt. Danach im Browser prüfen, dass es nach drei Wechseln derselbe Rahmen ist.
- Status: übernommen in `CLAUDE.md`, Abschnitt Astro
