// diario-storage.js
// Formato, migrazione e fusione del diario di fermentazione: funzioni pure,
// senza DOM, senza localStorage, senza Firebase. Stanno qui e non dentro
// diario-page.js perché il diario è l'unica cosa che l'utente accumula nel
// tempo, e la logica che decide quale copia sopravvive merita di essere
// verificabile da sola (vedi test/diario.test.mjs).

// Versione del formato salvato. Finora il diario era un array nudo, senza
// alcun indicatore: il giorno che la struttura cambia non ci sarebbe modo di
// distinguere i dati vecchi dai nuovi, né di migrarli.
export const VERSIONE_FORMATO = 1;

/** Chiave con cui si riconosce la stessa voce fra dispositivi diversi. */
export function chiaveVoce(voce) {
    return voce.id || `${voce.nome}_${voce.data}`;
}

/** Istante dell'ultima modifica, con i vari nomi che il campo ha assunto. */
function quandoModificata(voce) {
    return Date.parse(voce.aggiornato || voce.updatedAt || voce.data || '') || 0;
}

/**
 * Unisce due elenchi tenendo, per ogni voce presente in entrambi, la più
 * recente.
 *
 * Prima vinceva sempre la copia locale. Bastava aprire il diario su un secondo
 * dispositivo con una copia vecchia perché quella sovrascrivesse la modifica
 * fatta altrove: non "vince chi ha modificato per ultimo" ma "vince chi ha
 * aperto per ultimo", che è il contrario di quello che l'utente si aspetta.
 */
export function unisciDiari(locali = [], remote = []) {
    const perChiave = new Map();

    for (const voce of [...remote, ...locali]) {
        if (!voce || typeof voce !== 'object') continue;
        const chiave = chiaveVoce(voce);
        const esistente = perChiave.get(chiave);
        if (!esistente || quandoModificata(voce) >= quandoModificata(esistente)) {
            perChiave.set(chiave, voce);
        }
    }
    return Array.from(perChiave.values());
}

/**
 * Estrae le voci da quanto letto dalla memoria, accettando sia il formato
 * versionato sia l'array nudo di prima.
 */
export function deserializza(grezzo) {
    if (!grezzo) return [];
    if (Array.isArray(grezzo)) return grezzo;          // formato originale
    if (Array.isArray(grezzo.voci)) return grezzo.voci; // formato versionato
    return [];
}

/** Costruisce l'involucro versionato da scrivere in memoria. */
export function serializza(voci) {
    return {
        versione: VERSIONE_FORMATO,
        aggiornato: new Date().toISOString(),
        voci,
    };
}

// Campi ammessi in una scheda del diario, con il tipo atteso.
const CAMPI_FERMENTAZIONE = {
    nome: 'stringa', data: 'stringa', note: 'stringa',
    aggiornato: 'stringa', updatedAt: 'stringa', id: 'stringa',
    tipo_pizza: 'stringa', tipo_impasto: 'stringa',
    idratazione: 'numero', lievito: 'numero', farina_w: 'numero',
    tempo: 'numero', tempo_lievitazione: 'numero', tempo_frigo: 'numero',
    num_panetti: 'numero', peso_panetto: 'numero',
    percentuale_biga: 'numero', percentuale_poolish: 'numero',
    percentuale_lievito_madre: 'numero',
};

const CAMPI_BLEND = {
    possibile: 'booleano',
    pesoForte: 'numero', percentualeForte: 'numero',
    pesoDebole: 'numero', percentualeDebole: 'numero',
};

function copiaCampiAmmessi(origine, schema) {
    const out = {};
    for (const [campo, tipo] of Object.entries(schema)) {
        const v = origine[campo];
        if (v === undefined || v === null) continue;
        if (tipo === 'numero') {
            const n = Number(v);
            if (Number.isFinite(n)) out[campo] = n;
        } else if (tipo === 'booleano') {
            out[campo] = Boolean(v);
        } else {
            out[campo] = String(v).slice(0, 2000);
        }
    }
    return out;
}

/**
 * Riduce una voce ai soli campi previsti, con i tipi previsti.
 *
 * Serve per i backup importati, che sono file scelti dall'utente e non
 * necessariamente prodotti da questo sito: così una voce malformata non entra
 * nel diario e nessuna chiave inattesa raggiunge il rendering.
 *
 * @returns {Object|null} null se la voce non è utilizzabile
 */
export function normalizzaFermentazione(voce) {
    if (!voce || typeof voce !== 'object' || Array.isArray(voce)) return null;

    const pulita = copiaCampiAmmessi(voce, CAMPI_FERMENTAZIONE);
    if (!pulita.nome) return null;

    if (voce.blend && typeof voce.blend === 'object' && !Array.isArray(voce.blend)) {
        pulita.blend = copiaCampiAmmessi(voce.blend, CAMPI_BLEND);
    }
    return pulita;
}
