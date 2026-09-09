// tools-page.js
// Controller degli strumenti accessori della pagina calcolatore: calcolo
// condimenti, temperatura dell'acqua, guida ai forni, convertitore lieviti,
// SOS impasto, cereali e glossario.
//
// Stavano dentro calcolatore-page.js, che con 1476 righe faceva anche lettura
// del form, validazione, rendering della ricetta, timer, stampa, export
// calendario e piano operativo. E' il file in cui si e' concentrato quasi ogni
// difetto trovato finora, e non per caso: in un file cosi' un refuso come
// aggiornaWConsigliato() al posto di aggiornaSuggerimentoW() passa inosservato.
// Questi sette strumenti col calcolo dell'impasto non hanno nulla a che fare.

import { calcolaCondimenti, calcolaTempAcquaFDT, GUIDA_FORNI } from './tools-engine.js';
import { convertiLievito } from './yeast-converter.js';
import { caricaTroubleshootingData, renderTroubleshootingList } from './troubleshooting-engine.js';
import { caricaCerealiData, renderCerealiCards } from './grains-engine.js';
import { caricaGlossarioData, renderGlossarioDrawer, inizializzaGlossarioTooltips } from './glossario-engine.js';

const el = (id) => document.getElementById(id);

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


/** Prima inizializzazione di tutti gli strumenti. */
export function inizializzaStrumenti() {
    aggiornaCondimentiUI();
    aggiornaFDTUI();
    renderOvenDetail('domestico');
    aggiornaYeastConverterUI();
    initTroubleshooting();
    initCereali();
    initGlossario();
}

/** Ridisegna gli strumenti quando cambia la lingua. */
export function aggiornaStrumentiPerLingua() {
    initTroubleshooting();
    initCereali();
    initGlossario();
    aggiornaYeastConverterUI();
    aggiornaCondimentiUI();
    aggiornaFDTUI();
    const fornoAttivo = document.querySelector('.oven-choice-card.active')?.dataset?.oven || 'domestico';
    renderOvenDetail(fornoAttivo);
}
