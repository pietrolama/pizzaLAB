document.addEventListener('DOMContentLoaded', function () {
  console.log("Caricamento cookies.js avviato...");

  /**
   * Rimuove i duplicati per cookieconsent_status
   * su pizzalab.pizza e .pizzalab.pizza, con path / e "".
   */
  function removeDuplicateCookies() {
    console.log("Controllo cookie duplicati...");

    const cookieName = "cookieconsent_status";
    const domains = [
      "pizzalab.pizza",
      ".pizzalab.pizza"
    ];
    const paths = ["/", ""];

    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `${cookieName}=; 
                           path=${path}; 
                           domain=${domain}; 
                           expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      });
    });

    console.log("Cookie duplicati rimossi (se presenti).");
  }

  /**
   * Imposta il cookie con dominio .pizzalab.pizza
   */
  function setCookie(value) {
    const cookieString = `cookieconsent_status=${value};
                          path=/;
                          domain=.pizzalab.pizza;
                          expires=Fri, 31 Dec 2024 23:59:59 GMT;
                          Secure`;
    document.cookie = cookieString;
    console.log(`Cookie impostato: ${cookieString}`);
  }

  /**
   * Verifica lo stato dei cookie e carica GA se "allow".
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
   * Carica Google Analytics
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

    ga('create', 'G-1CV0W5QPKV', 'auto'); // Sostituisci con il tuo ID
    ga('send', 'pageview');
    console.log("Google Analytics caricato.");
  }

  /**
   * Inizializza la libreria CookieConsent
   * con dominio .pizzalab.pizza
   */
  if (typeof window.cookieconsent !== "undefined") {
    window.cookieconsent.initialise({
      cookie: {
        domain: '.pizzalab.pizza',
        path: '/'
      },
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
        console.log("Banner inizializzato con stato:", status);
        removeDuplicateCookies(); 
        checkCookieStatus(status);
      },
      onStatusChange: function (status) {
        console.log("Evento onStatusChange eseguito. Stato cambiato a:", status);
        removeDuplicateCookies();
        setCookie(status); // Imposta manualmente dismiss/allow con .pizzalab.pizza
        checkCookieStatus(status);
      }
    });
  } else {
    console.error("CookieConsent non caricato. Controlla il file o la CDN.");
  }

  /**
   * Listener manuale per il pulsante "Accetta" (classe .cc-dismiss).
   */
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('cc-dismiss')) {
      console.log("Clic sul pulsante 'Accetta' rilevato.");
      removeDuplicateCookies();
      setCookie('allow');
      checkCookieStatus('allow');
    }
  });

  console.log("Caricamento cookies.js completato.");
});
