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

    output.farina.textContent = Math.round(ricetta.pesoFarina);
    output.acqua.textContent = Math.round(ricetta.pesoAcqua);
    output.sale.textContent = Math.round(ricetta.pesoSale);
    output.lievito.textContent = parseFloat(ricetta.pesoLievito).toFixed(2);
}

Object.values(campi).forEach((el) => {
    el.addEventListener('input', aggiorna);
    el.addEventListener('change', aggiorna);
});

aggiorna();
