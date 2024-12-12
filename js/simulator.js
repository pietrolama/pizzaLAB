// simulator.js

document.addEventListener('DOMContentLoaded', () => {
    // Definizione delle funzioni globali necessarie per `calcolatore_script.js`
    
    // Funzione 'calcola'
    window.calcola = function() {
        // Implementa la logica per 'calcola' qui
        console.log("Funzione 'calcola' eseguita.");
        // Esempio di calcolo o aggiornamento della UI
        // Puoi sostituire questo con la logica reale che desideri
    };

    // Funzione 'generaPianoGenerico'
    window.generaPianoGenerico = function() {
        // Implementa la logica per 'generaPianoGenerico' qui
        console.log("Funzione 'generaPianoGenerico' eseguita.");
        // Esempio di generazione di un piano nutrizionale
        // Puoi sostituire questo con la logica reale che desideri
    };

    // Funzione 'toggleSections' (se necessaria)
    window.toggleSections = function() {
        // Implementa la logica per 'toggleSections' qui
        console.log("Funzione 'toggleSections' eseguita.");
        const tipoImpasto = document.getElementById('tipo_impasto').value;
        // Logica per mostrare/nascondere sezioni basate sul tipo di impasto
        // Esempio:
        // if (tipoImpasto === 'biga') { /* mostra sezioni specifiche */ }
        // else { /* nascondi sezioni specifiche */ }
    };

    // Funzione per recuperare i parametri dalla query string
    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Elementi per i valori nutrizionali
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

    // Caricamento dati delle ricette e degli ingredienti
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

    // Configura il calcolatore in base alla ricetta
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

    // Aggiorna la lista degli ingredienti visibile
    function aggiornaListaIngredienti() {
        const lista = document.getElementById('lista-ingredienti'); // ID corretto
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

    // Modifica la quantità di un ingrediente
    function modificaIngrediente(index) {
        const nuovoPeso = prompt("Inserisci il nuovo peso (g):", ingredientiAggiunti[index].quantita);
        if (nuovoPeso && !isNaN(nuovoPeso)) {
            ingredientiAggiunti[index].quantita = parseFloat(nuovoPeso);
            aggiornaListaIngredienti();
            calcolaValoriNutrizionali();
        }
    }

    // Rimuove un ingrediente
    function rimuoviIngrediente(index) {
        ingredientiAggiunti.splice(index, 1);
        aggiornaListaIngredienti();
        calcolaValoriNutrizionali();
    }

    // Calcola i valori nutrizionali totali
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

    // Aggiungi Event Listener per il Bottone "Aggiungi Ingrediente"
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

    // Aggiungi Event Listener per il Bottone "Calcola Valori Nutrizionali"
    const calcolaButton = document.getElementById('calcola-valori');
    if (calcolaButton) {
        calcolaButton.addEventListener('click', () => {
            calcolaValoriNutrizionali();
        });
    } else {
        console.warn("Elemento 'calcola-valori' non trovato nel DOM.");
    }

    // Event listener per il pulsante 'Calcola e Genera Ricetta' e per Genera Piano
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

    // Event listener per il cambiamento del metodo di impasto
    const tipoImpastoElement = document.getElementById('tipo_impasto');
    if (tipoImpastoElement) {
        tipoImpastoElement.addEventListener('change', toggleSections);
    } else {
        console.warn("Elemento 'tipo_impasto' non trovato nel DOM.");
    }
});
