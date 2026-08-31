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

function configureCalculator() {
    const { tipo_pizza: tipoPizza, consistenza, tipo_impasto: tipoImpasto, num_panetti: numPanetti } = userSelections;
    const params = configData[tipoPizza].parametri[consistenza];

    const configToSave = {
        tipo_pizza: tipoPizza,
        tipo_impasto: tipoImpasto,
        consistenza,
        num_panetti: numPanetti,
        idratazione: params.idratazione,
        peso_panetto: params.peso_panetto,
        tempo_lievitazione: params.tempo_lievitazione,
        tempo_frigo: params.tempo_frigo,
    };
    if (userSelections.percentuale_biga) configToSave.percentuale_biga = userSelections.percentuale_biga;
    if (userSelections.percentuale_poolish) configToSave.percentuale_poolish = userSelections.percentuale_poolish;
    if (userSelections.percentuale_lievito_madre) configToSave.percentuale_lievito_madre = userSelections.percentuale_lievito_madre;

    localStorage.setItem('configurazioneImpasto', JSON.stringify(configToSave));

    questionEl().textContent = 'Perfetto! Ho configurato il calcolatore con i parametri ideali per te.';
    const container = optionsEl();
    container.innerHTML = '';
    container.appendChild(creaOpzioneBottone('Vai al Calcolatore', () => {
        window.location.href = 'calcolatore.html';
    }));
    backButton().disabled = true;
}
