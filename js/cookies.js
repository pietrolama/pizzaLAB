document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializza Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",      // Pagina della privacy policy
            "orientation": "bottom",           // Posizionamento del banner
            "showAlertSmall": true,            // Icona per riaprire il banner
            "cookieslist": true,               // Mostra l'elenco dei cookie
            "adblocker": false,                // Non mostra avvisi per Adblocker
            "AcceptAllCta": true,              // Pulsante "Accetta tutto"
            "highPrivacy": false,              // Disabilita accettazione implicita
            "handleBrowserDNTRequest": false,  // Non gestisce "Do Not Track"
            "removeCredit": true,              // Rimuove il credito dal banner
            "moreInfoLink": true,              // Link a ulteriori informazioni
            "debug": true                      // Modalità debug
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Configurazione del servizio Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"],
            "js": function () {
                console.log("Attivazione Google Analytics...");
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
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID GA
                ga('send', 'pageview');
            },
            "fallback": function () {
                console.log("Google Analytics non attivo.");
            }
        };

        // Attendi il rendering completo e assegna eventi ai pulsanti di Tarteaucitron
        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');

            console.log("Verifica pulsanti:", acceptButton, denyButton);

            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(true);
                    console.log("✅ Tutti i cookie accettati.");
                });
            } else {
                console.warn("❌ Pulsante 'Accetta' non trovato.");
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(false);
                    console.log("❌ Tutti i cookie rifiutati.");
                });
            } else {
                console.warn("❌ Pulsante 'Rifiuta' non trovato.");
            }

        }, 1000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
