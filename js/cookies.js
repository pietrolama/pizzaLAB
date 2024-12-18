document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Definizione del servizio Google Analytics prima dell'inizializzazione
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
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Inserisci il tuo ID GA
                ga('send', 'pageview');
                console.log("✅ Google Analytics attivato.");
            }
        };

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
            "useExternalCss": true,
            "customCss": "cookies/css/tarteaucitron.min.css", // Percorso al tuo CSS personalizzato
            "readmoreLink": "/privacy.html",
            "lang": "it", // Lingua
            "langPath": "cookies/lang/", // Percorso dove cercare i file di lingua
            "debug": true
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Aggiungo il servizio alla coda dei job
        tarteaucitron.job.push('googleanalytics');

        // Funzione per salvare le preferenze
        function savePreferences(response) {
            localStorage.setItem('cookie_preferences', response ? 'accepted' : 'denied');
            console.log(`Preferenze salvate: ${response ? 'accettate' : 'rifiutate'}.`);
            tarteaucitron.userInterface.closeAlert();
        }

        // Controllo delle preferenze salvate
        function checkSavedPreferences() {
            const saved = localStorage.getItem('cookie_preferences');
            if (tarteaucitron.state) {
                if (saved === 'accepted') {
                    console.log("Preferenze: accettate.");
                    tarteaucitron.userInterface.respondAll(true);
                } else if (saved === 'denied') {
                    console.log("Preferenze: rifiutate.");
                    tarteaucitron.userInterface.respondAll(false);
                } else {
                    console.log("Nessuna preferenza salvata. L'utente deve ancora scegliere.");
                }
            } else {
                console.warn("Tarteaucitron non è ancora pronto, riprovo tra poco...");
                setTimeout(checkSavedPreferences, 1000);
            }
        }

        // Aggiunta eventi ai pulsanti dopo il rendering del banner
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
        }, 2000);

        // Controlla le preferenze all'avvio con un leggero ritardo, per sicurezza
        setTimeout(checkSavedPreferences, 2000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
