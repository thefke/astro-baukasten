---
name: abschluss
description: Session abschließen, bevor ein neuer Chat beginnt. Stand auf main, Korrekturen als Lessons, CLAUDE.md nachziehen, offene Fragen sammeln, Auftrag für die nächste Session. Nutzen, wenn jemand /abschluss aufruft, die Session beenden, den Chat wechseln oder eine neue Funktion anfangen will.
---

# Abschluss einer Session

Ziel: Nach dem Abschluss steht alles, was gelten soll, im Repo auf `main`. Der nächste Chat startet ohne dieses Gespräch und weiß trotzdem alles, was zählt.

## 1. Nachsehen

- Was gebaut wurde: `git status`, `git log main..HEAD`, offene Branches dieser Session.
- Was besprochen wurde: der Chat. Entscheidungen mit Datum, Korrekturen, offene Fragen.

Daraus einen Vorschlag bauen. Der Mensch korrigiert ihn, statt von vorn zu erzählen.

## 2. Korrekturen werden Lessons

- Jede Korrektur aus dieser Session wird ein Eintrag in `lessons.md`, im Format dort, mit Beleg: Datei, Seite oder Commit.
- Nur, was passiert ist. Keine allgemeinen Tipps.
- Ist eine Lesson bestätigt oder zum zweiten Mal passiert: als Regel in `CLAUDE.md` oder `DESIGN.md`, Status `übernommen in <datei>`.
- Lässt sich die Regel prüfen: zusätzlich eine Regel in `scripts/pruefen.mjs`.

## 3. CLAUDE.md nachziehen

- Neuer Befehl, neue Datei, neuer Ablauf: ein Satz mit Verweis.
- Datum oben aktualisieren.
- Die Datei bleibt kurz. Was nur für eine Aufgabe gilt, kommt in eine eigene Datei oder einen Skill.

## 4. Offene Fragen

Was nur Kunde oder Team beantworten kann, kommt nach `fragen.md`: je Frage Kontext und ein Vorschlag mit Grund.

## 5. Prüfen und auf main

1. `npm run check`. Ist es rot: nicht mergen, den Befund in der Übergabe nennen.
2. Commit mit einer Nachricht, die sagt, was und warum. Push.
3. Pull Request anlegen. Mergen, wenn <Regel: wer darf was mergen>. Sonst den Link zum Pull Request nennen und warten.
4. Kein Branch bleibt nach der Session ohne Pull Request und ohne Grund offen.

## 6. Übergabe

Kurz im Chat:

- Was auf `main` liegt.
- Was auf eine Freigabe wartet, mit Link.
- Der Auftrag für die nächste Session in einem Satz zum Kopieren: „Lies CLAUDE.md und lessons.md. Baue <Funktion>. Fertig, wenn <prüfbares Kriterium>.“

## Regeln

- Höchstens drei Rückfragen.
- Nichts nur in den Chat, was nach der Session noch gelten soll. Das Repo führt.
