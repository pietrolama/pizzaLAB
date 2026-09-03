// sw.js - Service Worker per PizzaLab PWA
// Permette il funzionamento completo offline del calcolatore, diario, ricette e guide.

const CACHE_NAME = 'pizzalab-cache-v1';

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
    './js/nav.js',
    './js/home.js',
    './js/calcolatore-engine.js',
    './js/calcolatore-page.js',
    './js/flour-blend-engine.js',
    './js/procedura-engine.js',
    './js/timer-engine.js',
    './js/pizza-card-engine.js',
    './js/tools-engine.js',
    './js/i18n-engine.js',
    './js/diario-page.js',
    './js/assistente-page.js',
    './js/simulator-page.js',
    './js/listing.js',
    './js/mini-calc.js',
    './js/stagionale.js',
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
    './img/logo.png',
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
    './img/nutrienti.jpg',
    './img/shop.jpg'
];

// Install Event: Pre-cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate Event: Clear older caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch Event: Stale-While-Revalidate with offline fallback
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Solo richieste GET
    if (request.method !== 'GET') return;

    // Ignora richieste chrome-extension o non-http
    if (!request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        // Aggiorna la cache solo per risorse del nostro dominio
                        if (request.url.startsWith(self.location.origin)) {
                            cache.put(request, responseClone);
                        }
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Se la rete fallisce e la risorsa è una pagina HTML, fallback a index.html o cache
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return null;
            });

            // Restituisce la versione in cache se disponibile, altrimenti aspetta la rete
            return cachedResponse || fetchPromise;
        })
    );
});
