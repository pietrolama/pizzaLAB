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

// Composizione della ricetta per tipo di pizza, in percentuale sul peso della
// farina (percentuali panificatorie). La napoletana segue il disciplinare AVPN:
// solo farina, acqua, sale e lievito, senza zucchero né olio.
export const COMPOSIZIONE_PER_PIZZA = {
    napoletana: { sale: 2.5, zucchero: 0, olio: 0 },
    romana: { sale: 2, zucchero: 1.3, olio: 3.2 },
    contemporanea: { sale: 2, zucchero: 1.3, olio: 3.2 },
    pala: { sale: 2, zucchero: 1.3, olio: 3.2 },
    padellino: { sale: 2, zucchero: 1.3, olio: 3.2 },
    teglia: { sale: 2, zucchero: 1.3, olio: 3.2 },
};

const COMPOSIZIONE_DEFAULT = { sale: 2, zucchero: 1.3, olio: 3.2 };

// Idratazione propria dei prefermenti, come frazione del loro peso di farina.
// La biga è un impasto sodo (44%), il poolish è liquido in parti uguali (100%).
// Sono esportate perché la validazione le usa per verificare che l'acqua dei
// prefermenti non superi l'acqua totale della ricetta.
export const IDRATAZIONE_BIGA = 0.44;
export const IDRATAZIONE_POOLISH = 1.0;

export function composizionePizza(tipoPizza) {
    return COMPOSIZIONE_PER_PIZZA[tipoPizza] ?? COMPOSIZIONE_DEFAULT;
}

// Peso impasto (g) per una teglia in base alle dimensioni e allo spessore
// desiderato: superficie (cm²) ÷ 2 dà il peso per uno spessore medio;
// la rettifica di ±100g adegua per una base più sottile o più alta.
// Esempio verificato: teglia 40x60 -> sottile 1100g, media 1200g, alta 1300g.
// La rettifica è additiva, quindi su teglie molto piccole potrebbe portare il
// peso a zero o sotto: il risultato viene limitato a un minimo praticabile.
export function calcolaPesoTeglia(base, altezza, spessore) {
    const b = Number(base);
    const h = Number(altezza);
    if (!Number.isFinite(b) || !Number.isFinite(h) || b <= 0 || h <= 0) return 0;

    const areaSuPer2 = (b * h) / 2;
    const rettificaSpessore = { sottile: -100, media: 0, alta: 100 };
    const peso = areaSuPer2 + (rettificaSpessore[spessore] ?? 0);

    // Sotto i 50 g non si stende una base: si torna al peso senza rettifica.
    return peso < 50 ? Math.max(areaSuPer2, 0) : peso;
}

// Quantità di lievito fresco (g) necessaria, in funzione di massa d'impasto,
// idratazione, sale/grassi (in % sul peso farina), tempi e temperatura.
// usaTeglia (bool) applica la correzione termica valida per Teglia e Pala:
// entrambe sono un'unica massa d'impasto stesa e sottile, a differenza dei
// panetti tondi, quindi risentono maggiormente della temperatura ambiente.
// L'intervallo di idratazione entro cui il polinomio al denominatore
// (4.2·i − 80 − 0.0305·i²) resta positivo: fuori da qui la formula cambia segno
// e non ha più significato fisico. Le radici sono ~22.83% e ~114.87%.
export const IDRATAZIONE_VALIDA_LIEVITO = { min: 23, max: 114 };

