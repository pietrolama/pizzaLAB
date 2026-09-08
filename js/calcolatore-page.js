// calcolatore-page.js
// Collega il form della pagina calcolatore al motore di calcolo puro
// (calcolatore-engine.js) e al motore di generazione procedura
// (procedura-engine.js). Tutta la logica di dominio vive in quei due
// moduli: qui c'è solo lettura del DOM, dispatch e rendering.
import {
    metodiPerPizza,
    composizionePizza,
    calcolaPesoTeglia,
    calcolaImpastoDiretto,
    calcolaImpastoBiga,
    calcolaImpastoPoolish,
    calcolaImpastoLievitoMadre,
    calcolaImpastoBigaPoolish,
    estraiTotaliMacro,
    calculatePlanDiretto,
    calculatePlanBiga,
    calculatePlanPoolish,
    calculatePlanLievitoMadre,
    calculatePlanBigaPoolish,
} from './calcolatore-engine.js';
import { generaProcedura } from './procedura-engine.js';
import {
    calcolaTaglioDueFarine,
    proteineToW,
    wToProteine,
    suggerisciWPerRicetta,
} from './flour-blend-engine.js';
import { kitchenTimer } from './timer-engine.js';
import { generaPizzaCardBlob } from './pizza-card-engine.js';
import {
    calcolaCondimenti,
    calcolaTempAcquaFDT,
    GUIDA_FORNI
} from './tools-engine.js';
import { stampaSchedaRicetta } from './print-engine.js';
import { esportaCalendarioICS } from './calendar-export.js';
import { generaCurvaFermentazioneSVG } from './fermentation-curve-engine.js';
import { convertiLievito } from './yeast-converter.js';
import { caricaTroubleshootingData, renderTroubleshootingList } from './troubleshooting-engine.js';
import { caricaCerealiData, renderCerealiCards } from './grains-engine.js';
import { caricaGlossarioData, renderGlossarioDrawer, inizializzaGlossarioTooltips } from './glossario-engine.js';
import { getSavedLocale, t } from './i18n-engine.js';
import { validaInput, verificaRisultato } from './validazione-engine.js';

const el = (id) => document.getElementById(id);

let ultimoStatoRicetta = null;
let ultimoDatiCalcolati = null;
let ultimoPianoGenerato = [];

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

// STATO BLEND FARINE
let isBlendMode = false;
let blendUnit = 'w'; // 'w' oppure 'prot'
let wConsigliatoAttuale = 270;

function aggiornaSuggerimentoW() {
    const tipoPizza = el('tipo_pizza')?.value || 'napoletana';
    let oreTotali = 8;
    let oreFrigo = 0;

    if (el('tipo_impasto')?.value === 'diretto') {
        oreTotali = parseFloat(el('tempoLievTotale_diretto')?.value) || 8;
        oreFrigo = parseFloat(el('tempoFrigo_diretto')?.value) || 0;
    } else {
        oreTotali = 24;
        oreFrigo = 18;
    }

    const suggerimento = suggerisciWPerRicetta({ tipoPizza, oreTotali, oreFrigo });
    wConsigliatoAttuale = suggerimento.wConsigliato;

    const badge = el('badge_w_consigliato');
    if (badge) {
        const isEn = document.documentElement.lang === 'en';
        badge.textContent = `${isEn ? 'Recommended' : 'Consigliato'}: W ${wConsigliatoAttuale} (${wToProteine(wConsigliatoAttuale)}% prot)`;
        badge.title = t(suggerimento.descrizione, {}, '');
    }
}

function getValoriBlendInW() {
    let valA = parseFloat(el('blend_val_a')?.value) || 350;
    let valB = parseFloat(el('blend_val_b')?.value) || 180;
    let target = parseFloat(el('blend_target_input')?.value) || 280;

    if (blendUnit === 'prot') {
        valA = proteineToW(valA);
        valB = proteineToW(valB);
        target = proteineToW(target);
    }

    return { wForte: valA, wDebole: valB, wTarget: target };
}

function aggiornaCalcoloBlend(pesoFarinaTotale = 1000) {
    if (!el('sezione_blend')) return null;

    const { wForte, wDebole, wTarget } = getValoriBlendInW();
    const risultato = calcolaTaglioDueFarine({
        wForte,
        wDebole,
        wTarget,
        pesoTotale: pesoFarinaTotale,
        nomeForte: 'Farina Forte (A)',
        nomeDebole: 'Farina Debole (B)'
    });

    // Aggiorna UI anteprima
    el('blend_target_preview').textContent = `${wTarget} W`;
    el('blend_res_perc_a').textContent = `${risultato.percentualeForte}%`;
    el('blend_res_perc_b').textContent = `${risultato.percentualeDebole}%`;

    el('blend_res_peso_a').textContent = pesoFarinaTotale > 0 ? `${risultato.pesoForte} g` : '-';
    el('blend_res_peso_b').textContent = pesoFarinaTotale > 0 ? `${risultato.pesoDebole} g` : '-';

    el('blend_res_w_eff').textContent = `${risultato.wEffettivo} W`;
    el('blend_res_prot_eff').textContent = `~${risultato.proteineEffettive}% prot`;

    el('blend_bar_a').style.width = `${risultato.percentualeForte}%`;
    el('blend_bar_b').style.width = `${risultato.percentualeDebole}%`;

    const alertEl = el('blend_alert');
    if (risultato.avviso) {
        // Il motore restituisce chiave i18n e parametri: il testo si compone qui,
        // così l'avviso segue la lingua attiva invece di restare in italiano.
        alertEl.textContent = `⚠️ ${t(risultato.avviso.chiave, risultato.avviso.params, risultato.avviso.chiave)}`;
        alertEl.style.display = 'block';
    } else {
        alertEl.style.display = 'none';
    }

    // Se in modalità blend, sincronizziamo il campo forza_farina base con il W target/effettivo
    if (isBlendMode) {
        el('forza_farina').value = risultato.wEffettivo;
    }

    return risultato;
}

function cambiaUnitaBlend(nuovaUnita) {
    if (blendUnit === nuovaUnita) return;
    blendUnit = nuovaUnita;

    const btnW = el('btn_unit_w');
    const btnProt = el('btn_unit_prot');
    const labelA = el('label_val_a');
    const labelB = el('label_val_b');
    const labelTarget = el('label_target');
    const inputA = el('blend_val_a');
    const inputB = el('blend_val_b');
    const inputTarget = el('blend_target_input');

    if (nuovaUnita === 'prot') {
        btnW.classList.remove('active');
        btnProt.classList.add('active');

        labelA.textContent = 'Proteine % (es. 14.0% Manitoba)';
        labelB.textContent = 'Proteine % (es. 10.5% Tipo 0)';
        labelTarget.textContent = 'Proteine % obiettivo';

        inputA.value = wToProteine(parseFloat(inputA.value) || 380);
        inputA.step = '0.1';
        inputB.value = wToProteine(parseFloat(inputB.value) || 180);
        inputB.step = '0.1';
        inputTarget.value = wToProteine(parseFloat(inputTarget.value) || 280);
        inputTarget.step = '0.1';
    } else {
        btnProt.classList.remove('active');
        btnW.classList.add('active');

        labelA.textContent = 'Forza W (es. Manitoba)';
        labelB.textContent = 'Forza W (es. Tipo 0 / 00)';
        labelTarget.textContent = 'Valore W desiderato';

        inputA.value = proteineToW(parseFloat(inputA.value) || 14.0);
        inputA.step = '1';
        inputB.value = proteineToW(parseFloat(inputB.value) || 10.5);
        inputB.step = '1';
        inputTarget.value = proteineToW(parseFloat(inputTarget.value) || 12.5);
        inputTarget.step = '1';
    }

    aggiornaCalcoloBlend();
}

