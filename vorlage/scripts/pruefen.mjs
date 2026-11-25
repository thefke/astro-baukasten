#!/usr/bin/env node
// Prüfskript: macht Regeln aus CLAUDE.md und DESIGN.md zu Prüfungen.
//
//   node scripts/pruefen.mjs            prüft das Projekt im aktuellen Ordner
//   node scripts/pruefen.mjs <ordner>   prüft ein anderes Projekt
//
// Node 18 oder neuer, keine Pakete. Exit-Code 1 bei Befunden, damit
// `npm run check` abbricht, bevor etwas live geht.
//
// Eine Zeile ausnehmen: `pruefen:erlaubt` als Kommentar in dieselbe Zeile.
// Eine Regel abschalten: unten in REGELN auf false setzen.

import fs from 'node:fs';
import path from 'node:path';

const REGELN = {
  farben: true,           // jede Hex-Farbe im Code steht als Token in DESIGN.md
  weiterleitungen: true,  // kein Astro.redirect, feste Weiterleitungen gehören auf den Server
  googleFonts: true,      // keine Requests an Google Fonts, Schriften selbst hosten
  gedankenstriche: true,  // kein Gedankenstrich als Einschub in Texten
};

const ROOT = path.resolve(process.argv[2] || process.cwd());
const SRC = path.join(ROOT, 'src');
const CODE = new Set(['.astro', '.css', '.scss', '.ts', '.js', '.mjs', '.jsx', '.tsx', '.md', '.mdx', '.html', '.svelte', '.vue']);
const TEXT = new Set(['.astro', '.md', '.mdx']);
const SKIP = new Set(['node_modules', 'dist', '.astro', '.git', '.netlify']);
const AUSNAHME = 'pruefen:erlaubt';

const befunde = [];
const hinweise = [];

function dateien(ordner) {
  if (!fs.existsSync(ordner)) return [];
  const raus = [];
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) raus.push(...dateien(p));
    else if (CODE.has(path.extname(e.name))) raus.push(p);
  }
  return raus;
}

function zeilen(datei) {
  return fs.readFileSync(datei, 'utf8').split(/\r?\n/);
}

function melde(datei, nr, regel, text) {
  befunde.push({ ort: `${path.relative(ROOT, datei)}:${nr}`, regel, text });
}

// Hex-Farben vergleichbar machen: Kleinbuchstaben, Kurzform ausschreiben, Alpha abschneiden.
function normal(hex) {
  let h = hex.toLowerCase().replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  return '#' + h.slice(0, 6);
}

function tokens() {
  const datei = path.join(ROOT, 'DESIGN.md');
  if (!fs.existsSync(datei)) {
    hinweise.push('Farben: DESIGN.md fehlt, Regel übersprungen.');
    return null;
  }
  const text = fs.readFileSync(datei, 'utf8');
  const m = text.match(/<!--\s*pruefen:farben\s*-->([\s\S]*?)<!--\s*\/pruefen:farben\s*-->/);
  if (!m) {
    hinweise.push('Farben: In DESIGN.md fehlen die Markierungen <!-- pruefen:farben --> und <!-- /pruefen:farben -->, Regel übersprungen.');
    return null;
  }
  const werte = (m[1].match(/#[0-9a-fA-F]{3,8}\b/g) || []).map(normal);
  if (!werte.length) {
    hinweise.push('Farben: Zwischen den Markierungen in DESIGN.md steht keine Hex-Farbe, Regel übersprungen.');
    return null;
  }
  return new Set(werte);
}

const HEX = /(?<![\w&#])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
// Anker und SVG-Verweise sind keine Farben: href="#abc", url(#def)
const KEIN_FARBWERT = /(href\s*=\s*["']?|url\(\s*["']?|id\s*=\s*["']?)$/;

function pruefeFarben(alle, erlaubt) {
  for (const datei of alle) {
    zeilen(datei).forEach((z, i) => {
      if (z.includes(AUSNAHME)) return;
      for (const m of z.matchAll(HEX)) {
        if (KEIN_FARBWERT.test(z.slice(0, m.index))) continue;
        if (!erlaubt.has(normal(m[0]))) melde(datei, i + 1, 'farben', `${m[0]} steht nicht in DESIGN.md`);
      }
    });
  }
}

function pruefeMuster(alle, muster, regel, text) {
  for (const datei of alle) {
    zeilen(datei).forEach((z, i) => {
      if (!z.includes(AUSNAHME) && muster.test(z)) melde(datei, i + 1, regel, text);
    });
  }
}

function pruefeGedankenstriche(alle) {
  const texte = alle.filter((d) => {
    const rel = path.relative(SRC, d).split(path.sep)[0];
    return (rel === 'content' || rel === 'pages') && TEXT.has(path.extname(d));
  });
  // Geviertstrich überall, Halbgeviertstrich nur mit Leerzeichen davor und danach.
  // Erlaubt bleiben: Bis-Striche wie 10–12 Uhr, Zitate als Markdown-Zitat (das Original
  // bleibt), der Trenner im Seitentitel („Seite – Marke“) und Buchtitel in Links.
  const strich = /—|\s–\s/;
  const frei = /^\s*>|title\s*[=:]|<title>/i;
  const zitatOderLink = /\[[^\]]*\]\([^)]*\)|„[^“]*“/g;
  for (const datei of texte) {
    zeilen(datei).forEach((z, i) => {
      if (z.includes(AUSNAHME) || frei.test(z)) return;
      if (strich.test(z.replace(zitatOderLink, ''))) melde(datei, i + 1, 'gedankenstriche', 'Gedankenstrich als Einschub, Punkt, Komma oder Doppelpunkt setzen');
    });
  }
}

if (!fs.existsSync(SRC)) {
  console.error(`Kein Ordner src/ in ${ROOT}. Aus dem Projektordner starten oder den Pfad angeben.`);
  process.exit(2);
}

const alle = dateien(SRC);
const configs = fs.readdirSync(ROOT).filter((f) => /^astro\.config\.(mjs|js|ts|mts)$/.test(f)).map((f) => path.join(ROOT, f));

if (REGELN.farben) {
  const erlaubt = tokens();
  if (erlaubt) pruefeFarben(alle, erlaubt);
}
if (REGELN.weiterleitungen) {
  pruefeMuster(alle, /Astro\.redirect\s*\(/, 'weiterleitungen', 'Astro.redirect baut eine Zwischenseite, Weiterleitung in netlify.toml oder public/_redirects eintragen');
}
if (REGELN.googleFonts) {
  pruefeMuster([...alle, ...configs], /fonts\.(googleapis|gstatic)\.com/, 'google-fonts', 'Request an Google Fonts, Schrift selbst hosten');
}
if (REGELN.gedankenstriche) pruefeGedankenstriche(alle);

for (const h of hinweise) console.log(`HINWEIS  ${h}`);
for (const b of befunde) console.log(`FEHLER   ${b.ort}  [${b.regel}]  ${b.text}`);
console.log(`\n${alle.length} Dateien geprüft, ${befunde.length} Befund(e), ${hinweise.length} Hinweis(e).`);
process.exit(befunde.length ? 1 : 0);
