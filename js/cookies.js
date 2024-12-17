document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializzazione di Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",        // URL della pagina della privacy
            "orientation": "bottom",              // Posizionamento del banner
            "showAlertSmall": false,              // Nasconde l'icona di riapertura
            "cookieslist": true,                  // Mostra l'elenco dei cookie
            "highPrivacy": true,                  // Richiede azione esplicita dell'utente
            "removeCredit": true,                 // Rimuove il credito Tarteaucitron
            "handleBrowserDNTRequest": false,     // Ignora il "Do Not Track" del browser
            "AcceptAllCta": true,                 // Mostra pulsante "Accetta tutto"
            "moreInfoLink": true,                 // Mostra ulteriori informazioni
            "debug": true                         // Modalità debug
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Funzione per salvare le preferenze dell'utente
        function savePreferences() {
            tarteaucitron.userInterface.respondAll(false); // Blocca tutti i servizi di default
            localStorage.setItem('cookie_preferences', 'saved');
            console.log("✅ Preferenze salvate.");
            tarteaucitron.userInterface.closeAlert(); // Chiude il banner
        }

        // Controlla se le preferenze sono già state salvate
        if (localStorage.getItem('cookie_preferences') === 'saved') {
            console.log("🛑 Preferenze già salvate. Nascondo il banner.");
            tarteaucitron.userInterface.closeAlert();
        }

        // Assegna eventi ai pulsanti dopo il rendering
        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');
            const saveButton = document.querySelector('#tarteaucitronSaveButton');

            // Eventi pulsante "Accetta tutti i cookie"
            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(true);
                    console.log("✅ Tutti i cookie accettati.");
                    savePreferences();
                });
            } else {
                console.warn("⚠️ Pulsante 'Accetta' non trovato.");
            }

            // Eventi pulsante "Rifiuta tutti i cookie"
            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(false);
                    console.log("❌ Tutti i cookie rifiutati.");
                    savePreferences();
                });
            } else {
                console.warn("⚠️ Pulsante 'Rifiuta' non trovato.");
            }

            // Evento pulsante "Salva"
            if (saveButton) {
                saveButton.addEventListener('click', savePreferences);
            } else {
                console.warn("⚠️ Pulsante 'Salva' non trovato.");
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
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID di tracciamento
                ga('send', 'pageview');
            },
            "fallback": function () {
                console.warn("❌ Google Analytics non attivato.");
            }
        };

    } catch (error) {
        console.error("❌ Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
