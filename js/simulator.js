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
    let ingredienti = [];
    let ricette = [];

    // Caricamento delle ricette e degli ingredienti
    Promise.all([
        fetch('data/ricette.json')
            .then(response => response.json())
            .then(data => {
                ricette = data;
                window.loadedRicette = ricette;
            })
            .catch(error => console.error('Errore nel caricamento delle ricette:', error)),
        fetch('data/ingredienti.json')
            .then(response => response.json())
            .then(data => {
                ingredienti = data;
                window.loadedIngredienti = ingredienti;
            })
            .catch(error => console.error('Errore nel caricamento degli ingredienti:', error))
    ]).then(() => {
        if (!ricette || !ingredienti) {
            console.error("Errore: Impossibile caricare ricette o ingredienti.");
            return;
        }
        mostraMetodiPerPizza(tipoPizza);
    });

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

    function aggiornaSimulazione() {
        if (!metodo) return;

        const ricetta = calcolaRicettaFissa(tipoPizza, metodo, 1); // Una pizza
        if (!ricetta) {
            ingredientiContainer.innerHTML = "<p>Errore nel calcolo della ricetta.</p>";
            return;
        }

        ingredientiAggiunti = ricetta.ingredienti.map(ing => {
            const ingredienteBase = window.loadedIngredienti.find(i => i.nome === ing.nome) || {};
            return {
                ...ingredienteBase,
                nome: ing.nome,
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
            totali.calorie += (ingrediente.calorie || 0) * fattore;
            totali.grassi += (ingrediente.grassi || 0) * fattore;
            totali.carboidrati += (ingrediente.carboidrati || 0) * fattore;
            totali.zuccheri += (ingrediente.zuccheri || 0) * fattore;
            totali.fibre += (ingrediente.fibre || 0) * fattore;
            totali.proteine += (ingrediente.proteine || 0) * fattore;
            totali.sale += (ingrediente.sale || 0) * fattore;
        });

        // Aggiorna i valori nutrizionali nella tabella
        Object.keys(valoriNutrizionali).forEach(key => {
            valoriNutrizionali[key].textContent = totali[key].toFixed(1);
        });
    }

    function aggiornaListaIngredienti() {
        ingredientiContainer.innerHTML = ''; // Svuota il contenitore

        ingredientiAggiunti.forEach((ingrediente, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${ingrediente.nome} - ${ingrediente.quantita.toFixed(1)} g
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
