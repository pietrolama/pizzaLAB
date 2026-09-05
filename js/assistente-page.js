// assistente-page.js
// Wizard interattivo per configurare il Calcolatore in base alle preferenze.
// Supporta lingua Italiana ed Inglese con aggiornamento dinamico.

import { getSavedLocale } from './i18n-engine.js';

let configData;
const userSelections = {};
let currentStep = 0;

function capitalizza(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
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

    window.addEventListener('pizzalab:locale-changed', () => {
        if (currentStep > 0) {
            renderStep(currentStep);
        }
    });
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
    button.className = 'btn-secondary';
    button.style.padding = '14px 20px';
    button.style.fontSize = '1rem';
    button.style.fontWeight = '600';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function askTimePreference() {
    const isEn = (document.documentElement.lang || getSavedLocale()) === 'en';
    questionEl().textContent = isEn
        ? 'How much time do you have for dough fermentation?'
        : 'Quanto tempo hai a disposizione per la lievitazione?';
    
    const container = optionsEl();
    container.innerHTML = '';
    [
        { label: isEn ? 'Less than 8 hours' : 'Meno di 8 ore', value: 'meno_di_8' },
        { label: isEn ? 'Up to 24 hours' : 'Massimo 24 ore', value: 'massimo_24' },
        { label: isEn ? 'More than 24 hours' : 'Più di 24 ore', value: 'piu_di_24' },
    ].forEach((opt) => {
        container.appendChild(creaOpzioneBottone(opt.label, () => {
            userSelections.tempo_preferenza = opt.value;
            nextQuestion();
        }));
    });
}

const NOMI_PIZZE = {
    napoletana: { it: 'Napoletana', en: 'Neapolitan' },
    romana: { it: 'Romana Tonda', en: 'Roman Round' },
    pala: { it: 'Pizza alla Pala', en: 'Pizza alla Pala' },
    teglia: { it: 'Pizza in Teglia', en: 'Pan / Sheet Pizza' },
    contemporanea: { it: 'Contemporanea', en: 'Contemporary' },
    padellino: { it: 'Padellino / Tegamino', en: 'Pan Pizza (Padellino)' }
};

function askTipoPizza() {
    const isEn = (document.documentElement.lang || getSavedLocale()) === 'en';
    const tempoPreferenza = userSelections.tempo_preferenza;
    questionEl().textContent = isEn
        ? 'What style of pizza would you like to make?'
        : 'Che tipo di pizza vuoi preparare?';

    const container = optionsEl();
    container.innerHTML = '';

    const tipiDisponibili = Object.keys(configData).filter((tipo) =>
        configData[tipo].metodi.some((m) => metodoCompatibileConTempo(m, tempoPreferenza)));

    if (!tipiDisponibili.length) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align:center;">${isEn ? 'No pizza styles available for this timeframe.' : 'Nessuna pizza disponibile per questo tempo di lievitazione.'}</p>`;
        return;
    }

    tipiDisponibili.forEach((tipo) => {
        const nomeVisualizzato = NOMI_PIZZE[tipo] ? (isEn ? NOMI_PIZZE[tipo].en : NOMI_PIZZE[tipo].it) : capitalizza(tipo);
        container.appendChild(creaOpzioneBottone(nomeVisualizzato, () => {
            userSelections.tipo_pizza = tipo;
            nextQuestion();
        }));
    });
}

const NOMI_METODI = {
    diretto: { it: 'Metodo Diretto', en: 'Direct Method' },
    biga: { it: 'Biga (Prefermento Solido)', en: 'Biga (Stiff Preferment)' },
    poolish: { it: 'Poolish (Prefermento Liquido)', en: 'Poolish (Liquid Preferment)' },
    lievito_madre: { it: 'Lievito Madre (Sourdough)', en: 'Sourdough Starter' },
    biga_poolish: { it: 'Biga + Poolish (Doppio Prefermento)', en: 'Biga + Poolish (Double Preferment)' }
};

