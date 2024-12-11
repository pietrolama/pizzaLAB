document.addEventListener('DOMContentLoaded', () => {
    const tipoPizza = getQueryParam('tipo') || 'napoletana';
    let metodo = getQueryParam('metodo') || null;

    const ingredientiContainer = document.getElementById('ingredienti-container');
    const valoriNutrizionali = {
        calorie: document.getElementById('calorie-totali'),
        grassi: document.getElementById('grassi-totali'),
        carboidrati: document.getElementById('carboidrati-totali'),
        zuccheri: document.getElementById('zuccheri-totali'),
        fibre: document.getElementById('fibre-totali'),
        proteine: document.getElementById('proteine-totali'),
        sale: document.getElementById('sale-totale'),
    };

    let ingredientiAggiunti = [];

    // Carica le ricette e gli ingredienti
    fetch('data/ricette.json')
        .then(response => response.json())
        .then(data => {
            ricette = data;
            // Popola il menu a tendina degli impasti
            Object.keys(ricette).forEach(impasto => {
                const option = document.createElement('option');
                option.value = impasto;
                option.textContent = ricette[impasto].diretto.nome;
                impastoSelezione.appendChild(option);
            });
        })
        .catch(error => console.error('Errore nel caricamento delle ricette:', error));
    
    fetch('data/ingredienti.json')
        .then(response => response.json())
        .then(data => {
            ingredienti = data;
            // Popola il menu a tendina degli ingredienti
            ingredienti.forEach(ingrediente => {
                const option = document.createElement('option');
                option.value = ingrediente.nome;
                option.textContent = ingrediente.nome;
                ingredientiSelezione.appendChild(option);
            });
        })
        .catch(error => console.error('Errore nel caricamento degli ingredienti:', error));

    // Caricamento delle ricette e degli ingredienti
    const checkRicette = setInterval(() => {
        if (window.loadedRicette && window.loadedIngredienti) {
            clearInterval(checkRicette);
            mostraMetodiPerPizza(tipoPizza);
        } else {
            console.log("In attesa di dati...");
        }
    }, 200);

    function mostraMetodiPerPizza(tipoPizza) {
        const pizzaData = window.loadedRicette[tipoPizza];
        if (!pizzaData) {
            ingredientiContainer.innerHTML = "<p>Pizza non trovata nel JSON.</p>";
            return;
        }

        const metodiDisponibili = Object.keys(pizzaData);
        metodo = metodo || metodiDisponibili[0];
        aggiornaSimulazione();
    }

        // Gestione della selezione dell'impasto
    impastoSelezione.addEventListener('change', () => {
        const tipoImpasto = impastoSelezione.value;
        const metodo = "diretto"; // Default per ora
        const numPizze = 2; // Default per ora
        const ricetta = calcolaRicettaFissa(tipoImpasto, metodo, numPizze);
    
        // Aggiungi gli ingredienti base alla lista
        ingredientiAggiunti = ricetta.ingredienti.map(ing => {
            const ingredienteBase = ingredienti.find(i => i.nome === ing.nome);
            return {
                ...ingredienteBase,
                quantita: parseFloat(ing.quantita),
            };
        });
    
        aggiornaListaIngredienti();
    });
    
    // Aggiungi un ingrediente alla lista
    document.getElementById('aggiungi-ingrediente').addEventListener('click', () => {
        const ingredienteSelezionato = ingredientiSelezione.value;
        if (!ingredienteSelezionato) return;
    
        const ingrediente = ingredienti.find(ing => ing.nome === ingredienteSelezionato);
        if (ingrediente) {
            // Aggiungi l'ingrediente alla lista globale
            ingredientiAggiunti.push({ ...ingrediente, quantita: 100 }); // Quantità iniziale di 100g
            aggiornaListaIngredienti();
        }
    });

    function aggiornaSimulazione() {
        if (!metodo) return;

        const ricetta = calcolaRicettaFissa(tipoPizza, metodo, 1); // Una pizza
        if (!ricetta) {
            ingredientiContainer.innerHTML = "<p>Errore nel calcolo della ricetta.</p>";
            return;
        }

        ingredientiAggiunti = ricetta.ingredienti.map(ing => {
            const ingredienteBase = window.loadedIngredienti.find(i => i.nome === ing.nome);
            return {
                ...ingredienteBase,
                quantita: parseFloat(ing.quantita),
            };
        });

        calcolaValoriNutrizionali();
        aggiornaListaIngredienti();
    }

    function calcolaValoriNutrizionali() {
        const totali = {
            calorie: 0,
            grassi: 0,
            carboidrati: 0,
            zuccheri: 0,
            fibre: 0,
            proteine: 0,
            sale: 0,
        };

        ingredientiAggiunti.forEach(ingrediente => {
            const fattore = ingrediente.quantita / 100;
            totali.calorie += ingrediente.calorie * fattore;
            totali.grassi += ingrediente.grassi * fattore;
            totali.carboidrati += ingrediente.carboidrati * fattore;
            totali.zuccheri += ingrediente.zuccheri * fattore;
            totali.fibre += ingrediente.fibre * fattore;
            totali.proteine += ingrediente.proteine * fattore;
            totali.sale += ingrediente.sale * fattore;
        });

        // Aggiorna i valori nutrizionali nella tabella
        valoriNutrizionali.calorie.textContent = totali.calorie.toFixed(1);
        valoriNutrizionali.grassi.textContent = totali.grassi.toFixed(1);
        valoriNutrizionali.carboidrati.textContent = totali.carboidrati.toFixed(1);
        valoriNutrizionali.zuccheri.textContent = totali.zuccheri.toFixed(1);
        valoriNutrizionali.fibre.textContent = totali.fibre.toFixed(1);
        valoriNutrizionali.proteine.textContent = totali.proteine.toFixed(1);
        valoriNutrizionali.sale.textContent = totali.sale.toFixed(1);
    }

    function aggiornaListaIngredienti() {
        ingredientiContainer.innerHTML = ''; // Svuota il contenitore

        ingredientiAggiunti.forEach((ingrediente, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${ingrediente.nome} - ${ingrediente.quantita} g
                <button class="modifica" data-index="${index}">Modifica</button>
                <button class="rimuovi" data-index="${index}">Rimuovi</button>
            `;
            ingredientiContainer.appendChild(li);
        });

        document.querySelectorAll('.modifica').forEach(button => {
            button.addEventListener('click', (e) => modificaIngrediente(e.target.dataset.index));
        });

        document.querySelectorAll('.rimuovi').forEach(button => {
            button.addEventListener('click', (e) => rimuoviIngrediente(e.target.dataset.index));
        });
    }

    function modificaIngrediente(index) {
        const nuovoPeso = prompt('Inserisci il nuovo peso (g):', ingredientiAggiunti[index].quantita);
        if (nuovoPeso && !isNaN(nuovoPeso)) {
            ingredientiAggiunti[index].quantita = parseFloat(nuovoPeso);
            calcolaValoriNutrizionali();
            aggiornaListaIngredienti();
        }
    }

    function rimuoviIngrediente(index) {
        ingredientiAggiunti.splice(index, 1);
        calcolaValoriNutrizionali();
        aggiornaListaIngredienti();
    }

    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
});
