// yeast-converter.js
// Motore di conversione universale tra tipologie di lieviti con compensazione farina/acqua.

export const TIPI_LIEVITO = {
    lbf: { id: 'lbf', nome: 'Lievito di Birra Fresco (LBF)', nome_en: 'Fresh Compressed Yeast (LBF)', fattore: 1.0 },
    lbs: { id: 'lbs', nome: 'Lievito di Birra Secco (LBS / Istantaneo)', nome_en: 'Active / Instant Dry Yeast (LBS)', fattore: 0.33 },
    licoli: { id: 'licoli', nome: 'Li.Co.Li (Lievito Madre Liquido 100%)', nome_en: 'Liquid Sourdough Starter (100% hydration)', fattore: 5.0 },
    solido: { id: 'solido', nome: 'Lievito Madre Solido / Pasta Madre (50%)', nome_en: 'Solid Sourdough Paste (50% hydration)', fattore: 6.0 }
};

export function convertiLievito({ quantita, daTipo, aTipo, farinaTotaleImpasto = 1000 }) {
    if (!quantita || quantita <= 0) return null;

    // 1. Normalizza tutto a grammi di LBF (Lievito di Birra Fresco)
    let grammiLBF = 0;
    if (daTipo === 'lbf') {
        grammiLBF = quantita;
    } else if (daTipo === 'lbs') {
        grammiLBF = quantita * 3.03; // ~ 1/0.33
    } else if (daTipo === 'licoli') {
        grammiLBF = quantita / 5.0;
    } else if (daTipo === 'solido') {
        grammiLBF = quantita / 6.0;
    }

    // 2. Calcola la quantità nel tipo di destinazione
    let risultato = 0;
    if (aTipo === 'lbf') {
        risultato = grammiLBF;
    } else if (aTipo === 'lbs') {
        risultato = grammiLBF * 0.33;
    } else if (aTipo === 'licoli') {
        risultato = grammiLBF * 5.0;
    } else if (aTipo === 'solido') {
        risultato = grammiLBF * 6.0;
    }

    // 3. Calcolo compensazione acqua e farina nell'impasto
    let sottraiFarina = 0;
    let sottraiAcqua = 0;

    if (aTipo === 'licoli') {
        // Licoli è 50% farina e 50% acqua
        sottraiFarina = Math.round(risultato * 0.5);
        sottraiAcqua = Math.round(risultato * 0.5);
    } else if (aTipo === 'solido') {
        // Solido è 66.6% farina e 33.3% acqua (idro 50%)
        sottraiFarina = Math.round(risultato * 0.666);
        sottraiAcqua = Math.round(risultato * 0.333);
    }

    return {
        quantitaOriginale: quantita,
        daTipo,
        aTipo,
        risultato: Math.round(risultato * 100) / 100,
        sottraiFarina,
        sottraiAcqua,
        notaCompensazione: (sottraiFarina > 0 || sottraiAcqua > 0)
            ? `Dovrai sottrarre ${sottraiFarina}g di farina e ${sottraiAcqua}g di acqua dalla ricetta base per mantenere l'idratazione invariata.`
            : 'Nessuna compensazione di idratazione necessaria.'
    };
}
