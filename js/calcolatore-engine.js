// calcolatore-engine.js
// Motore logico del calcolatore impasto di PizzaLab, estratto dal vecchio sito
// e ripulito da ogni dipendenza dal DOM: solo funzioni pure (input -> output),
// pronte per essere collegate a qualunque nuova interfaccia. Nessun
// document.getElementById, nessun localStorage, nessuna manipolazione di UI.

// Metodi di impasto disponibili per ogni tipo di pizza.
export const metodiPerPizza = {
    napoletana: ['diretto'],
    romana: ['diretto'],
    pala: ['diretto', 'biga'],
    contemporanea: ['diretto', 'biga', 'poolish', 'lievito_madre', 'biga_poolish'],
    padellino: ['diretto'],
    teglia: ['diretto', 'biga', 'poolish', 'lievito_madre', 'biga_poolish'],
};

// Peso impasto (g) per una teglia in base alle dimensioni e allo spessore
// desiderato: superficie (cm²) ÷ 2 dà il peso per uno spessore medio;
// la rettifica di ±100g adegua per una base più sottile o più alta.
// Esempio verificato: teglia 40x60 -> sottile 1100g, media 1200g, alta 1300g.
export function calcolaPesoTeglia(base, altezza, spessore) {
    const areaSuPer2 = (base * altezza) / 2;
    const rettificaSpessore = { sottile: -100, media: 0, alta: 100 };
    return areaSuPer2 + (rettificaSpessore[spessore] ?? 0);
}

// Quantità di lievito fresco (g) necessaria, in funzione di massa d'impasto,
// idratazione, sale/grassi (in % sul peso farina), tempi e temperatura.
// usaTeglia (bool) applica la correzione termica valida per Teglia e Pala:
// entrambe sono un'unica massa d'impasto stesa e sottile, a differenza dei
// panetti tondi, quindi risentono maggiormente della temperatura ambiente.
export function calcolaLievito(numPanetti, pesoPanetto, idratazione, sale, grassi, tempoLievitazione, oreFrigo, temperaturaAmbiente, usaTeglia) {
    const tempCorretta = temperaturaAmbiente * (1 - 0.25 * usaTeglia);
    const fattoreCrescitaLievito = 0.005;

    const tempoLievitazioneCorretto = tempoLievitazione - (9 * oreFrigo / 10);
    const forzaLievitoSpecifica = 2250 * (1 + sale / 200) * (1 + grassi / 300)
        / ((4.2 * idratazione - 80 - 0.0305 * idratazione * idratazione) * Math.pow(tempCorretta, 2.5) * Math.pow(tempoLievitazioneCorretto, 1.2));
    const pesoImpasto = numPanetti * pesoPanetto;
    const quantitaFarinaImpasto = 100000 * pesoImpasto / (idratazione * (sale + grassi) + 1000 * (idratazione + 100));
    const lievitoNecessarioImpasto = (quantitaFarinaImpasto * forzaLievitoSpecifica - fattoreCrescitaLievito);

    if (isNaN(lievitoNecessarioImpasto) || lievitoNecessarioImpasto < 0) {
        return 0;
    }
    return lievitoNecessarioImpasto;
}

// Metodo Diretto: { pesoPanetto, idratazioneTotale, numPanetti, tempoLievitazioneTotale,
// oreFrigo, temperaturaAmbiente, tipoPizza } -> ricetta completa.
export function calcolaImpastoDiretto({
    pesoPanetto,
    idratazioneTotale,
    numPanetti,
    tempoLievitazioneTotale,
    tempoLievTotale,
    oreFrigo = 0,
    temperaturaAmbiente,
    tipoPizza
}) {
    // La correzione termica si applica a Teglia e Pala.
    const inTeglia = tipoPizza === 'teglia' || tipoPizza === 'pala';
    const tempoTotale = tempoLievitazioneTotale ?? tempoLievTotale ?? 8;

    let tempoLievitazioneEffettivo = tempoTotale;
    if (oreFrigo > 0) {
        tempoLievitazioneEffettivo = tempoTotale - (9 * oreFrigo / 10);
    }
    const massa = tempoLievitazioneEffettivo * 10 / 100;
    const apretto = tempoLievitazioneEffettivo - massa;

    const pesoFarina = (100 * pesoPanetto) / (100 + idratazioneTotale) * numPanetti;
    const pesoAcqua = idratazioneTotale * pesoFarina / 100;
    const pesoSale = 0.02 * pesoFarina;
    const pesoZucchero = 0.013 * pesoFarina;
    const pesoOlio = 0.032 * pesoFarina;

    // Percentuali panificatorie (sale e grassi sul peso della farina), usate dalla
    // formula di forza del lievito: restano costanti al variare della dimensione
    // dell'impasto, quindi si passano le percentuali (2% sale, 3.2% grassi) e non
    // i pesi assoluti.
    const salePercentuale = 2;
    const grassiPercentuale = 3.2;

    let lievito = calcolaLievito(
        numPanetti, pesoPanetto, idratazioneTotale,
        salePercentuale, grassiPercentuale,
        tempoTotale, oreFrigo, temperaturaAmbiente, inTeglia
    );
    if (isNaN(lievito)) lievito = 0;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        massa: massa.toFixed(0),
        apretto: apretto.toFixed(0),
        tempoLievitazioneEffettivo: tempoLievitazioneEffettivo.toFixed(0),
        pesoFarina: pesoFarina.toFixed(2),
        pesoAcqua: pesoAcqua.toFixed(2),
        pesoSale: pesoSale.toFixed(2),
        pesoLievito: lievito.toFixed(2),
        pesoZucchero: pesoZucchero.toFixed(2),
        pesoOlio: pesoOlio.toFixed(2),
    };
}

