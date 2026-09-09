// test/coerenza-testi.test.mjs
// I testi pubblicati — FAQ, dati strutturati Schema.org, dizionari i18n —
// dichiarano numeri che descrivono il comportamento del calcolatore. Sono
// scritti a mano in file diversi da quelli che li producono, quindi divergono
// senza che nessuno se ne accorga.
//
// È già successo: la featureList prometteva "idratazione dal 55% al 90%"
// mentre il calcolatore accettava 40-110%, e "Biga dal 20%" mentre il minimo
// reale era 10%. Sono affermazioni indicizzate da Google, non commenti interni.
//
// Questi test leggono i valori veri dal codice e verificano che i testi li
// citino correttamente.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LIMITI } from '../js/validazione-engine.js';
import { metodiPerPizza, composizionePizza, IDRATAZIONE_BIGA } from '../js/calcolatore-engine.js';

const html = fs.readFileSync(new URL('../calcolatore.html', import.meta.url), 'utf8');
const it = JSON.parse(fs.readFileSync(new URL('../data/i18n/it.json', import.meta.url), 'utf8'));
const en = JSON.parse(fs.readFileSync(new URL('../data/i18n/en.json', import.meta.url), 'utf8'));

/** Il primo blocco di dati strutturati della pagina calcolatore. */
function datiStrutturati() {
    const blocco = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(blocco, 'blocco JSON-LD non trovato in calcolatore.html');
    return JSON.parse(blocco[1]);
}

test('i dati strutturati sono JSON valido', () => {
    const d = datiStrutturati();
    assert.ok(Array.isArray(d) && d.length >= 2, 'atteso un array con almeno due voci');
    assert.ok(d.some((x) => x['@type'] === 'WebApplication'));
    assert.ok(d.some((x) => x['@type'] === 'FAQPage'));
});

test('la featureList dichiara l\'intervallo di idratazione realmente accettato', () => {
    const app = datiStrutturati().find((x) => x['@type'] === 'WebApplication');
    const riga = app.featureList.find((f) => /idratazione/i.test(f));
    assert.ok(riga, 'nessuna voce sull\'idratazione nella featureList');

    const [, min, max] = riga.match(/(\d+)%\s*al\s*(\d+)%/) || [];
    assert.equal(Number(min), LIMITI.idratazione.min,
        `la featureList dice "dal ${min}%" ma il calcolatore accetta dal ${LIMITI.idratazione.min}%`);
    assert.equal(Number(max), LIMITI.idratazione.max,
        `la featureList dice "al ${max}%" ma il calcolatore accetta fino al ${LIMITI.idratazione.max}%`);
});

test('la featureList dichiara l\'intervallo dei prefermenti realmente accettato', () => {
    const app = datiStrutturati().find((x) => x['@type'] === 'WebApplication');
    const riga = app.featureList.find((f) => /Biga/i.test(f));
    assert.ok(riga, 'nessuna voce sui prefermenti nella featureList');

    const [, min, max] = riga.match(/(\d+)%\s*al\s*(\d+)%/) || [];
    assert.equal(Number(min), LIMITI.percentualeBiga.min,
        `dichiarato "dal ${min}%" ma il minimo reale è ${LIMITI.percentualeBiga.min}%`);
    assert.equal(Number(max), LIMITI.percentualeBiga.max,
        `dichiarato "al ${max}%" ma il massimo reale è ${LIMITI.percentualeBiga.max}%`);
});

test('la descrizione dell\'app cita lo stesso intervallo di idratazione', () => {
    const app = datiStrutturati().find((x) => x['@type'] === 'WebApplication');
    const [, min, max] = app.description.match(/idratazione \((\d+)%-(\d+)%\)/) || [];
    assert.equal(Number(min), LIMITI.idratazione.min);
    assert.equal(Number(max), LIMITI.idratazione.max);
});

test('la FAQ sulla biga cita l\'idratazione della biga usata dal codice', () => {
    const faq = datiStrutturati().find((x) => x['@type'] === 'FAQPage');
    const domanda = faq.mainEntity.find((q) => /Biga al 100%/i.test(q.name));
    assert.ok(domanda, 'FAQ sulla biga non trovata');

    const [, min, max] = domanda.acceptedAnswer.text.match(/(\d+)-(\d+)% di acqua/) || [];
    const reale = IDRATAZIONE_BIGA * 100;
    assert.ok(reale >= Number(min) && reale <= Number(max),
        `il testo dice ${min}-${max}% di acqua nella biga, il codice usa ${reale}%`);
});

test('il sale citato nei testi della biga copre gli stili che la offrono', () => {
    // Il range nel testo esiste solo perché teglia sta al minimo e pala al
    // massimo: se una delle due cambia, il testo va aggiornato.
    const stiliConBiga = Object.entries(metodiPerPizza)
        .filter(([, metodi]) => metodi.includes('biga'))
        .map(([tipo]) => tipo);
    assert.ok(stiliConBiga.length > 0);

    const sali = stiliConBiga.map((t) => composizionePizza(t).sale);
    const minReale = Math.min(...sali);
    const maxReale = Math.max(...sali);

    // Lo stesso testo esiste in quattro copie: JSON-LD, HTML visibile e i due
    // dizionari. Vanno controllate tutte, perché è facile aggiornarne solo una.
    const faq = datiStrutturati().find((x) => x['@type'] === 'FAQPage');
    const testoLd = faq.mainEntity.find((q) => /Biga al 100%/i.test(q.name)).acceptedAnswer.text;

    const fonti = [
        ['JSON-LD', testoLd],
        ['HTML visibile', html.match(/data-i18n="calc\.seo\.faq3_a"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''],
        ['i18n IT', it['calc.seo.faq3_a']],
        ['i18n EN', en['calc.seo.faq3_a']],
    ];

    for (const [nome, testo] of fonti) {
        const m = testo.match(/(\d(?:[.,]\d)?)-(\d(?:[.,]\d)?)%/g) || [];
        const range = m.map((x) => x.replace('%', '').split('-').map((v) => Number(v.replace(',', '.'))));
        const trovato = range.some(([a, b]) => a === minReale && b === maxReale);
        assert.ok(trovato,
            `${nome}: nessun intervallo ${minReale}-${maxReale}% (sale reale degli stili con biga). Intervalli citati: ${m.join(', ') || 'nessuno'}`);
    }
});

test('i due dizionari citano gli stessi numeri', () => {
    // Una traduzione che perde una cifra è un errore silenzioso: il lettore
    // inglese riceve un'istruzione diversa da quello italiano.
    const numeri = (s) => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(',', '.')).sort();

    const chiaviConNumeri = Object.keys(it).filter((k) => /^calc\.seo\.faq/.test(k));
    assert.ok(chiaviConNumeri.length > 0, 'nessuna FAQ trovata nei dizionari');

    for (const k of chiaviConNumeri) {
        assert.deepEqual(numeri(it[k]), numeri(en[k]),
            `${k}: i numeri citati in italiano e in inglese non coincidono`);
    }
});
