document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Definisci il servizio Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"], 
            "js": function () {
                console.log("✅ Inizializzazione di Google Analytics...");
                (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
                a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;
                m.parentNode.insertBefore(a,m)
                })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
                ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID GA
                ga('send', 'pageview');
                console.log("✅ Google Analytics attivato.");
            }
        };

        // Inizializza Tarteaucitron con opzioni minime e highPrivacy disattivato
        tarteaucitron.init({
            privacyUrl: "",
            orientation: "bottom",
            showAlertSmall: false,
            cookieslist: true,
            highPrivacy: false, // permetti di ricordare la scelta
            removeCredit: true,
            handleBrowserDNTRequest: false,
            AcceptAllCta: true,
            moreInfoLink: false,
            useExternalCss: false,
            debug: true,
            cookieDomain: ".pizzalab.pizza"
            // Nessun langPath, usa la lingua di default (en) o una integrata finché non sistemi la lingua.
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        // Aggiungi il servizio alla job list
        tarteaucitron.job = tarteaucitron.job || [];
        tarteaucitron.job.push('googleanalytics');

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