function impostaModalitaBlend(attivo) {
    isBlendMode = attivo;
    el('btn_mode_singola').classList.toggle('active', !attivo);
    el('btn_mode_blend').classList.toggle('active', attivo);
    el('sezione_blend').classList.toggle('hidden', !attivo);

    if (attivo) {
        aggiornaCalcoloBlend();
    }
}

function aggiornaMetodiDisponibili() {
    const tipoPizza = el('tipo_pizza').value;
    const metodoSelect = el('tipo_impasto');
    const metodiDisponibili = metodiPerPizza[tipoPizza] || [];
    const metodoAttuale = metodoSelect.value;

    // Le opzioni statiche nel markup portano data-i18n="method.*": ricostruirle
    // con testo fisso le lasciava in italiano anche in inglese e ne cancellava
    // l'attributo, così nemmeno un cambio lingua successivo le recuperava.
    // Qui si traduce subito e si rimette l'attributo per le traduzioni future.
    metodoSelect.innerHTML = '';
    metodiDisponibili.forEach((metodo) => {
        const opt = document.createElement('option');
        const chiave = `method.${metodo}`;
        opt.value = metodo;
        opt.setAttribute('data-i18n', chiave);
        opt.textContent = t(chiave, {}, metodo);
        metodoSelect.appendChild(opt);
    });

    metodoSelect.value = metodiDisponibili.includes(metodoAttuale) ? metodoAttuale : metodiDisponibili[0];
    aggiornaSezioneVisibile();
    sincronizzaTeglia();
    aggiornaSuggerimentoW();
}

function aggiornaSezioneVisibile() {
    const metodo = el('tipo_impasto').value;
    Object.values(SEZIONI_METODO).forEach((id) => el(id).classList.add('hidden'));
    const idAttivo = SEZIONI_METODO[metodo];
    if (idAttivo) el(idAttivo).classList.remove('hidden');
    aggiornaSuggerimentoW();
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

// Campi letti da ogni metodo: nome logico -> id dell'input nel markup.
// Serve sia a raccogliere i valori sia a evidenziare il campo in errore.
const CAMPI_PER_METODO = {
    diretto: {
        pesoPanetto: 'peso_panetto_diretto',
        idratazioneTotale: 'idratazione_totale_diretto',
        numPanetti: 'num_panetti_diretto',
        tempoLievitazioneTotale: 'tempoLievTotale_diretto',
        oreFrigo: 'tempoFrigo_diretto',
        temperaturaAmbiente: 'temperatura_ambiente_diretto',
    },
    biga: {
        pesoPanetto: 'peso_panetto_biga',
        idratazioneTotale: 'idratazione_totale_biga',
        percentualeBiga: 'percentuale_biga',
        numPanetti: 'num_panetti_biga',
    },
    poolish: {
        pesoPanetto: 'peso_panetto_poolish',
        idratazioneTotale: 'idratazione_totale_poolish',
        percentualePoolish: 'percentuale_poolish',
        numPanetti: 'num_panetti_poolish',
    },
    lievito_madre: {
        pesoPanetto: 'peso_panetto_lievito',
        idratazioneTotale: 'idratazione_totale_lievito',
        percentualePastaMadre: 'percentuale_lievito',
        numPanetti: 'num_panetti_lievito',
    },
    biga_poolish: {
        pesoPanetto: 'peso_panetto_biga_poolish',
        idratazioneTotale: 'idratazione_totale_biga_poolish',
        percentualeBiga: 'percentuale_biga_bp',
        percentualePoolish: 'percentuale_poolish_bp',
        numPanetti: 'num_panetti_biga_poolish',
    },
};

// Nome logico del campo -> suffisso della chiave i18n usata in LIMITI,
// per risalire dall'errore all'input da evidenziare.
const MAPPA_LABEL = {
    pesoPanetto: 'ball_weight',
    numPanetti: 'ball_count',
    idratazioneTotale: 'hydration',
    temperaturaAmbiente: 'temperature',
    tempoLievitazioneTotale: 'total_time',
    oreFrigo: 'fridge_time',
    percentualeBiga: 'biga_perc',
    percentualePoolish: 'poolish_perc',
    percentualePastaMadre: 'sourdough_perc',
};

// Legge i valori grezzi del metodo attivo. Un campo vuoto diventa NaN e non un
// valore di comodo: è la validazione a decidere che farne, così un input
// mancante non può passare silenziosamente per un default plausibile.
function leggiInput(tipoImpasto) {
    const mappa = CAMPI_PER_METODO[tipoImpasto];
    if (!mappa) return null;

    const input = {};
    for (const [nome, id] of Object.entries(mappa)) {
        const valore = el(id)?.value;
        input[nome] = nome === 'numPanetti'
            ? parseInt(valore, 10)
            : parseFloat(valore);
    }
    return input;
}

// Applica/rimuove l'evidenziazione sui campi del metodo attivo.
function evidenziaCampi(tipoImpasto, nomiCampi = []) {
    const mappa = CAMPI_PER_METODO[tipoImpasto] || {};
    for (const [nome, id] of Object.entries(mappa)) {
        el(id)?.classList.toggle('is-invalid', nomiCampi.includes(nome));
    }
}

// Traduce un messaggio di validazione. Le etichette dei campi sono a loro volta
// chiavi i18n, quindi vanno risolte prima di sostituirle nel testo.
function testoMessaggio(msg) {
    const params = { ...msg.params };
    if (params.campo) params.campo = t(params.campo, {}, params.campo);
    return t(msg.chiave, params, msg.chiave);
}

function mostraMessaggiValidazione(errori, avvisi) {
    const box = el('validazione-messaggi');
    if (!box) return;

    if (errori.length === 0 && avvisi.length === 0) {
        box.innerHTML = '';
        box.hidden = true;
        return;
    }

    const riga = (msg, classe) => {
        const p = document.createElement('p');
        p.className = classe;
        p.textContent = testoMessaggio(msg);
        return p;
    };

    box.innerHTML = '';
    errori.forEach((e) => box.appendChild(riga(e, 'validation-error')));
    avvisi.forEach((a) => box.appendChild(riga(a, 'validation-warning')));
    box.hidden = false;
}

/**
 * Legge il form, valida e calcola. Restituisce null se gli input non
 * descrivono una ricetta realizzabile: in quel caso i messaggi sono già
 * stati mostrati all'utente.
 */
function calcolaRicetta() {
    const { tipoPizza, tipoImpasto } = leggiComune();
    const input = leggiInput(tipoImpasto);
    if (!input) return null;

    const esito = validaInput(tipoImpasto, input);
    if (!esito.valido) {
        // I campi citati negli errori vengono evidenziati nel form.
        const campiInErrore = Object.keys(CAMPI_PER_METODO[tipoImpasto] || {})
            .filter((nome) => esito.errori.some((e) => e.params?.campo === `valid.field.${MAPPA_LABEL[nome]}`));
        evidenziaCampi(tipoImpasto, campiInErrore);
        mostraMessaggiValidazione(esito.errori, esito.avvisi);
        el('validazione-messaggi')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return null;
    }

    evidenziaCampi(tipoImpasto, []);

    let dati;
    switch (tipoImpasto) {
        case 'diretto':
            dati = calcolaImpastoDiretto({ ...input, tempoLievTotale: input.tempoLievitazioneTotale, tipoPizza });
            break;
        case 'biga':
            dati = calcolaImpastoBiga({ ...input, tipoPizza });
            break;
        case 'poolish':
            dati = calcolaImpastoPoolish({ ...input, tipoPizza });
            break;
        case 'lievito_madre':
            dati = calcolaImpastoLievitoMadre({ ...input, tipoPizza });
            break;
        case 'biga_poolish':
            dati = calcolaImpastoBigaPoolish({ ...input, tipoPizza });
            break;
        default:
            return null;
    }

    // Rete di sicurezza: se malgrado la validazione un valore risultasse non
    // finito o negativo, si avvisa invece di stampare NaN nella scheda.
    const controllo = verificaRisultato(dati);
    if (!controllo.pulito) {
        mostraMessaggiValidazione(
            [{ chiave: 'valid.result_not_computable', params: {} }],
            esito.avvisi,
        );
        return null;
    }

    mostraMessaggiValidazione([], esito.avvisi);
    return dati;
}

function idratazioneTotaleAttuale(tipoImpasto) {
    return parseFloat(el(CAMPO_IDRATAZIONE[tipoImpasto]).value);
}

function animateNumber(element, targetValue, decimals = 0, duration = 400) {
    if (!element) return;

    // Ultima barriera prima del DOM: un valore non finito arriverebbe a schermo
    // come "NaN" o "Infinity". Meglio un trattino, che si legge come "non
    // disponibile" invece che come un difetto dell'applicazione.
    if (!Number.isFinite(targetValue)) {
        element.textContent = '—';
        delete element.dataset.currentVal;
        return;
    }

    const scriviValore = () => {
        element.dataset.currentVal = targetValue;
        element.textContent = decimals > 0 ? targetValue.toFixed(decimals) : Math.round(targetValue);
    };

    // Chi ha chiesto meno animazioni riceve subito il valore finale. Il CSS
    // rispetta gia' questa preferenza (vedi @media prefers-reduced-motion),
    // ma il conteggio animato e' JavaScript e la ignorava. Scrivere il valore
    // direttamente elimina anche la dipendenza da requestAnimationFrame, che
    // non parte in ogni contesto di rendering.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        scriviValore();
        return;
    }

    const startValue = parseFloat(element.dataset.currentVal) || 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const current = startValue + (targetValue - startValue) * easeOutQuad;
        element.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            scriviValore();
        }
    }
    requestAnimationFrame(update);
}

