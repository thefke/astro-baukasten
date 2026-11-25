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

