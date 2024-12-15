document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializza Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",      // URL della pagina privacy
            "orientation": "bottom",           // Posizionamento del banner
            "showAlertSmall": true,            // Mostra un'icona per riaprire il banner
            "cookieslist": true,               // Mostra l'elenco dei cookie
            "debug": true                      // Modalità debug
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Aggiunta del servizio Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true, // Richiede il consenso
            "cookies": ['_ga', '_gid'],
            "js": function () {
                console.log("Caricamento Google Analytics...");
                (function (i, s, o, g, r, a, m) {
                    i['GoogleAnalyticsObject'] = r;
                    i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments);
                    }, i[r].l = 1 * new Date();
                    a = s.createElement(o), m = s.getElementsByTagName(o)[0];
                    a.async = 1;
                    a.src = g;
                    m.parentNode.insertBefore(a, m);
                })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
                ga('create', 'UA-XXXXXXX-Y', 'auto'); // Sostituisci con il tuo ID UA
                ga('send', 'pageview');
            }
        };

        console.log("Google Analytics configurato correttamente.");

        // Attesa per il rendering completo del banner
        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');

            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(true);
                    console.log("Pulsante 'Accetta' cliccato: tutti i cookie accettati.");
                });
            } else {
                console.warn("Pulsante 'Accetta' non trovato.");
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(false);
                    console.log("Pulsante 'Rifiuta' cliccato: tutti i cookie rifiutati.");
                });
            } else {
                console.warn("Pulsante 'Rifiuta' non trovato.");
            }

            console.log("Eventi assegnati ai pulsanti.");
        }, 1000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
