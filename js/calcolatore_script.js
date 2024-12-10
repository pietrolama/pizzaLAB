// Definizione dei metodi disponibili per ogni tipo di pizza
const metodiPerPizza = {
    "napoletana": ["diretto"],
    "romana": ["diretto"],
    "pala": ["diretto", "biga"],
    "contemporanea": ["diretto", "biga", "poolish", "lievito_madre", "biga_poolish"],
    "padellino": ["diretto"]
};

// Funzione per caricare le ricette dal file JSON
async function caricaRicette() {
    try {
        const response = await fetch('data/ricette.json');
        if (!response.ok) {
            console.error(`Errore nel caricamento del JSON: ${response.status}`);
            return null;
        }
        const ricette = await response.json();
        console.log("Ricette caricate correttamente:", ricette);
        return ricette;
    } catch (error) {
        console.error("Errore durante il caricamento del JSON:", error);
        return null;
    }
}

// Caricamento delle ricette al caricamento della pagina
(async () => {
    window.loadedRicette = await caricaRicette();
    if (!window.loadedRicette) {
        console.error("JSON non caricato, verifica il percorso o il file.");
    } else {
        console.log("Ricette caricate correttamente:", window.loadedRicette);
    }
})();

// Funzione per mostrare/nascondere le sezioni in base al metodo di impasto selezionato
function toggleSections() {
    const metodoImpasto = document.getElementById('tipo_impasto').value;
    console.log('Metodo impasto in toggleSections:', metodoImpasto);

    // Nascondi tutte le sezioni
    const sezioni = ['sezione_diretto', 'sezione_biga', 'sezione_poolish', 'sezione_lievito_madre', 'sezione_biga_poolish'];
    sezioni.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.classList.add('hidden');
        }
    });

    // Mostra la sezione corretta
    switch (metodoImpasto) {
        case 'diretto':
            document.getElementById('sezione_diretto').classList.remove('hidden');
            break;
        case 'biga':
            document.getElementById('sezione_biga').classList.remove('hidden');
            break;
        case 'poolish':
            document.getElementById('sezione_poolish').classList.remove('hidden');
            break;
        case 'lievito_madre':
            document.getElementById('sezione_lievito_madre').classList.remove('hidden');
            break;
        case 'biga_poolish':
            document.getElementById('sezione_biga_poolish').classList.remove('hidden');
            break;
        default:
            console.warn('Metodo di impasto non riconosciuto in toggleSections:', metodoImpasto);
            break;
    }
}

// Event listener per il cambiamento del tipo di pizza
document.getElementById('tipo_pizza').addEventListener('change', (e) => {
    const tipoPizza = e.target.value || "napoletana";

    console.log("Tipo di pizza selezionato:", tipoPizza);

    const metodiDisponibili = metodiPerPizza[tipoPizza] || [];
    const metodoSelect = document.getElementById('tipo_impasto');

    // Rimuove tutte le opzioni esistenti
    metodoSelect.innerHTML = '';

    // Aggiunge solo le opzioni disponibili
    metodiDisponibili.forEach(metodo => {
        const option = document.createElement('option');
        option.value = metodo;
        option.textContent = metodo.charAt(0).toUpperCase() + metodo.slice(1).replace('_', ' ');
        metodoSelect.appendChild(option);
    });

    // Imposta il valore del menu a tendina al primo metodo disponibile
    metodoSelect.value = metodiDisponibili[0] || '';
    metodoSelect.dispatchEvent(new Event('change'));
});

// Event listener per il cambiamento del metodo di impasto
document.getElementById('tipo_impasto').addEventListener('change', toggleSections);

// Funzione per calcolare e mostrare la ricetta personalizzata
function calcola() {
    const tipoPizza = document.getElementById('tipo_pizza').value;
    const tipoImpasto = document.getElementById('tipo_impasto').value;

    if (!tipoPizza || !tipoImpasto) {
        alert("Seleziona sia il tipo di pizza che il metodo di impasto.");
        return;
    }

    mostraRicetta(tipoPizza, tipoImpasto);
}