function askMetodoImpasto() {
    const isEn = (document.documentElement.lang || getSavedLocale()) === 'en';
    const { tipo_pizza: tipoPizza, tempo_preferenza: tempoPreferenza } = userSelections;
    const metodiDisponibili = configData[tipoPizza].metodi.filter((m) => metodoCompatibileConTempo(m, tempoPreferenza));

    if (metodiDisponibili.length > 1) {
        const nomePizza = NOMI_PIZZE[tipoPizza] ? (isEn ? NOMI_PIZZE[tipoPizza].en : NOMI_PIZZE[tipoPizza].it) : capitalizza(tipoPizza);
        questionEl().textContent = isEn
            ? `For ${nomePizza} pizza, which dough method do you prefer?`
            : `Per la pizza ${nomePizza}, quale metodo di impasto preferisci?`;
        
        const container = optionsEl();
        container.innerHTML = '';
        metodiDisponibili.forEach((metodo) => {
            const nomeMetodo = NOMI_METODI[metodo] ? (isEn ? NOMI_METODI[metodo].en : NOMI_METODI[metodo].it) : capitalizza(metodo.replace(/_/g, ' '));
            container.appendChild(creaOpzioneBottone(nomeMetodo, () => {
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
        questionEl().textContent = isEn ? 'No dough methods available for your selection.' : 'Nessun metodo di impasto disponibile per le tue selezioni.';
        optionsEl().innerHTML = '';
    }
}

function askConsistenza() {
    const isEn = (document.documentElement.lang || getSavedLocale()) === 'en';
    questionEl().textContent = isEn
        ? 'Do you prefer a soft or crispy crust?'
        : 'Preferisci una pizza soffice o croccante?';

    const container = optionsEl();
    container.innerHTML = '';
    [
        { key: 'soffice', it: 'Soffice & Morbida (Napoletana Style)', en: 'Soft & Tender (Airy)' },
        { key: 'croccante', it: 'Croccante & Friabile (Crunchy)', en: 'Crispy & Crunchy' }
    ].forEach((c) => {
        container.appendChild(creaOpzioneBottone(isEn ? c.en : c.it, () => {
            userSelections.consistenza = c.key;
            nextQuestion();
        }));
    });
}

function askNumeroPanetti() {
    const isEn = (document.documentElement.lang || getSavedLocale()) === 'en';
    questionEl().textContent = isEn
        ? 'How many pizzas / dough balls do you want to make?'
        : 'Quante pizze vuoi preparare?';

    const container = optionsEl();
    container.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = '4';
    input.className = 'form-control';
    input.style.textAlign = 'center';
    input.style.fontSize = '1.3rem';
    input.style.fontWeight = 'bold';
    container.appendChild(input);

    const btnCalcola = creaOpzioneBottone(isEn ? 'Proceed →' : 'Procedi →', () => {
        const numPanetti = parseInt(input.value, 10);
        if (!numPanetti || numPanetti <= 0) return;
        userSelections.num_panetti = numPanetti;
        nextQuestion();
    });
    btnCalcola.className = 'btn';
    container.appendChild(btnCalcola);
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

function notaIdratazione(range, consistenza, isEn) {
    if (isEn) {
        const base = consistenza === 'soffice'
            ? 'High hydration: softer, more open crumb with a cloud-like cornicione.'
            : 'Lower hydration: crispier bottom crust, easier to handle by hand.';
        return `${base} Recommended range for this style: ${range[0]}–${range[1]}%.`;
    }
    const base = consistenza === 'soffice'
        ? 'Idratazione alta: impasto più soffice e alveolato, cornicione morbido.'
        : 'Idratazione più contenuta: impasto più croccante e facile da gestire a mano.';
    return `${base} Range consigliato per questa pizza: ${range[0]}–${range[1]}%.`;
}

function notaTempoLievitazione(tempoPreferenza, isEn) {
    if (isEn) {
        return tempoPreferenza === 'piu_di_24'
            ? 'Long fermentation: more time for aromatic flavor development and lightness, with reduced yeast.'
            : 'Shorter proof: slightly higher yeast dosage to be ready on schedule.';
    }
    return tempoPreferenza === 'piu_di_24'
        ? 'Lievitazione lunga: più tempo per sviluppo aromatico e digeribilità, con dosi di lievito ridotte.'
        : 'Lievitazione più breve: dosi di lievito leggermente più alte per essere pronta nei tempi indicati.';
}

function notaTempoFrigo(tempoFrigo, isEn) {
    if (isEn) {
        return tempoFrigo > 0
            ? 'Cold retard (4°C / 39°F) slows fermentation and makes timing flexible.'
            : 'No cold retard: all fermentation occurs at room temperature.';
    }
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
    const isEn = (document.documentElement.lang || getSavedLocale()) === 'en';
    const { tipo_pizza: tipoPizza, consistenza, tipo_impasto: tipoImpasto, num_panetti: numPanetti, tempo_preferenza: tempoPreferenza } = userSelections;
    const params = configData[tipoPizza].parametri[consistenza];
    const idratazioneMedia = Array.isArray(params.idratazione)
        ? Math.round((params.idratazione[0] + params.idratazione[1]) / 2)
        : params.idratazione;

    questionEl().textContent = isEn
        ? 'Here are the recommended parameters: you can tweak them before proceeding.'
        : 'Ecco i parametri suggeriti: puoi modificarli prima di procedere.';

    let prefLabel = `${capitalizza(tipoImpasto)} (%)`;
    let prefHint = '';
    if (tipoImpasto === 'biga') {
        prefLabel = isEn ? 'Biga preferment (%)' : 'Biga (%)';
        prefHint = isEn ? 'Pre-fermented flour in biga: higher % extends maturation and strengthens structure.' : 'Percentuale di farina prefermentata in biga.';
    } else if (tipoImpasto === 'poolish') {
        prefLabel = isEn ? 'Poolish preferment (%)' : 'Poolish (%)';
        prefHint = isEn ? 'Pre-fermented flour in poolish: increases extensibility and honeycomb crumb.' : 'Percentuale di farina prefermentata in poolish.';
    } else if (tipoImpasto === 'lievito_madre') {
        prefLabel = isEn ? 'Sourdough starter (%)' : 'Lievito madre (%)';
        prefHint = isEn ? 'Starter % of total flour: controls rising power and lactic tang.' : 'Percentuale di lievito madre sul totale farina.';
    }

    const percentualeCampo = ['biga', 'poolish', 'lievito_madre'].includes(tipoImpasto)
        ? campoRiepilogo({
            id: 'riep_percentuale',
            label: prefLabel,
            value: userSelections[`percentuale_${tipoImpasto}`] || 0,
            hint: prefHint,
        })
        : '';

    const container = optionsEl();
    container.style.display = 'block';
    container.style.maxWidth = '520px';
    container.innerHTML = `
        <div class="form-row" style="grid-template-columns: 1fr 1fr; gap: 16px;">
            ${campoRiepilogo({
                id: 'riep_idratazione',
                label: isEn ? 'Hydration (%)' : 'Idratazione (%)',
                value: idratazioneMedia,
                hint: notaIdratazione(params.idratazione, consistenza, isEn),
                step: 0.5,
            })}
            ${campoRiepilogo({
                id: 'riep_peso',
                label: isEn ? 'Ball weight (g)' : 'Peso panetto (g)',
                value: params.peso_panetto,
                hint: isEn ? 'Single dough ball weight: affects thickness and bake time.' : 'Peso del singolo panetto: incide su spessore e tempo di cottura.',
                min: 100,
            })}
            ${campoRiepilogo({
                id: 'riep_num_panetti',
                label: isEn ? 'Number of pizzas' : 'Numero pizze',
                value: numPanetti,
                hint: isEn ? 'Total number of pizzas to calculate.' : 'Quante pizze verranno calcolate in totale.',
                min: 1,
            })}
            ${campoRiepilogo({
                id: 'riep_tempo_lievitazione',
                label: isEn ? 'Total proof time (hours)' : 'Ore totali lievitazione',
                value: params.tempo_lievitazione,
                hint: notaTempoLievitazione(tempoPreferenza, isEn),
                min: 1,
            })}
            ${campoRiepilogo({
                id: 'riep_tempo_frigo',
                label: isEn ? 'Fridge cold retard (hours)' : 'Ore in frigo',
                value: params.tempo_frigo || 0,
                hint: notaTempoFrigo(params.tempo_frigo || 0, isEn),
            })}
            ${percentualeCampo}
        </div>
    `;

    const conferma = creaOpzioneBottone(isEn ? 'Open in Calculator →' : 'Vai al Calcolatore →', () => {
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
    conferma.className = 'btn';
    conferma.style.width = '100%';
    conferma.style.marginTop = '20px';
    container.appendChild(conferma);

    backButton().disabled = false;
}
