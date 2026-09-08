// validazione-engine.js
// Validazione degli input del calcolatore impasto: funzioni pure (input -> esito),
// nessuna dipendenza dal DOM. Restituisce chiavi i18n, non testo, così la stessa
// logica serve sia l'interfaccia italiana sia quella inglese.
//
// Due livelli di esito:
//  - errore : l'input produce una ricetta matematicamente impossibile
//             (NaN, pesi negativi, lievito nullo). Il calcolo va bloccato.
//  - avviso : l'input è calcolabile ma fuori dalla pratica normale.
//             Il calcolo procede, l'utente viene avvertito.

// Limiti di dominio per ogni campo numerico. `min`/`max` sono inclusivi e
// coincidono con gli attributi min/max del markup, così la validazione HTML
// nativa e quella JS non possono divergere.
export const LIMITI = {
    pesoPanetto: { min: 50, max: 2000, label: 'valid.field.ball_weight' },
    numPanetti: { min: 1, max: 100, label: 'valid.field.ball_count' },
    idratazione: { min: 40, max: 110, label: 'valid.field.hydration' },
    temperaturaAmbiente: { min: 1, max: 40, label: 'valid.field.temperature' },
    tempoLievitazione: { min: 1, max: 120, label: 'valid.field.total_time' },
    oreFrigo: { min: 0, max: 119, label: 'valid.field.fridge_time' },
    percentualeBiga: { min: 10, max: 100, label: 'valid.field.biga_perc' },
    percentualePoolish: { min: 10, max: 100, label: 'valid.field.poolish_perc' },
    percentualePastaMadre: { min: 5, max: 40, label: 'valid.field.sourdough_perc' },
    forzaFarina: { min: 90, max: 450, label: 'valid.field.flour_w' },
    tegliaLato: { min: 10, max: 200, label: 'valid.field.pan_side' },
    numeroTeglie: { min: 1, max: 50, label: 'valid.field.pan_count' },
};

// Idratazione del prefermento sul proprio peso di farina: la biga è al 44%,
// il poolish al 100%. Serve per verificare che l'acqua richiesta dai
// prefermenti non superi l'acqua totale disponibile nell'impasto.
export const IDRATAZIONE_PREFERMENTO = { biga: 0.44, poolish: 1.0 };

function err(chiave, params = {}) {
    return { livello: 'errore', chiave, params };
}

function avv(chiave, params = {}) {
    return { livello: 'avviso', chiave, params };
}

/**
 * Verifica un singolo valore numerico contro i limiti dichiarati in LIMITI.
 * Restituisce un errore se il valore è assente, non numerico o fuori scala.
 */
export function validaCampo(nome, valore) {
    const limite = LIMITI[nome];
    if (!limite) return null;

    if (valore === null || valore === undefined || valore === '' || !Number.isFinite(valore)) {
        return err('valid.missing', { campo: limite.label });
    }
    if (valore < limite.min) {
        return err('valid.too_low', { campo: limite.label, min: limite.min, max: limite.max });
    }
    if (valore > limite.max) {
        return err('valid.too_high', { campo: limite.label, min: limite.min, max: limite.max });
    }
    return null;
}

/**
 * Valida l'insieme completo di input per un metodo di impasto.
 *
 * @param {string} tipoImpasto - diretto | biga | poolish | lievito_madre | biga_poolish
 * @param {Object} input - valori già convertiti in Number (NaN ammesso: viene intercettato)
 * @returns {{ valido: boolean, errori: Array, avvisi: Array }}
 */
