document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    /**
     * Rimuove tutti i cookie duplicati con lo stesso nome,
     * forzando la cancellazione per diverse combinazioni di dominio e path.
     */
    function removeDuplicateCookies() {
        console.log("Controllo cookie duplicati...");

        const cookieName = "cookieconsent_status";
        // Possibili domini
        const domains = [
            "pizzalab.pizza",
            "www.pizzalab.pizza",
            ".pizzalab.pizza"
        ];
        // Possibili path
        const paths = [
            "/",
            ""
        ];

        domains.forEach(domain => {
            paths.forEach(path => {
                document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
            });
        });

        console.log("Cookie duplicati rimossi (se presenti).");
    }

    /**
     * Imposta il cookie con i valori desiderati.
     */
    function setCookie(value) {
        // Dominio unificato e path impostato a "/"
        const cookieString = `cookieconsent_status=${value};` +
                             `path=/;` +
                             `domain=.pizzalab.pizza;` +
                             `expires=Fri, 31 Dec 2024 23:59:59 GMT;` +
                             `Secure`;
        document.cookie = cookieString;
        console.log(`Cookie impostato: ${cookieString}`);
    }

    /**
     * Verifica lo stato attuale del cookie e, se "allow",
     * carica Google Analytics (o altre librerie).
     */
    function checkCookieStatus(status) {
        if (status === "allow") {
            console.log("Cookie accettati. Caricamento Google Analytics...");
            loadGoogleAnalytics();
        } else {
            console.log("Cookie non accettati.");
        }
    }

    /**
     * Carica Google Analytics (o qualsiasi altro script)
     * solo se i cookie sono accettati.
     */
    function loadGoogleAnalytics() {
        console.log("Caricamento di Google Analytics...");
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments);
            }, i[r].l = 1 * new Date();
            a = s.createElement(o), m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = 'https://www.google-analytics.com/analytics.js';
            m.parentNode.insertBefore(a, m);
        })(window, document, 'script', 0, 'ga');
        
        // Sostituisci con il tuo ID di tracciamento
        ga('create', 'G-1CV0W5QPKV', 'auto');
        ga('send', 'pageview');

        console.log("Google Analytics caricato.");
    }

    /**
     * Inizializza il banner di CookieConsent (se caricato correttamente).
     */
    if (typeof window.cookieconsent !== "undefined") {
        window.cookieconsent.initialise({
            palette: {
                popup: {
                    background: "#000",
                    text: "#fff"
                },
                button: {
                    background: "#f1d600",
                    text: "#000"
                }
            },
            content: {
                message: "Questo sito utilizza cookie per garantire la migliore esperienza di navigazione.",
                dismiss: "Accetta",
                link: "Maggiori informazioni",
                href: "/privacy.html"
            },
            // Viene chiamato al primo caricamento del banner
            onInitialise: function (status) {
                console.log("Banner inizializzato con stato:", status);
                removeDuplicateCookies(); // Elimina eventuali duplicati
                // Non impostiamo subito il cookie: la libreria creerà "dismiss" o "allow" in base al pulsante
                checkCookieStatus(status); // Se "allow", carica GA
            },
            // Viene chiamato ad ogni cambiamento di stato (da dismiss a allow o viceversa)
            onStatusChange: function (status) {
                console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
                removeDuplicateCookies();   // Elimina i cookie duplicati prima di impostare
                setCookie(status);          // Imposta manualmente "dismiss" o "allow"
                checkCookieStatus(status);  // Se "allow", carica GA
            }
        });
    } else {
        console.error("CookieConsent non caricato. Controlla il file o la CDN.");
    }

    /**
     * Listener manuale per il clic sul pulsante "Accetta" del banner.
     * In molte versioni di CookieConsent, l'elemento ha classe .cc-dismiss.
     */
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('cc-dismiss')) {
            console.log("Clic sul pulsante 'Accetta' rilevato.");
            // Rimuovo i duplicati per sicurezza
            removeDuplicateCookies();
            // Imposto "allow" manualmente (in caso la libreria non lo facesse)
            setCookie('allow');
            // Verifico lo stato e carico GA se necessario
            checkCookieStatus('allow');
        }
    });

    console.log("Caricamento cookies.js completato.");
});