// Funzioni di calcolo per diversi metodi di impasto
function calcolaLievito(numPanetti, pesoPaniello, idratazione, sale, grassi, tempoLievitazione, oreFrigo, temperaturaAmbiente, usa_teglia) {
    // Calcoli della funzione
    var tempCorretta = temperaturaAmbiente * (1 - 0.25 * usa_teglia);
    var fattoreCrescitaLievito = 0.005;

    var tempoLievitazioneCorretto = tempoLievitazione - (9 * oreFrigo / 10),
        forzaLievitoSpecifica = 2250 * (1 + sale / 200) * (1 + grassi / 300) / ((4.2 * idratazione - 80 - 0.0305 * idratazione * idratazione) * Math.pow(tempCorretta, 2.5) * Math.pow(tempoLievitazioneCorretto, 1.2)),
        pesoImpasto = numPanetti * pesoPaniello,
        quantitaFarinaImpasto = 100000 * (pesoImpasto) / (idratazione * (sale + grassi) + 1000 * (idratazione + 100)),
        lievitoNecessarioImpasto = (quantitaFarinaImpasto * forzaLievitoSpecifica - fattoreCrescitaLievito);

    // Controlla se il risultato è un numero
    if (isNaN(lievitoNecessarioImpasto) || lievitoNecessarioImpasto < 0) {
        console.error("Errore: Lievito non calcolabile", lievitoNecessarioImpasto);
        return 0; // Restituisce un valore di default in caso di errore
    }

    return lievitoNecessarioImpasto;
}

function calcolaDiretto() {
    const pesoPanetto = parseFloat(document.getElementById('peso_panetto_diretto').value);
    const idratazioneTotale = parseFloat(document.getElementById('idratazione_totale_diretto').value);
    const numPanetti = parseInt(document.getElementById('num_panetti_diretto').value);
    const tempoLievitazioneTotale = parseInt(document.getElementById('tempoLievTotale_diretto').value);
    const oreFrigo = parseInt(document.getElementById('tempoFrigo_diretto').value) || 0;
    const temperaturaAmbiente = parseInt(document.getElementById('temperatura_ambiente_diretto').value);
    const inTeglia = document.getElementById('usa_teglia_diretto').checked;

    if (!pesoPanetto || !idratazioneTotale || !numPanetti || !tempoLievitazioneTotale || !temperaturaAmbiente) {
        alert("Inserisci tutti i dati richiesti.");
        return;
    }

    // Calcolo del tempo di lievitazione effettivo
    var tempoLievitazioneEffettivo = tempoLievitazioneTotale;
    if (oreFrigo > 0) {
        tempoLievitazioneEffettivo = tempoLievitazioneTotale - (9 * oreFrigo / 10);
    }
    var massa = tempoLievitazioneEffettivo*10/100;
    var apretto = tempoLievitazioneEffettivo-massa;
    // Calcolo delle quantità di impasto
    var pesoFarina = (100 * pesoPanetto) / (100 + idratazioneTotale) * numPanetti;
    var pesoAcqua = idratazioneTotale * pesoFarina / 100;
    var pesoSale = 0.02 * pesoFarina;
    var pesoZucchero = 0.013 * pesoFarina;
    var pesoOlio = 0.032 * pesoFarina;

    // Calcolo del lievito
    var lievito = calcolaLievito(
        numPanetti,
        pesoPanetto,
        idratazioneTotale,
        pesoSale,
        pesoOlio,
        tempoLievitazioneEffettivo,
        oreFrigo,
        temperaturaAmbiente,
        inTeglia
    );

    // Controllo se il calcolo del lievito è valido
    if (isNaN(lievito)) {
        alert("Errore: Il calcolo del lievito ha prodotto un risultato non valido.");
        console.error("Errore nel calcolo del lievito:", lievito);
        lievito = 0; // Imposta un valore di default
    }

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        massa: massa.toFixed(0),
        apretto: apretto.toFixed(0),
        tempoLievitazioneEffettivo: tempoLievitazioneEffettivo.toFixed(0),
        pesoFarina: pesoFarina.toFixed(2),
        pesoAcqua: pesoAcqua.toFixed(2),
        pesoSale: pesoSale.toFixed(2),
        pesoLievito: lievito.toFixed(2),
        pesoZucchero: pesoZucchero.toFixed(2),
        pesoOlio: pesoOlio.toFixed(2),
    };
}

