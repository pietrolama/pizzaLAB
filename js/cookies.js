document.addEventListener('DOMContentLoaded', function () {
  console.log("Caricamento cookies.js avviato...");

  try {
    tarteaucitron.init({
      privacyUrl: '',
      orientation: "bottom",
      showAlertSmall: false,
      cookieslist: true,
      highPrivacy: false,
      removeCredit: true,
      handleBrowserDNTRequest: false,
      AcceptAllCta: true,
      moreInfoLink: false,
      useExternalCss: false,
      cookieDomain: ".pizzalab.pizza",
      debug: true
      // Nota: Niente lingua custom, niente langPath, niente CSS esterno
    });

    console.log("Tarteaucitron inizializzato correttamente.");
  } catch (error) {
    console.error("Errore durante l'inizializzazione di Tarteaucitron:", error);
  }
});
