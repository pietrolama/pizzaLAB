// yeast-converter.js
// Motore di conversione universale tra tipologie di lieviti con compensazione
// di farina e acqua nell'impasto principale.

export const TIPI_LIEVITO = {
    lbf: { id: 'lbf', nome: 'Lievito di Birra Fresco (LBF)', nome_en: 'Fresh Compressed Yeast (LBF)', fattore: 1.0 },
    lbs: { id: 'lbs', nome: 'Lievito di Birra Secco (LBS / Istantaneo)', nome_en: 'Active / Instant Dry Yeast (LBS)', fattore: 0.33 },
    licoli: { id: 'licoli', nome: 'Li.Co.Li (Lievito Madre Liquido 100%)', nome_en: 'Liquid Sourdough Starter (100% hydration)', fattore: 5.0 },
    solido: { id: 'solido', nome: 'Lievito Madre Solido / Pasta Madre (50%)', nome_en: 'Solid Sourdough Paste (50% hydration)', fattore: 6.0 }
};

// Quanta farina e quanta acqua porta in dote ogni tipo di lievito, come
// frazione del proprio peso. Il lievito di birra (fresco o secco) è una massa
// trascurabile e non altera il bilancio dell'impasto; i lieviti madre invece
// sono a tutti gli effetti farina e acqua già impastate:
//   - Li.Co.Li, idratazione 100%  -> metà farina, metà acqua
//   - pasta madre solida, idr. 50% -> 2/3 farina, 1/3 acqua
const COMPOSIZIONE_LIEVITO = {
    lbf: { farina: 0, acqua: 0 },
    lbs: { farina: 0, acqua: 0 },
    licoli: { farina: 0.5, acqua: 0.5 },
    solido: { farina: 2 / 3, acqua: 1 / 3 },
};

/**
 * Converte una quantità di lievito da un tipo all'altro e calcola come
 * correggere farina e acqua dell'impasto per mantenere invariata l'idratazione.
 *
 * @param {Object} params
 * @param {number} params.quantita - grammi del lievito di partenza
 * @param {string} params.daTipo - lbf | lbs | licoli | solido
 * @param {string} params.aTipo  - lbf | lbs | licoli | solido
 * @returns {Object|null} null se gli argomenti non sono utilizzabili
 */
export function convertiLievito({ quantita, daTipo, aTipo }) {
    const q = Number(quantita);
    if (!Number.isFinite(q) || q <= 0) return null;
    if (!TIPI_LIEVITO[daTipo] || !TIPI_LIEVITO[aTipo]) return null;

    // Si passa per il lievito di birra fresco come unità di riferimento: il
    // `fattore` di ogni tipo esprime quanti grammi servono al posto di 1 g di
    // LBF, quindi si divide per entrare e si moltiplica per uscire. Usare la
    // stessa costante nei due sensi garantisce che una conversione di andata e
    // ritorno restituisca il valore di partenza.
    const grammiLBF = q / TIPI_LIEVITO[daTipo].fattore;
    const quantitaEquivalente = grammiLBF * TIPI_LIEVITO[aTipo].fattore;

    // Compensazione con segno: farina e acqua che il nuovo lievito aggiunge
    // all'impasto, meno quelle che il vecchio già apportava.
    //   > 0  -> vanno sottratte dall'impasto principale
    //   < 0  -> vanno aggiunte
    const origine = COMPOSIZIONE_LIEVITO[daTipo];
    const destinazione = COMPOSIZIONE_LIEVITO[aTipo];

    const differenzaFarina = (quantitaEquivalente * destinazione.farina) - (q * origine.farina);
    const differenzaAcqua = (quantitaEquivalente * destinazione.acqua) - (q * origine.acqua);

    const arrotonda = (v) => Math.round(v * 100) / 100;

    return {
        quantitaOriginale: q,
        daTipo,
        aTipo,
        quantitaEquivalente: arrotonda(quantitaEquivalente),
        differenzaFarina: arrotonda(differenzaFarina),
        differenzaAcqua: arrotonda(differenzaAcqua),
    };
}