function calcolaBiga() {
    var pesoPanetto = parseFloat(document.getElementById('peso_panetto_biga').value);
    var idratazioneTotale = parseFloat(document.getElementById('idratazione_totale_biga').value);
    var percentualeBiga = parseFloat(document.getElementById('percentuale_biga').value);
    var numPanetti = parseInt(document.getElementById('num_panetti_biga').value);

    if (!pesoPanetto || !idratazioneTotale || !percentualeBiga || !numPanetti) {
        alert("Inserisci tutti i dati richiesti per il metodo Biga.");
        return;
    }

    var pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazioneTotale / 100);
    var pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    var pesoAcquaBiga = pesoFarinaBiga * 0.44;
    var pesoLievitoBiga = pesoFarinaBiga * 0.01;
    var pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaBiga;
    var pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - pesoAcquaBiga;

    var sale = 0.02 * pesoTotaleFarina;
    var zucchero = 0.015 * pesoTotaleFarina;
    var olio = 0.03 * pesoTotaleFarina;

    return {
        pesoFarina: pesoFarinaPrincipale.toFixed(2),
        pesoAcqua: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaBiga: pesoAcquaBiga.toFixed(2),
        pesoFarinaBiga: pesoFarinaBiga.toFixed(2),
        pesoLievitoBiga: pesoLievitoBiga.toFixed(2),
        pesoOlio: olio.toFixed(2),
    };
}

function calcolaPoolish() {
    var pesoPanetto = parseFloat(document.getElementById('peso_panetto_poolish').value);
    var idratazioneTotale = parseFloat(document.getElementById('idratazione_totale_poolish').value);
    var percentualePoolish = parseFloat(document.getElementById('percentuale_poolish').value);
    var numPanetti = parseInt(document.getElementById('num_panetti_poolish').value);

    if (!pesoPanetto || !idratazioneTotale || !percentualePoolish || !numPanetti) {
        alert("Inserisci tutti i dati richiesti per il metodo Poolish.");
        return;
    }

    var pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazioneTotale / 100);
    var pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    var pesoAcquaPoolish = pesoFarinaPoolish;
    var pesoLievitoPoolish = pesoFarinaPoolish * 0.001;
    var pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaPoolish;
    var pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - pesoAcquaPoolish;

    var sale = 0.02 * pesoTotaleFarina;
    var zucchero = 0.015 * pesoTotaleFarina;
    var olio = 0.03 * pesoTotaleFarina;
    return {
        pesoFarina: pesoFarinaPrincipale.toFixed(2),
        pesoAcqua: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaPoolish: pesoAcquaPoolish.toFixed(2),
        pesoFarinaPoolish: pesoFarinaPoolish.toFixed(2),
        pesoLievitoPoolish: pesoLievitoPoolish.toFixed(2),
        pesoOlio: olio.toFixed(2),
    };
}