function estraiMinutiTimer(testo) {
    // Riconosce es: "20-30 minuti", "30-45 minuti", "15-20 minuti", "45-60 minuti", "10-15 minuti", "20 minuti"
    const matchMin = testo.match(/(\d+)(?:-(\d+))?\s+minuti/i);
    if (matchMin) {
        // Se c'è un intervallo (es. 20-30), prendiamo il valore medio o superiore
        const val1 = parseInt(matchMin[1], 10);
        const val2 = matchMin[2] ? parseInt(matchMin[2], 10) : val1;
        return val2 || val1;
    }
    return null;
}

function renderRisultato(dati, tipoImpasto) {
    const { tipoPizza, forzaFarina } = leggiComune();
    const idratazioneTotale = idratazioneTotaleAttuale(tipoImpasto);

    const totali = estraiTotaliMacro(tipoImpasto, dati);
    const pesoFarinaTot = Math.round(totali.farina);

    let blendInfo = null;
    if (isBlendMode) {
        blendInfo = aggiornaCalcoloBlend(pesoFarinaTot);
    }

    const [pesoId, numId] = CAMPI_PESO_NUMERO[tipoImpasto] || [];
    const numPanetti = parseInt(el(numId)?.value, 10) || dati.numPanetti || 4;
    const pesoPanetto = parseFloat(el(pesoId)?.value) || dati.pesoPanetto || 250;

    // Salva stato per generazione Pizza Card
    ultimoStatoRicetta = {
        tipoPizza,
        tipoImpasto,
        idratazione: idratazioneTotale,
        numPanetti,
        pesoPanetto,
        totali,
        forzaFarina: isBlendMode && blendInfo ? blendInfo.wEffettivo : (forzaFarina || 260),
        blend: isBlendMode ? blendInfo : null,
        tempAmbiente: parseFloat(el('temperatura_ambiente_diretto')?.value) || 22,
        oreTotali: parseFloat(el('tempoLievTotale_diretto')?.value) || 24,
        oreFrigo: parseFloat(el('tempoFrigo_diretto')?.value) || 18,
    };

    ultimoDatiCalcolati = dati;
    const isEn = (document.documentElement.lang || getSavedLocale()) === 'en';

    // La napoletana non prevede zucchero né olio: le celle a zero non vanno
    // mostrate, altrimenti la scheda suggerisce ingredienti che non fanno
    // parte della ricetta.
    const comp = composizionePizza(tipoPizza);

    const grid = el('risultato-grid');
    grid.innerHTML = `
        <div><strong id="res-farina">0</strong><span>${isEn ? 'g total flour' : 'g farina totale'}</span></div>
        <div><strong id="res-acqua">0</strong><span>${isEn ? 'g water' : 'g acqua'}</span></div>
        <div><strong id="res-sale">0</strong><span>${isEn ? 'g salt' : 'g sale'}</span></div>
        ${comp.zucchero > 0 ? `<div><strong id="res-zucchero">0</strong><span>${isEn ? 'g sugar' : 'g zucchero'}</span></div>` : ''}
        ${comp.olio > 0 ? `<div><strong id="res-olio">0</strong><span>${isEn ? 'g oil' : 'g olio'}</span></div>` : ''}
        <div><strong id="res-lievito">0.00</strong><span>${isEn ? 'g yeast' : 'g lievito'}</span></div>
        ${isBlendMode && blendInfo && blendInfo.possibile ? `
        <div class="recipe-blend-breakdown">
            <strong>🌾 ${isEn ? `Flour Blend (${blendInfo.wEffettivo} W — ~${blendInfo.proteineEffettive}% protein):` : `Taglio Farine (${blendInfo.wEffettivo} W — ~${blendInfo.proteineEffettive}% proteine):`}</strong>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px;">
                <span>🔴 <strong>${blendInfo.pesoForte} g</strong> ${isEn ? 'Strong Flour' : 'Farina Forte'} (${blendInfo.percentualeForte}%)</span>
                <span>🔵 <strong>${blendInfo.pesoDebole} g</strong> ${isEn ? 'Weak Flour' : 'Farina Debole'} (${blendInfo.percentualeDebole}%)</span>
            </div>
        </div>
        ` : ''}
    `;

    animateNumber(el('res-farina'), pesoFarinaTot, 0);
    animateNumber(el('res-acqua'), Math.round(totali.acqua), 0);
    animateNumber(el('res-sale'), Math.round(totali.sale), 0);
    animateNumber(el('res-zucchero'), Math.round(totali.zucchero), 0);
    animateNumber(el('res-olio'), Math.round(totali.olio), 0);
    animateNumber(el('res-lievito'), totali.lievito, 2);

    const { passi, avvisi } = generaProcedura({
        tipoPizza,
        tipoImpasto,
        idratazioneTotale,
        forzaFarina: isBlendMode && blendInfo ? blendInfo.wEffettivo : forzaFarina,
        dati,
        blend: isBlendMode ? blendInfo : null,
        locale: isEn ? 'en' : 'it'
    });

    el('risultato-steps').innerHTML = passi.map((p, idx) => {
        const minuti = estraiMinutiTimer(p);
        const timerButton = minuti ? ` <button type="button" class="step-timer-btn" data-minutes="${minuti}" data-label="${isEn ? 'Step' : 'Passo'} ${idx + 1}">⏱️ ${isEn ? 'Start' : 'Avvia'} ${minuti} min</button>` : '';
        return `<li style="animation-delay: ${idx * 60}ms">${p}${timerButton}</li>`;
    }).join('');

    el('risultato-avvisi').innerHTML = avvisi.map((a) => `<p>${a}</p>`).join('');

    // Aggiorna tabella di marcia / cronoprogramma
    aggiornaCronoprogrammaUI();

    // Render della curva di fermentazione SVG dinamica
    const curveContainer = el('fermentation-curve-container');
    if (curveContainer) {
        curveContainer.innerHTML = generaCurvaFermentazioneSVG({
            oreTotali: ultimoStatoRicetta.oreTotali || 8,
            oreFrigo: ultimoStatoRicetta.oreFrigo || 0,
            tempAmbiente: ultimoStatoRicetta.tempAmbiente || 22,
            tipoImpasto: ultimoStatoRicetta.tipoImpasto || 'diretto',
            tipoPizza: ultimoStatoRicetta.tipoPizza || 'napoletana'
        });
    }

    // Collega i pulsanti timer generati dinamicamente
    el('risultato-steps').querySelectorAll('.step-timer-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const min = parseFloat(btn.dataset.minutes) || 10;
            const label = btn.dataset.label || 'Timer Impasto';
            avviaTimerCucina(min, label);
        });
    });

    const resBox = el('risultato');
    resBox.classList.remove('hidden');
    resBox.classList.remove('animate-reveal');
    void resBox.offsetWidth; // trigger reflow
    resBox.classList.add('animate-reveal');
    resBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// --- GESTIONE TIMER CUCINA ---
