// Riferimenti agli elementi HTML
const impastoSelezione = document.getElementById('impasto-selezione');
const ingredientiSelezione = document.getElementById('ingredienti-selezione');
const listaIngredienti = document.getElementById('lista-ingredienti');
const calcolaValoriButton = document.getElementById('calcola-valori');
const valoriNutrizionali = {
    calorie: document.getElementById('calorie-totali'),
    grassi: document.getElementById('grassi-totali'),
    carboidrati: document.getElementById('carboidrati-totali'),
    zuccheri: document.getElementById('zuccheri-totali'),
    fibre: document.getElementById('fibre-totali'),
    proteine: document.getElementById('proteine-totali'),
    sale: document.getElementById('sale-totale'),
};

// Variabili globali
let ingredientiAggiunti = [];
let ricette = [];
let ingredienti = [];

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

// Aggiorna la lista degli ingredienti visualizzata
function aggiornaListaIngredienti() {
    listaIngredienti.innerHTML = ''; // Svuota la lista

    ingredientiAggiunti.forEach((ingrediente, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${ingrediente.nome} - ${ingrediente.quantita} g
            <button class="modifica" data-index="${index}">Modifica</button>
            <button class="rimuovi" data-index="${index}">Rimuovi</button>
        `;
        listaIngredienti.appendChild(li);
    });

    // Aggiungi listener per i pulsanti di modifica e rimuovi
    document.querySelectorAll('.modifica').forEach(button => {
        button.addEventListener('click', (e) => modificaIngrediente(e.target.dataset.index));
    });

    document.querySelectorAll('.rimuovi').forEach(button => {
        button.addEventListener('click', (e) => rimuoviIngrediente(e.target.dataset.index));
    });
}

// Modifica un ingrediente
function modificaIngrediente(index) {
    const nuovoPeso = prompt('Inserisci il nuovo peso (g):', ingredientiAggiunti[index].quantita);
    if (nuovoPeso && !isNaN(nuovoPeso)) {
        ingredientiAggiunti[index].quantita = parseFloat(nuovoPeso);
        aggiornaListaIngredienti();
    }
}

// Rimuovi un ingrediente
function rimuoviIngrediente(index) {
    ingredientiAggiunti.splice(index, 1);
    aggiornaListaIngredienti();
}

// Calcola i valori nutrizionali totali
calcolaValoriButton.addEventListener('click', () => {
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
        const fattore = ingrediente.quantita / 100; // Calcola il fattore basato su 100g
        totali.calorie += ingrediente.calorie * fattore;
        totali.grassi += ingrediente.grassi * fattore;
        totali.carboidrati += ingrediente.carboidrati * fattore;
        totali.zuccheri += ingrediente.zuccheri * fattore;
        totali.fibre += ingrediente.fibre * fattore;
        totali.proteine += ingrediente.proteine * fattore;
        totali.sale += ingrediente.sale * fattore;
    });

    // Aggiorna la tabella con i valori totali
    valoriNutrizionali.calorie.textContent = totali.calorie.toFixed(1);
    valoriNutrizionali.grassi.textContent = totali.grassi.toFixed(1);
    valoriNutrizionali.carboidrati.textContent = totali.carboidrati.toFixed(1);
    valoriNutrizionali.zuccheri.textContent = totali.zuccheri.toFixed(1);
    valoriNutrizionali.fibre.textContent = totali.fibre.toFixed(1);
    valoriNutrizionali.proteine.textContent = totali.proteine.toFixed(1);
    valoriNutrizionali.sale.textContent = totali.sale.toFixed(1);
});
// Riferimenti agli elementi HTML
const impastoSelezione = document.getElementById('impasto-selezione');
const ingredientiSelezione = document.getElementById('ingredienti-selezione');
const listaIngredienti = document.getElementById('lista-ingredienti');
const calcolaValoriButton = document.getElementById('calcola-valori');
const valoriNutrizionali = {
    calorie: document.getElementById('calorie-totali'),
    grassi: document.getElementById('grassi-totali'),
    carboidrati: document.getElementById('carboidrati-totali'),
    zuccheri: document.getElementById('zuccheri-totali'),
    fibre: document.getElementById('fibre-totali'),
    proteine: document.getElementById('proteine-totali'),
    sale: document.getElementById('sale-totale'),
};

// Variabili globali
let ingredientiAggiunti = [];
let ricette = [];
let ingredienti = [];

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

// Aggiorna la lista degli ingredienti visualizzata
function aggiornaListaIngredienti() {
    listaIngredienti.innerHTML = ''; // Svuota la lista

    ingredientiAggiunti.forEach((ingrediente, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${ingrediente.nome} - ${ingrediente.quantita} g
            <button class="modifica" data-index="${index}">Modifica</button>
            <button class="rimuovi" data-index="${index}">Rimuovi</button>
        `;
        listaIngredienti.appendChild(li);
    });

    // Aggiungi listener per i pulsanti di modifica e rimuovi
    document.querySelectorAll('.modifica').forEach(button => {
        button.addEventListener('click', (e) => modificaIngrediente(e.target.dataset.index));
    });

    document.querySelectorAll('.rimuovi').forEach(button => {
        button.addEventListener('click', (e) => rimuoviIngrediente(e.target.dataset.index));
    });
}

// Modifica un ingrediente
function modificaIngrediente(index) {
    const nuovoPeso = prompt('Inserisci il nuovo peso (g):', ingredientiAggiunti[index].quantita);
    if (nuovoPeso && !isNaN(nuovoPeso)) {
        ingredientiAggiunti[index].quantita = parseFloat(nuovoPeso);
        aggiornaListaIngredienti();
    }
}

// Rimuovi un ingrediente
function rimuoviIngrediente(index) {
    ingredientiAggiunti.splice(index, 1);
    aggiornaListaIngredienti();
}

// Calcola i valori nutrizionali totali
calcolaValoriButton.addEventListener('click', () => {
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
        const fattore = ingrediente.quantita / 100; // Calcola il fattore basato su 100g
        totali.calorie += ingrediente.calorie * fattore;
        totali.grassi += ingrediente.grassi * fattore;
        totali.carboidrati += ingrediente.carboidrati * fattore;
        totali.zuccheri += ingrediente.zuccheri * fattore;
        totali.fibre += ingrediente.fibre * fattore;
        totali.proteine += ingrediente.proteine * fattore;
        totali.sale += ingrediente.sale * fattore;
    });

    // Aggiorna la tabella con i valori totali
    valoriNutrizionali.calorie.textContent = totali.calorie.toFixed(1);
    valoriNutrizionali.grassi.textContent = totali.grassi.toFixed(1);
    valoriNutrizionali.carboidrati.textContent = totali.carboidrati.toFixed(1);
    valoriNutrizionali.zuccheri.textContent = totali.zuccheri.toFixed(1);
    valoriNutrizionali.fibre.textContent = totali.fibre.toFixed(1);
    valoriNutrizionali.proteine.textContent = totali.proteine.toFixed(1);
    valoriNutrizionali.sale.textContent = totali.sale.toFixed(1);
});