export function validaInput(tipoImpasto, input) {
    const errori = [];
    const avvisi = [];
    const push = (e) => { if (e) errori.push(e); };

    // --- Campi comuni a tutti i metodi ---
    push(validaCampo('pesoPanetto', input.pesoPanetto));
    push(validaCampo('numPanetti', input.numPanetti));
    push(validaCampo('idratazione', input.idratazioneTotale));

    if (Number.isFinite(input.numPanetti) && !Number.isInteger(input.numPanetti)) {
        errori.push(err('valid.ball_count_integer'));
    }

    // --- Vincoli specifici del metodo ---
    if (tipoImpasto === 'diretto') {
        push(validaCampo('temperaturaAmbiente', input.temperaturaAmbiente));
        push(validaCampo('tempoLievitazione', input.tempoLievitazioneTotale));
        push(validaCampo('oreFrigo', input.oreFrigo));

        const tot = input.tempoLievitazioneTotale;
        const frigo = input.oreFrigo;
        // Il frigo "vale" 1/10 di un'ora a temperatura ambiente: se le ore di
        // frigo eguagliano o superano il totale, il tempo utile va a zero o
        // sotto e la formula del lievito degenera.
        if (Number.isFinite(tot) && Number.isFinite(frigo) && frigo >= tot) {
            errori.push(err('valid.fridge_exceeds_total', { totale: tot, frigo }));
        } else if (Number.isFinite(tot) && Number.isFinite(frigo)) {
            const effettivo = tot - (9 * frigo / 10);
            if (effettivo < 1) {
                errori.push(err('valid.effective_time_too_short', { ore: effettivo.toFixed(1) }));
            }
        }
    }

    if (tipoImpasto === 'biga' || tipoImpasto === 'biga_poolish') {
        push(validaCampo('percentualeBiga', input.percentualeBiga));
    }
    if (tipoImpasto === 'poolish' || tipoImpasto === 'biga_poolish') {
        push(validaCampo('percentualePoolish', input.percentualePoolish));
    }
    if (tipoImpasto === 'lievito_madre') {
        push(validaCampo('percentualePastaMadre', input.percentualePastaMadre));
    }

    // --- Bilancio idrico dei prefermenti ---
    // L'acqua assorbita dai prefermenti non può superare l'acqua totale della
    // ricetta, altrimenti l'impasto principale risulterebbe con acqua negativa.
    const idr = input.idratazioneTotale;
    if (Number.isFinite(idr)) {
        const b = Number.isFinite(input.percentualeBiga) ? input.percentualeBiga : 0;
        const p = Number.isFinite(input.percentualePoolish) ? input.percentualePoolish : 0;
        const usaBiga = tipoImpasto === 'biga' || tipoImpasto === 'biga_poolish';
        const usaPoolish = tipoImpasto === 'poolish' || tipoImpasto === 'biga_poolish';

        const acquaPrefermenti =
            (usaBiga ? b * IDRATAZIONE_PREFERMENTO.biga : 0) +
            (usaPoolish ? p * IDRATAZIONE_PREFERMENTO.poolish : 0);

        if ((usaBiga || usaPoolish) && acquaPrefermenti > idr) {
            errori.push(err('valid.preferment_water_exceeds', {
                acqua: acquaPrefermenti.toFixed(1),
                idratazione: idr,
            }));
        }

        if (tipoImpasto === 'biga_poolish' && Number.isFinite(b) && Number.isFinite(p) && b + p > 100) {
            errori.push(err('valid.preferment_sum_exceeds', { somma: b + p }));
        }
    }

    // --- Avvisi non bloccanti ---
    if (Number.isFinite(idr)) {
        if (idr > 85) avvisi.push(avv('valid.warn_high_hydration', { idratazione: idr }));
        if (idr < 50) avvisi.push(avv('valid.warn_low_hydration', { idratazione: idr }));
    }
    if (Number.isFinite(input.temperaturaAmbiente) && input.temperaturaAmbiente > 30) {
        avvisi.push(avv('valid.warn_high_temp', { temperatura: input.temperaturaAmbiente }));
    }
    // Sotto i 15 °C la stima resta calcolabile ma nessun modello è stato
    // validato lì: la curva di risposta alla temperatura è tarata sul campo
    // fra i 18 e i 30 °C e più in basso è un'estrapolazione. Si avverte senza
    // bloccare, perché una cucina non riscaldata d'inverno è un caso reale.
    if (Number.isFinite(input.temperaturaAmbiente) && input.temperaturaAmbiente < 15) {
        avvisi.push(avv('valid.warn_low_temp', { temperatura: input.temperaturaAmbiente }));
    }
    if (tipoImpasto === 'diretto' && Number.isFinite(input.tempoLievitazioneTotale)
        && input.tempoLievitazioneTotale > 72) {
        avvisi.push(avv('valid.warn_long_fermentation', { ore: input.tempoLievitazioneTotale }));
    }

    return { valido: errori.length === 0, errori, avvisi };
}

/**
 * Rete di sicurezza a valle del calcolo: intercetta qualunque valore non finito
 * o negativo sfuggito alla validazione a monte, così l'interfaccia non può in
 * nessun caso mostrare "NaN", "Infinity" o grammature negative.
 *
 * @returns {{ pulito: boolean, campi: string[] }} campi = chiavi problematiche
 */
export function verificaRisultato(dati) {
    if (!dati || typeof dati !== 'object') return { pulito: false, campi: ['*'] };

    const campi = [];
    for (const [chiave, valore] of Object.entries(dati)) {
        // I flag booleani (es. lievitoCalcolabile) descrivono l'esito, non sono
        // grammature: vanno ignorati dal controllo numerico.
        if (typeof valore === 'boolean') continue;

        if (valore === null || valore === undefined) { campi.push(chiave); continue; }

        const n = typeof valore === 'number' ? valore : parseFloat(valore);
        if (!Number.isFinite(n) || n < 0) campi.push(chiave);
    }
    return { pulito: campi.length === 0, campi };
}
