// test/browser/avvia.mjs
// Avvia un server statico sul progetto e un browser headless, esegue i
// controlli e ripulisce. È il punto di ingresso di `npm run verifica`.
//
// Il browser si cerca fra quelli installati: in locale di solito è Brave o
// Chromium, sui runner di GitHub Actions è Chrome, preinstallato.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = fileURLToPath(new URL('../../', import.meta.url));
export const PORTA_HTTP = Number(process.env.PORT || 8099);
export const ORIGINE = `http://127.0.0.1:${PORTA_HTTP}`;
const PORTA_CDP = Number(process.env.CDP_PORT || 9222);

const CANDIDATI_BROWSER = [
    process.env.CHROME_PATH,
    '/opt/brave.com/brave/brave-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
].filter(Boolean);

const TIPI = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
};

export function avviaServer() {
    const server = http.createServer((req, res) => {
        const percorso = decodeURIComponent(req.url.split('?')[0]);
        let file = path.join(RADICE, percorso === '/' ? 'index.html' : percorso.replace(/^\/+/, ''));

        // Nessuna richiesta può uscire dalla cartella del progetto.
        if (!file.startsWith(RADICE) || !existsSync(file) || statSync(file).isDirectory()) {
            res.writeHead(404).end('non trovato');
            return;
        }
        res.writeHead(200, { 'Content-Type': TIPI[path.extname(file)] || 'application/octet-stream' });
        createReadStream(file).pipe(res);
    });

    return new Promise((ok) => server.listen(PORTA_HTTP, '127.0.0.1', () => ok(server)));
}

export async function avviaBrowser() {
    const eseguibile = CANDIDATI_BROWSER.find((p) => existsSync(p));
    if (!eseguibile) {
        throw new Error(
            'nessun browser basato su Chromium trovato.\n'
            + 'Installane uno oppure indica il percorso con CHROME_PATH=/percorso/al/browser',
        );
    }

    const processo = spawn(eseguibile, [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        `--remote-debugging-port=${PORTA_CDP}`,
        `--user-data-dir=${path.join(RADICE, '.tmp-browser')}`,
        '--no-first-run',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-sync',
        'about:blank',
    ], { stdio: 'ignore', detached: false });

    // Attende che il protocollo risponda, invece di dormire un tempo fisso.
    const scadenza = Date.now() + 30000;
    while (Date.now() < scadenza) {
        try {
            const r = await fetch(`http://127.0.0.1:${PORTA_CDP}/json/version`);
            if (r.ok) return { processo, eseguibile };
        } catch { /* non ancora pronto */ }
        await new Promise((r) => setTimeout(r, 300));
    }

    processo.kill('SIGKILL');
    throw new Error('il browser non ha risposto sulla porta di debug entro 30 secondi');
}
