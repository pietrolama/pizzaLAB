document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    // Crea il banner dinamicamente
    function createCookieBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';

    banner.innerHTML = `
        <span class="cookie-text">Questo sito utilizza cookie per migliorare la tua esperienza. Continuando accetti l'uso dei cookie.</span>
        <div class="cookie-buttons">
            <button id="accept-cookies" class="cookie-btn">Accetta</button>
            <button id="reject-cookies" class="cookie-btn">Rifiuta</button>
            <button id="privacy-link" class="cookie-btn">Privacy</button>
        </div>
    `;

    document.body.appendChild(banner);

    // Aggiungi un listener per il pulsante Privacy
    document.getElementById('privacy-link').addEventListener('click', function () {
        window.location.href = '/privacy.html';
    });
}


    // Funzione per impostare un cookie
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value}; path=/; domain=.pizzalab.pizza; expires=${expires.toUTCString()}; Secure; SameSite=Lax`;
    }

    // Funzione per ottenere un cookie
    function getCookie(name) {
        const cookies = document.cookie.split('; ');
        for (let i = 0; i < cookies.length; i++) {
            const [key, value] = cookies[i].split('=');
            if (key === name) return value;
        }
        return null;
    }

    // Funzione per caricare Google Analytics
    function loadGoogleAnalytics() {
        console.log("Caricamento Google Analytics...");
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
        ga('create', 'G-1CV0W5QPKV', 'auto');
        ga('send', 'pageview');
        console.log("Google Analytics caricato.");
    }

    // Funzione principale per la gestione dei cookie
    function manageCookies() {
        const consent = getCookie('cookieconsent_status');

        if (consent === 'allow') {
            console.log("Cookie accettati. Caricamento servizi...");
            loadGoogleAnalytics();
        } else {
            console.log("Cookie non accettati. Mostra il banner.");
            createCookieBanner();
        }
    }

    // Gestione dei clic sui pulsanti
    document.addEventListener('click', function (event) {
        if (event.target.id === 'accept-cookies') {
            console.log("Clic su 'Accetta' rilevato.");
            setCookie('cookieconsent_status', 'allow', 365); // Imposta il consenso
            document.getElementById('cookie-banner').remove(); // Rimuovi il banner
            loadGoogleAnalytics(); // Carica i servizi
        }

        if (event.target.id === 'reject-cookies') {
            console.log("Clic su 'Rifiuta' rilevato.");
            setCookie('cookieconsent_status', 'dismiss', 365); // Registra il rifiuto
            document.getElementById('cookie-banner').remove(); // Rimuovi il banner
        }
    });

    // Esegui la gestione dei cookie all'avvio
    manageCookies();

    console.log("Caricamento cookies.js completato.");
});
