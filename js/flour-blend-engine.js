// flour-blend-engine.js
// Motore logico per il calcolo del blend (miscela) e del taglio delle farine di PizzaLab.
// Funzioni pure (input -> output) senza dipendenze dal DOM, riutilizzabili nel calcolatore,
// nel modulo scienza e in qualsiasi componente UI.

/**
 * Converte empiricamente la percentuale di proteine (% su 100g) in valore di forza W stimato.
 * Modello basato su regressione calibrata dei grani teneri commerciali:
 * - 10.0% -> 170 W (Debole)
 * - 11.5% -> 236 W (~235 W, Medio-debole)
 * - 12.5% -> 285 W (Media / Pizza standard)
 * - 13.5% -> 338 W (~340 W, Forte)
 * - 14.5% -> 395 W (Manitoba / Rinforzo)
 * 
 * @param {number} proteine - Grammi di proteine per 100g (es. 12.5)
 * @returns {number} Valore di W stimato arrotondato all'intero più vicino
 */
export function proteineToW(proteine) {
    if (!proteine || proteine <= 0) return 0;
    const p = Math.max(7, Math.min(18, Number(proteine)));
    // Formula ricalibrata: W = 2.0 * P^2 + 1.0 * P - 40
    const w = 2.0 * (p * p) + 1.0 * p - 40;
    return Math.round(Math.max(80, Math.min(500, w)));
}

/**
 * Converte empiricamente il valore di forza W nella percentuale stimata di proteine.
 * 
 * @param {number} w - Indice di forza alveografica W (es. 280)
 * @returns {number} Proteine stimate % con un decimale (es. 12.4)
 */
export function wToProteine(w) {
    if (!w || w <= 0) return 0;
    const targetW = Math.max(80, Math.min(500, Number(w)));
    // Risoluzione inversa di: 2.0 * P^2 + P - (W + 40) = 0
    // P = (-1 + sqrt(1 + 8 * (W + 40))) / 4
    const discriminant = 1 + 8 * (targetW + 40);
    if (discriminant < 0) return 10.0;
    const p = (-1 + Math.sqrt(discriminant)) / 4;
    return Number(p.toFixed(1));
}

/**
 * Calcola il W risultante e le proteine medie di un blend di N farine (Formula Diretta).
 * 
 * @param {Array<{ peso: number, w?: number, proteine?: number, nome?: string }>} farine
 * @returns {{ pesoTotale: number, wFinale: number, proteineMedie: number, composizione: Array<Object> }}
 */
export function calcolaWBlend(farine = []) {
    if (!Array.isArray(farine) || farine.length === 0) {
        return { pesoTotale: 0, wFinale: 0, proteineMedie: 0, composizione: [] };
    }

    let pesoTotale = 0;
    let sommaPonderataW = 0;
    let sommaPonderataProteine = 0;

    const farineValide = farine.map(f => {
        const peso = Math.max(0, Number(f.peso) || 0);
        let w = Number(f.w);
        let proteine = Number(f.proteine);

        if ((isNaN(w) || w <= 0) && proteine > 0) {
            w = proteineToW(proteine);
        } else if ((isNaN(proteine) || proteine <= 0) && w > 0) {
            proteine = wToProteine(w);
        } else if (isNaN(w) && isNaN(proteine)) {
            w = 260; // fallback standard
            proteine = 12.0;
        }

        return {
            nome: f.nome || 'Farina',
            peso,
            w: Math.round(w),
            proteine: Number(proteine.toFixed(1))
        };
    });

    pesoTotale = farineValide.reduce((acc, f) => acc + f.peso, 0);

    if (pesoTotale <= 0) {
        return { pesoTotale: 0, wFinale: 0, proteineMedie: 0, composizione: [] };
    }

    farineValide.forEach(f => {
        sommaPonderataW += f.w * f.peso;
        sommaPonderataProteine += f.proteine * f.peso;
    });

    const wFinale = Math.round(sommaPonderataW / pesoTotale);
    const proteineMedie = Number((sommaPonderataProteine / pesoTotale).toFixed(1));

    const composizione = farineValide.map(f => ({
        ...f,
        percentuale: Number(((f.peso / pesoTotale) * 100).toFixed(1))
    }));

    return {
        pesoTotale: Math.round(pesoTotale),
        wFinale,
        proteineMedie,
        composizione
    };
}

/**
 * Risolve la Formula Inversa (Regola del Taglio / Quadrato di Pearson):
 * Calcola esattamente quanta Farina Forte (A) e quanta Farina Debole (B) servono
 * per raggiungere un W target desiderato.
 * 
 * @param {Object} params
 * @param {number} params.wForte - W della farina forte (es. 380)
 * @param {number} params.wDebole - W della farina debole (es. 180)
 * @param {number} params.wTarget - W obiettivo desiderato (es. 280)
 * @param {number} params.pesoTotale - Peso totale complessivo della farina in grammi (es. 1000)
 * @param {string} [params.nomeForte] - Nome facoltativo per la farina forte
 * @param {string} [params.nomeDebole] - Nome facoltativo per la farina debole
 * 
 * @returns {{
 *   possibile: boolean,
 *   avviso?: string,
 *   percentualeForte: number,
 *   percentualeDebole: number,
 *   pesoForte: number,
 *   pesoDebole: number,
 *   wEffettivo: number,
 *   proteineEffettive: number,
 *   wTarget: number,
 *   pesoTotale: number,
 *   dettagli?: Object
 * }}
 */
