document.addEventListener('DOMContentLoaded', () => {
    const tipoPizza = getQueryParam('tipo') || 'napoletana';
    let metodo = getQueryParam('metodo') || null;

    const numPizzeInput = document.getElementById('num_pizze');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const ricettaContainer = document.getElementById('ricetta-container');
    const metodiContainer = document.getElementById('metodi-container');
    const metodiButtons = document.getElementById('metodi-buttons');

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

    const checkRicette = setInterval(() => {
        if (window.loadedRicette) {
            clearInterval(checkRicette);
            mostraMetodiPerPizza(tipoPizza);
        }
    }, 200);

    function mostraMetodiPerPizza(tipoPizza) {
        const pizzaData = window.loadedRicette[tipoPizza];
        if (!pizzaData) {
            ricettaContainer.innerHTML = "<p>Pizza non trovata nel JSON.</p>";
            return;
        }

        const metodiDisponibili = Object.keys(pizzaData);

        if (metodiDisponibili.length === 1) {
            // Un solo metodo: lo usiamo direttamente
            metodiContainer.classList.add('hidden');
            metodo = metodiDisponibili[0];
            aggiornaRicetta();
        } else {
            // Più metodi: mostra pulsanti
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
        if (!metodo) return;
        const numPizze = parseInt(numPizzeInput.value, 10);
        const ricetta = calcolaRicettaFissa(tipoPizza, metodo, numPizze);
        mostraRicetta(ricetta);
    }

    function mostraRicetta(ricetta) {
        if (!ricetta || !ricetta.ingredienti || !ricetta.procedimento) {
            ricettaContainer.innerHTML = "<p>Impossibile caricare la ricetta.</p>";
            return;
        }
        const ingredientiHTML = ricetta.ingredienti.map(ing => <li>${ing.nome}: ${ing.quantita} g</li>).join('');
        const proceduraHTML = ricetta.procedimento.map(step => <p>${step}</p>).join('');

        ricettaContainer.innerHTML = 
            <h2>${ricetta.nome}</h2>
            <h4>Ingredienti:</h4>
            <ul>${ingredientiHTML}</ul>
            <h4>Procedura:</h4>
            ${proceduraHTML}
        ;

        // Aggiungiamo la classe active per mostrare la ricetta se il CSS richiede .active per opacity 1
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

// Queste funzioni devono esistere già in calcolatore_script.js o essere definite qui.
// A scopo dimostrativo, vengono definite minimalmente qui.

function calcolaRicettaFissa(tipoPizza, metodo, numPanetti) {
    const peso_panetto = 250;
    const idratazione = 70;
    const tempo_lievitazione = 8;
    const tempo_frigo = 0;
    const temperatura_ambiente = 22;
    const in_teglia = false;

    let datiCalcolati = null;

    if (metodo === "diretto") {
        datiCalcolati = calcolaDirettoParam(numPanetti, peso_panetto, idratazione, tempo_lievitazione, tempo_frigo, temperatura_ambiente, in_teglia);
    } else {
        return null;
    }

    const baseRicetta = window.loadedRicette[tipoPizza][metodo];
    if (!baseRicetta) return null;

    const ingredienti = baseRicetta.ingredienti.map(ing => {
        let q = ing.quantita;
        Object.entries(datiCalcolati).forEach(([key, value]) => {
            q = q.replace(<${key}>, value);
        });
        return {nome: ing.nome, quantita: q};
    });

    const procedimento = baseRicetta.procedimento.map(step => {
        let s = step;
        Object.entries(datiCalcolati).forEach(([key, value]) => {
            s = s.replace(<${key}>, value);
        });
        return s;
    });

    return {
        nome: baseRicetta.nome,
        ingredienti,
        procedimento
    };
}

function calcolaDirettoParam(numPanetti, pesoPanetto, idratazione, tempoLievitazioneTotale, oreFrigo, temperaturaAmbiente, inTeglia) {
    var tempoLievitazioneEffettivo = tempoLievitazioneTotale;
    if (oreFrigo > 0) {
        tempoLievitazioneEffettivo = tempoLievitazioneTotale - (9 * oreFrigo / 10);
    }
    var massa = tempoLievitazioneEffettivo * 0.1;
    var apretto = tempoLievitazioneEffettivo - massa;

    var pesoFarina = (100 * pesoPanetto) / (100 + idratazione) * numPanetti;
    var pesoAcqua = idratazione * pesoFarina / 100;
    var pesoSale = 0.02 * pesoFarina;
    var pesoZucchero = 0.013 * pesoFarina;
    var pesoOlio = 0.032 * pesoFarina;

    // Assicurarsi che la funzione calcolaLievito esista in calcolatore_script.js
    var lievito = calcolaLievito(
        numPanetti,
        pesoPanetto,
        idratazione,
        pesoSale,
        pesoOlio,
        tempoLievitazioneEffettivo,
        oreFrigo,
        temperaturaAmbiente,
        inTeglia
    );

    if (isNaN(lievito)) {
        lievito = 0;
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
        pesoOlio: pesoOlio.toFixed(2)
    };
}
