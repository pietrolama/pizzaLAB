document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Funzione per rilevare l'ad blocker
    function detectAdBlocker() {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"; // File noto per essere bloccato
        script.onerror = function () {
            console.warn("Ad blocker rilevato. Alcune funzionalità potrebbero non funzionare correttamente.");
            const adBlockMessage = document.createElement("div");
            adBlockMessage.id = "adblock-message";
            adBlockMessage.style.position = "fixed";
            adBlockMessage.style.bottom = "10px";
            adBlockMessage.style.left = "10px";
            adBlockMessage.style.padding = "10px";
            adBlockMessage.style.backgroundColor = "#ffcc00";
            adBlockMessage.style.color = "#000";
            adBlockMessage.innerHTML = "Rilevato ad blocker. Si prega di disattivarlo per una migliore esperienza.";
            document.body.appendChild(adBlockMessage);
        };
        document.head.appendChild(script);
    }

    // Inizializzazione del rilevamento ad blocker
    detectAdBlocker();

    // Funzione per caricare Google Analytics
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
        ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID di tracciamento
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }

    // Configurazione dei cookie
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
            cookie: {
                name: "cookieconsent_status",
                path: "/",
                domain: "pizzalab.pizza", // Assicurati che il dominio corrisponda al tuo
                expiryDays: 365
            },
            onInitialise: function (status) {
                console.log("Banner inizializzato con stato:", status);
                if (status === "allow") {
                    console.log("Cookie accettati dall'utente.");
                    loadGoogleAnalytics();
                }
            },
            onStatusChange: function (status) {
                console.log("Lo stato del consenso è cambiato:", status);
                if (status === "allow") {
                    console.log("Cookie accettati dall'utente dopo modifica.");
                    loadGoogleAnalytics();
                }
            },
            onPopupOpen: function () {
                console.log("Il banner dei cookie è stato mostrato.");
            },
            onPopupClose: function () {
                console.log("Il banner dei cookie è stato chiuso.");
            }
        });
    } else {
        console.error("CookieConsent non caricato. Controlla il file.");
    }

    // Debug per controllare lo stato del cookie
    console.log("Stato corrente del cookie:", document.cookie.split('; ').find(row => row.startsWith('cookieconsent_status')));
});