function avviaTimerCucina(minuti, label) {
    const floating = el('floating-timer');
    const digits = el('floating-timer-digits');
    const labelEl = el('floating-timer-label');
    const pauseBtn = el('btn-timer-pause');

    if (floating) floating.classList.remove('hidden');
    if (labelEl) labelEl.textContent = label;
    if (pauseBtn) pauseBtn.textContent = '⏸️';

    kitchenTimer.start(minuti, label, {
        onTick: (remaining, total, lbl) => {
            if (digits) digits.textContent = kitchenTimer.constructor.formatTime(remaining);
        },
        onComplete: (lbl) => {
            if (digits) digits.textContent = '00:00';
            if (labelEl) labelEl.textContent = t('calc.timer_ready', {}, '🎉 Pronto!');
            setTimeout(() => {
                if (!kitchenTimer.isRunning && floating) {
                    floating.classList.add('hidden');
                }
            }, 6000);
        }
    });
}

el('btn-timer-pause')?.addEventListener('click', () => {
    kitchenTimer.pause();
    const btn = el('btn-timer-pause');
    if (btn) btn.textContent = kitchenTimer.isPaused ? '▶️' : '⏸️';
});

el('btn-timer-stop')?.addEventListener('click', () => {
    kitchenTimer.stop();
    const floating = el('floating-timer');
    if (floating) floating.classList.add('hidden');
});

// --- GESTIONE CONDIVISIONE PIZZA CARD ---
el('btn-share-card')?.addEventListener('click', async () => {
    if (!ultimoStatoRicetta) return;

    const btn = el('btn-share-card');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Generazione in corso...';
    btn.disabled = true;

    try {
        const blob = await generaPizzaCardBlob(ultimoStatoRicetta);
        if (!blob) throw new Error('Impossibile generare l\'immagine.');

        const file = new File([blob], `pizzalab-${ultimoStatoRicetta.tipoPizza}.png`, { type: 'image/png' });

        // Se il browser supporta Web Share API con file (mobile Android/iOS)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: `Scheda PizzaLab - ${ultimoStatoRicetta.tipoPizza}`,
                text: `Ecco la ricetta calcolata su PizzaLab per ${ultimoStatoRicetta.tipoPizza} (${ultimoStatoRicetta.idratazione}% idratazione)!`,
                files: [file],
            });
        } else {
            // Fallback download istantaneo
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pizzalab-${ultimoStatoRicetta.tipoPizza}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            alert('Errore nella condivisione della Pizza Card: ' + e.message);
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- GESTIONE CRONOPROGRAMMA / TIMELINE ORARIA ---
function formattaDataOra(d) {
    const isEn = document.documentElement.lang === 'en';
    const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString(isEn ? 'en-US' : 'it-IT', options);
}

function aggiornaCronoprogrammaUI() {
    if (!ultimoStatoRicetta || !el('schedule-timeline-container')) return;

    const infornataInput = el('schedule_infornata_time');
    let targetDate;
    if (infornataInput && infornataInput.value) {
        targetDate = new Date(infornataInput.value);
    } else {
        const now = new Date();
        targetDate = new Date(now);
        targetDate.setHours(20, 0, 0, 0);
        const oreTotali = ultimoStatoRicetta.oreTotali || 8;
        if (targetDate.getTime() - (oreTotali * 3600000) <= now.getTime()) {
            targetDate.setDate(targetDate.getDate() + 1);
        }
        if (infornataInput) {
            const offset = targetDate.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(targetDate.getTime() - offset)).toISOString().slice(0, 16);
            infornataInput.value = localISOTime;
        }
    }

    let plan = [];
    const tipo = ultimoStatoRicetta.tipoImpasto;
    const loc = document.documentElement.lang === 'en' ? 'en' : 'it';
    if (tipo === 'diretto') {
        const tot = ultimoStatoRicetta.oreTotali || 24;
        const frigo = ultimoStatoRicetta.oreFrigo || 0;
        plan = calculatePlanDiretto(targetDate, tot, frigo, loc);
    } else if (tipo === 'biga') {
        const perc = parseFloat(el('percentuale_biga')?.value) || 30;
        plan = calculatePlanBiga(targetDate, perc, loc);
    } else if (tipo === 'poolish') {
        const perc = parseFloat(el('percentuale_poolish')?.value) || 20;
        plan = calculatePlanPoolish(targetDate, perc, loc);
    } else if (tipo === 'lievito_madre') {
        const perc = parseFloat(el('percentuale_lievito')?.value) || 20;
        plan = calculatePlanLievitoMadre(targetDate, perc, loc);
    } else if (tipo === 'biga_poolish') {
        const percB = parseFloat(el('percentuale_biga_bp')?.value) || 30;
        const percP = parseFloat(el('percentuale_poolish_bp')?.value) || 20;
        plan = calculatePlanBigaPoolish(targetDate, percB, percP, loc);
    }

    ultimoPianoGenerato = plan;

    const container = el('schedule-timeline-container');
    if (!container) return;

    container.innerHTML = plan.map((step, idx) => {
        const isInfornata = idx === plan.length - 1;
        return `
            <div class="schedule-item ${isInfornata ? 'infornata' : ''}">
                <span class="schedule-time-badge">${formattaDataOra(step.time)}</span>
                <div class="schedule-action-text">${step.action}</div>
            </div>
        `;
    }).join('');
}

