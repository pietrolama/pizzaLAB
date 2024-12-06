// assistente.js

let configData;
let userSelections = {};
let currentStep = 0;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('data/config.json')
        .then(response => response.json())
        .then(data => {
            configData = data;
            startAssistant();
        })
        .catch(error => console.error('Errore nel caricamento dei dati:', error));
});

function startAssistant() {
    currentStep = 0;
    nextQuestion();
}

function nextQuestion() {
    currentStep++;
    switch (currentStep) {
        case 1:
            askTimePreference();
            break;
        case 2:
            askTipoPizza();
            break;
        case 3:
            askMetodoImpasto();
            break;
        case 4:
            askConsistenza();
            break;
        case 5:
            askNumeroPanetti();
            break;
        case 6:
            configureCalculator();
            break;
        default:
            break;
    }
}

function previousQuestion() {
    if (currentStep > 0) {
        currentStep--;
        switch (currentStep) {
            case 1:
                askTimePreference();
                break;
            case 2:
                askTipoPizza();
                break;
            case 3:
                askMetodoImpasto();
                break;
            case 4:
                askConsistenza();
                break;
            case 5:
                askNumeroPanetti();
                break;
            default:
                break;
        }
    }

    // Disabilita il bottone "Indietro" se siamo al primo step
    const backButton = document.getElementById('back-button');
    backButton.disabled = currentStep === 0;
}


const pizzaPerTempo = {
    'meno_di_8': ['napoletana', 'romana', 'padellino'],
    'massimo_24': ['contemporanea', 'pala'],
    'piu_di_24': ['contemporanea', 'pala']
};

function metodoCompatibileConTempo(metodo, tempoPreferenza) {
    const tempiMetodo = {
        'diretto': ['meno_di_8'],
        'biga': ['massimo_24', 'piu_di_24'],
        'poolish': ['massimo_24', 'piu_di_24'],
        'lievito_madre': ['massimo_24', 'piu_di_24'],
        'biga_poolish': ['piu_di_24']
    };
    return tempiMetodo[metodo] && tempiMetodo[metodo].includes(tempoPreferenza);
}

function askTimePreference() {
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    questionElement.innerText = "Quanto tempo hai a disposizione per la lievitazione?";

    const options = [
        { label: 'Meno di 8 ore', value: 'meno_di_8' },
        { label: 'Massimo 24 ore', value: 'massimo_24' },
        { label: 'Più di 24 ore', value: 'piu_di_24' }
    ];

    options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option.label;
        button.addEventListener('click', () => {
            userSelections['tempo_preferenza'] = option.value;
            nextQuestion();
        });
        optionsContainer.appendChild(button);
    });
}

function askTipoPizza() {
    const tempoPreferenza = userSelections['tempo_preferenza'];
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    questionElement.innerText = "Che tipo di pizza vuoi preparare?";

    const tipiPizzaDisponibili = Object.keys(configData).filter(tipoPizza => {
        const metodiDisponibili = configData[tipoPizza]['metodi'];
        return metodiDisponibili.some(metodo => metodoCompatibileConTempo(metodo, tempoPreferenza));
    });

    tipiPizzaDisponibili.forEach(tipo => {
        const button = document.createElement('button');
        button.innerText = capitalizeFirstLetter(tipo);
        button.addEventListener('click', () => {
            userSelections['tipo_pizza'] = tipo;
            nextQuestion();
        });
        optionsContainer.appendChild(button);
    });
}

function askMetodoImpasto() {
    const tipoPizza = userSelections['tipo_pizza'];
    const tempoPreferenza = userSelections['tempo_preferenza'];
    const metodiDisponibili = configData[tipoPizza]['metodi'].filter(metodo => metodoCompatibileConTempo(metodo, tempoPreferenza));

    if (metodiDisponibili.length > 1) {
        const questionElement = document.getElementById('question');
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        questionElement.innerText = `Per la pizza ${capitalizeFirstLetter(tipoPizza)}, quale metodo di impasto preferisci?`;
        metodiDisponibili.forEach(metodo => {
            const button = document.createElement('button');
            button.innerText = capitalizeFirstLetter(metodo.replace(/_/g, ' '));
            button.addEventListener('click', () => {
                userSelections['tipo_impasto'] = metodo;
                impostaParametriMetodo(metodo, tempoPreferenza);
                nextQuestion();
            });
            optionsContainer.appendChild(button);
        });
    } else if (metodiDisponibili.length === 1) {
        userSelections['tipo_impasto'] = metodiDisponibili[0];
        impostaParametriMetodo(metodiDisponibili[0], tempoPreferenza);
        nextQuestion();
    } else {
        alert('Nessun metodo di impasto disponibile per le tue selezioni.');
        // Potresti decidere di tornare indietro o terminare qui
    }
}

