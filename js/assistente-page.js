// assistente-page.js
// Wizard a domande che configura il Calcolatore in base a tempo disponibile,
// tipo di pizza, metodo, consistenza desiderata e numero di pizze, usando
// i preset di data/config.json. Passa la configurazione al Calcolatore via
// localStorage (letta da calcolatore-page.js all'avvio).
let configData;
const userSelections = {};
let currentStep = 0;

function capitalizza(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const questionEl = () => document.getElementById('question');
const optionsEl = () => document.getElementById('options-container');
const backButton = () => document.getElementById('back-button');

document.addEventListener('DOMContentLoaded', () => {
    fetch('data/config.json')
        .then((r) => r.json())
        .then((data) => {
            configData = data;
            currentStep = 0;
            nextQuestion();
        })
        .catch((err) => {
            console.error('Errore nel caricamento di config.json:', err);
            questionEl().textContent = 'Contenuto non disponibile al momento.';
        });

    backButton().addEventListener('click', previousQuestion);
});

function nextQuestion() {
    currentStep++;
    renderStep(currentStep);
}

function previousQuestion() {
    if (currentStep <= 1) return;
    currentStep--;
    renderStep(currentStep);
}

function renderStep(step) {
    backButton().disabled = step <= 1;
    optionsEl().style.cssText = 'display: grid; gap: 12px; max-width: 420px; margin: 0 auto;';
    switch (step) {
        case 1: askTimePreference(); break;
        case 2: askTipoPizza(); break;
        case 3: askMetodoImpasto(); break;
        case 4: askConsistenza(); break;
        case 5: askNumeroPanetti(); break;
        case 6: configureCalculator(); break;
        default: break;
    }
}

const TEMPI_PER_METODO = {
    diretto: ['meno_di_8', 'massimo_24'],
    biga: ['massimo_24', 'piu_di_24'],
    poolish: ['massimo_24', 'piu_di_24'],
    lievito_madre: ['massimo_24', 'piu_di_24'],
    biga_poolish: ['piu_di_24'],
};

function metodoCompatibileConTempo(metodo, tempoPreferenza) {
    return (TEMPI_PER_METODO[metodo] || []).includes(tempoPreferenza);
}

function creaOpzioneBottone(label, onClick) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function askTimePreference() {
    questionEl().textContent = 'Quanto tempo hai a disposizione per la lievitazione?';
    const container = optionsEl();
    container.innerHTML = '';
    [
        { label: 'Meno di 8 ore', value: 'meno_di_8' },
        { label: 'Massimo 24 ore', value: 'massimo_24' },
        { label: 'Più di 24 ore', value: 'piu_di_24' },
    ].forEach((opt) => {
        container.appendChild(creaOpzioneBottone(opt.label, () => {
            userSelections.tempo_preferenza = opt.value;
            nextQuestion();
        }));
    });
}

function askTipoPizza() {
    const tempoPreferenza = userSelections.tempo_preferenza;
    questionEl().textContent = 'Che tipo di pizza vuoi preparare?';
    const container = optionsEl();
    container.innerHTML = '';

    const tipiDisponibili = Object.keys(configData).filter((tipo) =>
        configData[tipo].metodi.some((m) => metodoCompatibileConTempo(m, tempoPreferenza)));

    if (!tipiDisponibili.length) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align:center;">Nessuna pizza disponibile per questo tempo di lievitazione.</p>';
        return;
    }

    tipiDisponibili.forEach((tipo) => {
        container.appendChild(creaOpzioneBottone(capitalizza(tipo), () => {
            userSelections.tipo_pizza = tipo;
            nextQuestion();
        }));
    });
}

