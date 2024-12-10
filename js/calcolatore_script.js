// dettagli-ricetta.js
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
        // Controlliamo se loadedRicette è disponibile
        if (window.loadedRicette) {
            clearInterval(checkRicette);
            mostraMetodiPerPizza(tipoPizza);
        } else {
            console.log("In attesa di loadedRicette...");
        }
    }, 200);

    function mostraMetodiPerPizza(tipoPizza) {
        const pizzaData = window.loadedRicette[tipoPizza];
        if (!pizzaData) {
            ricettaContainer.innerHTML = "<p>Pizza non trovata nel JSON.</p>";
            return;
        }

        // metodiDisponibili è un array dei metodi disponibili (es: ['diretto'], ['diretto','biga'], etc.)
        const metodiDisponibili = Object.keys(pizzaData);

        if (metodiDisponibili.length === 1) {
            // Un solo metodo disponibile
            metodiContainer.classList.add('hidden');
            metodo = metodiDisponibili[0];
            aggiornaRicetta();
        } else {
            // Più metodi: mostra i pulsanti per la selezione
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
        const ingredientiHTML = ricetta.ingredienti.map(ing => `<li>${ing.nome}: ${ing.quantita} g</li>`).join('');
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

// Revisione della funzione calcolaRicettaFissa per supportare tutti i metodi
function calcolaRicettaFissa(tipoPizza, metodo, numPanetti) {
    const peso_panetto = 250;
    const idratazione = 70;
    const tempo_lievitazione = 8;
    const tempo_frigo = 0;
    const temperatura_ambiente = 22;
    const in_teglia = false;

    let datiCalcolati = null;
    // Usiamo valori percentuali di default
    switch (metodo) {
        case "diretto":
            datiCalcolati = calcolaDirettoParam(numPanetti, peso_panetto, idratazione, tempo_lievitazione, tempo_frigo, temperatura_ambiente, in_teglia);
            break;
        case "biga":
            // esempio: percentuale biga = 70%
            datiCalcolati = calcolaBigaParam(numPanetti, peso_panetto, idratazione, tempo_lievitazione, tempo_frigo, temperatura_ambiente, in_teglia, 70);
            break;
        case "poolish":
            // esempio: percentuale poolish = 50%
            datiCalcolati = calcolaPoolishParam(numPanetti, peso_panetto, idratazione, tempo_lievitazione, tempo_frigo, temperatura_ambiente, in_teglia, 50);
            break;
        case "lievito_madre":
            // esempio: percentuale pasta madre = 30%
            datiCalcolati = calcolaLievitoMadreParam(numPanetti, peso_panetto, idratazione, tempo_lievitazione, tempo_frigo, temperatura_ambiente, in_teglia, 30);
            break;
        case "biga_poolish":
            // esempio: percentuale biga=40%, poolish=40%
            datiCalcolati = calcolaBigaPoolishParam(numPanetti, peso_panetto, idratazione, tempo_lievitazione, tempo_frigo, temperatura_ambiente, in_teglia, 40, 40);
            break;
        default:
            return null;
    }

    const baseRicetta = window.loadedRicette[tipoPizza][metodo];
    if (!baseRicetta) return null;

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
