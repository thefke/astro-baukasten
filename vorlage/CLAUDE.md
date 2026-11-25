# CLAUDE.md · <Projektname>

> Stand: <TT.MM.JJJJ>. Claude liest diese Datei zu Beginn jeder Session. Was hier steht, gilt. Widerspricht ein Chat dieser Datei, gilt die Datei, und Claude sagt es.

## Projekt

- Was: <ein Satz, was die Website ist und für wen>
- Live: <Domain>. Vorschau: <URL der Vorschau>
- Wer entscheidet: <Name, Rolle>. Claude baut, <Name> gibt frei.

## Stack

- Astro, statisch, Ausgabe `dist/`. <Tailwind ja oder nein>. Hosting: <Netlify oder anderes>.
- Befehle: `npm run dev` (Vorschau lokal), `npm run build`, `npm run check` (Build und Prüfskript).
- Keine neuen Pakete ohne Rückfrage.

## Ablauf je Session

1. Eine Session, eine Funktion. Neue Funktion, neuer Chat.
2. Zuerst lesen: diese Datei, `DESIGN.md`, `lessons.md` (alle Einträge mit Status `offen` oder `bestätigt`), `fragen.md`.
3. Jede Session arbeitet auf einem eigenen Branch, nie direkt auf `main`.
4. Vor jedem Commit: `npm run check`. Rot heißt: nicht mergen.
5. Am Ende Skill `abschluss`. Danach liegt alles, was gelten soll, auf `main`.

## Deploys

- Ein Production-Deploy kostet <15> Credits. Budget im Monat: <N> Credits. Sind sie leer, pausiert Netlify alle Seiten des Teams.
- Takt: <Fertig heißt live.> ODER <Änderungen sammeln, höchstens ein Production-Deploy am Tag.>
- Commits nur an Doku bekommen `[skip netlify]` in die Commit-Nachricht.
- Deploy-Vorschauen sind frei. Geprüft wird dort, nicht auf live.

## Astro

- Feste Weiterleitungen in `netlify.toml` oder `public/_redirects`, nie mit `Astro.redirect`. Das baut eine Zwischenseite mit zwei Sekunden „Redirecting from …“.
- Was beim Build feststeht, wird beim Build geholt. Nichts zur Laufzeit von fremden Servern laden, ohne den Datenschutz zu prüfen.
- Zahlen und Listen, die sich ändern, stehen in `src/data/`, nie von Hand im Text.
- Jede Seite nutzt ein Layout aus `src/layouts/`. Keine Seite baut eigene Navigation oder eigenen Footer.

## Gestaltung

- `DESIGN.md` ist Gesetz. Farben und Schriften im Code nur aus den Tokens dort. Weicht der Code ab, ist der Code falsch.
- Neue Farbe, Schrift oder neuer Baustein: zuerst in `DESIGN.md`, nach Freigabe in den Code.
- Vor dem Merge: Screenshot der geänderten Seite auf 390 px Breite und auf Desktop.

## Texte

- Sprache: <Deutsch>. Anrede: <du oder Sie>.
- Fakten nur aus <Quelle, etwa Briefing oder Website des Kunden>. Fehlt eine Angabe: Frage in `fragen.md`. Nichts erfinden.

## Daten

- Keine Zugangsdaten, Tokens oder personenbezogenen Daten im Repo. Schlüssel nur als Umgebungsvariable.
- Tracking lädt erst nach Einwilligung.

## Ablage

- `src/`, `public/`: die Website
- `DESIGN.md`, `lessons.md`, `fragen.md`: Projektwissen
- `scripts/pruefen.mjs`: macht Regeln zu Prüfungen
- `.claude/skills/`: wiederkehrende Abläufe als Skill

## Änderungen an dieser Datei

- Eine neue Regel kommt mit Datum und Anlass, meist aus `lessons.md`.
- Datum oben nachziehen.
- Die Datei bleibt kurz. Bedienwissen und Historie gehören in eigene Dateien, hier steht ein Verweis.
