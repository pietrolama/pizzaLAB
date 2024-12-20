window.cookieconsent.initialise({
    palette: {
        popup: {
            background: "#000000"
        },
        button: {
            background: "#f1d600"
        }
    },
    theme: "classic",
    position: "bottom-left",
    content: {
        message: "Questo sito utilizza cookie per migliorare l'esperienza utente.",
        dismiss: "Accetto",
        link: "Scopri di più",
        href: "privacy.html"
    },
    onInitialise: function (status) {
        // Controlla se i cookie sono stati accettati
        if (this.hasConsented()) {
            loadGoogleAnalytics();
        }
    },
    onStatusChange: function (status) {
        // Ricarica i servizi solo se accettati
        if (status === "allow") {
            loadGoogleAnalytics();
        }
    }
});

// Funzione per caricare Google Analytics
function loadGoogleAnalytics() {
    console.log("Caricamento di Google Analytics...");
    (function (i, s, o, g, r, a, m) {
        i["GoogleAnalyticsObject"] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = "https://www.googletagmanager.com/gtag/js?id=G-1CV0W5QPKV";
        m.parentNode.insertBefore(a, m);
    })(window, document, "script", "https://www.googletagmanager.com/gtag/js?id=G-1CV0W5QPKV", "ga");

    // Configura Google Analytics 4 con il tuo ID
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", "G-1CV0W5QPKV"); // Usa il tuo ID di tracciamento
}
