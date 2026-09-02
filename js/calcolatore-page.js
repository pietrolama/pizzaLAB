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
import {
    calcolaTaglioDueFarine,
    proteineToW,
    wToProteine,
    suggerisciWPerRicetta,
} from './flour-blend-engine.js';
import { kitchenTimer } from './timer-engine.js';
import { generaPizzaCardBlob } from './pizza-card-engine.js';

const el = (id) => document.getElementById(id);

let ultimoStatoRicetta = null;

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
        badge.textContent = `Consigliato: W ${wConsigliatoAttuale} (${wToProteine(wConsigliatoAttuale)}% prot)`;
        badge.title = suggerimento.descrizione;
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
        alertEl.textContent = `⚠️ ${risultato.avviso}`;
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

function calcolaRicetta() {
    const { tipoPizza, tipoImpasto } = leggiComune();

    switch (tipoImpasto) {
        case 'diretto':
            return calcolaImpastoDiretto({
                pesoPanetto: parseFloat(el('peso_panetto_diretto').value),
                idratazioneTotale: parseFloat(el('idratazione_totale_diretto').value),
                numPanetti: parseInt(el('num_panetti_diretto').value, 10),
                tempoLievTotale: parseFloat(el('tempoLievTotale_diretto').value),
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

function idratazioneTotaleAttuale(tipoImpasto) {
    return parseFloat(el(CAMPO_IDRATAZIONE[tipoImpasto]).value);
}

function animateNumber(element, targetValue, decimals = 0, duration = 400) {
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
            element.dataset.currentVal = targetValue;
            element.textContent = decimals > 0 ? targetValue.toFixed(decimals) : Math.round(targetValue);
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

    const grid = el('risultato-grid');
    grid.innerHTML = `
        <div><strong id="res-farina">0</strong><span>g farina totale</span></div>
        <div><strong id="res-acqua">0</strong><span>g acqua</span></div>
        <div><strong id="res-sale">0</strong><span>g sale</span></div>
        <div><strong id="res-zucchero">0</strong><span>g zucchero</span></div>
        <div><strong id="res-olio">0</strong><span>g olio</span></div>
        <div><strong id="res-lievito">0.00</strong><span>g lievito</span></div>
        ${isBlendMode && blendInfo && blendInfo.possibile ? `
        <div class="recipe-blend-breakdown">
            <strong>🌾 Taglio Farine (${blendInfo.wEffettivo} W — ~${blendInfo.proteineEffettive}% proteine):</strong>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px;">
                <span>🔴 <strong>${blendInfo.pesoForte} g</strong> Farina Forte (${blendInfo.percentualeForte}%)</span>
                <span>🔵 <strong>${blendInfo.pesoDebole} g</strong> Farina Debole (${blendInfo.percentualeDebole}%)</span>
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
        blend: isBlendMode ? blendInfo : null
    });

    el('risultato-steps').innerHTML = passi.map((p, idx) => {
        const minuti = estraiMinutiTimer(p);
        const timerButton = minuti ? ` <button type="button" class="step-timer-btn" data-minutes="${minuti}" data-label="Passo ${idx + 1}">⏱️ Avvia ${minuti} min</button>` : '';
        return `<li style="animation-delay: ${idx * 60}ms">${p}${timerButton}</li>`;
    }).join('');

    el('risultato-avvisi').innerHTML = avvisi.map((a) => `<p>${a}</p>`).join('');

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
            if (labelEl) labelEl.textContent = '🎉 Pronto!';
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

// =========================================================================
// PIANO OPERATIVO INTERATTIVO A SCORRIMENTO (MODALITÀ IN CUCINA)
// =========================================================================
let pianoPassi = [];
let pianoIndex = 0;
let wakeLock = null;

async function attivaWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
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

function assegnaFase(idx, totale, testo) {
    if (/miscela|farina/i.test(testo)) return 'Fase: Preparazione Farine';
    if (/biga|poolish|lievito madre/i.test(testo) && idx === 0) return 'Fase: Prefermento';
    if (/autolisi/i.test(testo)) return 'Fase: Autolisi';
    if (/impasta|incordatura|planetaria|lavora/i.test(testo)) return 'Fase: Impasto & Incordatura';
    if (/pieghe|rinforzo/i.test(testo)) return 'Fase: Pieghe di Struttura';
    if (/massa|puntata|riposare/i.test(testo)) return 'Fase: Prima Lievitazione (Puntata)';
    if (/staglio|panetti|pirlando/i.test(testo)) return 'Fase: Staglio & Formatura';
    if (/appretto/i.test(testo)) return 'Fase: Seconda Lievitazione (Appretto)';
    if (/stesura/i.test(testo)) return 'Fase: Stesura';
    if (/cottura|inforna/i.test(testo)) return 'Fase: Cottura';
    return `Passo ${idx + 1}`;
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
    const modal = el('piano-operativo-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    disattivaWakeLock();
}

function renderPianoCard(idx) {
    if (!pianoPassi[idx]) return;
    const passo = pianoPassi[idx];
    pianoIndex = idx;

    // Aggiorna contatore e progress bar
    el('piano-counter').textContent = `Passo ${idx + 1} di ${pianoPassi.length}`;
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
        el('piano-timer-label').textContent = `Timer consigliato per questa fase: ${passo.minuti} minuti`;
        el('piano-modal-timer-digits').textContent = `${passo.minuti.toString().padStart(2, '0')}:00`;
        el('btn-modal-timer-start').classList.remove('hidden');
        el('btn-modal-timer-start').textContent = `⏱️ Avvia Timer (${passo.minuti} min)`;
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
    }

    if (nextBtn) {
        if (idx === pianoPassi.length - 1) {
            nextBtn.textContent = '🎉 Completa Piano';
            nextBtn.classList.add('btn');
        } else {
            nextBtn.textContent = 'Successivo →';
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