function calcolaLievitoMadre() {
    var pesoPanetto = parseFloat(document.getElementById('peso_panetto_lievito').value);
    var idratazioneTotale = parseFloat(document.getElementById('idratazione_totale_lievito').value);
    var percentualePastaMadre = parseFloat(document.getElementById('percentuale_lievito').value);
    var numPanetti = parseInt(document.getElementById('num_panetti_lievito').value);

    if (!pesoPanetto || !idratazioneTotale || !percentualePastaMadre || !numPanetti) {
        alert("Inserisci tutti i dati richiesti.");
        return;
    }

    var pesoTotaleImpasto = pesoPanetto * numPanetti;
    var pesoPastaMadreFinale = (percentualePastaMadre / 100) * pesoTotaleImpasto;

    var farinaPastaMadre = pesoPastaMadreFinale * (2 / 3);
    var acquaPastaMadre = pesoPastaMadreFinale * (1 / 3);

    var farinaPrincipale = (pesoTotaleImpasto - pesoPastaMadreFinale) / (1 + idratazioneTotale / 100);
    var acquaPrincipale = farinaPrincipale * (idratazioneTotale / 100);

    var pesoZucchero = 0.015 * (farinaPrincipale + farinaPastaMadre);
    var pesoOlio = 0.03 * (farinaPrincipale + farinaPastaMadre);
    var pesoSale = 0.02 * (farinaPrincipale + farinaPastaMadre);

    var pastaMadreIniziale = pesoPastaMadreFinale / 6.25;

    var farinaRinfresco1 = pastaMadreIniziale;
    var acquaRinfresco1 = pastaMadreIniziale * 0.5;

    var farinaRinfresco2 = pastaMadreIniziale * 2.5;
    var acquaRinfresco2 = farinaRinfresco2 * 0.5;

    return {
        pesoFarinaPrincipale: farinaPrincipale.toFixed(2),
        pesoAcquaPrincipale: acquaPrincipale.toFixed(2),
        pesoSale: pesoSale.toFixed(2),
        pesoZucchero: pesoZucchero.toFixed(2),
        pesoOlio: pesoOlio.toFixed(2),
        pesoPastaMadreFinale: pesoPastaMadreFinale.toFixed(2),
        farinaPastaMadre: farinaPastaMadre.toFixed(2),
        acquaPastaMadre: acquaPastaMadre.toFixed(2),
        farinaRinfresco1: farinaRinfresco1.toFixed(2),
        acquaRinfresco1: acquaRinfresco1.toFixed(2),
        farinaRinfresco2: farinaRinfresco2.toFixed(2),
        acquaRinfresco2: acquaRinfresco2.toFixed(2),
    };
}

function calcolaBigaPoolish() {
    var percentualeBiga = parseFloat(document.getElementById('percentuale_biga_bp').value);
    var percentualePoolish = parseFloat(document.getElementById('percentuale_poolish_bp').value);
    var pesoPanetto = parseFloat(document.getElementById('peso_panetto_biga_poolish').value);
    var idratazioneTotale = parseFloat(document.getElementById('idratazione_totale_biga_poolish').value);
    var numPanetti = parseInt(document.getElementById('num_panetti_biga_poolish').value);

    if (!pesoPanetto || !idratazioneTotale || !percentualeBiga || !percentualePoolish || !numPanetti) {
        alert("Inserisci tutti i dati richiesti per il metodo Biga + Poolish.");
        return;
    }

    var pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazioneTotale / 100);
    var pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    var pesoAcquaBiga = pesoFarinaBiga * 0.44;
    var pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    var pesoAcquaPoolish = pesoFarinaPoolish;
    var pesoFarinaPrincipale = pesoTotaleFarina - (pesoFarinaBiga + pesoFarinaPoolish);
    var pesoAcquaPrincipale = (pesoTotaleFarina * (idratazioneTotale / 100)) - (pesoAcquaBiga + pesoAcquaPoolish);

    var sale = 0.02 * pesoTotaleFarina;
    var zucchero = 0.015 * pesoTotaleFarina;
    var olio = 0.03 * pesoTotaleFarina;

    return {
        pesoFarinaPrincipale: pesoFarinaPrincipale.toFixed(2),
        pesoAcquaPrincipale: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaPoolish: pesoAcquaPoolish.toFixed(2),
        pesoFarinaPoolish: pesoFarinaPoolish.toFixed(2),
        pesoOlio: olio.toFixed(2),
        pesoAcquaBiga: pesoAcquaBiga.toFixed(2),
        pesoFarinaBiga: pesoFarinaBiga.toFixed(2),
        // PesoLievitoPoolish e PesoLievitoBiga non sono stati calcolati, quindi li rimuovo
    };
}

