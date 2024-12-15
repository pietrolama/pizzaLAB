document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    const tarteaucitronRoot = document.getElementById('tarteaucitronRoot');
    if (!tarteaucitronRoot) {
        console.error("Errore: Il contenitore #tarteaucitronRoot non esiste nel DOM.");
        return;
    }

    try {
        // Configura Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html", // Assicurati che questo URL esista
            "orientation": "bottom",
            "showAlertSmall": true,
            "cookieslist": true,
            "debug": true,
            "cdn": "js"
        });
        console.log("Configurazione di Tarteaucitron completata.");
    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
        return;
    }

    // Monitoraggio dello stato del banner
    const checkBanner = setInterval(() => {
        if (tarteaucitronRoot.innerHTML.trim()) {
            clearInterval(checkBanner);
            console.log("Banner generato correttamente:", tarteaucitronRoot.innerHTML);

            // Test di accettazione e rifiuto dei servizi
            try {
                tarteaucitron.userInterface.respondAll(true); // Accetta tutti i servizi
                console.log("Servizi accettati.");
            } catch (error) {
                console.error("Errore durante l'accettazione dei servizi:", error);
            }

            try {
                tarteaucitron.userInterface.respond(false); // Rifiuta tutti i servizi
                console.log("Servizi rifiutati.");
            } catch (error) {
                console.error("Errore durante il rifiuto dei servizi:", error);
            }
        } else {
            console.warn("Il banner non è ancora stato generato. Riprovo...");
        }
    }, 500);

    // Timeout di sicurezza
    setTimeout(() => {
        clearInterval(checkBanner);
        if (!tarteaucitronRoot.innerHTML.trim()) {
            console.error("Timeout: Il banner non è stato generato. Verifica la configurazione.");
        }
    }, 5000);
});
