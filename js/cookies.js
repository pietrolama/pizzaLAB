document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    const checkTarteaucitron = setInterval(() => {
        if (typeof tarteaucitron !== 'undefined') {
            clearInterval(checkTarteaucitron);
            console.log("tarteaucitron è ora disponibile!");

            try {
                // Configura tarteaucitron
                tarteaucitron.init({
                    "privacyUrl": "/privacy",
                    "hashtag": "#tarteaucitron",
                    "cookieName": "tarteaucitron",
                    "orientation": "bottom",
                    "showAlertSmall": true,
                    "cookieslist": true,
                    "adblocker": false,
                    "AcceptAllCta": true,
                    "highPrivacy": false,
                    "handleBrowserDNTRequest": false,
                    "removeCredit": true,
                    "moreInfoLink": true,
                    "useExternalCss": false,
                    "debug": true
                });
                console.log("Configurazione di tarteaucitron completata.");
            } catch (error) {
                console.error("Errore durante la configurazione di tarteaucitron:", error);
            }

            try {
                // Aggiungi Google Analytics
                tarteaucitron.services.googleanalytics = {
                    "key": "googleanalytics",
                    "type": "analytic",
                    "name": "Google Analytics",
                    "uri": "https://policies.google.com/privacy",
                    "needConsent": true,
                    "cookies": ["_ga", "_gid"],
                    "js": function () {
                        console.log("Google Analytics caricato.");
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
                    },
                    "fallback": function () {
                        console.log("Google Analytics non attivo.");
                    }
                };
                console.log("Servizio Google Analytics aggiunto.");
            } catch (error) {
                console.error("Errore durante l'aggiunta di Google Analytics:", error);
            }
        } else {
            console.log("In attesa di tarteaucitron...");
        }
    }, 100); // Controlla ogni 100 ms
});
