document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializzazione di Tarteaucitron
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
            "debug": true
        });
        console.log("Tarteaucitron inizializzato correttamente.");

        // Salvataggio preferenze in localStorage
        function savePreferences(accepted) {
            const status = accepted ? 'accepted' : 'denied';
            localStorage.setItem('cookie_preferences', status);
            console.log(`Preferenze salvate: ${status}`);
            tarteaucitron.userInterface.closeAlert();
        }

        // Verifica preferenze salvate e applica il comportamento
        function checkSavedPreferences() {
            const preferences = localStorage.getItem('cookie_preferences');
            if (preferences === 'accepted') {
                console.log("Preferenze: accettate. Attivazione dei servizi...");
                tarteaucitron.userInterface.respondAll(true);
            } else if (preferences === 'denied') {
                console.log("Preferenze: rifiutate. Disattivazione dei servizi...");
                tarteaucitron.userInterface.respondAll(false);
            } else {
                console.log("Nessuna preferenza trovata. Mostro il banner.");
            }
        }

        // Configurazione del servizio Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"],
            "js": function () {
                console.log("✅ Google Analytics attivato.");
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
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Usa il tuo ID
                ga('send', 'pageview');
            }
        };

        // Controllo iniziale delle preferenze
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

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
