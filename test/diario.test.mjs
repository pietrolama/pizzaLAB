// test/diario.test.mjs
// Il diario è l'unica cosa che l'utente accumula nel tempo: mesi di infornate
// annotate, che nessun ricalcolo può ricostruire. La logica che decide quale
// copia sopravvive a una sincronizzazione, e quella che legge i dati salvati
// mesi fa, meritano un test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    VERSIONE_FORMATO,
    chiaveVoce,
    unisciDiari,
    deserializza,
    serializza,
    normalizzaFermentazione,
} from '../js/diario-storage.js';

test('il formato vecchio, un array nudo, resta leggibile', () => {
    // Chi ha usato il diario prima dell'involucro versionato non deve perdere
    // nulla: è il caso che rende utile avere una versione.
    const vecchio = [{ nome: 'Napoletana 24h', data: '2026-01-15' }];
    assert.deepEqual(deserializza(vecchio), vecchio);
});

test('il formato versionato viene letto correttamente', () => {
    const voci = [{ nome: 'Teglia 48h', data: '2026-02-01' }];
    assert.deepEqual(deserializza(serializza(voci)), voci);
    assert.equal(serializza(voci).versione, VERSIONE_FORMATO);
});

test('dati corrotti o assenti non fanno perdere il controllo', () => {
    for (const grezzo of [null, undefined, 0, 'testo', {}, { voci: 'non un array' }]) {
        assert.deepEqual(deserializza(grezzo), [], `fallito per ${JSON.stringify(grezzo)}`);
    }
});

test('la fusione tiene la copia modificata più di recente', () => {
    const locale = { id: 'a', nome: 'Napoletana', note: 'vecchia', aggiornato: '2026-01-01T10:00:00Z' };
    const remota = { id: 'a', nome: 'Napoletana', note: 'nuova', aggiornato: '2026-03-01T10:00:00Z' };

    // In entrambi gli ordini deve vincere la più recente, non "quella locale".
    assert.equal(unisciDiari([locale], [remota])[0].note, 'nuova');
    assert.equal(unisciDiari([remota], [locale])[0].note, 'nuova');
});

test('una modifica locale recente non viene sovrascritta dal cloud', () => {
    const locale = { id: 'a', note: 'appena scritta', nome: 'x', aggiornato: '2026-03-02T10:00:00Z' };
    const remota = { id: 'a', note: 'vecchia', nome: 'x', aggiornato: '2026-01-01T10:00:00Z' };
    assert.equal(unisciDiari([locale], [remota])[0].note, 'appena scritta');
});

test('la fusione non duplica e non perde voci', () => {
    const locali = [{ id: 'a', nome: 'A' }, { id: 'b', nome: 'B' }];
    const remote = [{ id: 'b', nome: 'B' }, { id: 'c', nome: 'C' }];
    const uniti = unisciDiari(locali, remote);
    assert.equal(uniti.length, 3);
    assert.deepEqual(uniti.map((v) => v.id).sort(), ['a', 'b', 'c']);
});

test('il campo updatedAt del cloud vale quanto aggiornato', () => {
    // Il cloud scrive updatedAt, il client scrive aggiornato: vanno confrontati
    // fra loro, altrimenti ogni voce remota risulterebbe vecchissima.
    const locale = { id: 'a', nome: 'x', aggiornato: '2026-01-01T00:00:00Z' };
    const remota = { id: 'a', nome: 'x', updatedAt: '2026-06-01T00:00:00Z', note: 'dal cloud' };
    assert.equal(unisciDiari([locale], [remota])[0].note, 'dal cloud');
});

test('voci senza id vengono riconosciute per nome e data', () => {
    const a = { nome: 'Napoletana', data: '2026-01-15', note: 'prima' };
    const b = { nome: 'Napoletana', data: '2026-01-15', note: 'seconda', aggiornato: '2026-02-01T00:00:00Z' };
    assert.equal(chiaveVoce(a), chiaveVoce(b));
    assert.equal(unisciDiari([a], [b]).length, 1);
});

test('un backup ostile non entra nel diario così com\'è', () => {
    const ostile = {
        nome: '<img src=x onerror=alert(1)>',
        idratazione: '65',
        campoInatteso: 'non deve passare',
        blend: { pesoForte: '<script>', percentualeForte: 50, altro: 'no' },
    };
    const pulita = normalizzaFermentazione(ostile);

    assert.equal(pulita.campoInatteso, undefined, 'un campo non previsto è passato');
    assert.equal(pulita.blend.altro, undefined, 'un campo non previsto nel blend è passato');
    assert.equal(pulita.idratazione, 65, 'i numeri vanno convertiti da stringa');
    // Il nome resta testo: l'escaping avviene al rendering, qui si controlla
    // solo che non venga inventato nulla.
    assert.equal(typeof pulita.nome, 'string');
    assert.equal(pulita.blend.pesoForte, undefined, 'un valore non numerico è entrato come numero');
});

test('una voce senza nome viene scartata', () => {
    assert.equal(normalizzaFermentazione({ note: 'solo note' }), null);
    for (const v of [null, undefined, 'testo', 42, []]) {
        assert.equal(normalizzaFermentazione(v), null, `fallito per ${JSON.stringify(v)}`);
    }
});
