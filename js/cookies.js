document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    try {
        // Inizializzazione di Tarteaucitron
        tarteaucitron.init({
            "privacyUrl": "/privacy.html",
            "orientation": "bottom",
            "showAlertSmall": true,
            "cookieslist": true,
            "debug": true
        });
        console.log("Tarteaucitron inizializzato correttamente.");

        // Funzione per loggare lo stato delle checkbox
        function logCheckboxStatus() {
            const acceptCheckbox = document.querySelector('#acceptCheckbox');
            const denyCheckbox = document.querySelector('#denyCheckbox');

            console.log("=== Stato delle Checkbox ===");
            console.log("Accetta:", acceptCheckbox ? acceptCheckbox.checked : "❌ Non trovata");
            console.log("Rifiuta:", denyCheckbox ? denyCheckbox.checked : "❌ Non trovata");
        }

        // Verifica DOM e assegna eventi
        setTimeout(() => {
            console.log("Verifica DOM dopo 1 secondo...");

            const acceptButton = document.querySelector('#tarteaucitronAllAllowed');
            const denyButton = document.querySelector('#tarteaucitronAllDenied');
            const acceptCheckbox = document.querySelector('#acceptCheckbox');
            const denyCheckbox = document.querySelector('#denyCheckbox');

            console.log("Pulsanti trovati:", acceptButton, denyButton);
            console.log("Checkbox trovate:", acceptCheckbox, denyCheckbox);

            // Eventi per i pulsanti
            if (acceptButton) {
                acceptButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(true);
                    console.log("✅ Pulsante 'Accetta' cliccato.");
                    logCheckboxStatus();
                });
            } else {
                console.warn("❌ Pulsante 'Accetta' non trovato.");
            }

            if (denyButton) {
                denyButton.addEventListener('click', () => {
                    tarteaucitron.userInterface.respondAll(false);
                    console.log("❌ Pulsante 'Rifiuta' cliccato.");
                    logCheckboxStatus();
                });
            } else {
                console.warn("❌ Pulsante 'Rifiuta' non trovato.");
            }

            // Eventi per le checkbox
            if (acceptCheckbox) {
                acceptCheckbox.addEventListener('change', () => {
                    console.log("Checkbox 'Accetta' cambiata:", acceptCheckbox.checked);
                });
            } else {
                console.warn("❌ Checkbox 'Accetta' non trovata.");
            }

            if (denyCheckbox) {
                denyCheckbox.addEventListener('change', () => {
                    console.log("Checkbox 'Rifiuta' cambiata:", denyCheckbox.checked);
                });
            } else {
                console.warn("❌ Checkbox 'Rifiuta' non trovata.");
            }

            logCheckboxStatus(); // Log iniziale
        }, 1000);

    } catch (error) {
        console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
    }
});
