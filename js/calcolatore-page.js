// calcolatore-page.js
// Collega il form della pagina calcolatore al motore di calcolo puro
// (calcolatore-engine.js) e al motore di generazione procedura
// (procedura-engine.js). Tutta la logica di dominio vive in quei due
// moduli: qui c'è solo lettura del DOM, dispatch e rendering.
import {
    metodiPerPizza,
    calcolaPesoTeglia,
    calcolaImpastoDiretto,
    calcolaImpastoBiga,
    calcolaImpastoPoolish,
    calcolaImpastoLievitoMadre,
    calcolaImpastoBigaPoolish,
    estraiTotaliMacro,
} from './calcolatore-engine.js';
import { generaProcedura } from './procedura-engine.js';

const el = (id) => document.getElementById(id);

const SEZIONI_METODO = {
    diretto: 'sezione_diretto',
    biga: 'sezione_biga',
    poolish: 'sezione_poolish',
    lievito_madre: 'sezione_lievito_madre',
    biga_poolish: 'sezione_biga_poolish',
};

const CAMPI_PESO_NUMERO = {
    diretto: ['peso_panetto_diretto', 'num_panetti_diretto'],
    biga: ['peso_panetto_biga', 'num_panetti_biga'],
    poolish: ['peso_panetto_poolish', 'num_panetti_poolish'],
    lievito_madre: ['peso_panetto_lievito', 'num_panetti_lievito'],
    biga_poolish: ['peso_panetto_biga_poolish', 'num_panetti_biga_poolish'],
};

const CAMPO_IDRATAZIONE = {
    diretto: 'idratazione_totale_diretto',
    biga: 'idratazione_totale_biga',
    poolish: 'idratazione_totale_poolish',
    lievito_madre: 'idratazione_totale_lievito',
    biga_poolish: 'idratazione_totale_biga_poolish',
};

function aggiornaMetodiDisponibili() {
    const tipoPizza = el('tipo_pizza').value;
    const metodoSelect = el('tipo_impasto');
    const metodiDisponibili = metodiPerPizza[tipoPizza] || [];
    const metodoAttuale = metodoSelect.value;

    metodoSelect.innerHTML = '';
    metodiDisponibili.forEach((metodo) => {
        const opt = document.createElement('option');
        opt.value = metodo;
        opt.textContent = {
            diretto: 'Impasto Diretto',
            biga: 'Prefermento Biga',
            poolish: 'Prefermento Poolish',
            lievito_madre: 'Lievito Madre',
            biga_poolish: 'Biga + Poolish',
        }[metodo] || metodo;
        metodoSelect.appendChild(opt);
    });

    metodoSelect.value = metodiDisponibili.includes(metodoAttuale) ? metodoAttuale : metodiDisponibili[0];
    aggiornaSezioneVisibile();
    sincronizzaTeglia();
}

function aggiornaSezioneVisibile() {
    const metodo = el('tipo_impasto').value;
    Object.values(SEZIONI_METODO).forEach((id) => el(id).classList.add('hidden'));
    const idAttivo = SEZIONI_METODO[metodo];
    if (idAttivo) el(idAttivo).classList.remove('hidden');
}

function sincronizzaTeglia() {
    const isTeglia = el('tipo_pizza').value === 'teglia';
    el('sezione_teglia').classList.toggle('hidden', !isTeglia);
    el('teglia_hint').classList.toggle('hidden', !isTeglia);

    const metodo = el('tipo_impasto').value;
    const [pesoId, numId] = CAMPI_PESO_NUMERO[metodo] || [];
    if (!pesoId || !numId) return;
    const pesoInput = el(pesoId);
    const numInput = el(numId);

    if (isTeglia) {
        const base = parseFloat(el('teglia_base').value);
        const altezza = parseFloat(el('teglia_altezza').value);
        const spessore = el('teglia_spessore').value;
        const numeroTeglie = parseInt(el('teglia_numero').value, 10) || 1;
        if (base > 0 && altezza > 0) {
            pesoInput.value = calcolaPesoTeglia(base, altezza, spessore).toFixed(0);
        }
        numInput.value = numeroTeglie;
        pesoInput.disabled = true;
        numInput.disabled = true;
    } else {
        pesoInput.disabled = false;
        numInput.disabled = false;
    }
}

function leggiComune() {
    return {
        tipoPizza: el('tipo_pizza').value,
        tipoImpasto: el('tipo_impasto').value,
        forzaFarina: parseFloat(el('forza_farina').value) || undefined,
    };
}