// Metodo Biga: { pesoPanetto, idratazioneTotale, percentualeBiga, numPanetti } -> ricetta.
export function calcolaImpastoBiga({ pesoPanetto, idratazioneTotale, percentualeBiga, numPanetti }) {
    const pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazioneTotale / 100);
    const pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    const pesoAcquaBiga = pesoFarinaBiga * 0.44;
    const pesoLievitoBiga = pesoFarinaBiga * 0.01;
    const pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaBiga;
    const pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - pesoAcquaBiga;

    const sale = 0.02 * pesoTotaleFarina;
    const zucchero = 0.015 * pesoTotaleFarina;
    const olio = 0.03 * pesoTotaleFarina;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarina: pesoFarinaPrincipale.toFixed(2),
        pesoFarinaPrincipale: pesoFarinaPrincipale.toFixed(2),
        pesoAcqua: pesoAcquaPrincipale.toFixed(2),
        pesoAcquaPrincipale: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaBiga: pesoAcquaBiga.toFixed(2),
        pesoFarinaBiga: pesoFarinaBiga.toFixed(2),
        pesoLievitoBiga: pesoLievitoBiga.toFixed(2),
        pesoZucchero: zucchero.toFixed(2),
        pesoOlio: olio.toFixed(2),
    };
}

// Metodo Poolish: { pesoPanetto, idratazioneTotale, percentualePoolish, numPanetti } -> ricetta.
export function calcolaImpastoPoolish({ pesoPanetto, idratazioneTotale, percentualePoolish, numPanetti }) {
    const pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazioneTotale / 100);
    const pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    const pesoAcquaPoolish = pesoFarinaPoolish;
    const pesoLievitoPoolish = pesoFarinaPoolish * 0.001;
    const pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaPoolish;
    const pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - pesoAcquaPoolish;

    const sale = 0.02 * pesoTotaleFarina;
    const zucchero = 0.015 * pesoTotaleFarina;
    const olio = 0.03 * pesoTotaleFarina;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarina: pesoFarinaPrincipale.toFixed(2),
        pesoFarinaPrincipale: pesoFarinaPrincipale.toFixed(2),
        pesoAcqua: pesoAcquaPrincipale.toFixed(2),
        pesoAcquaPrincipale: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaPoolish: pesoAcquaPoolish.toFixed(2),
        pesoFarinaPoolish: pesoFarinaPoolish.toFixed(2),
        pesoLievitoPoolish: pesoLievitoPoolish.toFixed(2),
        pesoZucchero: zucchero.toFixed(2),
        pesoOlio: olio.toFixed(2),
    };
}

