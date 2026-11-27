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
  links: true,            // nach dem Build: jeder interne Link, Anker und jede Weiterleitung in dist/ hat ein Ziel
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
if (REGELN.links) pruefeLinks();

// Nach dem Build: interne Links (href, src, action, poster), Anker und Weiterleitungen in dist/_redirects.
// Meldet Ziele, die es nicht gibt, fehlende Anker, relative Links, Weiterleitungen ins Leere
// und Weiterleitungen, die nie greifen, weil es für ihre Quelle eine Datei gibt.
function pruefeLinks() {
  const DIST = path.join(ROOT, 'dist');
  if (!fs.existsSync(DIST)) { hinweise.push('Links: dist/ fehlt, erst bauen (npm run check). Regel übersprungen.'); return; }
  if (fs.existsSync(path.join(ROOT, 'netlify.toml')) && /\[\[redirects\]\]/.test(fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8'))) {
    hinweise.push('Links: netlify.toml enthält [[redirects]]. Die prüft das Skript nicht, nur dist/_redirects.');
  }
  const html = [];
  (function lauf(o) {
    for (const e of fs.readdirSync(o, { withFileTypes: true })) {
      const p = path.join(o, e.name);
      if (e.isDirectory()) lauf(p); else if (e.name.endsWith('.html')) html.push(p);
    }
  })(DIST);
  // Weiterleitungen: Quelle und Ziel je Zeile
  const regeln = [];
  const rdatei = path.join(DIST, '_redirects');
  if (fs.existsSync(rdatei)) {
    zeilen(rdatei).forEach((z, i) => {
      const t = z.trim();
      if (!t || t.startsWith('#')) return;
      const [von, nach] = t.split(/\s+/);
      regeln.push({ von: von.replace(/\/$/, '') || '/', nach, nr: i + 1 });
    });
  }
  const datei = (pfad) => {
    const rein = decodeURIComponent(pfad.split('#')[0].split('?')[0]);
    const kandidaten = [path.join(DIST, rein), path.join(DIST, rein, 'index.html'), path.join(DIST, rein + '.html')];
    return kandidaten.find((k) => fs.existsSync(k) && fs.statSync(k).isFile());
  };
  const weiter = (pfad) => {
    const rein = pfad.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
    return regeln.some((r) => r.von === rein || (r.von.endsWith('/*') && (rein + '/').startsWith(r.von.slice(0, -1))));
  };
  const ids = new Map();
  const anker = (ziel, id) => {
    if (!ids.has(ziel)) ids.set(ziel, new Set([...fs.readFileSync(ziel, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    return ids.get(ziel).has(id);
  };
  let anzahl = 0;
  const gemeldet = new Set();
  const melden = (ort, text) => { const k = ort + '|' + text; if (!gemeldet.has(k)) { gemeldet.add(k); befunde.push({ ort, regel: 'links', text }); } };
  for (const seite of html) {
    const text = fs.readFileSync(seite, 'utf8');
    const ort = path.relative(ROOT, seite);
    for (const m of text.matchAll(/\s(?:href|src|action|poster|data-src)="([^"]+)"/g)) {
      const ziel = m[1];
      if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ziel)) continue;
      anzahl++;
      if (ziel.startsWith('#')) {
        if (ziel.length > 1 && !anker(seite, ziel.slice(1))) melden(ort, `Anker ${ziel} fehlt auf der Seite`);
        continue;
      }
      if (!ziel.startsWith('/')) { melden(ort, `Relativer Link ${ziel}, interne Links beginnen mit /`); continue; }
      const gefunden = datei(ziel);
      if (!gefunden) { if (!weiter(ziel)) melden(ort, `Ziel ${ziel} gibt es nicht`); continue; }
      const id = ziel.split('#')[1];
      if (id && gefunden.endsWith('.html') && !anker(gefunden, id)) melden(ort, `Anker #${id} fehlt auf ${ziel.split('#')[0]}`);
    }
  }
  for (const r of regeln) {
    if (/^https?:/.test(r.nach)) continue;
    const gefunden = datei(r.nach);
    if (!gefunden) { melden(`public/_redirects:${r.nr}`, `Weiterleitung führt ins Leere: ${r.nach}`); continue; }
    const id = r.nach.split('#')[1];
    if (id && !anker(gefunden, id)) melden(`public/_redirects:${r.nr}`, `Anker #${id} fehlt auf ${r.nach.split('#')[0]}`);
    if (datei(r.von === '/' ? '/index.html' : r.von)) melden(`public/_redirects:${r.nr}`, `Für ${r.von} gibt es eine Datei, die Weiterleitung greift nicht`);
  }
  hinweise.push(`Links: ${html.length} Seiten, ${anzahl} interne Verweise und ${regeln.length} Weiterleitungen geprüft.`);
}

for (const h of hinweise) console.log(`HINWEIS  ${h}`);
for (const b of befunde) console.log(`FEHLER   ${b.ort}  [${b.regel}]  ${b.text}`);
console.log(`\n${alle.length} Dateien geprüft, ${befunde.length} Befund(e), ${hinweise.length} Hinweis(e).`);
process.exit(befunde.length ? 1 : 0);
