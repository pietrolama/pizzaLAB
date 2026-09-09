// test/browser/cdp.mjs
// Client minimale del Chrome DevTools Protocol, costruito sul WebSocket nativo
// di Node 22. Nessuna dipendenza: puppeteer porterebbe con sé un centinaio di
// pacchetti per fare quello che qui bastano ottanta righe a coprire.
//
// Serve un browser basato su Chromium avviato con --remote-debugging-port.
// Lo script avvia.mjs se ne occupa.

const PORTA = Number(process.env.CDP_PORT || 9222);
const BASE_CDP = `http://127.0.0.1:${PORTA}`;

/**
 * Apre una scheda e restituisce un canale per pilotarla.
 * @param {string} url
 */
export async function apriScheda(url = 'about:blank') {
    const risposta = await fetch(`${BASE_CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const scheda = await risposta.json();

    const ws = new WebSocket(scheda.webSocketDebuggerUrl);
    await new Promise((ok, ko) => {
        ws.onopen = ok;
        ws.onerror = () => ko(new Error('impossibile collegarsi alla scheda'));
    });

    let contatore = 0;
    const inAttesa = new Map();
    const eventi = [];

    ws.onmessage = (messaggio) => {
        const m = JSON.parse(messaggio.data);
        if (m.id && inAttesa.has(m.id)) {
            inAttesa.get(m.id)(m);
            inAttesa.delete(m.id);
        } else if (m.method) {
            eventi.push(m);
        }
    };

    const invia = (metodo, parametri = {}) => new Promise((ok) => {
        const id = ++contatore;
        inAttesa.set(id, ok);
        ws.send(JSON.stringify({ id, method: metodo, params: parametri }));
    });

    return {
        invia,
        eventi,
        chiudi: async () => {
            ws.close();
            await fetch(`${BASE_CDP}/json/close/${scheda.id}`).catch(() => {});
        },
    };
}

/** Attende che una condizione JavaScript diventi vera, invece di sperare in un timeout fisso. */
export async function attendi(valuta, espressione, { timeout = 20000, intervallo = 200, etichetta = '' } = {}) {
    const scadenza = Date.now() + timeout;
    while (Date.now() < scadenza) {
        if (await valuta(espressione) === true) return true;
        await new Promise((r) => setTimeout(r, intervallo));
    }
    throw new Error(`timeout in attesa di: ${etichetta || espressione}`);
}

/**
 * Apre una pagina pronta per essere ispezionata.
 *
 * Due accorgimenti che rendono i test deterministici, entrambi imparati
 * sbagliando:
 *
 *  - i font di Google in headless restano appesi e l'evento load non arriva
 *    mai, quindi si bloccano. Si bloccano SOLO quelli: bloccare tutto
 *    gstatic.com escluderebbe anche Firebase, e senza Firebase la barra di
 *    navigazione non riceve il pulsante di accesso — misurando così un layout
 *    che non esiste (è così che era sfuggito il selettore lingua tagliato);
 *  - il service worker serve CSS e JS dalla Cache API, che
 *    Network.setCacheDisabled non tocca: va disinstallato, altrimenti i test
 *    girano sulla versione precedente del codice.
 */
export async function apriPronta(url) {
    const s = await apriScheda('about:blank');
    await s.invia('Runtime.enable');
    await s.invia('Page.enable');
    await s.invia('Log.enable');
    await s.invia('Network.enable');
    await s.invia('Network.setCacheDisabled', { cacheDisabled: true });
    await s.invia('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
    // Il conteggio animato dei risultati usa requestAnimationFrame, che in
    // headless non parte: con movimento ridotto i valori vengono scritti subito.
    await s.invia('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

    const valuta = async (espressione) => {
        const r = await s.invia('Runtime.evaluate', {
            expression: espressione, returnByValue: true, awaitPromise: true,
        });
        if (r.result?.exceptionDetails) {
            return `ERRORE: ${(r.result.exceptionDetails.exception?.description || '').split('\n')[0]}`;
        }
        return r.result?.result?.value;
    };

    await s.invia('Page.navigate', { url });
    // 'interactive' basta: i moduli differiti sono già stati eseguiti, mentre
    // 'complete' aspetterebbe anche sottorisorse che possono non arrivare mai.
    await attendi(valuta, "document.readyState!=='loading'", { etichetta: 'DOM pronto' });

    await valuta(`(async () => {
        const registrazioni = await navigator.serviceWorker.getRegistrations();
        for (const r of registrazioni) await r.unregister();
        for (const chiave of await caches.keys()) await caches.delete(chiave);
        return true;
    })()`);
    await s.invia('Page.navigate', { url: `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}` });
    await attendi(valuta, "document.readyState!=='loading'", { etichetta: 'ricaricamento senza service worker' });

    return { s, valuta };
}

/** Errori di console, eccezioni e richieste fallite raccolti finora. */
export function problemi(scheda, { origine } = {}) {
    const errori = [];
    const rete = [];

    for (const e of scheda.eventi) {
        if (e.method === 'Runtime.exceptionThrown') {
            const d = e.params.exceptionDetails;
            errori.push(`ECCEZIONE: ${(d.exception?.description || d.text || '').split('\n')[0]}`);
        }
        if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') {
            errori.push(`CONSOLE: ${e.params.entry.text}`);
        }
        if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') {
            errori.push(`CONSOLE: ${e.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
        }
        if (e.method === 'Network.responseReceived') {
            const { url, status } = e.params.response;
            if (status >= 400 && (!origine || url.startsWith(origine))) rete.push(`HTTP ${status} ${url}`);
        }
    }

    // Le risorse esterne bloccate di proposito non sono difetti del sito.
    const daIgnorare = /fonts\.googleapis|fonts\.gstatic|ERR_BLOCKED_BY_CLIENT/i;
    return {
        errori: errori.filter((x) => !daIgnorare.test(x)),
        rete: rete.filter((x) => !daIgnorare.test(x)),
    };
}
