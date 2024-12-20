document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Funzione per rilevare l'ad blocker
    function detectAdBlocker() {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"; // File noto per essere bloccato
        script.onerror = function () {
            // Trigger: il file è stato bloccato, mostra messaggio
            console.warn("Ad blocker rilevato. Alcune funzionalità potrebbero non funzionare correttamente.");
            document.getElementById("adblock-message").style.display = "block";
        };
        document.head.appendChild(script);
    }

    // Inizializzazione del rilevamento ad blocker
    detectAdBlocker();

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
            onInitialise: function (status) {
                if (status === "allow") {
                    console.log("Cookie accettati dall'utente.");
                    // Aggiungi script di Google Analytics
                    loadGoogleAnalytics();
                }
            }
        });
    } else {
        console.error("CookieConsent non caricato. Controlla il file.");
    }

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
});
