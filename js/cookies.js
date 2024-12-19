document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Definizione del servizio Google Analytics prima dell'inizializzazione
        // Nota: assicurati di sostituire G-XXXXXXX con il tuo ID GA reale.
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
                ga('create', 'G-1CV0W5QPKV', 'auto');
                ga('send', 'pageview');
                console.log("✅ Google Analytics attivato.");
            }
        };

        // Definizione dei job prima dell'init
        tarteaucitron.job = tarteaucitron.job || [];
        tarteaucitron.job.push('googleanalytics');

        // Inizializzazione di Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",
            "orientation": "bottom",
            "showAlertSmall": false,
            "cookieslist": true,
            "highPrivacy": false, // Disattiva highPrivacy per non riproporre il banner dopo l'accettazione
            "removeCredit": true,
            "handleBrowserDNTRequest": false,
            "AcceptAllCta": true,
            "moreInfoLink": true,
            "useExternalCss": true,
            "customCss": "cookies/css/tarteaucitron.min.css",
            "readmoreLink": "/privacy.html",
            "debug": true,
            "lang": "it",
            "langPath": "../lang/" // percorso relativo: da js/ a cookies/js/ a cookies/lang/
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Non serve più salvare manualmente preferenze o usare respondAll().
        // Tarteaucitron gestisce tutto da sé.
        // Quando l'utente clicca su "Accetta" o "Rifiuta" del banner, Tarteaucitron salverà la preferenza nei suoi cookie.
        // Al reload della pagina, se l'utente ha accettato, non sarà mostrato il banner.

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