el('schedule_infornata_time')?.addEventListener('change', aggiornaCronoprogrammaUI);
el('schedule_infornata_time')?.addEventListener('input', aggiornaCronoprogrammaUI);

// --- ESPORTAZIONE CALENDARIO (.ICS) ---
el('btn-export-calendar')?.addEventListener('click', () => {
    if (!ultimoStatoRicetta) return;
    if (!ultimoPianoGenerato || ultimoPianoGenerato.length === 0) {
        aggiornaCronoprogrammaUI();
    }
    esportaCalendarioICS(ultimoPianoGenerato, ultimoStatoRicetta);
});

// --- STAMPA SCHEDA RICETTA A4 ---
el('btn-stampa-scheda')?.addEventListener('click', () => {
    if (!ultimoStatoRicetta) return;
    stampaSchedaRicetta(ultimoStatoRicetta);
});

// --- SALVATAGGIO NEL DIARIO FERMENTAZIONI ---
el('btn-salva-diario')?.addEventListener('click', () => {
    if (!ultimoStatoRicetta) return;

    const btn = el('btn-salva-diario');
    const originalText = btn.innerHTML;
    const isEn = document.documentElement.lang === 'en';

    try {
        const diarioKey = 'diarioFermentazioni';
        const lista = JSON.parse(localStorage.getItem(diarioKey)) || [];

        const nuovaVoce = {
            id: Date.now().toString(),
            nome: `${ultimoStatoRicetta.tipoPizza.charAt(0).toUpperCase() + ultimoStatoRicetta.tipoPizza.slice(1)} (${ultimoStatoRicetta.tipoImpasto})`,
            tipo_pizza: ultimoStatoRicetta.tipoPizza,
            tipo_impasto: ultimoStatoRicetta.tipoImpasto,
            data: new Date().toISOString(),
            idratazione: ultimoStatoRicetta.idratazione,
            tempo: ultimoStatoRicetta.oreTotali || 8,
            tempo_lievitazione: ultimoStatoRicetta.oreTotali || 8,
            tempo_frigo: ultimoStatoRicetta.oreFrigo || 0,
            temperatura_ambiente: ultimoStatoRicetta.tempAmbiente || 22,
            num_panetti: ultimoStatoRicetta.numPanetti,
            peso_panetto: ultimoStatoRicetta.pesoPanetto,
            farina_w: ultimoStatoRicetta.forzaFarina,
            percentuale_biga: parseFloat(el('percentuale_biga')?.value) || 30,
            percentuale_poolish: parseFloat(el('percentuale_poolish')?.value) || 20,
            percentuale_lievito_madre: parseFloat(el('percentuale_lievito')?.value) || 20,
            lievito: `${ultimoStatoRicetta.totali.lievito.toFixed(2)} g`,
            totali: ultimoStatoRicetta.totali,
            blend: ultimoStatoRicetta.blend,
            note: isEn 
                ? `Calculated with PizzaLab. Flour: ${Math.round(ultimoStatoRicetta.totali.farina)}g (${ultimoStatoRicetta.forzaFarina}W), Water: ${Math.round(ultimoStatoRicetta.totali.acqua)}g, Salt: ${Math.round(ultimoStatoRicetta.totali.sale)}g.`
                : `Calcolato con PizzaLab. Farina: ${Math.round(ultimoStatoRicetta.totali.farina)}g (${ultimoStatoRicetta.forzaFarina}W), Acqua: ${Math.round(ultimoStatoRicetta.totali.acqua)}g, Sale: ${Math.round(ultimoStatoRicetta.totali.sale)}g.`
        };

        lista.unshift(nuovaVoce);
        localStorage.setItem(diarioKey, JSON.stringify(lista));

        btn.innerHTML = isEn ? '<span>✅</span> Saved to Diary!' : '<span>✅</span> Salvato nel Diario!';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#10b981';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 3000);
    } catch (e) {
        alert(isEn ? 'Error saving to Diary: ' + e.message : 'Errore nel salvataggio nel Diario: ' + e.message);
    }
});

// =========================================================================
// PIANO OPERATIVO INTERATTIVO A SCORRIMENTO (MODALITÀ IN CUCINA)
// =========================================================================
let pianoPassi = [];
let pianoIndex = 0;
let wakeLock = null;
let wakeLockAttivo = false; // stato desiderato dall'utente, sopravvive al rilascio automatico del browser

async function attivaWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLockAttivo = true;
            wakeLock.addEventListener('release', () => {
                wakeLock = null;
            });
            const btn = el('btn-wakelock-toggle');
            if (btn) {
                btn.textContent = '💡 Schermo Attivo: ON';
                btn.style.borderColor = 'var(--primary-color)';
                btn.style.color = 'var(--primary-color)';
            }
        } catch (err) {
            console.warn('Wake Lock error:', err);
        }
    }
}

function disattivaWakeLock() {
    wakeLockAttivo = false;
    if (wakeLock) {
        wakeLock.release().then(() => { wakeLock = null; });
        const btn = el('btn-wakelock-toggle');
        if (btn) {
            btn.textContent = '💡 Schermo Attivo';
            btn.style.borderColor = '';
            btn.style.color = '';
        }
    }
}

el('btn-wakelock-toggle')?.addEventListener('click', () => {
    if (wakeLock) {
        disattivaWakeLock();
    } else {
        attivaWakeLock();
    }
});

// Il browser rilascia automaticamente il Wake Lock quando la tab perde
// visibilità (es. utente passa ad un'altra app in cucina): lo ri-acquisiamo
// se l'utente lo aveva attivato esplicitamente.
document.addEventListener('visibilitychange', () => {
    if (wakeLockAttivo && !wakeLock && document.visibilityState === 'visible') {
        attivaWakeLock();
    }
});

