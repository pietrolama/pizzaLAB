document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    /**
     * Funzione per eliminare i cookie duplicati legati al consenso.
     */
    function removeDuplicateCookies() {
        console.log("Controllo cookie duplicati...");
        const domains = ["pizzalab.pizza", "www.pizzalab.pizza", ".pizzalab.pizza"];
        domains.forEach(domain => {
            document.cookie = `cookieconsent_status=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        });
        console.log("Cookie duplicati rimossi.");
    }

    /**
     * Funzione per impostare correttamente il cookie.
     */
    function setCookie(value) {
        const cookieString = `cookieconsent_status=${value}; path=/; domain=.pizzalab.pizza; expires=Fri, 31 Dec 2024 23:59:59 GMT; Secure`;
        document.cookie = cookieString;
        console.log(`Cookie impostato: ${cookieString}`);
    }

    /**
     * Funzione per verificare lo stato dei cookie.
     */
    function checkCookieStatus(status) {
        if (status === "allow") {
            console.log("Cookie accettati. Caricamento Google Analytics...");
            loadGoogleAnalytics();
        } else {
            console.log("Cookie non accettati.");
        }
    }

    /**
     * Funzione per caricare Google Analytics.
     */
    function loadGoogleAnalytics() {
        console.log("Caricamento di Google Analytics...");
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
        ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID di tracciamento
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }

    /**
     * Inizializza il banner dei cookie.
     */
    if (typeof window.cookieconsent !== "undefined") {
        window.cookieconsent.initialise({
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
                removeDuplicateCookies(); // Elimina cookie duplicati all'avvio
                setCookie(status); // Sincronizza il cookie con lo stato interno
                checkCookieStatus(status);
            },
            onStatusChange: function (status) {
                console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
                removeDuplicateCookies(); // Elimina cookie duplicati
                setCookie(status); // Sincronizza il cookie con lo stato interno
                checkCookieStatus(status); // Controlla e carica
            }
        });
    } else {
        console.error("CookieConsent non caricato. Controlla il file.");
    }

    /**
     * Aggiunge un listener per il pulsante "Accetta".
     */
    const acceptButton = document.querySelector('.cc-dismiss');
    if (acceptButton) {
        acceptButton.addEventListener('click', function () {
            console.log("Clic sul pulsante 'Accetta' rilevato.");
            removeDuplicateCookies();
            setCookie('allow');
            window.cookieconsent.setStatus('allow'); // Sincronizza con lo stato interno della libreria
        });
    }
});