export function calcolaTaglioDueFarine({
    wForte,
    wDebole,
    wTarget,
    pesoTotale,
    nomeForte = 'Farina Forte (A)',
    nomeDebole = 'Farina Debole (B)'
}) {
    const tot = Math.round(Math.max(0, Number(pesoTotale) || 0));
    const target = Number(wTarget) || 260;
    let forte = Number(wForte) || 350;
    let debole = Number(wDebole) || 180;

    // Se l'utente inverte forte e debole, li ordiniamo
    if (debole > forte) {
        const temp = debole;
        debole = forte;
        forte = temp;
    }

    if (forte === debole) {
        return {
            possibile: target === forte,
            avviso: 'Le due farine hanno la stessa forza W.',
            percentualeForte: 100,
            percentualeDebole: 0,
            pesoForte: tot,
            pesoDebole: 0,
            wEffettivo: forte,
            proteineEffettive: wToProteine(forte),
            wTarget: target,
            pesoTotale: tot
        };
    }

    if (target >= forte) {
        return {
            possibile: false,
            avviso: `Il W desiderato (${target}) è maggiore o uguale alla farina più forte (${forte} W).`,
            percentualeForte: 100,
            percentualeDebole: 0,
            pesoForte: tot,
            pesoDebole: 0,
            wEffettivo: forte,
            proteineEffettive: wToProteine(forte),
            wTarget: target,
            pesoTotale: tot
        };
    }

    if (target <= debole) {
        return {
            possibile: false,
            avviso: `Il W desiderato (${target}) è minore o uguale alla farina più debole (${debole} W).`,
            percentualeForte: 0,
            percentualeDebole: 100,
            pesoForte: 0,
            pesoDebole: tot,
            wEffettivo: debole,
            proteineEffettive: wToProteine(debole),
            wTarget: target,
            pesoTotale: tot
        };
    }

    // Formula di Pearson
    const quotaForte = (target - debole) / (forte - debole);
    const quotaDebole = 1 - quotaForte;

    const percentualeForte = Number((quotaForte * 100).toFixed(1));
    const percentualeDebole = Number((quotaDebole * 100).toFixed(1));

    const pesoForte = Math.round(tot * quotaForte);
    const pesoDebole = tot - pesoForte;

    const wEffettivo = Math.round((forte * pesoForte + debole * pesoDebole) / (tot || 1));
    const proteineEffettive = wToProteine(wEffettivo);

    return {
        possibile: true,
        percentualeForte,
        percentualeDebole,
        pesoForte,
        pesoDebole,
        wEffettivo,
        proteineEffettive,
        wTarget: target,
        pesoTotale: tot,
        dettagli: {
            nomeForte,
            wForte: forte,
            nomeDebole,
            wDebole: debole
        }
    };
}

/**
 * Suggerisce il range ideale di forza W in base al tipo di pizza, ore totali e ore di frigo.
 * 
 * @param {Object} params
 * @param {string} params.tipoPizza - es. 'napoletana', 'teglia', 'pala', 'contemporanea'
 * @param {number} params.oreTotali - Ore totali di maturazione/lievitazione
 * @param {number} [params.oreFrigo=0] - Ore trascorse in frigo (4°C)
 * 
 * @returns {{ wConsigliato: number, wMin: number, wMax: number, descrizione: string }}
 */
export function suggerisciWPerRicetta({ tipoPizza, oreTotali, oreFrigo = 0 }) {
    const oreTA = Math.max(0, (oreTotali || 8) - (oreFrigo || 0));
    const oreEquivalenti = oreTA + ((oreFrigo || 0) / 3);

    let wMin = 220;
    let wMax = 280;
    let descrizione = '';

    if (oreEquivalenti <= 8) {
        wMin = 180;
        wMax = 240;
        descrizione = 'Lievitazione breve / diretta in giornata. Farina debole o media.';
    } else if (oreEquivalenti <= 18) {
        wMin = 250;
        wMax = 290;
        descrizione = 'Maturazione media (12-24h con parziale frigo). Farina di media forza.';
    } else if (oreEquivalenti <= 36) {
        wMin = 290;
        wMax = 340;
        descrizione = 'Lunga maturazione in frigo (24-48h). Farina forte e tenace.';
    } else {
        wMin = 340;
        wMax = 400;
        descrizione = 'Altissima idratazione o maturazioni prolungate (>48h). Richiede farine di forza/Manitoba.';
    }

    if (tipoPizza === 'teglia' || tipoPizza === 'pala' || tipoPizza === 'contemporanea') {
        wMin = Math.min(380, wMin + 20);
        wMax = Math.min(420, wMax + 30);
    }

    const wConsigliato = Math.round((wMin + wMax) / 2);

    return {
        wConsigliato,
        wMin,
        wMax,
        descrizione
    };
}