// Funzione per mostrare la ricetta nel DOM
function mostraRicetta(tipoPizza, metodo) {
    const ricette = window.loadedRicette;
    if (!ricette) {
        alert("Impossibile caricare le ricette.");
        return;
    }

    const pizza = ricette[tipoPizza];
    if (!pizza) {
        alert(`Tipo di pizza "${tipoPizza}" non trovato.`);
        console.error(`ERRORE: Tipo di pizza "${tipoPizza}" non trovato.`);
        return;
    }

    const ricetta = pizza[metodo];
    if (!ricetta) {
        alert(`Metodo "${metodo}" non disponibile.`);
        console.error(`ERRORE: Metodo "${metodo}" non trovato.`);
        return;
    }

    let datiCalcolati;
    switch (metodo) {
        case "diretto":
            datiCalcolati = calcolaDiretto();
            break;
        case "biga":
            datiCalcolati = calcolaBiga();
            break;
        case "poolish":
            datiCalcolati = calcolaPoolish();
            break;
        case "lievito_madre":
            datiCalcolati = calcolaLievitoMadre();
            break;
        case "biga_poolish":
            datiCalcolati = calcolaBigaPoolish();
            break;
        default:
            console.error("Metodo di impasto non riconosciuto.");
            return;
    }

    if (!datiCalcolati) {
        alert("Errore nel calcolo degli ingredienti.");
        return;
    }

    console.log("Dati calcolati:", datiCalcolati);

    const ingredienti = ricetta.ingredienti.map(ingrediente => {
        let quantita = ingrediente.quantita;
        Object.entries(datiCalcolati).forEach(([key, value]) => {
            quantita = quantita.replace(`<${key}>`, value || "n.d.");
        });
        return `<li>${ingrediente.nome}: ${quantita} g</li>`;
    }).join("");

    const procedura = ricetta.procedimento.map(step => {
        let proceduraStep = step;
        Object.entries(datiCalcolati).forEach(([key, value]) => {
            proceduraStep = proceduraStep.replace(`<${key}>`, value || "n.d.");
        });
        return `<p>${proceduraStep}</p>`;
    }).join("");

    // Definizione delle variabili prima dell'uso
    const risultato = document.getElementById('risultato');

    risultato.innerHTML = `
        <h2>${ricetta.nome}</h2>
        <h4>Ingredienti:</h4>
        <ul>${ingredienti}</ul>
        <h4>Procedura:</h4>
        ${procedura}
    `;
    // Rimuovi la classe hidden e aggiungi active
    risultato.classList.remove('hidden');
    setTimeout(() => risultato.classList.add('active'), 10); // Ritardo per triggerare l'animazione
}

// Event listener per il pulsante 'Calcola e Genera Ricetta' e per Genera Piano
document.getElementById('calcola-button').addEventListener('click', calcola);
document.getElementById('genera-piano').addEventListener('click', generaPianoGenerico);