function askConsistenza() {
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    questionElement.innerText = "Preferisci una pizza soffice o croccante?";
    ['soffice', 'croccante'].forEach(consistenza => {
        const button = document.createElement('button');
        button.innerText = capitalizeFirstLetter(consistenza);
        button.addEventListener('click', () => {
            userSelections['consistenza'] = consistenza;
            nextQuestion();
        });
        optionsContainer.appendChild(button);
    });
}

function askNumeroPanetti() {
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; // Svuota le opzioni precedenti
    questionElement.innerText = "Quante pizze vuoi preparare?";

    // Crea l'input per il numero di pizze
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.placeholder = 'Inserisci il numero di pizze';
    optionsContainer.appendChild(input);

    // Crea il pulsante "Calcola"
    const calculateButton = document.createElement('button');
    calculateButton.innerText = "Calcola";
    calculateButton.onclick = () => {
        const numPanetti = parseInt(input.value);
        if (isNaN(numPanetti) || numPanetti <= 0) {
            alert('Per favore, inserisci un numero valido di pizze.');
        } else {
            userSelections['num_panetti'] = numPanetti;
            configureCalculator(); // Passa alla configurazione del calcolatore
        }
    };
    optionsContainer.appendChild(calculateButton);
}


function impostaParametriMetodo(metodo, tempoPreferenza) {
    switch (metodo) {
        case 'biga':
            if (tempoPreferenza === 'massimo_24') {
                userSelections['percentuale_biga'] = 70;
            } else if (tempoPreferenza === 'piu_di_24') {
                userSelections['percentuale_biga'] = 35;
            }
            break;
        case 'poolish':
            if (tempoPreferenza === 'massimo_24') {
                userSelections['percentuale_poolish'] = 50;
            } else if (tempoPreferenza === 'piu_di_24') {
                userSelections['percentuale_poolish'] = 30;
            }
            break;
        case 'lievito_madre':
            userSelections['percentuale_lievito_madre'] = tempoPreferenza === 'massimo_24' ? 20 : 15;
            break;
        case 'biga_poolish':
            userSelections['percentuale_biga'] = 35;
            userSelections['percentuale_poolish'] = 35;
            break;
        default:
            // Per il metodo diretto o altri
            break;
    }
}

function configureCalculator() {
    const tipoPizza = userSelections['tipo_pizza'];
    const consistenza = userSelections['consistenza'];
    const tipoImpasto = userSelections['tipo_impasto'];
    const numPanetti = userSelections['num_panetti'];
    const params = configData[tipoPizza]['parametri'][consistenza];

    const configToSave = {
        tipo_pizza: tipoPizza,
        tipo_impasto: tipoImpasto,
        consistenza: consistenza,
        num_panetti: numPanetti,
        idratazione: params.idratazione,
        peso_panetto: params.peso_panetto,
        tempo_lievitazione: params.tempo_lievitazione,
        tempo_frigo: params.tempo_frigo
    };

    // Aggiungiamo le percentuali se presenti
    if (userSelections['percentuale_biga']) {
        configToSave['percentuale_biga'] = userSelections['percentuale_biga'];
    }
    if (userSelections['percentuale_poolish']) {
        configToSave['percentuale_poolish'] = userSelections['percentuale_poolish'];
    }
    if (userSelections['percentuale_lievito_madre']) {
        configToSave['percentuale_lievito_madre'] = userSelections['percentuale_lievito_madre'];
    }

    localStorage.setItem('configurazioneImpasto', JSON.stringify(configToSave));

    // Aggiorniamo la domanda per informare l'utente
    const questionElement = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    questionElement.innerText = "Perfetto! Ho configurato il calcolatore con i parametri ideali per te. Puoi verificarli e apportare eventuali modifiche se lo desideri.";

    // Modifichiamo il pulsante per andare al calcolatore
    const nextButton = document.getElementById('next-button');
    nextButton.innerText = "Vai al Calcolatore";
    nextButton.onclick = () => {
        window.location.href = 'calcolatore.html';
    };
}