function calcolaRicetta() {
    const { tipoPizza, tipoImpasto } = leggiComune();

    switch (tipoImpasto) {
        case 'diretto':
            return calcolaImpastoDiretto({
                pesoPanetto: parseFloat(el('peso_panetto_diretto').value),
                idratazioneTotale: parseFloat(el('idratazione_totale_diretto').value),
                numPanetti: parseInt(el('num_panetti_diretto').value, 10),
                tempoLievitazioneTotale: parseFloat(el('tempoLievTotale_diretto').value),
                oreFrigo: parseFloat(el('tempoFrigo_diretto').value) || 0,
                temperaturaAmbiente: parseFloat(el('temperatura_ambiente_diretto').value),
                tipoPizza,
            });
        case 'biga':
            return calcolaImpastoBiga({
                pesoPanetto: parseFloat(el('peso_panetto_biga').value),
                idratazioneTotale: parseFloat(el('idratazione_totale_biga').value),
                percentualeBiga: parseFloat(el('percentuale_biga').value),
                numPanetti: parseInt(el('num_panetti_biga').value, 10),
            });
        case 'poolish':
            return calcolaImpastoPoolish({
                pesoPanetto: parseFloat(el('peso_panetto_poolish').value),
                idratazioneTotale: parseFloat(el('idratazione_totale_poolish').value),
                percentualePoolish: parseFloat(el('percentuale_poolish').value),
                numPanetti: parseInt(el('num_panetti_poolish').value, 10),
            });
        case 'lievito_madre':
            return calcolaImpastoLievitoMadre({
                pesoPanetto: parseFloat(el('peso_panetto_lievito').value),
                idratazioneTotale: parseFloat(el('idratazione_totale_lievito').value),
                percentualePastaMadre: parseFloat(el('percentuale_lievito').value),
                numPanetti: parseInt(el('num_panetti_lievito').value, 10),
            });
        case 'biga_poolish':
            return calcolaImpastoBigaPoolish({
                pesoPanetto: parseFloat(el('peso_panetto_biga_poolish').value),
                idratazioneTotale: parseFloat(el('idratazione_totale_biga_poolish').value),
                percentualeBiga: parseFloat(el('percentuale_biga_bp').value),
                percentualePoolish: parseFloat(el('percentuale_poolish_bp').value),
                numPanetti: parseInt(el('num_panetti_biga_poolish').value, 10),
            });
        default:
            return null;
    }
}

// Passi di preparazione specifici del prefermento, da anteporre ai passi
// generici di mixing/incordatura generati da procedura-engine (che
// ragionano sull'impasto finale, non sul prefermento in sé).
function passiPrefermento(tipoImpasto, dati) {
    switch (tipoImpasto) {
        case 'biga':
            return [`Prepara la biga: mescola ${dati.pesoFarinaBiga} g di farina, ${dati.pesoAcquaBiga} g di acqua e ${dati.pesoLievitoBiga} g di lievito. Lascia fermentare 16-20 ore a 16-18°C.`];
        case 'poolish':
            return [`Prepara il poolish: mescola ${dati.pesoFarinaPoolish} g di farina, ${dati.pesoAcquaPoolish} g di acqua e ${dati.pesoLievitoPoolish} g di lievito fino a una pastella liquida. Lascia fermentare 10-12 ore a temperatura ambiente.`];
        case 'lievito_madre':
            return [`Rinfresca il lievito madre con ${dati.farinaRinfresco2} g di farina e ${dati.acquaRinfresco2} g di acqua rispetto alla pasta madre attiva, fino a ottenere ${dati.pesoPastaMadreFinale} g di lievito madre maturo.`];
        case 'biga_poolish':
            return [
                `Prepara la biga: mescola ${dati.pesoFarinaBiga} g di farina, ${dati.pesoAcquaBiga} g di acqua e ${dati.pesoLievitoBiga} g di lievito. Lascia fermentare 16-20 ore a 16-18°C.`,
                `Prepara il poolish: mescola ${dati.pesoFarinaPoolish} g di farina, ${dati.pesoAcquaPoolish} g di acqua e ${dati.pesoLievitoPoolish} g di lievito fino a una pastella liquida. Lascia fermentare 10-12 ore a temperatura ambiente.`,
            ];
        default:
            return [];
    }
}

function idratazioneTotaleAttuale(tipoImpasto) {
    return parseFloat(el(CAMPO_IDRATAZIONE[tipoImpasto]).value);
}

