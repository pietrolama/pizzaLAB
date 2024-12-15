document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Inizializza Tarteaucitron
    try {
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",
            "orientation": "bottom",
            "showAlertSmall": true,
            "cookieslist": true,
            "debug": true
        });

        console.log("Configurazione completata. Attendo il rendering del banner...");

        // Verifica se il banner è stato generato correttamente
        setTimeout(() => {
            const tarteaucitronRoot = document.getElementById('tarteaucitronRoot');
            if (tarteaucitronRoot) {
                console.log("Elemento tarteaucitronRoot trovato.");
                checkAndAttachEvents();
            } else {
                console.warn("Elemento tarteaucitronRoot non trovato. Forzo il rendering...");
                tarteaucitron.userInterface.openPanel();
                checkAndAttachEvents();
            }
        }, 1000); // Aspetta 1 secondo per il rendering

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }

    // Funzione per verificare e agganciare gli eventi ai pulsanti
    function checkAndAttachEvents() {
        console.log("Controllo la presenza dei pulsanti nel banner...");
        
        // Cerca i pulsanti "Accetta" e "Rifiuta"
        const acceptButton = document.querySelector("button[data-accept]");
        const rejectButton = document.querySelector("button[data-reject]");

        if (acceptButton) {
            acceptButton.addEventListener("click", function () {
                tarteaucitron.userInterface.respondAll(true);
                console.log("Tutti i cookie sono stati accettati.");
            });
        } else {
            console.warn("Pulsante 'Accetta' non trovato.");
        }

        if (rejectButton) {
            rejectButton.addEventListener("click", function () {
                tarteaucitron.userInterface.respondAll(false);
                console.log("Tutti i cookie sono stati rifiutati.");
            });
        } else {
            console.warn("Pulsante 'Rifiuta' non trovato.");
        }
    }
});
