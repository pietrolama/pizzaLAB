document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Controlla se Cookie Consent è caricato
    if (typeof window.cookieconsent === 'undefined') {
        console.error("CookieConsent non è stato caricato. Verifica il file o il blocco dell'ad blocker.");
        return;
    }

    // Inizializza Cookie Consent
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
            checkCookieStatus(status);
        }
    });

    // Funzione per controllare lo stato del cookie
    function checkCookieStatus(status) {
        if (status === 'allow') {
            console.log("Cookie accettati. Caricamento di Google Analytics...");
            loadGoogleAnalytics();
        } else {
            console.warn("Cookie non accettati.");
        }
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
        ga('create', 'G-1CV0W5QPKV', 'auto'); // Usa il tuo ID di tracciamento
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }
});
