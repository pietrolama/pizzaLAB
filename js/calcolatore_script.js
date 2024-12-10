document.addEventListener('DOMContentLoaded', () => {
    const tipoPizza = getQueryParam('tipo') || 'napoletana';
    let metodo = getQueryParam('metodo') || null;

    const numPizzeInput = document.getElementById('num_pizze');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const ricettaContainer = document.getElementById('ricetta-container');
    const metodiContainer = document.getElementById('metodi-container');
    const metodiButtons = document.getElementById('metodi-buttons');

    // Aggiorna il numero di pizze e calcola
    btnMinus.addEventListener('click', () => {
        let val = parseInt(numPizzeInput.value, 10);
        if (val > 1) {
            numPizzeInput.value = val - 1;
            aggiornaRicetta();
        }
    });

    btnPlus.addEventListener('click', () => {
        let val = parseInt(numPizzeInput.value, 10);
        numPizzeInput.value = val + 1;
        aggiornaRicetta();
    });

    numPizzeInput.addEventListener('change', aggiornaRicetta);

    // Controlla il caricamento delle ricette
    const checkRicette = setInterval(() => {
        if (window.loadedRicette) {
            clearInterval(checkRicette);
            console.log("loadedRicette caricato:", window.loadedRicette);
            mostraMetodiPerPizza(tipoPizza);
        } else {
            console.log("In attesa di loadedRicette...");
        }
    }, 200);

    function mostraMetodiPerPizza(tipoPizza) {
        const pizzaData = window.loadedRicette[tipoPizza];
        if (!pizzaData) {
            console.error(`Tipo pizza "${tipoPizza}" non trovato in loadedRicette.`);
            ricettaContainer.innerHTML = "<p>Pizza non trovata nel JSON.</p>";
            return;
        }

        const metodiDisponibili = Object.keys(pizzaData);
        console.log("Metodi disponibili:", metodiDisponibili);

        if (metodiDisponibili.length === 1) {
            metodiContainer.classList.add('hidden');
            metodo = metodiDisponibili[0];
            aggiornaRicetta();
        } else {
            metodiContainer.classList.remove('hidden');
            metodiButtons.innerHTML = '';

            metodiDisponibili.forEach(m => {
                const btn = document.createElement('button');
                btn.textContent = capitalizza(m);
                btn.addEventListener('click', () => {
                    metodo = m;
                    aggiornaRicetta();
                });
                metodiButtons.appendChild(btn);
            });

            if (!metodo || !metodiDisponibili.includes(metodo)) {
                metodo = metodiDisponibili[0];
            }
            aggiornaRicetta();
        }
    }

    function aggiornaRicetta() {
        if (!metodo) {
            console.warn("Nessun metodo selezionato.");
            return;
        }

        const numPizze = parseInt(numPizzeInput.value, 10);
        console.log(`Calcolo ricetta per tipo: ${tipoPizza}, metodo: ${metodo}, numero pizze: ${numPizze}`);
        const ricetta = calcolaRicettaFissa(tipoPizza, metodo, numPizze);
        if (ricetta) {
            mostraRicetta(ricetta);
        } else {
            console.error("Ricetta non calcolata correttamente.");
        }
    }

    function mostraRicetta(ricetta) {
        if (!ricetta || !ricetta.ingredienti || !ricetta.procedimento) {
            console.error("Errore nella ricetta:", ricetta);
            ricettaContainer.innerHTML = "<p>Impossibile caricare la ricetta.</p>";
            return;
        }

        const ingredientiHTML = ricetta.ingredienti.map(ing => `<li>${ing.nome}: ${ing.quantita}</li>`).join('');
        const proceduraHTML = ricetta.procedimento.map(step => `<p>${step}</p>`).join('');

        ricettaContainer.innerHTML = `
            <h2>${ricetta.nome}</h2>
            <h4>Ingredienti:</h4>
            <ul>${ingredientiHTML}</ul>
            <h4>Procedura:</h4>
            ${proceduraHTML}
        `;
        ricettaContainer.classList.add('active');
    }

    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    function capitalizza(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});

// Funzione per calcolare la ricetta in modo fisso
function calcolaRicettaFissa(tipoPizza, metodo, numPanetti) {
    const baseRicetta = window.loadedRicette[tipoPizza]?.[metodo];
    if (!baseRicetta) {
        console.error(`Ricetta non trovata per tipo: ${tipoPizza}, metodo: ${metodo}`);
        return null;
    }

    // Parametri fissi
    const peso_panetto = 250;
    const idratazione = 70;
    const tempo_lievitazione = 8;

    let datiCalcolati = calcolaParametri(metodo, numPanetti, peso_panetto, idratazione, tempo_lievitazione);

    const ingredienti = baseRicetta.ingredienti.map(ing => {
        let q = ing.quantita;
        Object.entries(datiCalcolati).forEach(([key, value]) => {
            q = q.replace(`<${key}>`, value);
        });
        return { nome: ing.nome, quantita: q };
    });

    const procedimento = baseRicetta.procedimento.map(step => {
        let s = step;
        Object.entries(datiCalcolati).forEach(([key, value]) => {
            s = s.replace(`<${key}>`, value);
        });
        return s;
    });

    return {
        nome: baseRicetta.nome,
        ingredienti,
        procedimento
    };
}

function calcolaParametri(metodo, numPanetti, pesoPanetto, idratazione, tempoLievitazione) {
    switch (metodo) {
        case "diretto":
            return calcolaDirettoParam(numPanetti, pesoPanetto, idratazione, tempoLievitazione);
        case "biga":
            return calcolaBigaParam(numPanetti, pesoPanetto, idratazione, 70);
        default:
            console.warn(`Metodo ${metodo} non supportato.`);
            return {};
    }
}
// Le seguenti funzioni devono già esistere o essere definite qui
// Assicurati che `calcolaLievito` sia definita nel tuo calcolatore_script.js
function calcolaDirettoParam(numPanetti, pesoPanetto, idratazione, tempoLievitazioneTotale, oreFrigo, temperaturaAmbiente, inTeglia) {
    var tempoLievitazioneEffettivo = tempoLievitazioneTotale;
    if (oreFrigo > 0) {
        tempoLievitazioneEffettivo -= (9 * oreFrigo / 10);
    }
    var massa = tempoLievitazioneEffettivo * 0.1;
    var apretto = tempoLievitazioneEffettivo - massa;

    var pesoFarina = (100 * pesoPanetto) / (100 + idratazione) * numPanetti;
    var pesoAcqua = idratazione * pesoFarina / 100;
    var pesoSale = 0.02 * pesoFarina;
    var pesoZucchero = 0.013 * pesoFarina;
    var pesoOlio = 0.032 * pesoFarina;

    var lievito = calcolaLievito(numPanetti, pesoPanetto, idratazione, pesoSale, pesoOlio, tempoLievitazioneEffettivo, oreFrigo, temperaturaAmbiente, inTeglia);
    if (isNaN(lievito)) lievito = 0;

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
        pesoOlio: pesoOlio.toFixed(2)
    };
}