export function calcolaLievito(numPanetti, pesoPanetto, idratazione, sale, grassi, tempoLievitazione, oreFrigo, temperaturaAmbiente, usaTeglia) {
    // La correzione termica vale solo per teglia e pala: `usaTeglia` è un
    // booleano, va normalizzato a 0/1 perché un undefined produrrebbe NaN.
    const correzioneTeglia = usaTeglia ? 1 : 0;
    const tempCorretta = Number(temperaturaAmbiente) * (1 - 0.25 * correzioneTeglia);
    const fattoreCrescitaLievito = 0.005;

    const tempoLievitazioneCorretto = tempoLievitazione - (9 * oreFrigo / 10);

    // Casi degeneri: la formula richiede temperatura e tempo utile strettamente
    // positivi e un'idratazione entro l'intervallo di validità del polinomio.
    // Restituire null (anziché 0) distingue "non calcolabile" da "zero lievito".
    if (!Number.isFinite(tempCorretta) || tempCorretta <= 0) return null;
    if (!Number.isFinite(tempoLievitazioneCorretto) || tempoLievitazioneCorretto <= 0) return null;
    if (!Number.isFinite(idratazione)
        || idratazione < IDRATAZIONE_VALIDA_LIEVITO.min
        || idratazione > IDRATAZIONE_VALIDA_LIEVITO.max) return null;
    if (!Number.isFinite(numPanetti) || !Number.isFinite(pesoPanetto)) return null;

    const forzaLievitoSpecifica = 2250 * (1 + sale / 200) * (1 + grassi / 300)
        / ((4.2 * idratazione - 80 - 0.0305 * idratazione * idratazione) * Math.pow(tempCorretta, 2.5) * Math.pow(tempoLievitazioneCorretto, 1.2));
    const pesoImpasto = numPanetti * pesoPanetto;
    const quantitaFarinaImpasto = 100000 * pesoImpasto / (idratazione * (sale + grassi) + 1000 * (idratazione + 100));
    const lievitoNecessarioImpasto = (quantitaFarinaImpasto * forzaLievitoSpecifica - fattoreCrescitaLievito);

    if (!Number.isFinite(lievitoNecessarioImpasto)) return null;
    return Math.max(lievitoNecessarioImpasto, 0);
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

    // Percentuali panificatorie (sul peso della farina) per il tipo di pizza
    // scelto: la napoletana non prevede zucchero né olio.
    const { sale: salePercentuale, zucchero: zuccheroPercentuale, olio: olioPercentuale } =
        composizionePizza(tipoPizza);
    const grassiPercentuale = olioPercentuale;

    // Bilancio di massa: il peso richiesto per il panetto è quello dell'impasto
    // finito, quindi la farina va ricavata dividendo per la somma di TUTTE le
    // percentuali (acqua, sale, zucchero, olio), non della sola acqua. Senza
    // questo, sale/zucchero/olio si sommavano al totale e il panetto reale
    // pesava circa il 4% in più di quello richiesto.
    const sommaPercentuali = 100 + idratazioneTotale + salePercentuale
        + zuccheroPercentuale + olioPercentuale;
    const pesoFarina = (100 * pesoPanetto * numPanetti) / sommaPercentuali;
    const pesoAcqua = idratazioneTotale * pesoFarina / 100;
    const pesoSale = salePercentuale * pesoFarina / 100;
    const pesoZucchero = zuccheroPercentuale * pesoFarina / 100;
    const pesoOlio = olioPercentuale * pesoFarina / 100;

    // `null` significa "non calcolabile con questi input" (tempo utile o
    // temperatura non positivi, idratazione fuori scala): va propagato perché
    // l'interfaccia possa avvertire invece di mostrare uno zero ingannevole.
    const lievito = calcolaLievito(
        numPanetti, pesoPanetto, idratazioneTotale,
        salePercentuale, grassiPercentuale,
        tempoTotale, oreFrigo, temperaturaAmbiente, inTeglia
    );

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        massa: massa.toFixed(0),
        apretto: apretto.toFixed(0),
        tempoLievitazioneEffettivo: tempoLievitazioneEffettivo.toFixed(0),
        pesoFarina: pesoFarina.toFixed(2),
        pesoAcqua: pesoAcqua.toFixed(2),
        pesoSale: pesoSale.toFixed(2),
        pesoLievito: lievito === null ? null : lievito.toFixed(2),
        pesoZucchero: pesoZucchero.toFixed(2),
        pesoOlio: pesoOlio.toFixed(2),
        lievitoCalcolabile: lievito !== null,
    };
}

// Farina totale a partire dal peso dell'impasto finito, tenendo conto di tutte
// le percentuali panificatorie e non della sola acqua (vedi nota in
// calcolaImpastoDiretto sul bilancio di massa).
function farinaTotaleDaImpasto(pesoPanetto, numPanetti, idratazioneTotale, comp) {
    const sommaPercentuali = 100 + idratazioneTotale + comp.sale + comp.zucchero + comp.olio;
    return (100 * pesoPanetto * numPanetti) / sommaPercentuali;
}

