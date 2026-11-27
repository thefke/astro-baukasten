#!/usr/bin/env bash
# Testet die Vorlage wie ein neues Projekt und läuft bei jeder Änderung am Baukasten
# (.github/workflows/vorlage-testen.yml).
#
# 1. Minimales Astro-Projekt aus tests/projekt/ (wie „npm create astro“ mit Template minimal),
#    Vorlage hinein, Schritte aus der README, dann dieselben Befehle wie die Action der
#    Vorlage: npm run check und npm run smoke. Beides muss grün sein.
# 2. Absichtliche Fehler: Jede Regel aus pruefen.mjs und smoke.mjs muss anschlagen,
#    astro check muss einen Typfehler finden. Und der saubere Stand darf keinen
#    falschen Befund liefern, das zeigt Schritt 1.
#
#   bash tests/vorlage-testen.sh [arbeitsordner]
#
# Liegt Chromium schon bereit, etwa in einer Cloud-Session:
#   CHROMIUM_PFAD=/pfad/zu/chromium bash tests/vorlage-testen.sh

set -euo pipefail

BAUKASTEN="$(cd "$(dirname "$0")/.." && pwd)"
ZIEL="${1:-$(mktemp -d)/projekt}"

rm -rf "$ZIEL"
mkdir -p "$ZIEL"
cp -r "$BAUKASTEN/tests/projekt/." "$ZIEL/"
cp -r "$BAUKASTEN/vorlage/." "$ZIEL/"
cd "$ZIEL"

echo "== Projekt in $ZIEL"
npm install --no-audit --no-fund

# README, „So startest du“, Schritt 3
npm pkg set scripts.check="astro check && astro build && node scripts/pruefen.mjs" scripts.smoke="node scripts/smoke.mjs"
npm install --save-dev --no-audit --no-fund @astrojs/check typescript playwright

echo
echo "== 1. Sauberes Projekt: alles grün"
npm run check
if [ -z "${CHROMIUM_PFAD:-}" ]; then
  npx playwright install --with-deps chromium
fi
npm run smoke

echo
echo "== 2. Absichtliche Fehler: jede Prüfung muss anschlagen"

# Erwartet einen Exit-Code ungleich 0 und jede genannte Regel als [regel] in der Ausgabe.
rot() {
  local befehl="$1"
  shift
  local ausgabe code
  set +e
  ausgabe="$(bash -c "$befehl" 2>&1)"
  code=$?
  set -e
  LETZTE_AUSGABE="$ausgabe"
  tail -n 15 <<<"$ausgabe"
  if [ "$code" -eq 0 ]; then
    echo "TEST FEHLGESCHLAGEN: '$befehl' hätte rot sein müssen."
    exit 1
  fi
  local regel
  for regel in "$@"; do
    if ! grep -qF "[$regel]" <<<"$ausgabe"; then
      echo "TEST FEHLGESCHLAGEN: Regel $regel hat nicht angeschlagen."
      exit 1
    fi
  done
  echo "-> rot, wie erwartet${*:+: $*}"
}

echo
echo "-- pruefen.mjs"
cat > src/pages/fehler-pruefen.astro <<'ASTRO'
---
if (Astro.url.pathname === '/nie/') return Astro.redirect('/');
---
<html lang="de">
  <head>
    <title>Fehler</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />
  </head>
  <body>
    <h1>Fehler</h1>
    <p style="color: #123456">Ein Satz — mit Einschub.</p>
  </body>
</html>
ASTRO
rot "node scripts/pruefen.mjs" farben weiterleitungen google-fonts gedankenstriche
rm src/pages/fehler-pruefen.astro

echo
echo "-- astro check"
echo "export const zahl: number = 'kein Text';" > src/fehler.ts
rot "npx astro check"
rm src/fehler.ts

echo
echo "-- Build mit kaputten Seiten: pruefen.mjs (Links) und smoke.mjs (Browser)"
cat > src/pages/kaputt-link.astro <<'ASTRO'
<html lang="de"><head><title>Link</title></head><body><h1>Link</h1><a href="/gibt-es-nicht/">Weg</a></body></html>
ASTRO
cat > src/pages/kaputt-bild.astro <<'ASTRO'
<html lang="de"><head><title>Bild</title></head><body><h1>Bild</h1><img src="/fehlt.png" alt="Fehlt" /></body></html>
ASTRO
cat > src/pages/kaputt-h1.astro <<'ASTRO'
<html lang="de"><head><title>Zwei Überschriften</title></head><body><h1>Eins</h1><h1>Zwei</h1></body></html>
ASTRO
cat > src/pages/kaputt-mobil.astro <<'ASTRO'
<html lang="de"><head><meta name="viewport" content="width=device-width" /><title>Breit</title></head><body><h1>Breit</h1><div style="width: 2000px">Zu breit</div></body></html>
ASTRO
cat > src/pages/kaputt-skript.astro <<'ASTRO'
<html lang="de"><head><title>Skript</title></head><body><h1>Skript</h1><script is:inline>throw new Error('absichtlich');</script></body></html>
ASTRO
echo "/alt/ /auch-weg/ 301" > public/_redirects
npx astro build
rot "node scripts/pruefen.mjs" links
rot "node scripts/smoke.mjs" laden inhalt mobil
for erwartet in "Skriptfehler: absichtlich" "Datei fehlt (404): /fehlt.png"; do
  grep -qF "$erwartet" <<<"$LETZTE_AUSGABE" || { echo "TEST FEHLGESCHLAGEN: smoke.mjs meldet nicht: $erwartet"; exit 1; }
done
rm src/pages/kaputt-*.astro public/_redirects

echo
echo "Alles gut: Die Vorlage ist grün, und jede Prüfung schlägt bei einem Fehler an."
