// focus-trap.js
// Gestione del fuoco per le finestre modali.
//
// Un contenitore con role="dialog" e aria-modal="true" dichiara ai lettori di
// schermo di essere modale, ma non cambia nulla per la tastiera: senza il
// codice qui sotto il fuoco resta sulla pagina sottostante e il Tab continua a
// percorrere elementi che l'utente non vede più.

const SELETTORE_FOCUSABILI = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

function elementiFocusabili(contenitore) {
    return Array.from(contenitore.querySelectorAll(SELETTORE_FOCUSABILI))
        // Un elemento nascosto ha offsetParent nullo: va escluso, altrimenti il
        // Tab sembrerebbe non fare nulla.
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Confina il fuoco dentro il contenitore finché non si chiama la funzione
 * restituita, che lo rimette dov'era.
 *
 * @param {Element} contenitore
 * @returns {() => void} funzione di rilascio
 */
export function intrappolaFuoco(contenitore) {
    if (!contenitore) return () => {};

    const precedente = document.activeElement;

    const primo = elementiFocusabili(contenitore)[0];
    // Se non c'è nulla di focusabile si porta il fuoco sul contenitore stesso,
    // così almeno i lettori di schermo iniziano a leggere da lì.
    if (primo) {
        primo.focus();
    } else {
        contenitore.setAttribute('tabindex', '-1');
        contenitore.focus();
    }

    const suTab = (e) => {
        if (e.key !== 'Tab') return;

        const elementi = elementiFocusabili(contenitore);
        if (elementi.length === 0) {
            e.preventDefault();
            return;
        }

        const primoEl = elementi[0];
        const ultimoEl = elementi[elementi.length - 1];

        // Ai due estremi il Tab esce dal contenitore: lo si riporta dentro,
        // chiudendo il ciclo in entrambe le direzioni.
        if (e.shiftKey && document.activeElement === primoEl) {
            e.preventDefault();
            ultimoEl.focus();
        } else if (!e.shiftKey && document.activeElement === ultimoEl) {
            e.preventDefault();
            primoEl.focus();
        } else if (!contenitore.contains(document.activeElement)) {
            // Il fuoco è finito fuori per altre vie (per esempio un clic):
            // si riporta all'inizio.
            e.preventDefault();
            primoEl.focus();
        }
    };

    document.addEventListener('keydown', suTab, true);

    return function rilascia() {
        document.removeEventListener('keydown', suTab, true);
        // Riporta il fuoco da dove era partito: senza, riparte dall'inizio
        // della pagina e chi usa la tastiera perde il segno.
        if (precedente && typeof precedente.focus === 'function' && document.contains(precedente)) {
            precedente.focus();
        }
    };
}
