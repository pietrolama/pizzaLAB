document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    const tarteaucitronRoot = document.getElementById('tarteaucitronRoot');

    if (!tarteaucitronRoot) {
        console.error("Il contenitore #tarteaucitronRoot non è presente nel DOM.");
        return;
    }

    console.log("#tarteaucitronRoot trovato nel DOM:", tarteaucitronRoot);

    try {
        // Configurazione Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html", // Assicurati che il file sia accessibile
            "orientation": "bottom",
            "showAlertSmall": true,
            "cookieslist": true,
            "debug": true // Attiva il debug per log più dettagliati
        });

        console.log("Configurazione di Tarteaucitron completata.");
    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
        return;
    }

    // Aggiunta del servizio Google Analytics
    try {
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"],
            "js": function () {
                console.log("Caricamento di Google Analytics...");
                (function (i, s, o, g, r, a, m) {
                    i['GoogleAnalyticsObject'] = r;
                    i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments);
                    }, i[r].l = 1 * new Date();
                    a = s.createElement(o),
                        m = s.getElementsByTagName(o)[0];
                    a.async = 1;
                    a.src = g;
                    m.parentNode.insertBefore(a, m);
                })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
                ga('create', 'G-1CV0W5QPKV', 'auto');
                ga('send', 'pageview');
            },
            "fallback": function () {
                console.log("Google Analytics non attivo perché il consenso non è stato dato.");
            }
        };

        console.log("Servizio Google Analytics configurato.");
    } catch (error) {
        console.error("Errore durante l'aggiunta di Google Analytics:", error);
        return;
    }

    // Forza il rendering del banner, se necessario
    setTimeout(() => {
        if (!tarteaucitronRoot.innerHTML.trim()) {
            console.warn("Il banner non è stato generato. Forzo il rendering...");
            tarteaucitron.userInterface.openPanel();
        } else {
            console.log("Banner correttamente generato:", tarteaucitronRoot.innerHTML);
        }
    }, 1000);

    // Log dello stato di Tarteaucitron
    setTimeout(() => {
        console.log("Stato di Tarteaucitron:", tarteaucitron.state);
    }, 2000);
});
