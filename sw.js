// sw.js - Service Worker per PizzaLab PWA
// Permette il funzionamento offline di calcolatore, diario, ricette e guide,
// in entrambe le lingue.

// La versione va incrementata a ogni rilascio che cambia gli asset: l'attivazione
// cancella le cache con nome diverso, forzando il ri-download del guscio.
const CACHE_VERSION = 'v4';
const CACHE_NAME = `pizzalab-cache-${CACHE_VERSION}`;

// Guscio dell'applicazione: pagine, stile, moduli e dataset necessari a usare
// il sito senza rete. L'elenco deve restare allineato ai file effettivamente
// serviti — un file mancante qui significa una funzione che offline non parte.
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './calcolatore.html',
    './diario.html',
    './assistente.html',
    './simulator.html',
    './scienza.html',
    './tipi-di-pizza.html',
    './prefermenti_e_farine.html',
    './shop.html',
    './contatti.html',
    './privacy.html',
    './manifest.webmanifest',
    './css/main.css',

    // Moduli JS
    './js/nav.js',
    './js/home.js',
    './js/i18n-engine.js',
    './js/dom-target.js',
    './js/focus-trap.js',
    './js/listing.js',
    './js/mini-calc.js',
    './js/stagionale.js',
    './js/calcolatore-engine.js',
    './js/calcolatore-page.js',
    './js/validazione-engine.js',
    './js/flour-blend-engine.js',
    './js/procedura-engine.js',
    './js/timer-engine.js',
    './js/pizza-card-engine.js',
    './js/tools-engine.js',
    './js/firebase-auth.js',
    './js/diario-page.js',
    './js/diario-storage.js',
    './js/assistente-page.js',
    './js/simulator-page.js',
    './js/print-engine.js',
    './js/calendar-export.js',
    './js/fermentation-curve-engine.js',
    './js/yeast-converter.js',
    './js/troubleshooting-engine.js',
    './js/grains-engine.js',
    './js/glossario-engine.js',

    // Dizionari e dataset in italiano
    './data/i18n/it.json',
    './data/i18n/en.json',
    './data/config.json',
    './data/farine.json',
    './data/ingredienti.json',
    './data/pizze.json',
    './data/prefermenti.json',
    './data/products.json',
    './data/ricette.json',
    './data/scienza.json',
    './data/stagionale.json',
    './data/cereali.json',
    './data/glossario.json',
    './data/troubleshooting.json',

    // Dataset localizzati: senza questi la versione inglese offline resta vuota
    './data/farine.en.json',
    './data/pizze.en.json',
    './data/prefermenti.en.json',
    './data/products.en.json',
    './data/scienza.en.json',
    './data/stagionale.en.json',

    // Immagini
    './logo.ico',
    './img/logo.png',
    './img/icon-192.png',
    './img/icon-512.png',
    './img/icon-maskable-512.png',
    './img/apple-touch-icon.png',
    './img/napoletana.jpg',
    './img/romana.jpg',
    './img/contemporanea.jpg',
    './img/pala.jpg',
    './img/padellino.jpg',
    './img/calcolatore.jpg',
    './img/assistente.jpg',
    './img/biga.jpg',
    './img/poolish.jpg',
    './img/lievito-madre.jpg',
    './img/farine.jpg',
    './img/farina0.jpg',
    './img/farina00.jpg',
    './img/farina1.jpg',
    './img/farina2.jpg',
    './img/farina_integrale.jpg',
    './img/nutrienti.jpg',
    './img/shop.jpg',
    './img/pizzalab_community.jpg',
];

// Install: pre-carica il guscio.
// cache.addAll() è atomico: basta un singolo 404 o un errore di rete perché
// l'intera installazione fallisca e il service worker non si attivi mai,
// lasciando l'utente senza offline. Qui ogni risorsa viene messa in cache
// singolarmente, così un asset mancante degrada quella sola funzione.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            const esiti = await Promise.allSettled(
                ASSETS_TO_CACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })))
            );
            const falliti = esiti
                .map((e, i) => (e.status === 'rejected' ? ASSETS_TO_CACHE[i] : null))
                .filter(Boolean);
            if (falliti.length) {
                console.warn('[SW] Risorse non memorizzate in cache:', falliti);
            }
            return self.skipWaiting();
        })
    );
});

// Activate: elimina le cache delle versioni precedenti.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames
                .filter((cache) => cache.startsWith('pizzalab-cache-') && cache !== CACHE_NAME)
                .map((cache) => caches.delete(cache))
        )).then(() => self.clients.claim())
    );
});

// Risposta di cortesia quando una risorsa non è né in rete né in cache.
// respondWith() richiede una Response: restituire null solleva un TypeError e
// la richiesta fallisce con un errore oscuro invece che con uno stato leggibile.
function rispostaNonDisponibile() {
    return new Response('', {
        status: 503,
        statusText: 'Non disponibile offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
}

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') return;
    if (!request.url.startsWith('http')) return;

    // Le richieste verso altre origini (font Google, immagini Amazon, API)
    // non passano dalla cache: vanno alla rete e basta.
    const stessaOrigine = request.url.startsWith(self.location.origin);
    if (!stessaOrigine) return;

    // Le navigazioni usano network-first: una pagina HTML servita dalla cache
    // mostrerebbe indefinitamente la versione precedente del sito. Il guscio in
    // cache resta come riserva quando la rete non c'è.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    return cached || (await caches.match('./index.html')) || rispostaNonDisponibile();
                })
        );
        return;
    }

    // Tutto il resto (CSS, JS, JSON, immagini) usa stale-while-revalidate:
    // risposta immediata dalla cache, aggiornamento in sottofondo.
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse || rispostaNonDisponibile());

            return cachedResponse || fetchPromise;
        })
    );
});