function askMetodoImpasto() {
    const { tipo_pizza: tipoPizza, tempo_preferenza: tempoPreferenza } = userSelections;
    const metodiDisponibili = configData[tipoPizza].metodi.filter((m) => metodoCompatibileConTempo(m, tempoPreferenza));

    if (metodiDisponibili.length > 1) {
        questionEl().textContent = `Per la pizza ${capitalizza(tipoPizza)}, quale metodo di impasto preferisci?`;
        const container = optionsEl();
        container.innerHTML = '';
        metodiDisponibili.forEach((metodo) => {
            container.appendChild(creaOpzioneBottone(capitalizza(metodo.replace(/_/g, ' ')), () => {
                userSelections.tipo_impasto = metodo;
                impostaParametriMetodo(metodo, tempoPreferenza);
                nextQuestion();
            }));
        });
    } else if (metodiDisponibili.length === 1) {
        userSelections.tipo_impasto = metodiDisponibili[0];
        impostaParametriMetodo(metodiDisponibili[0], tempoPreferenza);
        nextQuestion();
    } else {
        questionEl().textContent = 'Nessun metodo di impasto disponibile per le tue selezioni.';
        optionsEl().innerHTML = '';
    }
}

function askConsistenza() {
    questionEl().textContent = 'Preferisci una pizza soffice o croccante?';
    const container = optionsEl();
    container.innerHTML = '';
    ['soffice', 'croccante'].forEach((consistenza) => {
        container.appendChild(creaOpzioneBottone(capitalizza(consistenza), () => {
            userSelections.consistenza = consistenza;
            nextQuestion();
        }));
    });
}

function askNumeroPanetti() {
    questionEl().textContent = 'Quante pizze vuoi preparare?';
    const container = optionsEl();
    container.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = '4';
    input.className = 'form-control';
    container.appendChild(input);

    container.appendChild(creaOpzioneBottone('Calcola', () => {
        const numPanetti = parseInt(input.value, 10);
        if (!numPanetti || numPanetti <= 0) return;
        userSelections.num_panetti = numPanetti;
        nextQuestion();
    }));
}

function impostaParametriMetodo(metodo, tempoPreferenza) {
    switch (metodo) {
        case 'biga':
            userSelections.percentuale_biga = tempoPreferenza === 'massimo_24' ? 70 : 35;
            break;
        case 'poolish':
            userSelections.percentuale_poolish = tempoPreferenza === 'massimo_24' ? 50 : 30;
            break;
        case 'lievito_madre':
            userSelections.percentuale_lievito_madre = tempoPreferenza === 'massimo_24' ? 20 : 15;
            break;
        case 'biga_poolish':
            userSelections.percentuale_biga = 35;
            userSelections.percentuale_poolish = 35;
            break;
        default:
            break;
    }
}

const NOTE_PERCENTUALE = {
    biga: 'Percentuale di farina prefermentata in biga: più alta prolunga la maturazione e rinforza la struttura.',
    poolish: 'Percentuale di farina prefermentata in poolish: più alta aumenta estensibilità e alveolatura.',
    lievito_madre: 'Percentuale di lievito madre sul totale farina: regola forza e acidità dell\'impasto.',
};

function notaIdratazione(range, consistenza) {
    const base = consistenza === 'soffice'
        ? 'Idratazione alta: impasto più soffice e alveolato, cornicione morbido.'
        : 'Idratazione più contenuta: impasto più croccante e facile da gestire a mano.';
    return `${base} Range consigliato per questa pizza: ${range[0]}–${range[1]}%.`;
}

function notaTempoLievitazione(tempoPreferenza) {
    return tempoPreferenza === 'piu_di_24'
        ? 'Lievitazione lunga: più tempo per sviluppo aromatico e digeribilità, con dosi di lievito ridotte.'
        : 'Lievitazione più breve: dosi di lievito leggermente più alte per essere pronta nei tempi indicati.';
}

function notaTempoFrigo(tempoFrigo) {
    return tempoFrigo > 0
        ? 'Il passaggio in frigo (4°C) rallenta la fermentazione e la rende più gestibile nei tempi.'
        : 'Nessun passaggio in frigo: tutta la maturazione avviene a temperatura ambiente.';
}

