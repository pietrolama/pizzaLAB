document.addEventListener('DOMContentLoaded', function () {
    console.log("Caricamento cookies.js avviato...");

    function createCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #000;
            color: #fff;
            padding: 15px;
            font-size: 14px;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        banner.innerHTML = `
            <span>
                Questo sito utilizza cookie essenziali per login e salvataggio dati. Altri cookie per analisi richiedono il tuo consenso.
            </span>
            <div>
                <button id="accept-cookies">Accetta</button>
                <button id="reject-cookies">Rifiuta</button>
                <a href="/privacy.html">Privacy</a>
            </div>
        `;

        document.body.appendChild(banner);
    }

    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value}; path=/; domain=.pizzalab.pizza; expires=${expires.toUTCString()}; Secure; SameSite=Lax`;
    }

    function getCookie(name) {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [key, value] = cookie.split('=');
            if (key === name) return value;
        }
        return null;
    }

    function loadGoogleSignIn() {
        console.log("Caricamento Google Sign-In...");
        const script = document.createElement('script');
        script.src = "https://apis.google.com/js/platform.js";
        script.async = true;
        script.onload = () => console.log("Google Sign-In caricato.");
        document.head.appendChild(script);
    }

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
    }

    function manageCookies() {
        const consent = getCookie('cookieconsent_status');
        if (consent === 'allow') {
            console.log("Cookie accettati. Caricamento servizi...");
            loadGoogleSignIn();
            loadGoogleAnalytics();
        } else {
            console.log("Cookie non accettati. Mostra il banner.");
            createCookieBanner();
        }
    }

    document.addEventListener('click', function (event) {
        if (event.target.id === 'accept-cookies') {
            setCookie('cookieconsent_status', 'allow', 365);
            document.getElementById('cookie-banner').remove();
            loadGoogleSignIn();
            loadGoogleAnalytics();
        }

        if (event.target.id === 'reject-cookies') {
            setCookie('cookieconsent_status', 'dismiss', 365);
            document.getElementById('cookie-banner').remove();
        }
    });

    manageCookies();

    console.log("Caricamento cookies.js completato.");
});
