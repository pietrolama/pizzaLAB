document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Funzione per cancellare i cookie duplicati
    function clearDuplicateCookies() {
        const domainVariants = ["pizzalab.pizza", "www.pizzalab.pizza"];
        domainVariants.forEach(domain => {
            document.cookie = "cookieconsent_status=; path=/; domain=" + domain + "; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        });
        console.log("Cookie duplicati rimossi.");
    }

    // Cancella i cookie duplicati all'avvio
    clearDuplicateCookies();

    // Inizializza il banner dei cookie
    window.cookieconsent.initialise({
        palette: {
            popup: { background: "#000", text: "#fff" },
            button: { background: "#f1d600", text: "#000" }
        },
        content: {
            message: "Questo sito utilizza cookie per garantire la migliore esperienza di navigazione.",
            dismiss: "Accetta",
            link: "Maggiori informazioni",
            href: "/privacy.html"
        },
        onInitialise: function (status) {
            console.log("Banner inizializzato. Stato:", status);
            if (status === "allow") {
                console.log("Cookie accettati dall'utente.");
            }
        },
        onStatusChange: function (status) {
            console.log("Stato aggiornato:", status);
            document.cookie = "cookieconsent_status=" + status + "; path=/; domain=pizzalab.pizza; expires=Fri, 31 Dec 2024 23:59:59 GMT; Secure";
            console.log("Cookie impostato:", document.cookie);
        }
    });
});
