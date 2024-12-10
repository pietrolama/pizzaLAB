// dettagli-ricetta.js
document.addEventListener('DOMContentLoaded', () => {
    const tipoPizza = getQueryParam('tipo') || 'napoletana';
    let metodo = getQueryParam('metodo') || null; // se non c'è, sceglieremo il primo disponibile
    const numPizzeInput = document.getElementById('num_pizze');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const ricettaContainer = document.getElementById('ricetta-container');
    const metodiContainer = document.getElementById('metodi-container');
    const metodiButtons = document.getElementById('metodi-buttons');

    // Aggiorna ricetta quando cambia il numero di pizze
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

    // Attendi che le ricette siano caricate
    const checkRicette = setInterval(() => {
        if (window.loadedRicette) {
            clearInterval(checkRicette);
            // Adesso che abbiamo loadedRicette, mostriamo i metodi per la pizza scelta
            mostraMetodiPerPizza(tipoPizza);
        }
    }, 200);

    function mostraMetodiPerPizza(tipoPizza) {
        const pizzaData = window.loadedRicette[tipoPizza];
        if (!pizzaData) {
            ricettaContainer.innerHTML = "<p>Pizza non trovata.</p>";
            return;
        }

        const metodiDisponibili = Object.keys(pizzaData);
        if (metodiDisponibili.length > 1) {
            // Se ci sono più metodi, mostriamo i pulsanti
            metodiContainer.classList.remove('hidden');
            metodiButtons.innerHTML = ''; // svuota
            
            metodiDisponibili.forEach(m => {
                const btn = document.createElement('button');
                btn.textContent = m.charAt(0).toUpperCase() + m.slice(1); // capitalizza ad esempio 'diretto' -> 'Diretto'
                btn.addEventListener('click', () => {
                    metodo = m;
                    aggiornaRicetta();
                });
                metodiButtons.appendChild(btn);
            });

            // Se il metodo non era specificato, usiamo il primo
            if (!metodo) {
                metodo = metodiDisponibili[0];
            }
        } else {
            // Se c'è un solo metodo, non c'è bisogno di mostrare i pulsanti
            metodiContainer.classList.add('hidden');
            metodo = metodiDisponibili[0]; // l'unico metodo
        }

        aggiornaRicetta();
    }

    function aggiornaRicetta() {
        if (!metodo) return; // se ancora non abbiamo un metodo, aspettiamo
        const numPizze = parseInt(numPizzeInput.value, 10);
        const ricetta = calcolaRicettaFissa(tipoPizza, metodo, numPizze);
        mostraRicetta(ricetta);
    }

    function mostraRicetta(ricetta) {
        if (!ricetta || !ricetta.ingredienti || !ricetta.procedimento) {
            ricettaContainer.innerHTML = "<p>Impossibile caricare la ricetta.</p>";
            return;
        }
        const ingredientiHTML = ricetta.ingredienti.map(ing => `<li>${ing.nome}: ${ing.quantita} g</li>`).join('');
        const proceduraHTML = ricetta.procedimento.map(step => `<p>${step}</p>`).join('');

        ricettaContainer.innerHTML = `
            <h2>${ricetta.nome}</h2>
            <h4>Ingredienti:</h4>
            <ul>${ingredientiHTML}</ul>
            <h4>Procedura:</h4>
            ${proceduraHTML}
        `;
    }

    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
});

// Funzione per calcolare la ricetta in modo fisso
function calcolaRicettaFissa(tipoPizza, metodo, numPanetti) {
    // Parametri fissi di esempio
    const peso_panetto = 250; // fisso
    const idratazione = 70;   // fisso
    const tempo_lievitazione = 8; // fisso
    const tempo_frigo = 0; // fisso
    const temperatura_ambiente = 22; // fisso
    const in_teglia = false; // fisso

    let datiCalcolati = null;

    if (metodo === "diretto") {
        datiCalcolati = calcolaDirettoParam(numPanetti, peso_panetto, idratazione, tempo_lievitazione, tempo_frigo, temperatura_ambiente, in_teglia);
    } else {
        alert("Metodo non supportato in questa demo.");
        return null;
    }

    const baseRicetta = window.loadedRicette[tipoPizza][metodo];

    // Calcolo ingredienti
    const ingredienti = baseRicetta.ingredienti.map(ing => {
        let q = ing.quantita;
        Object.entries(datiCalcolati).forEach(([key, value]) => {
            q = q.replace(`<${key}>`, value);
        });
        return {nome: ing.nome, quantita: q};
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

function calcolaDirettoParam(numPanetti, pesoPanetto, idratazione, tempoLievitazioneTotale, oreFrigo, temperaturaAmbiente, inTeglia) {
    var tempoLievitazioneEffettivo = tempoLievitazioneTotale;
    if (oreFrigo > 0) {
        tempoLievitazioneEffettivo = tempoLievitazioneTotale - (9 * oreFrigo / 10);
    }
    var massa = tempoLievitazioneEffettivo * 10 / 100;
    var apretto = tempoLievitazioneEffettivo - massa;

    var pesoFarina = (100 * pesoPanetto) / (100 + idratazione) * numPanetti;
    var pesoAcqua = idratazione * pesoFarina / 100;
    var pesoSale = 0.02 * pesoFarina;
    var pesoZucchero = 0.013 * pesoFarina;
    var pesoOlio = 0.032 * pesoFarina;

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