document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // ===== Inizializzazione di Tarteaucitron =====
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",          // Pagina della privacy policy
            "orientation": "bottom",               // Posizione del banner
            "showAlertSmall": false,               // Icona per riaprire il banner
            "cookieslist": true,                   // Mostra la lista dei cookie
            "highPrivacy": true,                   // Accettazione esplicita dei cookie
            "removeCredit": true,                  // Rimuove il credito dal banner
            "handleBrowserDNTRequest": false,      // Ignora "Do Not Track"
            "AcceptAllCta": true,                  // Pulsante "Accetta tutto"
            "moreInfoLink": true,                  // Mostra il link per ulteriori info
            "debug": true                          // Abilita debug
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // ===== Funzione per controllare e applicare le preferenze salvate =====
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
            } else {
                console.log("Nessuna preferenza salvata. Mostro il banner.");
            }
        }

        // ===== Funzione per salvare le preferenze =====
        function savePreferences(response) {
            localStorage.setItem('cookie_preferences', response ? 'accepted' : 'denied');
            console.log(`Preferenze salvate: ${response ? 'accettate' : 'rifiutate'}.`);
            tarteaucitron.userInterface.closeAlert();
        }

        // ===== Configurazione del servizio Google Analytics =====
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid", "_gat"], // Principali cookie di Google Analytics
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

                // Configurazione di GA (sostituisci con il tuo ID GA)
                ga('create', 'G-1CV0W5QPKV', 'auto');
                ga('send', 'pageview');
            },
            "fallback": function () {
                console.warn("❌ Google Analytics non attivato.");
            }
        };

        // ===== Controllo delle preferenze all'avvio =====
        setTimeout(checkSavedPreferences, 500);

        // ===== Aggiunta eventi ai pulsanti =====
        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');
            const saveButton = document.querySelector('#tarteaucitronSaveButton');

            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    savePreferences(true);
                    console.log("✅ Tutti i cookie accettati.");
                });
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    savePreferences(false);
                    console.log("❌ Tutti i cookie rifiutati.");
                });
            }

            if (saveButton) {
                saveButton.addEventListener('click', () => {
                    console.log("Preferenze salvate manualmente.");
                    tarteaucitron.userInterface.closeAlert();
                });
            }
        }, 1000);

    } catch (error) {
        console.error("❌ Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
