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

        console.log("Tarteaucitron inizializzato correttamente.");

        // Funzione per verificare lo stato delle checkbox
        function logCheckboxStatus() {
            const acceptCheckbox = document.querySelector('#acceptCheckbox');
            const denyCheckbox = document.querySelector('#denyCheckbox');

            console.log("Stato delle Checkbox:");
            if (acceptCheckbox) {
                console.log("✔ Checkbox Accetta - Stato:", acceptCheckbox.checked);
            } else {
                console.warn("❌ Checkbox Accetta non trovata.");
            }

            if (denyCheckbox) {
                console.log("✔ Checkbox Rifiuta - Stato:", denyCheckbox.checked);
            } else {
                console.warn("❌ Checkbox Rifiuta non trovata.");
            }
        }

        // Debug pulsanti e checkbox
        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');

            console.log("Pulsanti trovati?", acceptButton, denyButton);

            // Aggiungi eventi ai pulsanti
            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(true);
                    console.log("Pulsante 'Accetta' cliccato: tutti i cookie accettati.");
                    logCheckboxStatus();
                });
            } else {
                console.warn("Pulsante 'Accetta' non trovato.");
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(false);
                    console.log("Pulsante 'Rifiuta' cliccato: tutti i cookie rifiutati.");
                    logCheckboxStatus();
                });
            } else {
                console.warn("Pulsante 'Rifiuta' non trovato.");
            }

            // Aggiungi eventi alle checkbox
            const acceptCheckbox = document.querySelector('#acceptCheckbox');
            const denyCheckbox = document.querySelector('#denyCheckbox');

            if (acceptCheckbox) {
                acceptCheckbox.addEventListener('change', () => {
                    console.log("Checkbox Accetta modificata. Stato:", acceptCheckbox.checked);
                });
            }

            if (denyCheckbox) {
                denyCheckbox.addEventListener('change', () => {
                    console.log("Checkbox Rifiuta modificata. Stato:", denyCheckbox.checked);
                });
            }

            console.log("Eventi assegnati ai pulsanti e checkbox.");
            logCheckboxStatus(); // Log iniziale
        }, 1000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