function calcolaBigaParam(numPanetti, pesoPanetto, idratazione, t, f, ta, i, percentualeBiga) {
    // Implementazione come precedentemente mostrata
    var pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazione / 100);
    var pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    var pesoAcquaBiga = pesoFarinaBiga * 0.44;
    var pesoLievitoBiga = pesoFarinaBiga * 0.01;
    var pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaBiga;
    var pesoAcquaPrincipale = (pesoTotaleFarina * (idratazione / 100)) - pesoAcquaBiga;

    var sale = 0.02 * pesoTotaleFarina;
    var zucchero = 0.015 * pesoTotaleFarina;
    var olio = 0.03 * pesoTotaleFarina;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarina: pesoFarinaPrincipale.toFixed(2),
        pesoAcqua: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaBiga: pesoAcquaBiga.toFixed(2),
        pesoFarinaBiga: pesoFarinaBiga.toFixed(2),
        pesoLievitoBiga: pesoLievitoBiga.toFixed(2),
        pesoOlio: olio.toFixed(2)
    };
}

function calcolaPoolishParam(numPanetti, pesoPanetto, idratazione, t, f, ta, i, percentualePoolish) {
    var pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazione / 100);
    var pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    var pesoAcquaPoolish = pesoFarinaPoolish;
    var pesoLievitoPoolish = pesoFarinaPoolish * 0.001;
    var pesoFarinaPrincipale = pesoTotaleFarina - pesoFarinaPoolish;
    var pesoAcquaPrincipale = (pesoTotaleFarina * (idratazione / 100)) - pesoAcquaPoolish;

    var sale = 0.02 * pesoTotaleFarina;
    var zucchero = 0.015 * pesoTotaleFarina;
    var olio = 0.03 * pesoTotaleFarina;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarina: pesoFarinaPrincipale.toFixed(2),
        pesoAcqua: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaPoolish: pesoAcquaPoolish.toFixed(2),
        pesoFarinaPoolish: pesoFarinaPoolish.toFixed(2),
        pesoLievitoPoolish: pesoLievitoPoolish.toFixed(2),
        pesoOlio: olio.toFixed(2)
    };
}

