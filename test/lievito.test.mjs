// test/lievito.test.mjs
// Blocca il comportamento della formula del lievito, che è empirica e non
// derivata da una teoria: senza valori fissati, una modifica a una costante
// passerebbe inosservata.
//
// Si esegue con:  node --test        (dalla radice del progetto)
//
// I riferimenti non sono invenzioni: l'inviluppo AVPN viene dal disciplinare
// (0,1-3 g di lievito fresco per litro d'acqua su 1600-1800 g di farina, cioè
// 0,06-1,88 g/kg di farina, con lievitazione raccomandata fra 8 e 24 ore) e i
// valori di risposta alla temperatura dalla letteratura sul lievito in impasto,
// che colloca il Q10 fra 2 e 3 nell'intervallo 18-30 °C.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    calcolaImpastoDiretto,
    fattoreTemperatura,
    Q10_LIEVITO,
    TEMPERATURA_RIFERIMENTO,
} from '../js/calcolatore-engine.js';

/** Grammi di lievito fresco per kg di farina, la grandezza in cui sono espressi i riferimenti. */
function lievitoPerKgFarina({ idratazione = 58, temperatura = 22, ore = 24, frigo = 0, tipoPizza = 'napoletana' } = {}) {
    const r = calcolaImpastoDiretto({
        pesoPanetto: 250,
        numPanetti: 4,
        idratazioneTotale: idratazione,
        tempoLievitazioneTotale: ore,
        oreFrigo: frigo,
        temperaturaAmbiente: temperatura,
        tipoPizza,
    });
    if (r.pesoLievito === null) return null;
    return (parseFloat(r.pesoLievito) / parseFloat(r.pesoFarina)) * 1000;
}

// Tolleranza generosa: serve a intercettare modifiche alle costanti, non a
// inseguire la terza cifra decimale.
function vicino(valore, atteso, tolleranzaPercentuale, messaggio) {
    const scarto = Math.abs(valore / atteso - 1) * 100;
    assert.ok(
        scarto <= tolleranzaPercentuale,
        `${messaggio}: ottenuto ${valore.toFixed(3)}, atteso ~${atteso} (scarto ${scarto.toFixed(1)}%, max ${tolleranzaPercentuale}%)`,
    );
}

test('le dosi restano dentro l\'inviluppo del disciplinare AVPN', () => {
    const MIN = 0.06;
    const MAX = 1.88;
    // Il disciplinare raccomanda 8-24 ore; sotto le 10 ore e sotto i 18 °C la
    // formula sfora leggermente il massimo ed è un limite noto, non una
    // regressione, quindi quell'angolo è escluso.
    for (const temperatura of [18, 20, 22, 25]) {
        for (const ore of [10, 12, 16, 20, 24]) {
            const v = lievitoPerKgFarina({ temperatura, ore });
            assert.ok(
                v >= MIN && v <= MAX,
                `${ore}h a ${temperatura}°C dà ${v.toFixed(2)} g/kg, fuori da ${MIN}-${MAX}`,
            );
        }
    }
});

test('valori di riferimento per le ricette tipiche', () => {
    vicino(lievitoPerKgFarina({ idratazione: 58, temperatura: 22, ore: 8 }), 1.36, 5, 'napoletana 8h a 22°C');
    vicino(lievitoPerKgFarina({ idratazione: 58, temperatura: 22, ore: 24, frigo: 18 }), 1.41, 5, 'napoletana 24h con 18h di frigo');
    vicino(lievitoPerKgFarina({ idratazione: 62, temperatura: 25, ore: 12 }), 0.58, 5, 'diretto 12h a 25°C');
    vicino(lievitoPerKgFarina({ idratazione: 62, temperatura: 18, ore: 12 }), 1.28, 5, 'diretto 12h a 18°C');
    vicino(lievitoPerKgFarina({ idratazione: 75, temperatura: 20, ore: 48, frigo: 42, tipoPizza: 'teglia' }), 2.50, 5, 'teglia 48h con 42h di frigo');
});

test('la risposta alla temperatura resta dentro i valori di letteratura', () => {
    // Q10 fra 2 e 3 nell'intervallo studiato in letteratura.
    for (const T of [18, 20, 22, 25, 30]) {
        const q10 = fattoreTemperatura(T + 10) / fattoreTemperatura(T);
        assert.ok(q10 >= 2 && q10 <= 3.2, `Q10 a ${T}°C vale ${q10.toFixed(2)}, fuori da 2-3.2`);
    }
    // Circa il 10% di variazione per grado, costante.
    const perGrado = (Math.log(Q10_LIEVITO) / 10) * 100;
    vicino(perGrado, 11.4, 5, 'variazione percentuale per grado');
    assert.equal(TEMPERATURA_RIFERIMENTO, 22);
});

test('la legge della temperatura resta finita anche sotto zero', () => {
    // La legge di potenza precedente divergeva a 0 °C e dava NaN sotto zero.
    for (const T of [0, -5, -20]) {
        const f = fattoreTemperatura(T);
        assert.ok(Number.isFinite(f) && f > 0, `fattoreTemperatura(${T}) vale ${f}`);
    }
    assert.equal(fattoreTemperatura(NaN), null);
});

test('il rallentamento al freddo è coerente col fattore usato per il frigo', () => {
    // Il codice converte le ore di frigo con un fattore 10 (1h di frigo vale
    // 0,1h a temperatura ambiente). La legge della temperatura deve dire
    // qualcosa di simile a 4 °C, altrimenti le due metà del modello divergono.
    const rallentamento = fattoreTemperatura(22) / fattoreTemperatura(4);
    assert.ok(
        rallentamento > 5 && rallentamento < 15,
        `a 4°C il rallentamento vale ${rallentamento.toFixed(1)}x, lontano dal fattore 10 usato per il frigo`,
    );
});

test('teglia e pala fermentano più lentamente, in modo costante', () => {
    // Il rapporto non deve dipendere dalla temperatura.
    const rapporti = [16, 22, 28].map((T) => fattoreTemperatura(T) / fattoreTemperatura(T, true));
    for (const r of rapporti) vicino(r, 2.053, 1, 'rallentamento teglia');
});

test('una cucina fredda dà dosi plausibili, non da pane rapido', () => {
    // Prima della correzione, 8h a 10 °C chiedeva 9,5 g/kg: cinque volte il
    // massimo AVPN e una dose da lievitazione rapida.
    for (const [temperatura, ore, massimo] of [[14, 8, 4], [12, 12, 3], [10, 24, 2], [10, 48, 1]]) {
        const v = lievitoPerKgFarina({ idratazione: 62, temperatura, ore });
        assert.ok(v < massimo, `${ore}h a ${temperatura}°C dà ${v.toFixed(2)} g/kg, sopra il limite di ${massimo}`);
    }
});

test('il bilancio di massa resta esatto', () => {
    for (const tipoPizza of ['napoletana', 'contemporanea', 'teglia']) {
        const r = calcolaImpastoDiretto({
            pesoPanetto: 250, numPanetti: 4, idratazioneTotale: 65,
            tempoLievitazioneTotale: 24, oreFrigo: 18, temperaturaAmbiente: 22, tipoPizza,
        });
        const totale = ['pesoFarina', 'pesoAcqua', 'pesoSale', 'pesoZucchero', 'pesoOlio']
            .reduce((s, k) => s + parseFloat(r[k]), 0);
        assert.ok(Math.abs(totale - 1000) < 0.5, `${tipoPizza}: impasto da ${totale.toFixed(2)}g invece di 1000g`);
    }
});
