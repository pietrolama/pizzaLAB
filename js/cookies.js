document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializzazione Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",
            "orientation": "bottom",
            "showAlertSmall": false,
            "cookieslist": true,
            "highPrivacy": true,
            "removeCredit": true,
            "handleBrowserDNTRequest": false,
            "AcceptAllCta": true,
            "moreInfoLink": true,
            "useLocalStorage": true, // Usa localStorage per persistenza
            "debug": true
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Controllo delle preferenze salvate
        function checkSavedPreferences() {
            const preference = localStorage.getItem('cookie_preferences');
            if (preference === 'accepted') {
                console.log("Preferenze salvate: accettate.");
                tarteaucitron.userInterface.respondAll(true); // Accetta tutti i cookie
                tarteaucitron.userInterface.closeAlert();
                initializeGoogleAnalytics(); // Inizializza GA
            } else if (preference === 'denied') {
                console.log("Preferenze salvate: rifiutate.");
                tarteaucitron.userInterface.respondAll(false); // Rifiuta tutti i cookie
                tarteaucitron.userInterface.closeAlert();
            } else {
                console.log("Nessuna preferenza trovata. Mostro il banner.");
            }
        }

        // Funzione per salvare le preferenze
        function savePreferences(response) {
            localStorage.setItem('cookie_preferences', response ? 'accepted' : 'denied');
            console.log(`Preferenze salvate: ${response ? 'accettate' : 'rifiutate'}.`);
            tarteaucitron.userInterface.closeAlert();
            if (response) initializeGoogleAnalytics(); // Inizializza GA se accettato
        }

        // Inizializza Google Analytics
        function initializeGoogleAnalytics() {
            if (!tarteaucitron.services.googleanalytics.fallbackTriggered) {
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

                ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID GA
                ga('send', 'pageview');
                console.log("✅ Google Analytics attivato.");
            }
        }

        // Controllo iniziale
        setTimeout(checkSavedPreferences, 500);

        // Aggiunta eventi ai pulsanti
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

        // Definizione del servizio Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"],
            "js": initializeGoogleAnalytics, // Inizializza GA quando attivato
            "fallback": function () {
                console.warn("❌ Google Analytics non attivato.");
                tarteaucitron.services.googleanalytics.fallbackTriggered = true;
            }
        };

        console.log("Configurazione Google Analytics completata.");

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