function renderRisultato(dati, tipoImpasto) {
    const { forzaFarina } = leggiComune();
    const idratazioneTotale = idratazioneTotaleAttuale(tipoImpasto);

    const totali = estraiTotaliMacro(tipoImpasto, dati);
    const grid = el('risultato-grid');
    grid.innerHTML = `
        <div><strong>${Math.round(totali.farina)}</strong><span>g farina</span></div>
        <div><strong>${Math.round(totali.acqua)}</strong><span>g acqua</span></div>
        <div><strong>${Math.round(totali.sale)}</strong><span>g sale</span></div>
        <div><strong>${Math.round(totali.zucchero)}</strong><span>g zucchero</span></div>
        <div><strong>${Math.round(totali.olio)}</strong><span>g olio</span></div>
        <div><strong>${totali.lievito.toFixed(2)}</strong><span>g lievito</span></div>
    `;

    const { passi, avvisi } = generaProcedura({ idratazioneTotale, forzaFarina });
    const passiCompleti = [...passiPrefermento(tipoImpasto, dati), ...passi];
    el('risultato-steps').innerHTML = passiCompleti.map((p) => `<li>${p}</li>`).join('');
    el('risultato-avvisi').innerHTML = avvisi.map((a) => `<p>${a}</p>`).join('');

    el('risultato').classList.remove('hidden');
}

el('tipo_pizza').addEventListener('change', aggiornaMetodiDisponibili);
el('tipo_impasto').addEventListener('change', () => {
    aggiornaSezioneVisibile();
    sincronizzaTeglia();
});
['teglia_base', 'teglia_altezza', 'teglia_spessore', 'teglia_numero'].forEach((id) => {
    el(id).addEventListener('input', sincronizzaTeglia);
    el(id).addEventListener('change', sincronizzaTeglia);
});

el('calcola-button').addEventListener('click', () => {
    const { tipoImpasto } = leggiComune();
    const dati = calcolaRicetta();
    if (!dati) return;
    renderRisultato(dati, tipoImpasto);
});

el('nutrienti-button').addEventListener('click', () => {
    const { tipoPizza, tipoImpasto } = leggiComune();
    const dati = calcolaRicetta();
    if (!dati) return;

    const [pesoId, numId] = CAMPI_PESO_NUMERO[tipoImpasto];
    localStorage.setItem('datiNutrizionali', JSON.stringify({
        tipoPizza,
        tipoImpasto,
        numPanetti: parseInt(el(numId).value, 10),
        pesoPanetto: parseFloat(el(pesoId).value),
        ingredientiBase: estraiTotaliMacro(tipoImpasto, dati),
    }));
    window.location.href = 'simulator.html';
});

// Applica una configurazione passata dall'Assistente Virtuale (vedi
// assistente-page.js), salvata in localStorage prima del redirect qui.
function applicaConfigurazioneAssistente() {
    const raw = localStorage.getItem('configurazioneImpasto');
    if (!raw) return;
    localStorage.removeItem('configurazioneImpasto');

    let config;
    try {
        config = JSON.parse(raw);
    } catch (e) {
        return;
    }

    el('tipo_pizza').value = config.tipo_pizza;
    aggiornaMetodiDisponibili();

    const metodiDisponibili = metodiPerPizza[config.tipo_pizza] || [];
    if (metodiDisponibili.includes(config.tipo_impasto)) {
        el('tipo_impasto').value = config.tipo_impasto;
    }
    aggiornaSezioneVisibile();
    sincronizzaTeglia();

    const tipoImpasto = el('tipo_impasto').value;
    const idratazioneMedia = Array.isArray(config.idratazione)
        ? (config.idratazione[0] + config.idratazione[1]) / 2
        : config.idratazione;

    const [pesoId, numId] = CAMPI_PESO_NUMERO[tipoImpasto] || [];
    if (pesoId) el(pesoId).value = config.peso_panetto;
    if (numId) el(numId).value = config.num_panetti;
    el(CAMPO_IDRATAZIONE[tipoImpasto]).value = idratazioneMedia;

    if (tipoImpasto === 'diretto') {
        el('tempoLievTotale_diretto').value = config.tempo_lievitazione;
        el('tempoFrigo_diretto').value = config.tempo_frigo || 0;
    } else if (tipoImpasto === 'biga' && config.percentuale_biga) {
        el('percentuale_biga').value = config.percentuale_biga;
    } else if (tipoImpasto === 'poolish' && config.percentuale_poolish) {
        el('percentuale_poolish').value = config.percentuale_poolish;
    } else if (tipoImpasto === 'lievito_madre' && config.percentuale_lievito_madre) {
        el('percentuale_lievito').value = config.percentuale_lievito_madre;
    } else if (tipoImpasto === 'biga_poolish') {
        if (config.percentuale_biga) el('percentuale_biga_bp').value = config.percentuale_biga;
        if (config.percentuale_poolish) el('percentuale_poolish_bp').value = config.percentuale_poolish;
    }
}

aggiornaMetodiDisponibili();
applicaConfigurazioneAssistente();