function assegnaFase(idx, totale, testo) {
    const isEn = document.documentElement.lang === 'en';
    if (/miscela|farina/i.test(testo)) return isEn ? 'Phase: Flour Preparation' : 'Fase: Preparazione Farine';
    if (/biga|poolish|lievito madre/i.test(testo) && idx === 0) return isEn ? 'Phase: Preferment' : 'Fase: Prefermento';
    if (/autolisi/i.test(testo)) return isEn ? 'Phase: Autolyse' : 'Fase: Autolisi';
    if (/impasta|incordatura|planetaria|lavora/i.test(testo)) return isEn ? 'Phase: Mixing & Gluten Development' : 'Fase: Impasto & Incordatura';
    if (/pieghe|rinforzo/i.test(testo)) return isEn ? 'Phase: Stretch & Folds' : 'Fase: Pieghe di Struttura';
    if (/massa|puntata|riposare/i.test(testo)) return isEn ? 'Phase: Bulk Fermentation (Puntata)' : 'Fase: Prima Lievitazione (Puntata)';
    if (/staglio|panetti|pirlando/i.test(testo)) return isEn ? 'Phase: Balling & Shaping (Staglio)' : 'Fase: Staglio & Formatura';
    if (/appretto/i.test(testo)) return isEn ? 'Phase: Final Proofing (Appretto)' : 'Fase: Seconda Lievitazione (Appretto)';
    if (/stesura/i.test(testo)) return isEn ? 'Phase: Dough Stretching' : 'Fase: Stesura';
    if (/cottura|inforna/i.test(testo)) return isEn ? 'Phase: Baking' : 'Fase: Cottura';
    return isEn ? `Step ${idx + 1}` : `Passo ${idx + 1}`;
}

function apriPianoOperativo() {
    const stepItems = el('risultato-steps')?.querySelectorAll('li');
    if (!stepItems || stepItems.length === 0) return;

    pianoPassi = Array.from(stepItems).map((li, idx) => {
        const text = li.childNodes[0]?.textContent?.trim() || li.textContent?.trim();
        const minuti = estraiMinutiTimer(text);
        return {
            index: idx,
            fase: assegnaFase(idx, stepItems.length, text),
            text: text,
            minuti: minuti
        };
    });

    pianoIndex = 0;
    const modal = el('piano-operativo-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    if (el('piano-pizza-label') && ultimoStatoRicetta) {
        el('piano-pizza-label').textContent = `${ultimoStatoRicetta.tipoPizza.toUpperCase()} · ${ultimoStatoRicetta.idratazione}% idr.`;
    }

    attivaWakeLock();
    renderPianoCard(0);
}

