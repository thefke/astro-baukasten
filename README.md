# Astro-Baukasten: Websites mit Claude Code

Vorlagen aus sieben Astro-Projekten, gebaut mit Claude Code zwischen Mai und November 2026. Sie sorgen dafür, dass eine Korrektur beim nächsten Chat noch gilt.

Von Thomas Hefke, [thomas-hefke.de](https://thomas-hefke.de/?utm_source=github&utm_medium=referral&utm_campaign=astro-baukasten).

## Was drin ist

Alles, was in dein Projekt gehört, liegt im Ordner `vorlage/`.

| Datei | Wofür |
|---|---|
| `vorlage/CLAUDE.md` | Regeln und Ablauf. Claude liest sie zu Beginn jeder Session. |
| `vorlage/DESIGN.md` | Farben, Schrift, Bausteine. Die Farben prüft das Skript. |
| `vorlage/lessons.md` | Jede Korrektur mit Beleg. Daraus werden Regeln. |
| `vorlage/fragen.md` | Offene Fragen an Kunde oder Team. |
| `vorlage/.claude/skills/abschluss/SKILL.md` | Session sauber beenden, bevor der nächste Chat startet. |
| `vorlage/scripts/pruefen.mjs` | Macht Regeln zu Prüfungen. Node 18 oder neuer, keine Pakete. |

## So startest du

1. Neues Astro-Projekt anlegen: `npm create astro@latest`. Dann ein GitHub-Repo dafür.
2. Den Inhalt von `vorlage/` ins Projekt kopieren, auch den Ordner `.claude/`. Zum Beispiel: `cp -r vorlage/. ../mein-projekt/`
3. In `package.json` unter `scripts` ergänzen: `"check": "astro build && node scripts/pruefen.mjs"`.
4. Platzhalter in spitzen Klammern ausfüllen. Mindestens: Projekt, Stack und Deploys in `CLAUDE.md`, die Farben in `DESIGN.md`.
5. Claude Code im Projekt starten. Erster Satz: „Lies CLAUDE.md und DESIGN.md und sag mir, was noch fehlt.“
6. Am Ende jeder Session: `/abschluss`.

## Die sieben Lessons dahinter

1. Jede Session abschließen. Am Ende steht ein fertiger Stand auf main. Für jede neue Funktion ein neuer Chat.
2. Alles in GitHub. Jede Änderung hat eine Version und einen Satz, warum.
3. Die Doku liegt neben dem Code. Jede Korrektur wird eine Zeile in `lessons.md`, bestätigte Lessons werden Regeln in `CLAUDE.md`.
4. Was in Markdown steht, prüft ein Skript. Weicht der Code von der Doku ab, ist der Code falsch.
5. Was regelmäßig anfällt, wird ein Skill. Der erste ist `abschluss`.
6. Deploys kosten Geld. Bei Netlify kostet jeder Production-Deploy Credits. Wie oft eine Seite live geht, steht in `CLAUDE.md`.
7. Weiterleitungen gehören auf den Server. `Astro.redirect` baut eine Zwischenseite mit zwei Sekunden „Redirecting from …“.

## Das Prüfskript

`node scripts/pruefen.mjs` kennt fünf Regeln:

- Farben: Jede Hex-Farbe im Code muss als Token in `DESIGN.md` stehen, zwischen den Markierungen `<!-- pruefen:farben -->`.
- Weiterleitungen: kein `Astro.redirect` in `src/`.
- Schriften: keine Requests an Google Fonts. Schriften selbst hosten.
- Gedankenstriche: kein Gedankenstrich als Einschub in Texten unter `src/content/` und `src/pages/`. Zitate, Seitentitel und Bis-Striche wie „10–12 Uhr“ bleiben erlaubt.
- Links: Nach dem Build prüft das Skript in `dist/` jeden internen Link, jeden Anker und jede Zeile in `_redirects`. Es meldet Ziele, die es nicht gibt, fehlende Anker, relative Links, Weiterleitungen ins Leere und Weiterleitungen, die nie greifen, weil es für ihre Quelle eine Datei gibt. Weiterleitungen in `netlify.toml` prüft es nicht, dazu gibt es einen Hinweis. Ohne `dist/` wird die Regel übersprungen. Deshalb gehört sie hinter den Build: `npm run check`.

Eine Regel abschalten: oben im Skript in `REGELN` auf `false` setzen. Eine Zeile ausnehmen: `pruefen:erlaubt` als Kommentar in dieselbe Zeile schreiben. Exit-Code 1 bei Befunden, so bricht `npm run check` ab, bevor etwas live geht.

## Für das Team, das die Website pflegt

Wer die Website nicht baut, aber mit Claude pflegt, braucht andere Sätze. Dafür gibt es den [Claude-Spickzettel fürs Marketingteam](https://thomas-hefke.de/ki-workshops-enablement/spickzettel/check/?utm_source=github&utm_medium=referral&utm_campaign=astro-baukasten), zwei Seiten als PDF.

## Grenzen

- Gebaut für Astro als statische Seite. Bei Server-Rendering passt der Abschnitt Astro in `CLAUDE.md` nur zum Teil.
- Die Vorlagen sind ein Start. Was in dein Projekt gehört, zeigen erst die Korrekturen der ersten Wochen.
- Die Zahl der Credits je Deploy hängt vom Netlify-Tarif ab. Vor dem Ausfüllen im eigenen Konto nachsehen.

## Lizenz

MIT, siehe `LICENSE`. Du darfst alles nutzen, ändern und weitergeben, auch in Kundenprojekten. Die Lizenzdatei bleibt dabei.