function calcolaLievitoMadreParam(numPanetti, pesoPanetto, idratazione, t, f, ta, i, percentualePastaMadre) {
    var pesoTotaleImpasto = pesoPanetto * numPanetti;
    var pesoPastaMadreFinale = (percentualePastaMadre / 100) * pesoTotaleImpasto;

    var farinaPastaMadre = pesoPastaMadreFinale * (2/3);
    var acquaPastaMadre = pesoPastaMadreFinale * (1/3);

    var farinaPrincipale = (pesoTotaleImpasto - pesoPastaMadreFinale) / (1 + idratazione / 100);
    var acquaPrincipale = farinaPrincipale * (idratazione / 100);

    var pesoZucchero = 0.015 * (farinaPrincipale + farinaPastaMadre);
    var pesoOlio = 0.03 * (farinaPrincipale + farinaPastaMadre);
    var pesoSale = 0.02 * (farinaPrincipale + farinaPastaMadre);

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarina: farinaPrincipale.toFixed(2),
        pesoAcqua: acquaPrincipale.toFixed(2),
        pesoSale: pesoSale.toFixed(2),
        pesoZucchero: pesoZucchero.toFixed(2),
        pesoOlio: pesoOlio.toFixed(2),
        pesoPastaMadreFinale: pesoPastaMadreFinale.toFixed(2),
        farinaPastaMadre: farinaPastaMadre.toFixed(2),
        acquaPastaMadre: acquaPastaMadre.toFixed(2)
    };
}

function calcolaBigaPoolishParam(numPanetti, pesoPanetto, idratazione, t, f, ta, i, percentualeBiga, percentualePoolish) {
    var pesoTotaleFarina = (pesoPanetto * numPanetti) / (1 + idratazione / 100);
    var pesoFarinaBiga = pesoTotaleFarina * (percentualeBiga / 100);
    var pesoAcquaBiga = pesoFarinaBiga * 0.44;
    var pesoFarinaPoolish = pesoTotaleFarina * (percentualePoolish / 100);
    var pesoAcquaPoolish = pesoFarinaPoolish;
    var pesoFarinaPrincipale = pesoTotaleFarina - (pesoFarinaBiga + pesoFarinaPoolish);
    var pesoAcquaPrincipale = (pesoTotaleFarina * (idratazione / 100)) - (pesoAcquaBiga + pesoAcquaPoolish);

    var sale = 0.02 * pesoTotaleFarina;
    var zucchero = 0.015 * pesoTotaleFarina;
    var olio = 0.03 * pesoTotaleFarina;

    return {
        numPanetti: numPanetti.toFixed(0),
        pesoPanetto: pesoPanetto.toFixed(0),
        pesoFarinaPrincipale: pesoFarinaPrincipale.toFixed(2),
        pesoAcquaPrincipale: pesoAcquaPrincipale.toFixed(2),
        pesoSale: sale.toFixed(2),
        pesoAcquaPoolish: pesoAcquaPoolish.toFixed(2),
        pesoFarinaPoolish: pesoFarinaPoolish.toFixed(2),
        pesoOlio: olio.toFixed(2),
        pesoAcquaBiga: pesoAcquaBiga.toFixed(2),
        pesoFarinaBiga: pesoFarinaBiga.toFixed(2)
    };
}