function campoRiepilogo({ id, label, value, hint, step = 1, min = 0 }) {
    return `
        <div class="form-group">
            <label for="${id}">${label}</label>
            <input type="number" id="${id}" class="form-control" value="${value}" step="${step}" min="${min}">
            <p class="form-hint">${hint}</p>
        </div>
    `;
}

function configureCalculator() {
    const { tipo_pizza: tipoPizza, consistenza, tipo_impasto: tipoImpasto, num_panetti: numPanetti, tempo_preferenza: tempoPreferenza } = userSelections;
    const params = configData[tipoPizza].parametri[consistenza];
    const idratazioneMedia = Array.isArray(params.idratazione)
        ? Math.round((params.idratazione[0] + params.idratazione[1]) / 2)
        : params.idratazione;

    questionEl().textContent = 'Ecco i parametri suggeriti: puoi modificarli prima di procedere.';

    const percentualeCampo = ['biga', 'poolish', 'lievito_madre'].includes(tipoImpasto)
        ? campoRiepilogo({
            id: 'riep_percentuale',
            label: tipoImpasto === 'lievito_madre' ? 'Lievito madre (%)' : `${capitalizza(tipoImpasto)} (%)`,
            value: userSelections[`percentuale_${tipoImpasto}`] || 0,
            hint: NOTE_PERCENTUALE[tipoImpasto],
        })
        : '';

    const container = optionsEl();
    container.style.display = 'block';
    container.style.maxWidth = '520px';
    container.innerHTML = `
        <div class="form-row">
            ${campoRiepilogo({
                id: 'riep_idratazione',
                label: 'Idratazione (%)',
                value: idratazioneMedia,
                hint: notaIdratazione(params.idratazione, consistenza),
                step: 0.5,
            })}
            ${campoRiepilogo({
                id: 'riep_peso',
                label: 'Peso panetto (g)',
                value: params.peso_panetto,
                hint: 'Peso del singolo panetto: incide su spessore e tempo di cottura.',
                min: 100,
            })}
            ${campoRiepilogo({
                id: 'riep_num_panetti',
                label: 'Numero pizze',
                value: numPanetti,
                hint: 'Quante pizze verranno calcolate in totale.',
                min: 1,
            })}
            ${campoRiepilogo({
                id: 'riep_tempo_lievitazione',
                label: 'Ore totali lievitazione',
                value: params.tempo_lievitazione,
                hint: notaTempoLievitazione(tempoPreferenza),
                min: 1,
            })}
            ${campoRiepilogo({
                id: 'riep_tempo_frigo',
                label: 'Ore in frigo',
                value: params.tempo_frigo || 0,
                hint: notaTempoFrigo(params.tempo_frigo || 0),
            })}
            ${percentualeCampo}
        </div>
    `;

    const conferma = creaOpzioneBottone('Vai al Calcolatore', () => {
        const configToSave = {
            tipo_pizza: tipoPizza,
            tipo_impasto: tipoImpasto,
            consistenza,
            num_panetti: parseInt(document.getElementById('riep_num_panetti').value, 10) || numPanetti,
            idratazione: parseFloat(document.getElementById('riep_idratazione').value) || idratazioneMedia,
            peso_panetto: parseFloat(document.getElementById('riep_peso').value) || params.peso_panetto,
            tempo_lievitazione: parseFloat(document.getElementById('riep_tempo_lievitazione').value) || params.tempo_lievitazione,
            tempo_frigo: parseFloat(document.getElementById('riep_tempo_frigo').value) || 0,
        };
        const percentualeInput = document.getElementById('riep_percentuale');
        if (percentualeInput) {
            configToSave[`percentuale_${tipoImpasto}`] = parseFloat(percentualeInput.value) || 0;
        }

        localStorage.setItem('configurazioneImpasto', JSON.stringify(configToSave));
        window.location.href = 'calcolatore.html';
    });
    conferma.style.gridColumn = '1 / -1';
    container.appendChild(conferma);

    backButton().disabled = false;
}
