document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
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
                ga('create', 'G-1CV0W5QPKV', 'auto');
                ga('send', 'pageview');
                console.log("✅ Google Analytics attivato.");
            }
        };

        tarteaucitron.init({
            privacyUrl: "",
            orientation: "bottom",
            showAlertSmall: false,
            cookieslist: true,
            highPrivacy: false,
            removeCredit: true,
            handleBrowserDNTRequest: false,
            AcceptAllCta: true,
            moreInfoLink: false,
            useExternalCss: false,
            debug: true,
            cookieDomain: ".pizzalab.pizza" // Gestisce sia www che senza www
        });

        console.log("Tarteaucitron inizializzato correttamente.");

        tarteaucitron.job = tarteaucitron.job || [];
        tarteaucitron.job.push('googleanalytics');

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
