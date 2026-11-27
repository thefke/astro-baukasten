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
| `vorlage/scripts/smoke.mjs` | Öffnet nach dem Build jede Seite im Browser, auf Handy und Desktop. Braucht Playwright. |
| `vorlage/.github/workflows/pruefen.yml` | Die Action: prüft jeden Pull Request mit denselben Befehlen wie lokal. |

## So startest du

1. Neues Astro-Projekt anlegen: `npm create astro@latest`. Dann ein GitHub-Repo dafür.
2. Den Inhalt von `vorlage/` ins Projekt kopieren, auch den Ordner `.claude/`. Zum Beispiel: `cp -r vorlage/. ../mein-projekt/`
3. In `package.json` unter `scripts` ergänzen: `"check": "astro check && astro build && node scripts/pruefen.mjs"` und `"smoke": "node scripts/smoke.mjs"`. Dann die Pakete dafür: `npm i -D @astrojs/check typescript playwright` und einmal `npx playwright install chromium`.
4. Platzhalter in spitzen Klammern ausfüllen. Mindestens: Projekt, Stack und Deploys in `CLAUDE.md`, die Farben in `DESIGN.md`.
5. Damit Rot den Merge sperrt: in GitHub unter Settings, Rules, Rulesets eine Regel für `main` anlegen und den Status-Check `pruefen` verlangen. Die Action liegt mit dem Ordner `.github/` schon im Projekt.
6. Claude Code im Projekt starten. Erster Satz: „Lies CLAUDE.md und DESIGN.md und sag mir, was noch fehlt.“
7. Am Ende jeder Session: `/abschluss`.

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

## Der Smoke-Test

`npm run build && npm run smoke` öffnet jede Seite aus `dist/` in Chromium, auf 390 und auf 1280 px Breite. Drei Regeln:

- Laden: Antwort 200, keine Skriptfehler, keine Fehler in der Konsole, keine fehlenden Bilder, Styles oder Schriften der eigenen Seite.
- Inhalt: genau eine `h1` und ein Seitentitel.
- Mobil: kein seitliches Scrollen bei 390 px.

Fremde Server blockt der Test, damit kein Aufruf in Analytics landet. Links prüft er nicht, das macht schon das Prüfskript. Große Seiten: `SMOKE_MAX=50 npm run smoke` öffnet nur die ersten 50 Seiten. Eine Regel abschalten oder eine Seite ausnehmen: oben im Skript in `REGELN` und `AUSNAHMEN`. Liegt Chromium woanders, etwa in einer Cloud-Session: `CHROMIUM_PFAD=/pfad/zu/chromium npm run smoke`.

## Die Action

`vorlage/.github/workflows/pruefen.yml` läuft bei jedem Pull Request und jedem Push auf `main`: `npm ci`, `npm run check`, Chromium installieren, `npm run smoke`. Das sind dieselben Befehle wie lokal, rot in der Action heißt rot auf deinem Rechner. In öffentlichen Repos kostet sie nichts, in privaten zählen die Minuten gegen das Kontingent des Kontos.

## So testet sich der Baukasten

`tests/vorlage-testen.sh` läuft bei jeder Änderung am Baukasten (Action „Vorlage testen“). Es legt ein Minimalprojekt aus `tests/projekt/` an, wie `npm create astro` mit dem Template minimal, kopiert die Vorlage hinein und lässt dieselben Befehle laufen wie die Action. Beides muss grün sein. Danach baut es absichtliche Fehler ein: Jede Regel aus Prüfskript und Smoke-Test muss anschlagen, und `astro check` muss einen Typfehler finden.

## Für das Team, das die Website pflegt

Wer die Website nicht baut, aber mit Claude pflegt, braucht andere Sätze. Dafür gibt es den [Claude-Spickzettel fürs Marketingteam](https://thomas-hefke.de/ki-workshops-enablement/spickzettel/check/?utm_source=github&utm_medium=referral&utm_campaign=astro-baukasten), zwei Seiten als PDF.

## Grenzen

- Gebaut für Astro als statische Seite. Bei Server-Rendering passt der Abschnitt Astro in `CLAUDE.md` nur zum Teil.
- Die Vorlagen sind ein Start. Was in dein Projekt gehört, zeigen erst die Korrekturen der ersten Wochen.
- Die Zahl der Credits je Deploy hängt vom Netlify-Tarif ab. Vor dem Ausfüllen im eigenen Konto nachsehen.
- Netlify baut jeden Push auf `main`, auch wenn die Action rot ist. Wer das sperren will, setzt den Build-Befehl in `netlify.toml` auf `npm run check`. Dann bricht der Deploy bei einem Befund ab.
- Der Smoke-Test sieht nur, was ohne Klick passiert. Formulare, Menüs und Abläufe über mehrere Seiten brauchen eigene Tests.

## Lizenz

MIT, siehe `LICENSE`. Du darfst alles nutzen, ändern und weitergeben, auch in Kundenprojekten. Die Lizenzdatei bleibt dabei.
