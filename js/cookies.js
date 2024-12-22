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
            handleCookieStatus(status);
        },
        onStatusChange: function (status) {
            console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
            handleCookieStatus(status);
        }
    });

    // Funzione per gestire lo stato dei cookie
    function handleCookieStatus(status) {
        if (status === "allow") {
            console.log("Cookie accettati. Rimuovendo duplicati e caricando Google Analytics...");
            clearCookie("cookieconsent_status", "pizzalab.pizza");
            loadGoogleAnalytics();
        } else {
            console.log("Cookie non accettati.");
        }
    }

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

    // Funzione per rimuovere cookie duplicati
    function clearCookie(name, domain) {
        console.log(`Rimuovendo cookie duplicati: ${name}`);
        document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure`;
        document.cookie = `${name}=; path=/; domain=www.${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure`;
    }

    // Debug per pulsanti
    setTimeout(() => {
        const acceptButton = document.querySelector('.cc-btn.cc-dismiss');
        if (acceptButton) {
            console.log("Pulsante 'Accetta' trovato:", acceptButton);
            acceptButton.addEventListener('click', () => {
                console.log("Clic sul pulsante 'Accetta' rilevato.");
                document.cookie = "cookieconsent_status=allow; path=/; domain=.pizzalab.pizza; expires=Fri, 31 Dec 2024 23:59:59 GMT; Secure";
                handleCookieStatus("allow");
            });
        } else {
            console.warn("Pulsante 'Accetta' non trovato.");
        }
    }, 500);
});