// Metodo Lievito Madre: { pesoPanetto, idratazioneTotale, percentualePastaMadre, numPanetti } -> ricetta.
export function calcolaImpastoLievitoMadre({ pesoPanetto, idratazioneTotale, percentualePastaMadre, numPanetti }) {
    const pesoTotaleImpasto = pesoPanetto * numPanetti;
    const pesoPastaMadreFinale = (percentualePastaMadre / 100) * pesoTotaleImpasto;

    const farinaPastaMadre = pesoPastaMadreFinale * (2 / 3);
    const acquaPastaMadre = pesoPastaMadreFinale * (1 / 3);

    const farinaPrincipale = (pesoTotaleImpasto - pesoPastaMadreFinale) / (1 + idratazioneTotale / 100);
    const acquaPrincipale = farinaPrincipale * (idratazioneTotale / 100);

    const pesoZucchero = 0.015 * (farinaPrincipale + farinaPastaMadre);
    const pesoOlio = 0.03 * (farinaPrincipale + farinaPastaMadre);
    const pesoSale = 0.02 * (farinaPrincipale + farinaPastaMadre);

    const pastaMadreIniziale = pesoPastaMadreFinale / 6.25;
    const farinaRinfresco1 = pastaMadreIniziale;
    const acquaRinfresco1 = pastaMadreIniziale * 0.5;
    const farinaRinfresco2 = pastaMadreIniziale * 2.5;
    const acquaRinfresco2 = farinaRinfresco2 * 0.5;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarinaPrincipale: farinaPrincipale.toFixed(2),
        pesoAcquaPrincipale: acquaPrincipale.toFixed(2),
        pesoSale: pesoSale.toFixed(2),
        pesoZucchero: pesoZucchero.toFixed(2),
        pesoOlio: pesoOlio.toFixed(2),
        pesoLievitoMadre: pesoPastaMadreFinale.toFixed(2),
        pesoPastaMadreFinale: pesoPastaMadreFinale.toFixed(2),
        farinaPastaMadre: farinaPastaMadre.toFixed(2),
        acquaPastaMadre: acquaPastaMadre.toFixed(2),
        farinaRinfresco1: farinaRinfresco1.toFixed(2),
        acquaRinfresco1: acquaRinfresco1.toFixed(2),
        farinaRinfresco2: farinaRinfresco2.toFixed(2),
        acquaRinfresco2: acquaRinfresco2.toFixed(2),
    };
}

// Metodo Biga + Poolish: { pesoPanetto, idratazioneTotale, percentualeBiga, percentualePoolish, numPanetti } -> ricetta.
export function calcolaImpastoBigaPoolish({ pesoPanetto, idratazioneTotale, percentualeBiga, percentualePoolish, numPanetti }) {
    const pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazioneTotale / 100);
    const pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    const pesoAcquaBiga = pesoFarinaBiga * 0.44;
    const pesoLievitoBiga = pesoFarinaBiga * 0.01;
    const pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    const pesoAcquaPoolish = pesoFarinaPoolish;
    const pesoLievitoPoolish = pesoFarinaPoolish * 0.001;
    const pesoFarinaPrincipale = pesoTotaleFarina - (pesoFarinaBiga + pesoFarinaPoolish);
    const pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - (pesoAcquaBiga + pesoAcquaPoolish);

    const sale = 0.02 * pesoTotaleFarina;
    const zucchero = 0.015 * pesoTotaleFarina;
    const olio = 0.03 * pesoTotaleFarina;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarinaPrincipale: pesoFarinaPrincipale.toFixed(2),
        pesoAcquaPrincipale: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaPoolish: pesoAcquaPoolish.toFixed(2),
        pesoFarinaPoolish: pesoFarinaPoolish.toFixed(2),
        pesoLievitoPoolish: pesoLievitoPoolish.toFixed(2),
        pesoZucchero: zucchero.toFixed(2),
        pesoOlio: olio.toFixed(2),
        pesoAcquaBiga: pesoAcquaBiga.toFixed(2),
        pesoFarinaBiga: pesoFarinaBiga.toFixed(2),
        pesoLievitoBiga: pesoLievitoBiga.toFixed(2),
    };
}

// Converte i dati calcolati (chiavi diverse per ogni metodo) nei totali per
// macro-ingrediente (farina, acqua, sale, zucchero, olio, lievito) riferiti
// all'intero impasto, utile per calcoli nutrizionali a valle.
export function estraiTotaliMacro(tipoImpasto, dati) {
    const n = (v) => parseFloat(v) || 0;
    switch (tipoImpasto) {
        case 'diretto':
            return {
                farina: n(dati.pesoFarina), acqua: n(dati.pesoAcqua), sale: n(dati.pesoSale),
                zucchero: n(dati.pesoZucchero), olio: n(dati.pesoOlio), lievito: n(dati.pesoLievito),
            };
        case 'biga':
            return {
                farina: n(dati.pesoFarinaPrincipale) + n(dati.pesoFarinaBiga),
                acqua: n(dati.pesoAcquaPrincipale) + n(dati.pesoAcquaBiga),
                sale: n(dati.pesoSale), zucchero: n(dati.pesoZucchero), olio: n(dati.pesoOlio),
                lievito: n(dati.pesoLievitoBiga),
            };
        case 'poolish':
            return {
                farina: n(dati.pesoFarinaPrincipale) + n(dati.pesoFarinaPoolish),
                acqua: n(dati.pesoAcquaPrincipale) + n(dati.pesoAcquaPoolish),
                sale: n(dati.pesoSale), zucchero: n(dati.pesoZucchero), olio: n(dati.pesoOlio),
                lievito: n(dati.pesoLievitoPoolish),
            };
        case 'lievito_madre':
            // Il lievito madre è fermentazione selvaggia: la sua massa (farina+acqua)
            // è già conteggiata in farinaPastaMadre/acquaPastaMadre, non c'è un
            // peso di "lievito" aggiuntivo da sommare.
            return {
                farina: n(dati.pesoFarinaPrincipale) + n(dati.farinaPastaMadre),
                acqua: n(dati.pesoAcquaPrincipale) + n(dati.acquaPastaMadre),
                sale: n(dati.pesoSale), zucchero: n(dati.pesoZucchero), olio: n(dati.pesoOlio),
                lievito: 0,
            };
        case 'biga_poolish':
            return {
                farina: n(dati.pesoFarinaPrincipale) + n(dati.pesoFarinaBiga) + n(dati.pesoFarinaPoolish),
                acqua: n(dati.pesoAcquaPrincipale) + n(dati.pesoAcquaBiga) + n(dati.pesoAcquaPoolish),
                sale: n(dati.pesoSale), zucchero: n(dati.pesoZucchero), olio: n(dati.pesoOlio),
                lievito: n(dati.pesoLievitoBiga) + n(dati.pesoLievitoPoolish),
            };
        default:
            return null;
    }
}

