#!/usr/bin/env node
// Smoke-Test nach dem Build: öffnet jede Seite aus dist/ in Chromium und prüft,
// ob nach einer Änderung noch alles tut. Links, Anker und Weiterleitungen prüft
// scripts/pruefen.mjs ohne Browser, hier geht es um das, was erst im Browser auffällt.
//
//   npm run build && npm run smoke
//   node scripts/smoke.mjs <ordner>     prüft einen anderen Build-Ordner als dist/
//
// Braucht das Paket playwright (npm i -D playwright) und einmal
// `npx playwright install chromium`. Liegt Chromium woanders:
// CHROMIUM_PFAD=/pfad/zu/chromium npm run smoke
//
// Je Seite, auf Handy (390 px) und Desktop (1280 px):
//   laden    Antwort 200, keine Skriptfehler, keine Fehler in der Konsole, keine
//            fehlgeschlagenen Dateien der eigenen Seite (Bilder, CSS, Schriften)
//   inhalt   genau eine h1 und ein Seitentitel
//   mobil    kein seitliches Scrollen bei 390 px
//
// Fremde Server blockt der Test, damit kein Aufruf in Analytics landet.
// Große Seiten: SMOKE_MAX=50 öffnet nur die ersten 50 Seiten.
// Eine Regel abschalten: unten in REGELN auf false setzen. Eine Seite ausnehmen:
// Pfad in AUSNAHMEN eintragen. Exit-Code 1 bei Befunden.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const REGELN = {
  laden: true,
  inhalt: true,
  mobil: true,
};

// Pfade, für die eine Regel nicht gilt, zum Beispiel { inhalt: ['/danke/'] }
const AUSNAHMEN = {};

const DIST = path.resolve(process.argv[2] || 'dist');
const MAX = Number(process.env.SMOKE_MAX || 0);
const BREITEN = [
  { name: 'Handy', width: 390, height: 844 },
  { name: 'Desktop', width: 1280, height: 800 },
];
const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml',
  '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.webmanifest': 'application/manifest+json',
};

const befunde = [];
const gemeldet = new Set();
function melde(ort, regel, text) {
  const schluessel = `${ort}|${regel}|${text}`;
  if (gemeldet.has(schluessel)) return;
  gemeldet.add(schluessel);
  befunde.push({ ort, regel, text });
}
const frei = (regel, url) => (AUSNAHMEN[regel] || []).includes(url);

if (!fs.existsSync(DIST)) {
  console.error(`Kein Build in ${DIST}. Erst npm run build.`);
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Paket playwright fehlt: npm i -D playwright, dann npx playwright install chromium');
  process.exit(2);
}

function htmlDateien(ordner) {
  const raus = [];
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const p = path.join(ordner, e.name);
    if (e.isDirectory()) raus.push(...htmlDateien(p));
    else if (e.name.endsWith('.html')) raus.push(p);
  }
  return raus;
}

// Datei zu einem Pfad wie /ueber/ oder /bild.png, so wie ein statischer Host sie ausliefert.
function datei(pfad) {
  let p;
  try {
    p = decodeURIComponent(pfad);
  } catch {
    return null;
  }
  const voll = path.join(DIST, p);
  if (!voll.startsWith(DIST)) return null;
  const kandidaten = p.endsWith('/')
    ? [path.join(voll, 'index.html')]
    : [voll, path.join(voll, 'index.html'), `${voll}.html`];
  return kandidaten.find((k) => fs.existsSync(k) && fs.statSync(k).isFile()) || null;
}

function urlVon(d) {
  const rel = '/' + path.relative(DIST, d).split(path.sep).join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
}

const alle = htmlDateien(DIST).map(urlVon).sort();
const seiten = MAX > 0 ? alle.slice(0, MAX) : alle;

const server = http.createServer((req, res) => {
  const d = datei(new URL(req.url, 'http://seite').pathname);
  if (!d) {
    const nf = path.join(DIST, '404.html');
    res.writeHead(404, { 'content-type': TYPEN['.html'] });
    res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Nicht gefunden');
    return;
  }
  res.writeHead(200, { 'content-type': TYPEN[path.extname(d).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(d).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const basis = `http://127.0.0.1:${server.address().port}`;
const eigen = (url) => url.startsWith(basis);

const browser = await chromium.launch(process.env.CHROMIUM_PFAD ? { executablePath: process.env.CHROMIUM_PFAD } : {});
try {
  for (const b of BREITEN) {
    const context = await browser.newContext({ viewport: { width: b.width, height: b.height } });
    await context.route('**/*', (route) => (eigen(route.request().url())
      ? route.continue()
      : route.fulfill({ status: 204, body: '' })));
    const page = await context.newPage();
    let fehler = [];
    page.on('console', (m) => {
      // Fehlende Dateien meldet der response-Handler mit Pfad, hier nur die übrigen Fehler.
      if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) fehler.push(m.text());
    });
    page.on('pageerror', (e) => fehler.push(`Skriptfehler: ${e.message}`));
    page.on('requestfailed', (r) => {
      // ERR_ABORTED: Der Browser bricht offene Anfragen ab, wenn die nächste Seite lädt. Kein Fehler der Seite.
      if (eigen(r.url()) && r.failure()?.errorText !== 'net::ERR_ABORTED') {
        fehler.push(`Datei lädt nicht: ${r.url().slice(basis.length)} (${r.failure()?.errorText})`);
      }
    });
    page.on('response', (r) => {
      if (eigen(r.url()) && r.status() >= 400 && r.request().resourceType() !== 'document') {
        fehler.push(`Datei fehlt (${r.status()}): ${r.url().slice(basis.length)}`);
      }
    });

    for (const url of seiten) {
      fehler = [];
      let antwort;
      try {
        antwort = await page.goto(basis + url, { waitUntil: 'load', timeout: 30000 });
      } catch (e) {
        melde(url, 'laden', `lädt nicht (${b.name}): ${e.message.split('\n')[0]}`);
        continue;
      }
      const werte = await page.evaluate(() => ({
        h1: document.querySelectorAll('h1').length,
        titel: document.title.trim(),
        breite: document.documentElement.scrollWidth,
        fenster: window.innerWidth,
      }));
      if (REGELN.laden && !frei('laden', url)) {
        const status = antwort ? antwort.status() : 0;
        if (status !== 200) melde(url, 'laden', `Antwort ${status}`);
        for (const f of fehler) melde(url, 'laden', f);
      }
      if (REGELN.inhalt && !frei('inhalt', url)) {
        if (werte.h1 !== 1) melde(url, 'inhalt', `${werte.h1} Überschriften h1, erwartet genau eine`);
        if (!werte.titel) melde(url, 'inhalt', 'Seitentitel fehlt');
      }
      if (REGELN.mobil && !frei('mobil', url) && b.name === 'Handy' && werte.breite > werte.fenster + 1) {
        melde(url, 'mobil', `${werte.breite} px breit bei ${werte.fenster} px Fenster, die Seite scrollt seitlich`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

for (const b of befunde) console.log(`FEHLER   ${b.ort}  [${b.regel}]  ${b.text}`);
const teil = seiten.length < alle.length ? ` (SMOKE_MAX: ${seiten.length} von ${alle.length})` : '';
console.log(`\n${seiten.length} Seiten im Browser geprüft${teil}, je auf Handy und Desktop, ${befunde.length} Befund(e).`);
process.exit(befunde.length ? 1 : 0);
