document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Funzione per cancellare i cookie duplicati
    function clearDuplicateCookies() {
        const domainVariants = ["pizzalab.pizza", "www.pizzalab.pizza"];
        domainVariants.forEach(domain => {
            document.cookie = "cookieconsent_status=; path=/; domain=" + domain + "; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        });
        console.log("Cookie duplicati rimossi.");
    }

    // Cancella i cookie duplicati all'avvio
    clearDuplicateCookies();

    // Funzione per caricare Google Analytics
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

        // Configura il tuo ID di tracciamento
        ga('create', 'G-1CV0W5QPKV', 'auto');
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }

    // Inizializza il banner dei cookie
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
            console.log("Banner inizializzato. Stato:", status);

            // Se l'utente ha già accettato i cookie, carica Google Analytics
            if (status === "allow") {
                loadGoogleAnalytics();
            }
        },
        onStatusChange: function (status) {
            console.log("Stato aggiornato:", status);

            // Aggiorna il cookie e carica Google Analytics se necessario
            document.cookie = "cookieconsent_status=" + status + "; path=/; domain=pizzalab.pizza; expires=Fri, 31 Dec 2024 23:59:59 GMT; Secure";

            if (status === "allow") {
                loadGoogleAnalytics();
            }
        }
    });
});
