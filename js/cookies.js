document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializzazione di Tarteaucitron con percorsi aggiornati
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",                    // URL della privacy policy
            "orientation": "bottom",                         // Posizione banner
            "showAlertSmall": false,                         // Nessuna icona piccola
            "cookieslist": true,                             // Mostra la lista dei cookie
            "highPrivacy": true,                             // Accettazione esplicita
            "removeCredit": true,                            // Rimuove il credito
            "handleBrowserDNTRequest": false,                // Ignora Do Not Track
            "AcceptAllCta": true,                            // Pulsante "Accetta tutto"
            "moreInfoLink": true,                            // Link ulteriori informazioni
            "useExternalCss": true,                          // Usa CSS esterno
            "readmoreLink": "/privacy.html",                 // Link dettagli cookie
            "debug": true,                                   // Debug attivo
            "customCss": "cookies/css/tarteaucitron.min.css" // Percorso al CSS
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Imposta il percorso ai file lingua e servizi
        tarteaucitron.lang = 'cookies/lang/tarteaucitron.it.min.js';
        tarteaucitron.services = 'cookies/js/tarteaucitron.services.min.js';

        // Funzione per salvare le preferenze
        function savePreferences(response) {
            localStorage.setItem('cookie_preferences', response ? 'accepted' : 'denied');
            console.log(`Preferenze salvate: ${response ? 'accettate' : 'rifiutate'}.`);
            tarteaucitron.userInterface.closeAlert();
        }

        // Controllo delle preferenze salvate
        function checkSavedPreferences() {
            const saved = localStorage.getItem('cookie_preferences');
            if (saved === 'accepted') {
                console.log("Preferenze: accettate.");
                tarteaucitron.userInterface.respondAll(true);
            } else if (saved === 'denied') {
                console.log("Preferenze: rifiutate.");
                tarteaucitron.userInterface.respondAll(false);
            }
        }

        // Assegna eventi ai pulsanti dopo il rendering
        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');
            const saveButton = document.querySelector('#tarteaucitronSaveButton');

            if (acceptButton) {
                acceptButton.addEventListener('click', () => savePreferences(true));
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => savePreferences(false));
            }

            if (saveButton) {
                saveButton.addEventListener('click', () => {
                    console.log("Preferenze salvate manualmente.");
                    tarteaucitron.userInterface.closeAlert();
                });
            }
        }, 1000);

        // Configurazione di Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"],
            "js": function () {
                console.log("✅ Inizializzazione di Google Analytics...");
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
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Tuo ID GA
                ga('send', 'pageview');
                console.log("✅ Google Analytics attivato.");
            }
        };

        // Controlla le preferenze all'avvio
        checkSavedPreferences();

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
