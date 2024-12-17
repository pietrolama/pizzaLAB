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

         // Aggiungi salvataggio delle preferenze
        function savePreferences() {
            tarteaucitron.userInterface.respondAll(false); // Blocca tutti i servizi di default
            localStorage.setItem('cookie_preferences', 'saved');
            console.log("Preferenze salvate.");
        }

        // Controlla se le preferenze sono già state salvate
        if (localStorage.getItem('cookie_preferences') === 'saved') {
            console.log("Preferenze già salvate. Nascondo il banner.");
            tarteaucitron.userInterface.closeAlert(); // Nascondi il banner
        }

        // Aggiungi evento al pulsante "Salva"
        setTimeout(() => {
            const saveButton = document.querySelector('#tarteaucitronSaveButton');
            if (saveButton) {
                saveButton.addEventListener('click', savePreferences);
            }
        }, 1000);

        // Configurazione del servizio Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"],
            "js": function () {
                console.log("Google Analytics attivato.");
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
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID
                ga('send', 'pageview');
            }
        };

        // Assegna eventi ai pulsanti dopo il rendering
        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');
            const saveButton = document.querySelector('#tarteaucitronSaveButton');

            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(true);
                    console.log("✅ Tutti i cookie accettati.");
                });
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(false);
                    console.log("❌ Tutti i cookie rifiutati.");
                });
            }

            if (saveButton) {
                saveButton.addEventListener('click', () => {
                    console.log("Preferenze salvate dall'utente.");
                });
            }

        }, 1000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
