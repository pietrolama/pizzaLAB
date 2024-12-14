document.addEventListener('DOMContentLoaded', function () {
    if (typeof tarteaucitron !== 'undefined') {
        // Configurazione tarteaucitron.js
        tarteaucitron.init({
            "privacyUrl": "/privacy", // URL della pagina di privacy policy
            "hashtag": "#tarteaucitron", 
            "cookieName": "tarteaucitron", 
            "orientation": "bottom", 
            "showAlertSmall": true, 
            "cookieslist": true, 
            "adblocker": false, 
            "AcceptAllCta": true, 
            "highPrivacy": false, 
            "handleBrowserDNTRequest": false, 
            "removeCredit": true, 
            "moreInfoLink": true, 
            "useExternalCss": false 
        });

        // Configurazione Google Analytics
        tarteaucitron.services.googleanalytics = {
            "key": "googleanalytics",
            "type": "analytic",
            "name": "Google Analytics",
            "uri": "https://policies.google.com/privacy",
            "needConsent": true,
            "cookies": ["_ga", "_gid"],
            "js": function () {
                (function (i, s, o, g, r, a, m) {
                    i['GoogleAnalyticsObject'] = r;
                    i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments);
                    }, i[r].l = 1 * new Date();
                    a = s.createElement(o),
                        m = s.getElementsByTagName(o)[0];
                    a.async = 1;
                    a.src = g;
                    m.parentNode.insertBefore(a, m);
                })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
                ga('create', 'G-1CV0W5QPKV', 'auto');
                ga('send', 'pageview');
            },
            "fallback": function () {
                console.log("Google Analytics non attivo");
            }
        };
    } else {
        console.error("tarteaucitron non è definito!");
    }
});
