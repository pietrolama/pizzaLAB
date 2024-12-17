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
            "debug": false // Rimuovi i log dopo il testing
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Controlla e applica le preferenze salvate
        function checkSavedPreferences() {
            const preferences = localStorage.getItem('cookie_preferences');
            if (preferences === 'accepted') {
                console.log("Preferenze salvate: accettate.");
                tarteaucitron.userInterface.respondAll(true);
                tarteaucitron.userInterface.closeAlert();
            } else if (preferences === 'denied') {
                console.log("Preferenze salvate: rifiutate.");
                tarteaucitron.userInterface.respondAll(false);
                tarteaucitron.userInterface.closeAlert();
            }
        }

        // Salva le preferenze
        function savePreferences(response) {
            localStorage.setItem('cookie_preferences', response ? 'accepted' : 'denied');
            console.log(`Preferenze salvate: ${response ? 'accettate' : 'rifiutate'}.`);
            tarteaucitron.userInterface.closeAlert();
        }

        setTimeout(() => {
            checkSavedPreferences();

            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');

            if (acceptButton) {
                acceptButton.addEventListener('click', () => savePreferences(true));
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => savePreferences(false));
            }
        }, 500);

        // Configurazione di Google Analytics
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
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID
                ga('send', 'pageview');
            },
            "fallback": function () {
                console.warn("❌ Google Analytics non attivato.");
            }
        };

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