// Funzione per recuperare la configurazione dal localStorage
document.addEventListener('DOMContentLoaded', () => {
    const configurazione = localStorage.getItem('configurazioneImpasto');
    if (configurazione) {
        const config = JSON.parse(configurazione);
        console.log('Configurazione recuperata:', config);

        // Set values in the calculator fields
        document.getElementById('tipo_pizza').value = config.tipo_pizza;
        document.getElementById('tipo_impasto').value = config.tipo_impasto;

        // Update visible sections
        toggleSections();

        // Specific values
        const tipoImpasto = config.tipo_impasto;
        const idratazioneMedia = Array.isArray(config.idratazione)
            ? (config.idratazione[0] + config.idratazione[1]) / 2
            : config.idratazione;

        let numPanettiFieldId = '';
        let pesoPanettoFieldId = '';
        let idratazioneFieldId = '';
        let tempoLievitazioneFieldId = '';
        let tempoFrigoFieldId = '';
        let percentualeBigaFieldId = '';
        let percentualePoolishFieldId = '';
        let percentualeLievitoFieldId = '';
        let percentualeBigaPoolishFieldId = '';
        let percentualePoolishBpFieldId = '';

        switch (tipoImpasto) { // Use 'tipoImpasto' instead of 'metodoImpasto'
            case 'diretto':
                numPanettiFieldId = 'num_panetti_diretto';
                pesoPanettoFieldId = 'peso_panetto_diretto';
                idratazioneFieldId = 'idratazione_totale_diretto';
                tempoLievitazioneFieldId = 'tempoLievTotale_diretto';
                tempoFrigoFieldId = 'tempoFrigo_diretto';

                document.getElementById(pesoPanettoFieldId).value = config.peso_panetto;
                document.getElementById(idratazioneFieldId).value = idratazioneMedia;
                document.getElementById(tempoLievitazioneFieldId).value = config.tempo_lievitazione;
                document.getElementById(tempoFrigoFieldId).value = config.tempo_frigo;
                break;

            case 'biga':
                numPanettiFieldId = 'num_panetti_biga';
                pesoPanettoFieldId = 'peso_panetto_biga';
                idratazioneFieldId = 'idratazione_totale_biga';
                percentualeBigaFieldId = 'percentuale_biga';

                document.getElementById(pesoPanettoFieldId).value = config.peso_panetto;
                document.getElementById(idratazioneFieldId).value = idratazioneMedia;
                // Imposta la percentuale di biga se presente
                if (config.percentuale_biga) {
                    document.getElementById(percentualeBigaFieldId).value = config.percentuale_biga;
                } else {
                    // Imposta un valore di default se necessario
                    document.getElementById(percentualeBigaFieldId).value = 70; // O un altro valore predefinito
                }
                break;

            case 'poolish':
                numPanettiFieldId = 'num_panetti_poolish';
                pesoPanettoFieldId = 'peso_panetto_poolish';
                idratazioneFieldId = 'idratazione_totale_poolish';
                percentualePoolishFieldId = 'percentuale_poolish';

                document.getElementById(pesoPanettoFieldId).value = config.peso_panetto;
                document.getElementById(idratazioneFieldId).value = idratazioneMedia;
                // Imposta la percentuale di poolish se presente
                if (config.percentuale_poolish) {
                    document.getElementById(percentualePoolishFieldId).value = config.percentuale_poolish;
                }
                break;

            case 'lievito_madre':
                numPanettiFieldId = 'num_panetti_lievito';
                pesoPanettoFieldId = 'peso_panetto_lievito';
                idratazioneFieldId = 'idratazione_totale_lievito';
                percentualeLievitoFieldId = 'percentuale_lievito';

                document.getElementById(pesoPanettoFieldId).value = config.peso_panetto;
                document.getElementById(idratazioneFieldId).value = idratazioneMedia;
                // Imposta la percentuale di lievito madre se presente
                if (config.percentuale_lievito_madre) {
                    document.getElementById(percentualeLievitoFieldId).value = config.percentuale_lievito_madre;
                }
                break;

            case 'biga_poolish':
                numPanettiFieldId = 'num_panetti_biga_poolish';
                pesoPanettoFieldId = 'peso_panetto_biga_poolish';
                idratazioneFieldId = 'idratazione_totale_biga_poolish';
                percentualeBigaPoolishFieldId = 'percentuale_biga_bp';
                percentualePoolishBpFieldId = 'percentuale_poolish_bp';

                document.getElementById(pesoPanettoFieldId).value = config.peso_panetto;
                document.getElementById(idratazioneFieldId).value = idratazioneMedia;
                // Imposta la percentuale di biga e poolish se presenti
                if (config.percentuale_biga) {
                    document.getElementById(percentualeBigaPoolishFieldId).value = config.percentuale_biga;
                }
                if (config.percentuale_poolish) {
                    document.getElementById(percentualePoolishBpFieldId).value = config.percentuale_poolish;
                }
                break;

            default:
                console.warn('Tipo di impasto non riconosciuto:', tipoImpasto);
                break;
        }

        // Set the number of dough balls if the ID was defined
        if (numPanettiFieldId && document.getElementById(numPanettiFieldId)) {
            document.getElementById(numPanettiFieldId).value = config.num_panetti;
        } else {
            console.warn('Campo numero di panetti non trovato per il tipo di impasto:', tipoImpasto);
        }

        // Rimuovi la configurazione dal localStorage se non è più necessaria
        localStorage.removeItem('configurazioneImpasto');
    } else {
        console.log('Nessuna configurazione trovata nel localStorage.');
    }
});

