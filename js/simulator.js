// simulator.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementi del DOM
    const tipoPizzaSelect = document.getElementById('tipo-pizza');
    const ricettaBaseList = document.getElementById('ricetta-base');
    const ingredientiSelezione = document.getElementById('ingredienti-selezione');
    const quantitaIngredienteInput = document.getElementById('quantita-ingrediente');
    const aggiungiIngredienteButton = document.getElementById('aggiungi-ingrediente');
    const listaIngredienti = document.getElementById('lista-ingredienti');

    const valoriNutrizionali = {
        calorie: document.getElementById('calorie-totali'),
        grassi: document.getElementById('grassi-totali'),
        carboidrati: document.getElementById('carboidrati-totali'),
        zuccheri: document.getElementById('zuccheri-totali'),
        fibre: document.getElementById('fibre-totali'),
        proteine: document.getElementById('proteine-totali'),
        sale: document.getElementById('sale-totale'),
    };

    let ricette = {};
    let ingredientiDisponibili = [];
    let ingredientiAggiunti = [];

    // 2. Caricamento dei Dati JSON
    async function caricaDati() {
        try {
            const responseRicette = await fetch('data/ricette.json');
            if (!responseRicette.ok) {
                throw new Error(`Errore nel caricamento di ricette.json: ${responseRicette.status}`);
            }
            ricette = await responseRicette.json();

            const responseIngredienti = await fetch('data/ingredienti.json');
            if (!responseIngredienti.ok) {
                throw new Error(`Errore nel caricamento di ingredienti.json: ${responseIngredienti.status}`);
            }
            ingredientiDisponibili = await responseIngredienti.json();

            popolaTipoPizza();
            popolaIngredientiSelezione();
        } catch (error) {
            console.error("Errore durante il caricamento dei dati:", error);
        }
    }

    // 3. Popolare il Select del Tipo di Pizza
    function popolaTipoPizza() {
        for (const tipo in ricette) {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = ricette[tipo].nome;
            tipoPizzaSelect.appendChild(option);
        }
    }

    // 4. Popolare il Select degli Ingredienti Extra
    function popolaIngredientiSelezione() {
        ingredientiDisponibili.forEach(ingrediente => {
            const option = document.createElement('option');
            option.value = ingrediente.nome;
            option.textContent = ingrediente.nome;
            ingredientiSelezione.appendChild(option);
        });
    }

    // 5. Gestire la Selezione del Tipo di Pizza
    tipoPizzaSelect.addEventListener('change', () => {
        const tipoSelezionato = tipoPizzaSelect.value;
        mostraRicettaBase(tipoSelezionato);
        resetIngredientiAggiunti();
        calcolaValoriNutrizionali();
    });

    // 6. Mostrare la Ricetta Base dell'Impasto
    function mostraRicettaBase(tipo) {
        ricettaBaseList.innerHTML = ''; // Pulisce la lista esistente

        const ingredientiBase = ricette[tipo].ingredienti_base;
        for (const ingrediente in ingredientiBase) {
            const li = document.createElement('li');
            li.textContent = `${capitalizza(ingrediente)}: ${ingredientiBase[ingrediente]} g`;
            ricettaBaseList.appendChild(li);
        }
    }

    // 7. Aggiungere Ingredienti Extra
    aggiungiIngredienteButton.addEventListener('click', () => {
        const nomeIngrediente = ingredientiSelezione.value;
        const quantita = parseFloat(quantitaIngredienteInput.value);

        if (!nomeIngrediente) {
            alert('Per favore, seleziona un ingrediente.');
            return;
        }

        if (isNaN(quantita) || quantita <= 0) {
            alert('Inserisci una quantità valida (g).');
            return;
        }

        aggiungiIngrediente(nomeIngrediente, quantita);
        quantitaIngredienteInput.value = ''; // Resetta l'input
    });

    function aggiungiIngrediente(nome, quantita) {
        // Verifica se l'ingrediente è già stato aggiunto
        const indice = ingredientiAggiunti.findIndex(ing => ing.nome === nome);
        if (indice !== -1) {
            // Aggiorna la quantità
            ingredientiAggiunti[indice].quantita += quantita;
        } else {
            // Aggiungi un nuovo ingrediente
            const ingrediente = ingredientiDisponibili.find(ing => ing.nome === nome);
            if (ingrediente) {
                ingredientiAggiunti.push({
                    nome: ingrediente.nome,
                    quantita: quantita,
                    calorie: ingrediente.calorie,
                    grassi: ingrediente.grassi,
                    carboidrati: ingrediente.carboidrati,
                    zuccheri: ingrediente.zuccheri,
                    fibre: ingrediente.fibre,
                    proteine: ingrediente.proteine,
                    sale: ingrediente.sale,
                });
            } else {
                console.error(`Ingrediente "${nome}" non trovato.`);
                return;
            }
        }

        aggiornaListaIngredienti();
        calcolaValoriNutrizionali();
    }

    // 8. Aggiornare la Lista degli Ingredienti Aggiunti
    function aggiornaListaIngredienti() {
        listaIngredienti.innerHTML = ''; // Pulisce la lista esistente

        ingredientiAggiunti.forEach((ingrediente, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${ingrediente.nome} - ${ingrediente.quantita} g
                <button class="modifica" data-index="${index}">Modifica</button>
                <button class="rimuovi" data-index="${index}">Rimuovi</button>
            `;
            listaIngredienti.appendChild(li);
        });

        // Aggiungi Event Listener per i Bottoni di Modifica e Rimozione
        document.querySelectorAll('.modifica').forEach(button => {
            button.addEventListener('click', e => {
                const index = e.target.getAttribute('data-index');
                modificaIngrediente(index);
            });
        });

        document.querySelectorAll('.rimuovi').forEach(button => {
            button.addEventListener('click', e => {
                const index = e.target.getAttribute('data-index');
                rimuoviIngrediente(index);
            });
        });
    }

    function modificaIngrediente(index) {
        const nuovoPeso = prompt("Inserisci il nuovo peso (g):", ingredientiAggiunti[index].quantita);
        const quantita = parseFloat(nuovoPeso);

        if (isNaN(quantita) || quantita <= 0) {
            alert("Peso non valido. Riprova.");
            return;
        }

        ingredientiAggiunti[index].quantita = quantita;
        aggiornaListaIngredienti();
        calcolaValoriNutrizionali();
    }

    function rimuoviIngrediente(index) {
        if (confirm(`Sei sicuro di voler rimuovere "${ingredientiAggiunti[index].nome}"?`)) {
            ingredientiAggiunti.splice(index, 1);
            aggiornaListaIngredienti();
            calcolaValoriNutrizionali();
        }
    }

    // 9. Calcolare i Valori Nutrizionali Totali
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

        // Calcoli per gli ingredienti base
        const tipoSelezionato = tipoPizzaSelect.value;
        if (tipoSelezionato && ricette[tipoSelezionato]) {
            const ingredientiBase = ricette[tipoSelezionato].ingredienti_base;
            for (const ingrediente in ingredientiBase) {
                const quantita = ingredientiBase[ingrediente];
                // Supponiamo che gli ingredienti base abbiano valori nutrizionali simili a quelli aggiuntivi
                // In realtà, dovresti avere una mappa degli ingredienti base con i loro valori nutrizionali
                // Per semplicità, qui aggiungiamo solo le quantità senza nutrienti
                // Se hai nutrienti per gli ingredienti base, integra qui
            }
        }

        // Calcoli per gli ingredienti aggiunti
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

        // Aggiorna i valori nel DOM
        valoriNutrizionali.calorie.textContent = totali.calorie.toFixed(1);
        valoriNutrizionali.grassi.textContent = totali.grassi.toFixed(1);
        valoriNutrizionali.carboidrati.textContent = totali.carboidrati.toFixed(1);
        valoriNutrizionali.zuccheri.textContent = totali.zuccheri.toFixed(1);
        valoriNutrizionali.fibre.textContent = totali.fibre.toFixed(1);
        valoriNutrizionali.proteine.textContent = totali.proteine.toFixed(1);
        valoriNutrizionali.sale.textContent = totali.sale.toFixed(1);
    }

    // 10. Reset degli Ingredienti Aggiunti Quando Si Cambia Tipo di Pizza
    function resetIngredientiAggiunti() {
        ingredientiAggiunti = [];
        aggiornaListaIngredienti();
    }

    // 11. Helper per Capitalizzare le Stringhe
    function capitalizza(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Inizializza il Caricamento dei Dati
    caricaDati();
});