function chiudiPianoOperativo() {
    if (kitchenTimer.isRunning) {
        kitchenTimer.stop();
    }
    const modal = el('piano-operativo-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    disattivaWakeLock();
}

function renderPianoCard(idx) {
    if (!pianoPassi[idx]) return;
    // Ferma un eventuale timer del passo precedente: cambiare card senza
    // fermarlo lascerebbe un timer attivo ma invisibile, con i suoi tick che
    // continuerebbero a sovrascrivere il display del nuovo passo.
    if (kitchenTimer.isRunning) {
        kitchenTimer.stop();
    }
    const passo = pianoPassi[idx];
    pianoIndex = idx;

    const isEn = document.documentElement.lang === 'en';

    // Aggiorna contatore e progress bar
    el('piano-counter').textContent = isEn ? `Step ${idx + 1} of ${pianoPassi.length}` : `Passo ${idx + 1} di ${pianoPassi.length}`;
    const perc = Math.round(((idx + 1) / pianoPassi.length) * 100);
    el('piano-progress-fill').style.width = `${perc}%`;

    // Aggiorna card
    el('piano-phase-badge').textContent = passo.fase;
    el('piano-step-text').textContent = passo.text;

    // Reset card animation
    const card = el('piano-current-card');
    card.classList.remove('animate-reveal');
    void card.offsetWidth;
    card.classList.add('animate-reveal');

    // Gestione Timer Card
    const timerBox = el('piano-timer-container');
    if (passo.minuti) {
        timerBox.classList.remove('hidden');
        el('piano-timer-label').textContent = isEn 
            ? `Recommended timer for this step: ${passo.minuti} minutes`
            : `Timer consigliato per questa fase: ${passo.minuti} minuti`;
        el('piano-modal-timer-digits').textContent = `${passo.minuti.toString().padStart(2, '0')}:00`;
        el('btn-modal-timer-start').classList.remove('hidden');
        el('btn-modal-timer-start').textContent = `⏱️ ${isEn ? 'Start Timer' : 'Avvia Timer'} (${passo.minuti} min)`;
        el('btn-modal-timer-pause').classList.add('hidden');
        el('btn-modal-timer-stop').classList.add('hidden');
    } else {
        timerBox.classList.add('hidden');
    }

    // Bottoni Footer
    const prevBtn = el('btn-piano-prev');
    const nextBtn = el('btn-piano-next');

    if (prevBtn) {
        prevBtn.disabled = idx === 0;
        prevBtn.style.opacity = idx === 0 ? '0.4' : '1';
        prevBtn.textContent = isEn ? '← Previous' : '← Precedente';
    }

    if (nextBtn) {
        if (idx === pianoPassi.length - 1) {
            nextBtn.textContent = isEn ? '🎉 Complete Plan' : '🎉 Completa Piano';
            nextBtn.classList.add('btn');
        } else {
            nextBtn.textContent = isEn ? 'Next →' : 'Successivo →';
        }
    }
}

// Timer Controls all'interno del Modal
el('btn-modal-timer-start')?.addEventListener('click', () => {
    const passo = pianoPassi[pianoIndex];
    if (!passo || !passo.minuti) return;

    el('btn-modal-timer-start').classList.add('hidden');
    el('btn-modal-timer-pause').classList.remove('hidden');
    el('btn-modal-timer-stop').classList.remove('hidden');

    kitchenTimer.start(passo.minuti, passo.fase, {
        onTick: (rem) => {
            el('piano-modal-timer-digits').textContent = kitchenTimer.constructor.formatTime(rem);
            el('floating-timer-digits').textContent = kitchenTimer.constructor.formatTime(rem);
        },
        onComplete: () => {
            el('piano-modal-timer-digits').textContent = '00:00';
            el('btn-modal-timer-pause').classList.add('hidden');
            el('btn-modal-timer-start').classList.remove('hidden');
            el('btn-modal-timer-start').textContent = '✅ Fase Completata!';
        }
    });
});

el('btn-modal-timer-pause')?.addEventListener('click', () => {
    kitchenTimer.pause();
    el('btn-modal-timer-pause').textContent = kitchenTimer.isPaused ? '▶️ Riprendi' : '⏸️ Pausa';
});

el('btn-modal-timer-stop')?.addEventListener('click', () => {
    kitchenTimer.stop();
    const passo = pianoPassi[pianoIndex];
    if (passo && passo.minuti) {
        el('piano-modal-timer-digits').textContent = `${passo.minuti.toString().padStart(2, '0')}:00`;
    }
    el('btn-modal-timer-start').classList.remove('hidden');
    el('btn-modal-timer-start').textContent = `⏱️ Avvia Timer (${passo?.minuti || 0} min)`;
    el('btn-modal-timer-pause').classList.add('hidden');
    el('btn-modal-timer-stop').classList.add('hidden');
});

// Navigazione Footer
el('btn-piano-prev')?.addEventListener('click', () => {
    if (pianoIndex > 0) renderPianoCard(pianoIndex - 1);
});

el('btn-piano-next')?.addEventListener('click', () => {
    if (pianoIndex < pianoPassi.length - 1) {
        renderPianoCard(pianoIndex + 1);
    } else {
        alert('🎉 Congratulazioni! Hai completato tutte le fasi del piano operativo.');
        chiudiPianoOperativo();
    }
});

el('btn-avvia-piano-operativo')?.addEventListener('click', apriPianoOperativo);
el('btn-chiudi-piano')?.addEventListener('click', chiudiPianoOperativo);

// Tasti freccia da tastiera per cambiare card
window.addEventListener('keydown', (e) => {
    const modal = el('piano-operativo-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e.key === 'ArrowRight' || e.key === ' ') {
        if (pianoIndex < pianoPassi.length - 1) renderPianoCard(pianoIndex + 1);
    } else if (e.key === 'ArrowLeft') {
        if (pianoIndex > 0) renderPianoCard(pianoIndex - 1);
    } else if (e.key === 'Escape') {
        chiudiPianoOperativo();
    }
});


// Event Listeners Base
el('tipo_pizza').addEventListener('change', aggiornaMetodiDisponibili);
el('tipo_impasto').addEventListener('change', () => {
    aggiornaSezioneVisibile();
    sincronizzaTeglia();
});

['teglia_base', 'teglia_altezza', 'teglia_spessore', 'teglia_numero'].forEach((id) => {
    el(id).addEventListener('input', sincronizzaTeglia);
    el(id).addEventListener('change', sincronizzaTeglia);
});

['tempoLievTotale_diretto', 'tempoFrigo_diretto'].forEach((id) => {
    const input = el(id);
    if (input) {
        input.addEventListener('input', aggiornaSuggerimentoW);
        input.addEventListener('change', aggiornaSuggerimentoW);
    }
});

// Event Listeners Blend
el('btn_mode_singola')?.addEventListener('click', () => impostaModalitaBlend(false));
el('btn_mode_blend')?.addEventListener('click', () => impostaModalitaBlend(true));

el('btn_unit_w')?.addEventListener('click', () => cambiaUnitaBlend('w'));
el('btn_unit_prot')?.addEventListener('click', () => cambiaUnitaBlend('prot'));

['blend_val_a', 'blend_val_b', 'blend_target_input'].forEach((id) => {
    const input = el(id);
    if (input) {
        input.addEventListener('input', () => aggiornaCalcoloBlend());
        input.addEventListener('change', () => aggiornaCalcoloBlend());
    }
});

el('btn_applica_suggerito')?.addEventListener('click', () => {
    if (blendUnit === 'prot') {
        el('blend_target_input').value = wToProteine(wConsigliatoAttuale);
    } else {
        el('blend_target_input').value = wConsigliatoAttuale;
    }
    aggiornaCalcoloBlend();
});

// Appena l'utente corregge un campo segnalato, l'evidenziazione sparisce: un
// bordo rosso che resta dopo la correzione fa credere che l'errore ci sia ancora.
Object.values(CAMPI_PER_METODO).forEach((campi) => {
    Object.values(campi).forEach((id) => {
        el(id)?.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));
    });
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
aggiornaSuggerimentoW();
applicaConfigurazioneAssistente();

// =========================================================================
// CONTROLLER STRUMENTI EXTRA (TOPPING, FDT, FORNI)
// =========================================================================

// 1. Tab Switching (Tutti i 7 strumenti)
const toolTabs = [
    { btn: 'tab-btn-topping', panel: 'panel-topping' },
    { btn: 'tab-btn-fdt', panel: 'panel-fdt' },
    { btn: 'tab-btn-forni', panel: 'panel-forni' },
    { btn: 'tab-btn-lieviti', panel: 'panel-lieviti' },
    { btn: 'tab-btn-cereali', panel: 'panel-cereali' },
    { btn: 'tab-btn-sos', panel: 'panel-sos' },
    { btn: 'tab-btn-glossario', panel: 'panel-glossario' },
];

toolTabs.forEach(({ btn, panel }) => {
    el(btn)?.addEventListener('click', () => {
        toolTabs.forEach((t) => {
            el(t.btn)?.classList.remove('active');
            el(t.panel)?.classList.add('hidden');
        });
        el(btn)?.classList.add('active');
        el(panel)?.classList.remove('hidden');
    });
});

// 2. Calcolo Condimenti / Topping
function aggiornaCondimentiUI() {
    if (!el('topping-list-container')) return;

    const forma = el('topping_forma')?.value || 'tonda';
    const isTonda = forma === 'tonda';

    el('group_topping_diametro')?.classList.toggle('hidden', !isTonda);
    el('group_topping_teglia_base')?.classList.toggle('hidden', isTonda);
    el('group_topping_teglia_alt')?.classList.toggle('hidden', isTonda);

    const diametro = parseFloat(el('topping_diametro')?.value) || 30;
    const base = parseFloat(el('topping_teglia_base')?.value) || 40;
    const altezza = parseFloat(el('topping_teglia_alt')?.value) || 60;
    const farcitura = el('topping_farcitura')?.value || 'margherita';
    const isEn = document.documentElement.lang === 'en';

    const res = calcolaCondimenti({ forma, diametro, base, altezza, farcitura, locale: isEn ? 'en' : 'it' });

    el('topping-area-label').textContent = isEn
        ? `Calculated surface area: ~${res.areaCm2} cm² (${isTonda ? `Ø ${diametro} cm` : `${base}x${altezza} cm`})`
        : `Superficie calcolata: ~${res.areaCm2} cm² (${isTonda ? `Ø ${diametro} cm` : `${base}x${altezza} cm`})`;

    const container = el('topping-list-container');
    container.innerHTML = res.condimenti.map((c) => `
        <div class="topping-item-row">
            <div>
                <strong style="color: var(--text-main);">${c.nome}</strong>
                <span style="display: block; font-size: 0.8rem; color: var(--text-dim);">${c.note}</span>
            </div>
            <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.15rem; color: var(--primary-color);">${c.quantita}</span>
        </div>
    `).join('');
}

['topping_forma', 'topping_diametro', 'topping_teglia_base', 'topping_teglia_alt', 'topping_farcitura'].forEach((id) => {
    const elem = el(id);
    if (elem) {
        elem.addEventListener('change', aggiornaCondimentiUI);
        elem.addEventListener('input', aggiornaCondimentiUI);
    }
});

// 3. Calcolo Temperatura Acqua (FDT)
function aggiornaFDTUI() {
    if (!el('fdt-res-temp')) return;

    const tempTarget = parseFloat(el('fdt_target')?.value) || 24;
    const tempAmbiente = parseFloat(el('fdt_ambiente')?.value) || 22;
    const tempFarina = parseFloat(el('fdt_farina')?.value) || (tempAmbiente - 1);
    const tipoImpastatrice = el('fdt_impastatrice')?.value || 'mani';
    const isEn = document.documentElement.lang === 'en';

    const res = calcolaTempAcquaFDT({ tempTarget, tempAmbiente, tempFarina, tipoImpastatrice, locale: isEn ? 'en' : 'it' });

    el('fdt-res-temp').textContent = `${res.tempAcqua}°C`;
    el('fdt-res-tipo').textContent = res.tipoAcqua;
    el('fdt-res-consiglio').textContent = res.consiglio;
}

['fdt_target', 'fdt_ambiente', 'fdt_farina', 'fdt_impastatrice'].forEach((id) => {
    const elem = el(id);
    if (elem) {
        elem.addEventListener('input', aggiornaFDTUI);
        elem.addEventListener('change', aggiornaFDTUI);
    }
});

// Sincronizza T° Ambiente del calcolatore principale con FDT
el('temperatura_ambiente_diretto')?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (val && el('fdt_ambiente')) {
        el('fdt_ambiente').value = val;
        if (el('fdt_farina')) el('fdt_farina').value = val - 1;
        aggiornaFDTUI();
    }
});