// Funzione per calcolare il piano di lavoro per qualsiasi metodo di impasto
function generaPianoGenerico() {
    const infornataElement = document.getElementById('infornata');
    const tipoImpastoElement = document.getElementById('tipo_impasto');

    if (!infornataElement || !tipoImpastoElement) {
        console.error('Gli elementi infornata o tipo_impasto non esistono nel DOM.');
        alert('Errore: campi mancanti nel modulo!');
        return;
    }

    const infornataTimeInput = infornataElement.value;
    const tipoImpasto = tipoImpastoElement.value;

    if (!infornataTimeInput) {
        alert('Inserisci un orario di infornata!');
        return;
    }

    const totalLievitazioneElement = document.getElementById(`tempoLievTotale_${tipoImpasto}`);
    const tempoFrigoElement = document.getElementById(`tempoFrigo_${tipoImpasto}`);

    if (!totalLievitazioneElement || !tempoFrigoElement) {
        console.error(`Campi di lievitazione mancanti per il tipo di impasto: ${tipoImpasto}`);
        alert('Errore: campi di lievitazione mancanti!');
        return;
    }

    const totalLievitazione = parseFloat(totalLievitazioneElement.value);
    const tempoFrigo = parseFloat(tempoFrigoElement.value) || 0;

    if (isNaN(totalLievitazione) || totalLievitazione <= 0) {
        alert('Inserisci un tempo di lievitazione valido!');
        return;
    }

    // Converti l'orario di infornata in un oggetto Date
    const today = new Date();
    const [hours, minutes] = infornataTimeInput.split(':').map(Number);
    const infornataTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

    // Calcola il piano specifico per il metodo
    let plan;
    switch (tipoImpasto) {
        case 'diretto':
            plan = calculatePlanDiretto(infornataTime, totalLievitazione, tempoFrigo);
            break;
        case 'biga':
            plan = calculatePlanBiga(infornataTime, totalLievitazione);
            break;
        case 'poolish':
            plan = calculatePlanPoolish(infornataTime, totalLievitazione);
            break;
        case 'lievito_madre':
            plan = calculatePlanLievitoMadre(infornataTime, totalLievitazione);
            break;
        case 'biga_poolish':
            plan = calculatePlanBigaPoolish(infornataTime, totalLievitazione);
            break;
        default:
            alert('Metodo di impasto non riconosciuto!');
            return;
    }

    if (!plan) {
        alert('Errore nella generazione del piano di lavoro!');
        return;
    }

    // Aggiorna il DOM
    const planBox = document.getElementById('plan-box');
    const planList = document.getElementById('plan-list');
    planList.innerHTML = '';

    plan.forEach(step => {
        const li = document.createElement('li');
        li.textContent = `${step.time}: ${step.action}`;
        planList.appendChild(li);
    });

    // Rimuovi la classe hidden e aggiungi active
    planBox.classList.remove('hidden');
    setTimeout(() => planBox.classList.add('active'), 10); // Ritardo per triggerare l'animazione
}

