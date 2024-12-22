document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Configura il banner dei cookie
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
            console.log("Evento onInitialise eseguito. Stato iniziale:", status);
            if (status === "allow") {
                console.log("Cookie già accettati.");
                loadGoogleAnalytics();
            }
        },
        onStatusChange: function (status) {
            console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
            if (status === "allow") {
                console.log("Cookie accettati. Aggiornamento cookie e caricamento GA...");
                setCookie('cookieconsent_status', 'allow', 365);
                loadGoogleAnalytics();
            } else {
                console.log("Cookie non accettati.");
            }
        }
    });

    // Funzione per caricare Google Analytics
    function loadGoogleAnalytics() {
        console.log("Caricamento di Google Analytics...");
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments);
            }, i[r].l = 1 * new Date();
            a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = 'https://www.google-analytics.com/analytics.js';
            m.parentNode.insertBefore(a, m);
        })(window, document, 'script', 0, 'ga');
        ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID di tracciamento
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }

    // Funzione per impostare i cookie manualmente
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${name}=${value}; path=/; domain=pizzalab.pizza; ${expires}; Secure`;
        console.log(`Cookie impostato manualmente: ${name}=${value}`);
    }

    // Debug per pulsanti
    setTimeout(() => {
        const acceptButton = document.querySelector('.cc-btn.cc-dismiss');
        if (acceptButton) {
            console.log("Pulsante 'Accetta' trovato:", acceptButton);
            acceptButton.addEventListener('click', () => {
                console.log("Clic sul pulsante 'Accetta' rilevato.");
            });
        } else {
            console.warn("Pulsante 'Accetta' non trovato.");
        }
    }, 500);
});
