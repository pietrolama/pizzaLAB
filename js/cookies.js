document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    /**
     * Rimuove tutti i cookie duplicati con nome `cookieconsent_status`
     * su pizzalab.pizza e .pizzalab.pizza, per evitare conflitti.
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
     * Imposta un cookie su `.pizzalab.pizza`.
     */
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        const cookieValue = `${name}=${value}; path=/; domain=.pizzalab.pizza; expires=${expires.toUTCString()}; Secure`;
        document.cookie = cookieValue;
        console.log(`Cookie impostato: ${cookieValue}`);
    }

    /**
     * Controlla lo stato del cookie `cookieconsent_status`.
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
     * Carica Google Analytics se i cookie sono accettati.
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
     * Inizializza il banner CookieConsent.
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
                removeDuplicateCookies(); // Elimina eventuali cookie duplicati all'avvio
                checkCookieStatus();
            },
            onStatusChange: function (status) {
                console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
                removeDuplicateCookies(); // Elimina eventuali duplicati prima di impostare il nuovo valore
                if (status === "allow") {
                    setCookie("cookieconsent_status", "allow", 365);
                } else {
                    setCookie("cookieconsent_status", "dismiss", 365);
                }
                checkCookieStatus();
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
            removeDuplicateCookies(); // Elimina eventuali cookie duplicati
            setCookie("cookieconsent_status", "allow", 365); // Imposta il nuovo valore
            checkCookieStatus();
        }
    });

    console.log("Caricamento cookies.js completato.");
});