// Funzione per calcolare il piano di lavoro per il metodo diretto
function calculatePlanDiretto(infornataTime, totalLievitazione, tempoFrigo) {
    const plan = [];
    let currentTime = new Date(infornataTime); // Partiamo dall'orario di infornata

    // Aggiungi l'azione "Inforna adesso"
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso.",
    });

    // Seconda lievitazione (30% del tempo totale)
    const secondLievitazioneMs = (totalLievitazione * 0.3) * 60 * 60 * 1000; // 30%
    currentTime = new Date(currentTime.getTime() - secondLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizio della seconda lievitazione.",
    });

    // Prima lievitazione (70% del tempo totale)
    const firstLievitazioneMs = (totalLievitazione * 0.7) * 60 * 60 * 1000; // 70%
    if (tempoFrigo > 0) {
        // Tempo in frigorifero
        const tempoFrigoMs = tempoFrigo * 60 * 60 * 1000;
        currentTime = new Date(currentTime.getTime() - tempoFrigoMs);
        plan.push({
            time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: "Togli l'impasto dal frigorifero e lascia riposare a temperatura ambiente.",
        });

        // Tempo rimanente della prima lievitazione a temperatura ambiente
        const remainingLievitazioneMs = firstLievitazioneMs - tempoFrigoMs;
        currentTime = new Date(currentTime.getTime() - remainingLievitazioneMs);
        plan.push({
            time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: "Metti l'impasto in frigorifero.",
        });
    } else {
        // Prima lievitazione interamente a temperatura ambiente
        currentTime = new Date(currentTime.getTime() - firstLievitazioneMs);
        plan.push({
            time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: "Inizio della prima lievitazione.",
        });
    }

    // Preparazione dell'impasto
    const prepTimeMs = 30 * 60 * 1000; // 30 minuti in ms
    currentTime = new Date(currentTime.getTime() - prepTimeMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Prepara l'impasto.",
    });

    return plan.reverse();
}

// Funzioni per calcolare i piani di lavoro specifici
function calculatePlanBiga(infornataTime, totalLievitazione) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    // Inforna adesso
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    // Fase finale della lievitazione (50% del tempo totale)
    const finalLievitazioneMs = (totalLievitazione * 0.5) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - finalLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Forma i panetti e inizia la lievitazione finale."
    });

    // Lievitazione della biga (50% del tempo totale)
    const bigaLievitazioneMs = (totalLievitazione * 0.5) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - bigaLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione della biga."
    });

    return plan.reverse();
}

function calculatePlanPoolish(infornataTime, totalLievitazione) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    // Inforna adesso
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    // Fase finale della lievitazione (40% del tempo totale)
    const finalLievitazioneMs = (totalLievitazione * 0.4) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - finalLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Forma i panetti e inizia la lievitazione finale."
    });

    // Lievitazione del poolish (60% del tempo totale)
    const poolishLievitazioneMs = (totalLievitazione * 0.6) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - poolishLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione del poolish."
    });

    return plan.reverse();
}

function calculatePlanLievitoMadre(infornataTime, totalLievitazione) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    // Inforna adesso
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    // Lievitazione finale (30% del tempo totale)
    const finalLievitazioneMs = (totalLievitazione * 0.3) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - finalLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Forma i panetti e inizia la lievitazione finale."
    });

    // Lievitazione principale (70% del tempo totale)
    const mainLievitazioneMs = (totalLievitazione * 0.7) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - mainLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione principale."
    });

    return plan.reverse();
}

function calculatePlanBigaPoolish(infornataTime, totalLievitazione) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    // Inforna adesso
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    // Fase finale della lievitazione (30% del tempo totale)
    const finalLievitazioneMs = (totalLievitazione * 0.3) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - finalLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Forma i panetti e inizia la lievitazione finale."
    });

    // Lievitazione combinata biga e poolish (70% del tempo totale)
    const combinedLievitazioneMs = (totalLievitazione * 0.7) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - combinedLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione combinata di biga e poolish."
    });

    return plan.reverse();
}
