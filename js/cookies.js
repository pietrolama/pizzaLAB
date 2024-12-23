document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    /**
     * Rimuove cookie duplicati su pizzalab.pizza e .pizzalab.pizza.
     */
    function removeDuplicateCookies() {
        console.log("Controllo cookie duplicati...");
        const cookieName = "cookieconsent_status";
        const domains = ["pizzalab.pizza", ".pizzalab.pizza"];
        const paths = ["/"];

        domains.forEach(domain => {
            paths.forEach(path => {
                document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
            });
        });

        console.log("Cookie duplicati rimossi.");
    }

    /**
     * Verifica lo stato del cookie `cookieconsent_status` e carica Google Analytics se necessario.
     */
    function checkCookieStatus() {
        const status = document.cookie.split('; ').find(row => row.startsWith('cookieconsent_status='));
        const value = status ? status.split('=')[1] : null;

        if (value === 'allow') {
            console.log("Cookie accettati. Caricamento Google Analytics...");
            loadGoogleAnalytics();
        } else {
            console.log("Cookie non accettati.");
        }
    }

    /**
     * Carica Google Analytics.
     */
    function loadGoogleAnalytics() {
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments);
            }, i[r].l = 1 * new Date();
            a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = 'https://www.google-analytics.com/analytics.js';
            m.parentNode.insertBefore(a, m);
        })(window, document, 'script', 0, 'ga');
        ga('create', 'G-1CV0W5QPKV', 'auto');
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }

    /**
     * Inizializza la libreria CookieConsent con configurazione corretta.
     */
    if (typeof window.cookieconsent !== "undefined") {
        window.cookieconsent.initialise({
            cookie: {
                domain: '.pizzalab.pizza',
                path: '/',
            },
            palette: {
                popup: { background: "#000", text: "#fff" },
                button: { background: "#f1d600", text: "#000" }
            },
            content: {
                message: "Questo sito utilizza cookie per garantire la migliore esperienza di navigazione.",
                dismiss: "Accetta",
                link: "Maggiori informazioni",
                href: "/privacy.html"
            },
            onInitialise: function (status) {
                console.log("Banner inizializzato con stato:", status);
                removeDuplicateCookies(); // Rimuove cookie duplicati all'avvio
                checkCookieStatus(); // Controlla lo stato attuale
            },
            onStatusChange: function (status) {
                console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
                removeDuplicateCookies(); // Elimina eventuali cookie duplicati
                checkCookieStatus(); // Verifica il nuovo stato
            }
        });
    } else {
        console.error("CookieConsent non caricato. Controlla il file.");
    }

    /**
     * Listener per il pulsante "Accetta".
     */
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('cc-dismiss')) {
            console.log("Clic sul pulsante 'Accetta' rilevato.");
            removeDuplicateCookies(); // Rimuove cookie duplicati
            checkCookieStatus(); // Verifica e aggiorna lo stato
        }
    });

    console.log("Caricamento cookies.js completato.");
});