// --- Pianificazione oraria (a che ora fare cosa, per infornare all'ora scelta) ---

export function createStep(currentTime, duration, action) {
    return {
        time: new Date(currentTime.getTime() - duration * 60 * 60 * 1000),
        action,
    };
}

export function calculatePlanDiretto(infornataTime, totalLievitazione, tempoFrigo) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    const tempoLievitazioneEffettivo = tempoFrigo > 0
        ? totalLievitazione - (9 * tempoFrigo / 10)
        : totalLievitazione;
    const apretto = tempoLievitazioneEffettivo * 0.9;
    const massa = tempoLievitazioneEffettivo - apretto;

    plan.push({ time: new Date(currentTime), action: 'Inforna adesso.' });

    plan.unshift(createStep(currentTime, apretto, "Dividi l'impasto in panetti e inizia l'appretto (lievitazione finale)."));
    currentTime = new Date(currentTime.getTime() - apretto * 60 * 60 * 1000);

    if (tempoFrigo > 0) {
        plan.unshift(createStep(currentTime, tempoFrigo, "Togli l'impasto dal frigorifero e lascia riposare a temperatura ambiente."));
        currentTime = new Date(currentTime.getTime() - tempoFrigo * 60 * 60 * 1000);
        plan.unshift(createStep(currentTime, 0, 'Metti l\'impasto in frigorifero.'));
    }

    plan.unshift(createStep(currentTime, massa, 'Inizio della lievitazione in massa.'));
    currentTime = new Date(currentTime.getTime() - massa * 60 * 60 * 1000);

    plan.unshift(createStep(currentTime, 0.5, "Prepara l'impasto."));

    return plan;
}

export function calculatePlanGeneric(infornataTime, durations, steps) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    plan.push({ time: new Date(currentTime), action: 'Inforna adesso.' });

    for (let i = steps.length - 1; i >= 0; i--) {
        currentTime = new Date(currentTime.getTime() - durations[i] * 60 * 60 * 1000);
        plan.unshift({ time: new Date(currentTime), action: steps[i] });
    }

    return plan;
}

export function calculatePlanBiga(infornataTime, percentualeBiga) {
    const durations = [1, 16, 0.5, percentualeBiga <= 30 ? 6 : percentualeBiga >= 70 ? 3 : 4.5];
    const steps = [
        'Preparazione biga',
        'Inizia la lievitazione della biga.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps);
}

export function calculatePlanPoolish(infornataTime, percentualePoolish) {
    const durations = [1, 12, 0.5, percentualePoolish <= 30 ? 6 : percentualePoolish >= 70 ? 3 : 4.5];
    const steps = [
        'Preparazione poolish',
        'Inizia la lievitazione del poolish.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps);
}

export function calculatePlanLievitoMadre(infornataTime, percentualeLievitoMadre) {
    const durations = [1, 8, 0.5, percentualeLievitoMadre <= 30 ? 7 : percentualeLievitoMadre >= 70 ? 4 : 5.5];
    const steps = [
        'Preparazione lievito madre',
        'Inizia la lievitazione del lievito madre.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps);
}

export function calculatePlanBigaPoolish(infornataTime, percentualeBiga, percentualePoolish) {
    const media = (percentualeBiga + percentualePoolish) / 2;
    const durations = [1, 10, 0.5, media <= 30 ? 6 : media >= 70 ? 3 : 4.5];
    const steps = [
        'Preparazione biga e poolish',
        'Inizia la lievitazione combinata di biga e poolish.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps);
}
