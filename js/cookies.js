document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializza Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",
            "orientation": "bottom",
            "showAlertSmall": true,
            "cookieslist": true,
            "debug": true
        });

        console.log("Configurazione completata. Attendo il rendering del banner...");

        // Controlla e associa eventi ai pulsanti del banner
        setTimeout(() => {
            checkAndAttachEvents();
        }, 1000); // Aspetta 1 secondo per garantire il rendering
    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }

    function checkAndAttachEvents() {
        console.log("Cerco i pulsanti 'Accetta' e 'Rifiuta'...");

        // Pulsante 'Accetta'
        const acceptButton = document.querySelector("#tarteaucitronAllAllowed");
        if (acceptButton) {
            acceptButton.addEventListener("click", function () {
                tarteaucitron.userInterface.respondAll(true);
                console.log("Tutti i cookie sono stati accettati.");
            });
            console.log("Evento 'Accetta' associato.");
        } else {
            console.warn("Pulsante 'Accetta' non trovato.");
        }

        // Pulsante 'Rifiuta'
        const rejectButton = document.querySelector("#tarteaucitronAllDenied");
        if (rejectButton) {
            rejectButton.addEventListener("click", function () {
                tarteaucitron.userInterface.respondAll(false);
                console.log("Tutti i cookie sono stati rifiutati.");
            });
            console.log("Evento 'Rifiuta' associato.");
        } else {
            console.warn("Pulsante 'Rifiuta' non trovato.");
        }
    }
});
