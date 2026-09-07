// dom-target.js
// Piccola utilità condivisa dai motori di rendering.
//
// Le pagine passano ai render un selettore CSS ("#contenitore"), mentre i motori
// si aspettavano un elemento DOM. Con i moduli ES, che sono sempre in strict
// mode, assegnare `.innerHTML` su una stringa solleva un TypeError e la sezione
// resta vuota senza spiegazioni. Questo helper accetta entrambe le forme.

/**
 * @param {string|Element|null} target - selettore CSS o elemento DOM
 * @returns {Element|null} l'elemento, o null se non trovato
 */
export function risolviContenitore(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    if (target instanceof Element) return target;
    return null;
}
