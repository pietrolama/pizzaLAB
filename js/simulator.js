// simulator.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Definizione delle Funzioni Globali Necessarie
    window.calcola = function() {
        // Implementa la logica per 'calcola' qui
        console.log("Funzione 'calcola' eseguita.");
        // Esempio: Puoi integrare qui calcoli specifici o aggiornamenti della UI
    };

    window.generaPianoGenerico = function() {
        // Implementa la logica per 'generaPianoGenerico' qui
        console.log("Funzione 'generaPianoGenerico' eseguita.");
        // Esempio: Puoi generare un piano nutrizionale basato sugli ingredienti aggiunti
    };

    window.toggleSections = function() {
        // Implementa la logica per 'toggleSections' qui
        console.log("Funzione 'toggleSections' eseguita.");
        const tipoImpasto = document.getElementById('tipo_impasto')?.value;
        if (tipoImpasto === 'biga') {
            // Mostra sezioni specifiche per 'biga'
            console.log("Tipo impasto: Biga");
            // Aggiungi qui la logica per mostrare/nascondere sezioni
        } else if (tipoImpasto === 'poolish') {
            // Mostra sezioni specifiche per 'poolish'
            console.log("Tipo impasto: Poolish");
            // Aggiungi qui la logica per mostrare/nascondere sezioni
        }
        // Aggiungi ulteriori condizioni se necessario
    };

    // 2. Riferimenti agli Elementi per i Valori Nutrizionali
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

    // 3. Funzione per Recuperare i Parametri dalla Query String
    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // 4. Caricamento dei Dati delle Ricette e degli Ingredienti
    Promise.all([
        fetch('data/ricette.json').then(res => res.json()),
        fetch('data/ingredienti.json').then(res => res.json())
    ])
    .then(([ricette, ingredienti]) => {
        window.loadedRicette = ricette;
        window.loadedIngredienti = ingredienti;
        const tipoPizza = getQueryParam('tipo') || 'napoletana';
        const metodoPizza = getQueryParam('metodo') || 'diretto';
        configuraCalcolatore(tipoPizza, metodoPizza);
    })
    .catch(err => console.error("Errore nel caricamento dei dati:", err));

    // 5. Configura il Calcolatore in Base alla Ricetta
    function configuraCalcolatore(tipoPizza, metodoPizza) {
        const ricetta = window.loadedRicette[tipoPizza]?.[metodoPizza];
        if (!ricetta) {
            console.error("Ricetta non trovata:", tipoPizza, metodoPizza);
            return;
        }

        // Configura gli ingredienti
        ingredientiAggiunti = ricetta.ingredienti.map(ing => {
            const ingredienteBase = window.loadedIngredienti.find(i => i.nome === ing.nome) || {};
            return {
                nome: ing.nome,
                quantita: parseFloat(ing.quantita) || 0,
                ...ingredienteBase
            };
        });

        aggiornaListaIngredienti();
        calcolaValoriNutrizionali();
    }

    // 6. Aggiorna la Lista degli Ingredienti Visibile
    function aggiornaListaIngredienti() {
        const lista = document.getElementById('lista-ingredienti');
        if (!lista) {
            console.error("Elemento 'lista-ingredienti' non trovato nel DOM.");
            return;
        }
        lista.innerHTML = ''; // Pulisce la lista esistente

        ingredientiAggiunti.forEach((ingrediente, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${ingrediente.nome} - ${ingrediente.quantita} g
                <button class="modifica" data-index="${index}">Modifica</button>
                <button class="rimuovi" data-index="${index}">Rimuovi</button>
            `;
            lista.appendChild(li);
        });

        // Aggiungi eventi per modifica e rimozione
        document.querySelectorAll('.modifica').forEach(button => {
            button.addEventListener('click', e => modificaIngrediente(e.target.dataset.index));
        });

        document.querySelectorAll('.rimuovi').forEach(button => {
            button.addEventListener('click', e => rimuoviIngrediente(e.target.dataset.index));
        });
    }

    // 7. Modifica la Quantità di un Ingrediente
    function modificaIngrediente(index) {
        const nuovoPeso = prompt("Inserisci il nuovo peso (g):", ingredientiAggiunti[index].quantita);
        if (nuovoPeso && !isNaN(nuovoPeso)) {
            ingredientiAggiunti[index].quantita = parseFloat(nuovoPeso);
            aggiornaListaIngredienti();
            calcolaValoriNutrizionali();
        }
    }

    // 8. Rimuove un Ingrediente
    function rimuoviIngrediente(index) {
        ingredientiAggiunti.splice(index, 1);
        aggiornaListaIngredienti();
        calcolaValoriNutrizionali();
    }

    // 9. Calcola i Valori Nutrizionali Totali
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

        // Aggiorna i valori nella UI
        Object.keys(valoriNutrizionali).forEach(key => {
            if (valoriNutrizionali[key]) {
                valoriNutrizionali[key].textContent = totali[key].toFixed(1);
            } else {
                console.warn(`Elemento per ${key} non trovato.`);
            }
        });
    }

    // 10. Aggiungi Event Listener per il Bottone "Aggiungi Ingrediente"
    const aggiungiButton = document.getElementById('aggiungi-ingrediente');
    if (aggiungiButton) {
        aggiungiButton.addEventListener('click', () => {
            const select = document.getElementById('ingredienti-selezione');
            const selectedIngredientName = select.value;
            
            if (!selectedIngredientName) {
                alert('Per favore, seleziona un ingrediente.');
                return;
            }

            const ingrediente = window.loadedIngredienti.find(i => i.nome === selectedIngredientName);
            if (ingrediente) {
                ingredientiAggiunti.push({
                    nome: ingrediente.nome,
                    quantita: 100, // Default quantità, puoi modificare secondo necessità
                    ...ingrediente
                });
                aggiornaListaIngredienti();
                calcolaValoriNutrizionali();
            } else {
                console.error('Ingrediente non trovato:', selectedIngredientName);
            }
        });
    } else {
        console.warn("Elemento 'aggiungi-ingrediente' non trovato nel DOM.");
    }

    // 11. Aggiungi Event Listener per il Bottone "Calcola Valori Nutrizionali"
    const calcolaButton = document.getElementById('calcola-valori');
    if (calcolaButton) {
        calcolaButton.addEventListener('click', () => {
            calcolaValoriNutrizionali();
        });
    } else {
        console.warn("Elemento 'calcola-valori' non trovato nel DOM.");
    }

    // 12. Event Listener per il Pulsante 'Calcola e Genera Ricetta' e per Genera Piano
    const calcolaRicettaButton = document.getElementById('calcola-button');
    if (calcolaRicettaButton) {
        calcolaRicettaButton.addEventListener('click', calcola);
    } else {
        console.warn("Elemento 'calcola-button' non trovato nel DOM.");
    }

    const generaPianoButton = document.getElementById('genera-piano');
    if (generaPianoButton) {
        generaPianoButton.addEventListener('click', generaPianoGenerico);
    } else {
        console.warn("Elemento 'genera-piano' non trovato nel DOM.");
    }

    // 13. Event Listener per il Cambiamento del Metodo di Impasto
    const tipoImpastoElement = document.getElementById('tipo_impasto');
    if (tipoImpastoElement) {
        tipoImpastoElement.addEventListener('change', toggleSections);
    } else {
        console.warn("Elemento 'tipo_impasto' non trovato nel DOM.");
    }
});