// Metodo Biga: { pesoPanetto, idratazioneTotale, percentualeBiga, numPanetti } -> ricetta.
export function calcolaImpastoBiga({ pesoPanetto, idratazioneTotale, percentualeBiga, numPanetti, tipoPizza }) {
    const comp = composizionePizza(tipoPizza);
    const pesoTotaleFarina = farinaTotaleDaImpasto(pesoPanetto, numPanetti, idratazioneTotale, comp);
    const pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    const pesoAcquaBiga = pesoFarinaBiga * IDRATAZIONE_BIGA;
    const pesoLievitoBiga = pesoFarinaBiga * 0.01;
    const pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaBiga;
    const pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - pesoAcquaBiga;

    const sale = comp.sale * pesoTotaleFarina / 100;
    const zucchero = comp.zucchero * pesoTotaleFarina / 100;
    const olio = comp.olio * pesoTotaleFarina / 100;

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
export function calcolaImpastoPoolish({ pesoPanetto, idratazioneTotale, percentualePoolish, numPanetti, tipoPizza }) {
    const comp = composizionePizza(tipoPizza);
    const pesoTotaleFarina = farinaTotaleDaImpasto(pesoPanetto, numPanetti, idratazioneTotale, comp);
    const pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    const pesoAcquaPoolish = pesoFarinaPoolish * IDRATAZIONE_POOLISH;
    const pesoLievitoPoolish = pesoFarinaPoolish * 0.001;
    const pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaPoolish;
    const pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - pesoAcquaPoolish;

    const sale = comp.sale * pesoTotaleFarina / 100;
    const zucchero = comp.zucchero * pesoTotaleFarina / 100;
    const olio = comp.olio * pesoTotaleFarina / 100;

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
export function calcolaImpastoLievitoMadre({ pesoPanetto, idratazioneTotale, percentualePastaMadre, numPanetti, tipoPizza }) {
    const comp = composizionePizza(tipoPizza);
    const pesoTotaleImpasto = pesoPanetto * numPanetti;
    const pesoPastaMadreFinale = (percentualePastaMadre / 100) * pesoTotaleImpasto;

    const farinaPastaMadre = pesoPastaMadreFinale * (2 / 3);
    const acquaPastaMadre = pesoPastaMadreFinale * (1 / 3);

    // Come per gli altri metodi, la farina si ricava dal peso finito tenendo
    // conto anche di sale, zucchero e olio. Qui però sale/zucchero/olio si
    // calcolano sulla farina COMPLESSIVA (principale + quella già contenuta
    // nella pasta madre), quindi la quota che spetta alla pasta madre va
    // sottratta dalla massa ancora da distribuire.
    const additiviPercentuali = comp.sale + comp.zucchero + comp.olio;
    const sommaPercentuali = 100 + idratazioneTotale + additiviPercentuali;
    const farinaPrincipale =
        (100 * (pesoTotaleImpasto - pesoPastaMadreFinale) - additiviPercentuali * farinaPastaMadre)
        / sommaPercentuali;
    const acquaPrincipale = farinaPrincipale * (idratazioneTotale / 100);

    const farinaComplessiva = farinaPrincipale + farinaPastaMadre;
    const pesoZucchero = comp.zucchero * farinaComplessiva / 100;
    const pesoOlio = comp.olio * farinaComplessiva / 100;
    const pesoSale = comp.sale * farinaComplessiva / 100;

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
export function calcolaImpastoBigaPoolish({ pesoPanetto, idratazioneTotale, percentualeBiga, percentualePoolish, numPanetti, tipoPizza }) {
    const comp = composizionePizza(tipoPizza);
    const pesoTotaleFarina = farinaTotaleDaImpasto(pesoPanetto, numPanetti, idratazioneTotale, comp);
    const pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    const pesoAcquaBiga = pesoFarinaBiga * IDRATAZIONE_BIGA;
    const pesoLievitoBiga = pesoFarinaBiga * 0.01;
    const pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    const pesoAcquaPoolish = pesoFarinaPoolish * IDRATAZIONE_POOLISH;
    const pesoLievitoPoolish = pesoFarinaPoolish * 0.001;
    const pesoFarinaPrincipale = pesoTotaleFarina - (pesoFarinaBiga + pesoFarinaPoolish);
    const pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - (pesoAcquaBiga + pesoAcquaPoolish);

    const sale = comp.sale * pesoTotaleFarina / 100;
    const zucchero = comp.zucchero * pesoTotaleFarina / 100;
    const olio = comp.olio * pesoTotaleFarina / 100;

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

export function calculatePlanDiretto(infornataTime, totalLievitazione, tempoFrigo, locale = 'it') {
    const plan = [];
    let currentTime = new Date(infornataTime);
    const isEn = locale === 'en';

    const tempoLievitazioneEffettivo = tempoFrigo > 0
        ? totalLievitazione - (9 * tempoFrigo / 10)
        : totalLievitazione;
    const apretto = tempoLievitazioneEffettivo * 0.9;
    const massa = tempoLievitazioneEffettivo - apretto;

    plan.push({ time: new Date(currentTime), action: isEn ? 'Bake now.' : 'Inforna adesso.' });

    plan.unshift(createStep(currentTime, apretto, isEn ? "Divide dough into balls and start final proofing (appretto)." : "Dividi l'impasto in panetti e inizia l'appretto (lievitazione finale)."));
    currentTime = new Date(currentTime.getTime() - apretto * 60 * 60 * 1000);

    if (tempoFrigo > 0) {
        plan.unshift(createStep(currentTime, tempoFrigo, isEn ? "Remove dough from refrigerator and let rest at room temperature." : "Togli l'impasto dal frigorifero e lascia riposare a temperatura ambiente."));
        currentTime = new Date(currentTime.getTime() - tempoFrigo * 60 * 60 * 1000);
        plan.unshift(createStep(currentTime, 0, isEn ? "Put dough into the refrigerator." : "Metti l'impasto in frigorifero."));
    }

    plan.unshift(createStep(currentTime, massa, isEn ? 'Start bulk fermentation (puntata).' : 'Inizio della lievitazione in massa.'));
    currentTime = new Date(currentTime.getTime() - massa * 60 * 60 * 1000);

    plan.unshift(createStep(currentTime, 0.5, isEn ? 'Mix and knead the dough.' : "Prepara l'impasto."));

    return plan;
}

export function calculatePlanGeneric(infornataTime, durations, steps, locale = 'it') {
    const plan = [];
    let currentTime = new Date(infornataTime);
    const isEn = locale === 'en';

    plan.push({ time: new Date(currentTime), action: isEn ? 'Bake now.' : 'Inforna adesso.' });

    for (let i = steps.length - 1; i >= 0; i--) {
        currentTime = new Date(currentTime.getTime() - durations[i] * 60 * 60 * 1000);
        plan.unshift({ time: new Date(currentTime), action: steps[i] });
    }

    return plan;
}

export function calculatePlanBiga(infornataTime, percentualeBiga, locale = 'it') {
    const durations = [1, 16, 0.5, percentualeBiga <= 30 ? 6 : percentualeBiga >= 70 ? 3 : 4.5];
    const isEn = locale === 'en';
    const steps = isEn ? [
        'Prepare biga',
        'Start biga fermentation.',
        'Mix final dough',
        'Wait for dough to double in volume.',
    ] : [
        'Preparazione biga',
        'Inizia la lievitazione della biga.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps, locale);
}

export function calculatePlanPoolish(infornataTime, percentualePoolish, locale = 'it') {
    const durations = [1, 12, 0.5, percentualePoolish <= 30 ? 6 : percentualePoolish >= 70 ? 3 : 4.5];
    const isEn = locale === 'en';
    const steps = isEn ? [
        'Prepare poolish',
        'Start poolish fermentation.',
        'Mix final dough',
        'Wait for dough to double in volume.',
    ] : [
        'Preparazione poolish',
        'Inizia la lievitazione del poolish.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps, locale);
}

export function calculatePlanLievitoMadre(infornataTime, percentualeLievitoMadre, locale = 'it') {
    const durations = [1, 8, 0.5, percentualeLievitoMadre <= 30 ? 7 : percentualeLievitoMadre >= 70 ? 4 : 5.5];
    const isEn = locale === 'en';
    const steps = isEn ? [
        'Prepare sourdough starter',
        'Start sourdough fermentation.',
        'Mix final dough',
        'Wait for dough to double in volume.',
    ] : [
        'Preparazione lievito madre',
        'Inizia la lievitazione del lievito madre.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps, locale);
}

export function calculatePlanBigaPoolish(infornataTime, percentualeBiga, percentualePoolish, locale = 'it') {
    const media = (percentualeBiga + percentualePoolish) / 2;
    const durations = [1, 10, 0.5, media <= 30 ? 6 : media >= 70 ? 3 : 4.5];
    const isEn = locale === 'en';
    const steps = isEn ? [
        'Prepare biga and poolish',
        'Start combined fermentation of biga and poolish.',
        'Mix final dough',
        'Wait for dough to double in volume.',
    ] : [
        'Preparazione biga e poolish',
        'Inizia la lievitazione combinata di biga e poolish.',
        'Creazione impasto',
        "Attesa raddoppio dell'impasto.",
    ];
    return calculatePlanGeneric(infornataTime, durations, steps, locale);
}
