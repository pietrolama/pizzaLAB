// mini-calc.js
// Mini-calcolatore live in home: usa il motore di calcolo vero (lo stesso
// del calcolatore completo), non numeri finti. Metodo diretto, con tempi di
// lievitazione/temperatura fissi a valori tipici per restare "mini".
import { calcolaImpastoDiretto } from './calcolatore-engine.js';

const TEMPO_LIEVITAZIONE_FISSO = 24; // ore, a temperatura ambiente
const ORE_FRIGO_FISSO = 0;
const TEMPERATURA_FISSA = 22; // °C

const campi = {
    tipo: document.getElementById('mc-tipo'),
    numero: document.getElementById('mc-numero'),
    peso: document.getElementById('mc-peso'),
    idro: document.getElementById('mc-idro'),
};

const output = {
    farina: document.getElementById('mc-farina'),
    acqua: document.getElementById('mc-acqua'),
    sale: document.getElementById('mc-sale'),
    lievito: document.getElementById('mc-lievito'),
};

function animateNumber(element, targetValue, decimals = 0, duration = 350) {
    const startValue = parseFloat(element.dataset.currentVal) || 0;
    if (startValue === targetValue) return;
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

function aggiorna() {
    const numPanetti = parseInt(campi.numero.value, 10);
    const pesoPanetto = parseFloat(campi.peso.value);
    const idratazioneTotale = parseFloat(campi.idro.value);
    const tipoPizza = campi.tipo.value;

    if (!numPanetti || !pesoPanetto || !idratazioneTotale) return;

    const ricetta = calcolaImpastoDiretto({
        pesoPanetto,
        idratazioneTotale,
        numPanetti,
        tempoLievitazioneTotale: TEMPO_LIEVITAZIONE_FISSO,
        oreFrigo: ORE_FRIGO_FISSO,
        temperaturaAmbiente: TEMPERATURA_FISSA,
        tipoPizza,
    });

    animateNumber(output.farina, Math.round(ricetta.pesoFarina), 0);
    animateNumber(output.acqua, Math.round(ricetta.pesoAcqua), 0);
    animateNumber(output.sale, Math.round(ricetta.pesoSale), 0);
    animateNumber(output.lievito, parseFloat(ricetta.pesoLievito), 2);
}

Object.values(campi).forEach((el) => {
    el.addEventListener('input', aggiorna);
    el.addEventListener('change', aggiorna);
});

aggiorna();