// 4. Guida Setup Forni
function renderOvenDetail(ovenId) {
    const data = GUIDA_FORNI.find((f) => f.id === ovenId) || GUIDA_FORNI[0];
    if (!data || !el('oven-detail-title')) return;

    const isEn = document.documentElement.lang === 'en';
    const ovenNome = isEn && data.nome_en ? data.nome_en : data.nome;
    const ovenTempi = isEn && data.tempiCottura_en ? data.tempiCottura_en : data.tempiCottura;
    const ovenSetup = isEn && data.setup_en ? data.setup_en : data.setup;

    el('oven-detail-title').textContent = `${data.icona} ${ovenNome}`;
    el('oven-detail-time').textContent = ovenTempi;
    el('oven-detail-list').innerHTML = ovenSetup.map((s) => `<li>${s}</li>`).join('');
}

document.querySelectorAll('.oven-choice-card').forEach((card) => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.oven-choice-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        renderOvenDetail(card.dataset.oven);
    });
});

// 5. Convertitore Universale Lieviti
function aggiornaYeastConverterUI() {
    if (!el('yeast-res-qty')) return;
    const qty = parseFloat(el('conv_yeast_qty')?.value);
    const fromType = el('conv_yeast_from')?.value || 'lbf';
    const toType = el('conv_yeast_to')?.value || 'lbs';
    const res = convertiLievito({ quantita: qty, daTipo: fromType, aTipo: toType });

    const isEn = document.documentElement.lang === 'en';
    const compEl = el('yeast-res-compensation');

    // Quantità assente o non valida: si azzera il risultato invece di leggere
    // proprietà su un valore nullo.
    if (!res) {
        el('yeast-res-qty').textContent = '—';
        if (compEl) compEl.style.display = 'none';
        return;
    }

    el('yeast-res-qty').textContent = `${res.quantitaEquivalente.toFixed(2)} g`;
    if (compEl) {
        if (res.differenzaFarina > 0 || res.differenzaAcqua > 0) {
            compEl.innerHTML = isEn
                ? `⚠️ <strong>Dough Adjustment:</strong> Subtract <strong>${res.differenzaFarina.toFixed(1)} g</strong> of flour and <strong>${res.differenzaAcqua.toFixed(1)} g</strong> of water from the main dough.`
                : `⚠️ <strong>Adeguamento Impasto:</strong> Sottrai <strong>${res.differenzaFarina.toFixed(1)} g</strong> di farina e <strong>${res.differenzaAcqua.toFixed(1)} g</strong> di acqua dall'impasto principale.`;
            compEl.style.display = 'block';
        } else if (res.differenzaFarina < 0 || res.differenzaAcqua < 0) {
            compEl.innerHTML = isEn
                ? `⚠️ <strong>Dough Adjustment:</strong> Add <strong>${Math.abs(res.differenzaFarina).toFixed(1)} g</strong> of flour and <strong>${Math.abs(res.differenzaAcqua).toFixed(1)} g</strong> of water to the main dough.`
                : `⚠️ <strong>Adeguamento Impasto:</strong> Aggiungi <strong>${Math.abs(res.differenzaFarina).toFixed(1)} g</strong> di farina e <strong>${Math.abs(res.differenzaAcqua).toFixed(1)} g</strong> di acqua all'impasto principale.`;
            compEl.style.display = 'block';
        } else {
            compEl.textContent = isEn ? 'No water/flour compensation needed.' : 'Nessuna compensazione di acqua/farina necessaria.';
            compEl.style.display = 'block';
        }
    }
}

['conv_yeast_qty', 'conv_yeast_from', 'conv_yeast_to'].forEach((id) => {
    const elem = el(id);
    if (elem) {
        elem.addEventListener('input', aggiornaYeastConverterUI);
        elem.addEventListener('change', aggiornaYeastConverterUI);
    }
});

// 6. SOS Impasto (Troubleshooting)
let troubleshootingData = [];
async function initTroubleshooting() {
    troubleshootingData = await caricaTroubleshootingData();
    renderTroubleshootingList(troubleshootingData, '#troubleshoot-cards-container');

    function filtraSOS() {
        const query = el('filter-sos-search')?.value || '';
        const cat = el('filter-sos-cat')?.value || 'all';
        renderTroubleshootingList(troubleshootingData, '#troubleshoot-cards-container', { query, categoria: cat });
    }

    el('filter-sos-search')?.addEventListener('input', filtraSOS);
    el('filter-sos-cat')?.addEventListener('change', filtraSOS);
}

// 7. Cereali & Grani Speciali
async function initCereali() {
    const data = await caricaCerealiData();
    renderCerealiCards(data, '#cereali-cards-container');
}

// 8. Glossario Scientifico & Tooltips
async function initGlossario() {
    const data = await caricaGlossarioData();
    renderGlossarioDrawer(data, '#glossario-cards-container');
    inizializzaGlossarioTooltips(data);
}

// Inizializza tutti gli strumenti
aggiornaCondimentiUI();
aggiornaFDTUI();
renderOvenDetail('domestico');
aggiornaYeastConverterUI();
initTroubleshooting();
initCereali();
initGlossario();

// Aggiorna dinamicamente al cambio lingua
window.addEventListener('pizzalab:locale-changed', () => {
    initTroubleshooting();
    initCereali();
    initGlossario();
    aggiornaYeastConverterUI();
    aggiornaCondimentiUI();
    aggiornaFDTUI();
    const activeOven = document.querySelector('.oven-choice-card.active')?.dataset?.oven || 'domestico';
    renderOvenDetail(activeOven);
    // La funzione si chiama aggiornaSuggerimentoW: il nome sbagliato sollevava
    // un ReferenceError che interrompeva il gestore prima del re-render della
    // scheda, lasciandola nella lingua precedente.
    aggiornaSuggerimentoW();
    if (ultimoStatoRicetta && ultimoDatiCalcolati) {
        renderRisultato(ultimoDatiCalcolati, ultimoStatoRicetta.tipoImpasto);
    }
});



