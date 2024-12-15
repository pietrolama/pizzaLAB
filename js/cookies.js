document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializza tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html", // URL della Privacy Policy
            "orientation": "bottom",       // Posizione del banner
            "showAlertSmall": true,        // Mostra il mini-banner
            "cookieslist": true,           // Mostra la lista dei cookie
            "debug": true,                 // Abilita il debug
            "highPrivacy": false,          // Disabilita l'accettazione automatica
            "AcceptAllCta": true,          // Aggiungi il pulsante "Accetta tutti i cookie"
            "removeCredit": true,          // Rimuovi il credit di tarteaucitron
            "useExternalCss": false        // Usa lo stile CSS locale
        });

        console.log("Configurazione completata. Attendo il rendering del banner...");

        // Aggiungi Google Analytics come esempio di servizio
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ['_ga', '_gid'],
            "js": function () {
                console.log("Google Analytics caricato...");
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
                console.warn("Google Analytics non attivo.");
            }
        };

        console.log("Servizio Google Analytics configurato correttamente.");

        // Forza il rendering del pannello dopo un timeout
        setTimeout(() => {
            console.log("Tentativo di apertura del pannello...");
            if (typeof tarteaucitron.userInterface.openPanel === 'function') {
                tarteaucitron.userInterface.openPanel();
                console.log("Pannello aperto manualmente.");
            } else {
                console.warn("Impossibile aprire il pannello: funzione non disponibile.");
            }
        }, 1000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di tarteaucitron:", error);
    }
});
