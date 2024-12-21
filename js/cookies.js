document.addEventListener('DOMContentLoaded', function () {
    // Inizializza il banner
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
            console.log("onInitialise eseguito. Stato iniziale:", status);
            if (status === "allow") {
                loadGoogleAnalytics();
            }
        },
        onStatusChange: function (status) {
            console.log("onStatusChange eseguito. Stato aggiornato:", status);
            if (status === "allow") {
                loadGoogleAnalytics();
            }
        }
    });

    // Carica Google Analytics
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
});
