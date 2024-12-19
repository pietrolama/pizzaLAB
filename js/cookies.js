document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        tarteaucitron.init({
            privacyUrl: "/privacy.html",
            orientation: "bottom",
            showAlertSmall: false,
            cookieslist: true,
            highPrivacy: false,
            removeCredit: true,
            handleBrowserDNTRequest: false,
            AcceptAllCta: true,
            moreInfoLink: true,
            useExternalCss: false, // Non usare CSS esterno per ora
            readmoreLink: "/privacy.html",
            debug: true,
            lang: "it" // Lascia solo la lingua, senza langPath
        });

        console.log("Tarteaucitron inizializzato correttamente.");

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
