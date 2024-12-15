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

        // Controlla e logga lo stato delle checkbox
        function logCheckboxStatus() {
            const acceptCheckbox = document.querySelector('#acceptCheckbox');
            const denyCheckbox = document.querySelector('#denyCheckbox');

            console.log("Stato delle Checkbox:");
            console.log("Accetta:", acceptCheckbox ? acceptCheckbox.checked : "❌ Non trovata");
            console.log("Rifiuta:", denyCheckbox ? denyCheckbox.checked : "❌ Non trovata");
        }

        setTimeout(() => {
            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');

            console.log("Pulsanti trovati?", acceptButton, denyButton);

            // Eventi sui pulsanti
            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(true);
                    console.log("Pulsante 'Accetta' cliccato.");
                    logCheckboxStatus();
                });
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(false);
                    console.log("Pulsante 'Rifiuta' cliccato.");
                    logCheckboxStatus();
                });
            }

            // Eventi sulle checkbox
            const acceptCheckbox = document.querySelector('#acceptCheckbox');
            const denyCheckbox = document.querySelector('#denyCheckbox');

            if (acceptCheckbox) {
                acceptCheckbox.addEventListener('change', () => {
                    console.log("Checkbox Accetta modificata:", acceptCheckbox.checked);
                });
            }

            if (denyCheckbox) {
                denyCheckbox.addEventListener('change', () => {
                    console.log("Checkbox Rifiuta modificata:", denyCheckbox.checked);
                });
            }

            logCheckboxStatus(); // Stato iniziale
        }, 1000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
