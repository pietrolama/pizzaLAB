// simulator.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Creazione Dinamica degli Elementi Mancanti
    function creaElementiMancanti() {
        // Creazione del Bottone 'calcola-button' se non esiste
        if (!document.getElementById('calcola-button')) {
            const calcolaButton = document.createElement('button');
            calcolaButton.id = 'calcola-button';
            calcolaButton.style.display = 'none'; // Nascondi l'elemento
            document.body.appendChild(calcolaButton);
        }

        // Creazione del Bottone 'genera-piano' se non esiste
        if (!document.getElementById('genera-piano')) {
            const generaPianoButton = document.createElement('button');
            generaPianoButton.id = 'genera-piano';
            generaPianoButton.style.display = 'none'; // Nascondi l'elemento
            document.body.appendChild(generaPianoButton);
        }

        // Creazione del Select 'tipo_impasto' se non esiste
        if (!document.getElementById('tipo_impasto')) {
            const tipoImpastoSelect = document.createElement('select');
            tipoImpastoSelect.id = 'tipo_impasto';
            tipoImpastoSelect.style.display = 'none'; // Nascondi l'elemento
            document.body.appendChild(tipoImpastoSelect);
        }
    }

    // 2. Definizione delle Funzioni Globali
    function definisciFunzioniGlobali() {
        // Funzione 'calcola' richiesta da calcolatore_script.js
        window.calcola = function() {
            console.log("Funzione 'calcola' eseguita.");
            // Puoi integrare qui la logica necessaria per 'calcola'
            // Ad esempio, potrebbe richiamare funzioni di calcolo specifiche
        };

        // Funzione 'generaPianoGenerico' richiesta da calcolatore_script.js
        window.generaPianoGenerico = function() {
            console.log("Funzione 'generaPianoGenerico' eseguita.");
            // Puoi integrare qui la logica necessaria per 'generaPianoGenerico'
            // Ad esempio, potrebbe generare un piano nutrizionale basato sugli ingredienti
        };

        // Funzione 'toggleSections' richiesta da calcolatore_script.js
        window.toggleSections = function() {
            console.log("Funzione 'toggleSections' eseguita.");
            const tipoImpasto = document.getElementById('tipo_impasto')?.value;
            if (tipoImpasto === 'biga') {
                // Logica per il metodo 'biga'
                console.log("Tipo impasto selezionato: Biga");
                // Implementa qui la logica per mostrare/nascondere sezioni specifiche
            } else if (tipoImpasto === 'poolish') {
                // Logica per il metodo 'poolish'
                console.log("Tipo impasto selezionato: Poolish");
                // Implementa qui la logica per mostrare/nascondere sezioni specifiche
            }
            // Aggiungi ulteriori condizioni se necessario
        };
    }

    // 3. Popolamento delle Selezioni
    async function popolaSelezioni() {
        try {
            // Carica gli ingredienti dal JSON
            const response = await fetch('data/ingredienti.json');
            if (!response.ok) {
                throw new Error(`Errore nel caricamento degli ingredienti: ${response.status}`);
            }
            const ingredienti = await response.json();
            window.loadedIngredienti = ingredienti;

            // Popola il select degli impasti (impasto-selezione)
            const impastoSelect = document.getElementById('impasto-selezione');
            if (impastoSelect) {
                // Definisci i tipi di impasto disponibili
                const tipiImpasto = ["diretto", "biga", "poolish", "lievito_madre", "biga_poolish"]; // Aggiorna secondo necessità
                tipiImpasto.forEach(impasto => {
                    const option = document.createElement('option');
                    option.value = impasto;
                    option.textContent = capitalizza(impasto.replace('_', ' '));
                    impastoSelect.appendChild(option);
                });
            }

            // Popola il select degli ingredienti (ingredienti-selezione)
            const ingredientiSelect = document.getElementById('ingredienti-selezione');
            if (ingredientiSelect) {
                ingredienti.forEach(ingrediente => {
                    const option = document.createElement('option');
                    option.value = ingrediente.nome;
                    option.textContent = capitalizza(ingrediente.nome);
                    ingredientiSelect.appendChild(option);
                });
            }

        } catch (error) {
            console.error("Errore durante il popolamento delle selezioni:", error);
        }
    }

    // Helper per capitalizzare le stringhe
    function capitalizza(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // 4. Gestione degli Ingredienti Aggiunti
    let ingredientiAggiunti = [];

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

    function aggiungiIngrediente(nome, quantita = 100) { // Quantità predefinita: 100g
        const ingredienteBase = window.loadedIngredienti.find(i => i.nome === nome);
        if (ingredienteBase) {
            ingredientiAggiunti.push({
                nome: ingredienteBase.nome,
                quantita: quantita,
                calorie: ingredienteBase.calorie || 0,
                grassi: ingredienteBase.grassi || 0,
                carboidrati: ingredienteBase.carboidrati || 0,
                zuccheri: ingredienteBase.zuccheri || 0,
                fibre: ingredienteBase.fibre || 0,
                proteine: ingredienteBase.proteine || 0,
                sale: ingredienteBase.sale || 0,
            });
            aggiornaListaIngredienti();
            calcolaValoriNutrizionali();
        } else {
            console.error(`Ingrediente "${nome}" non trovato.`);
        }
    }

    function modificaIngrediente(index) {
        const nuovoPeso = prompt("Inserisci il nuovo peso (g):", ingredientiAggiunti[index].quantita);
        if (nuovoPeso && !isNaN(nuovoPeso) && parseFloat(nuovoPeso) > 0) {
            ingredientiAggiunti[index].quantita = parseFloat(nuovoPeso);
            aggiornaListaIngredienti();
            calcolaValoriNutrizionali();
        } else {
            alert("Peso non valido. Riprova.");
        }
    }

    function rimuoviIngrediente(index) {
        if (confirm(`Sei sicuro di voler rimuovere "${ingredientiAggiunti[index].nome}"?`)) {
            ingredientiAggiunti.splice(index, 1);
            aggiornaListaIngredienti();
            calcolaValoriNutrizionali();
        }
    }

    // 5. Calcolo dei Valori Nutrizionali Totali
    const valoriNutrizionali = {
        calorie: document.getElementById('calorie-totali'),
        grassi: document.getElementById('grassi-totali'),
        carboidrati: document.getElementById('carboidrati-totali'),
        zuccheri: document.getElementById('zuccheri-totali'),
        fibre: document.getElementById('fibre-totali'),
        proteine: document.getElementById('proteine-totali'),
        sale: document.getElementById('sale-totale'),
    };

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

    // 6. Gestione degli Event Listener per i Bottoni e Selezioni
    function gestisciEventListener() {
        // Event listener per il bottone "Aggiungi Ingrediente"
        const aggiungiButton = document.getElementById('aggiungi-ingrediente');
        if (aggiungiButton) {
            aggiungiButton.addEventListener('click', () => {
                const select = document.getElementById('ingredienti-selezione');
                const selectedIngredientName = select.value;

                if (!selectedIngredientName) {
                    alert('Per favore, seleziona un ingrediente.');
                    return;
                }

                aggiungiIngrediente(selectedIngredientName);
            });
        } else {
            console.warn("Elemento 'aggiungi-ingrediente' non trovato nel DOM.");
        }

        // Event listener per il bottone "Calcola Valori Nutrizionali"
        const calcolaButton = document.getElementById('calcola-valori');
        if (calcolaButton) {
            calcolaButton.addEventListener('click', () => {
                calcolaValoriNutrizionali();
            });
        } else {
            console.warn("Elemento 'calcola-valori' non trovato nel DOM.");
        }

        // Event listener per il bottone "Calcola e Genera Ricetta"
        const calcolaRicettaButton = document.getElementById('calcola-button');
        if (calcolaRicettaButton) {
            calcolaRicettaButton.addEventListener('click', () => {
                window.calcola(); // Richiama la funzione globale 'calcola'
            });
        } else {
            console.warn("Elemento 'calcola-button' non trovato nel DOM.");
        }

        // Event listener per il bottone "Genera Piano"
        const generaPianoButton = document.getElementById('genera-piano');
        if (generaPianoButton) {
            generaPianoButton.addEventListener('click', () => {
                window.generaPianoGenerico(); // Richiama la funzione globale 'generaPianoGenerico'
            });
        } else {
            console.warn("Elemento 'genera-piano' non trovato nel DOM.");
        }

        // Event listener per la selezione dell'impasto
        const impastoSelezione = document.getElementById('impasto-selezione');
        if (impastoSelezione) {
            impastoSelezione.addEventListener('change', () => {
                console.log("Tipo di impasto selezionato:", impastoSelezione.value);
                // Puoi integrare qui la logica specifica per il simulatore basata sul tipo di impasto
                // Ad esempio, filtrare gli ingredienti disponibili o modificare i parametri di calcolo
            });
        } else {
            console.warn("Elemento 'impasto-selezione' non trovato nel DOM.");
        }
    }

    // 7. Inizializzazione del Simulatore
    async function inizializzaSimulatore() {
        creaElementiMancanti();
        definisciFunzioniGlobali();
        await popolaSelezioni();
        gestisciEventListener();
    }

    inizializzaSimulatore();
});
