document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    /**
     * Funzione per eliminare cookie duplicati.
     */
    function removeDuplicateCookies() {
        console.log("Controllo cookie duplicati...");
        const cookies = document.cookie.split('; ').filter(cookie => cookie.startsWith('cookieconsent_status'));
        if (cookies.length > 1) {
            console.log("Trovati cookie duplicati. Rimuovendo...");
            document.cookie = "cookieconsent_status=; path=/; domain=pizzalab.pizza; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            document.cookie = "cookieconsent_status=; path=/; domain=www.pizzalab.pizza; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            document.cookie = "cookieconsent_status=; path=/; domain=.pizzalab.pizza; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        }
    }

    /**
     * Funzione per impostare il cookie correttamente.
     * @param {string} value - Valore del cookie da impostare (es. 'allow' o 'dismiss').
     */
    function setCookie(value) {
        const cookieString = `cookieconsent_status=${value}; path=/; domain=.pizzalab.pizza; expires=Fri, 31 Dec 2024 23:59:59 GMT; Secure`;
        document.cookie = cookieString;
        console.log(`Cookie impostato manualmente: ${cookieString}`);
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
        ga('create', 'G-1CV0W5QPKV', 'auto'); // Usa il tuo ID di Google Analytics
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }

    /**
     * Funzione per verificare lo stato del cookie.
     */
    function checkCookieStatus(status) {
        if (status === "allow") {
            console.log("Cookie accettati. Caricando Google Analytics...");
            loadGoogleAnalytics();
        } else {
            console.log("Cookie non accettati.");
        }
    }

    // Rimuove cookie duplicati all'avvio
    removeDuplicateCookies();

    // Inizializza il banner dei cookie
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
                checkCookieStatus(status);
            },
            onStatusChange: function (status) {
                console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
                removeDuplicateCookies();
                checkCookieStatus(status);
            }
        });
    } else {
        console.error("CookieConsent non caricato. Controlla il file.");
    }

    // Gestione manuale del pulsante "Accetta"
    const acceptButton = document.querySelector('.cc-dismiss');
    if (acceptButton) {
        acceptButton.addEventListener('click', function () {
            console.log("Clic sul pulsante 'Accetta' rilevato.");
            setCookie('allow');
            loadGoogleAnalytics();
        });
    }
});
