document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Verifica e inizializza tarteaucitron
    const checkTarteaucitron = setInterval(() => {
        if (typeof tarteaucitron !== 'undefined' && typeof tarteaucitron.init === 'function') {
            clearInterval(checkTarteaucitron);
            console.log("Tarteaucitron è disponibile. Procedo con l'inizializzazione...");

            // Configurazione di Tarteaucitron
            try {
                tarteaucitron.init({
                    "privacyUrl": "/privacy.html", // URL della privacy policy
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
                    "cdn": "/cookies/", // Assicurati che questa cartella contenga CSS/JS corretti
                    "debug": true
                });
                console.log("Configurazione di Tarteaucitron completata.");
            } catch (error) {
                console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
            }

            // Forza il caricamento e il rendering del banner
            try {
                setTimeout(() => {
                    console.log("Forzo il caricamento dei servizi e il rendering del banner...");
                    tarteaucitron.load();
                }, 1000);
            } catch (error) {
                console.error("Errore durante il caricamento dei servizi:", error);
            }

            // Verifica il contenuto del banner
            setTimeout(() => {
                const tarteaucitronRoot = document.getElementById('tarteaucitronRoot');
                if (tarteaucitronRoot) {
                    const content = tarteaucitronRoot.innerHTML || "";
                    if (content.trim()) {
                        console.log("Il banner è stato generato correttamente.");
                    } else {
                        console.warn("Il banner non è ancora visibile. Verifica la configurazione dei file.");
                    }
                } else {
                    console.error("Elemento tarteaucitronRoot non trovato nel DOM.");
                }
            }, 2000);

            // Aggiunta del servizio Google Analytics
            try {
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
                console.log("Servizio Google Analytics configurato correttamente.");
            } catch (error) {
                console.error("Errore durante l'aggiunta di Google Analytics:", error);
            }
        } else {
            console.log("In attesa di Tarteaucitron...");
        }
    }, 500); // Controlla ogni 500 ms per verificare Tarteaucitron
});
