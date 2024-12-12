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
            console.log("Ricette caricate:", ricette);

            const responseIngredienti = await fetch('data/ingredienti.json');
            if (!responseIngredienti.ok) {
                throw new Error(`Errore nel caricamento di ingredienti.json: ${responseIngredienti.status}`);
            }
            ingredientiDisponibili = await responseIngredienti.json();
            console.log("Ingredienti disponibili:", ingredientiDisponibili);

            popolaTipoPizza();
            popolaIngredientiSelezione();
        } catch (error) {
            console.error("Errore durante il caricamento dei dati:", error);
        }
    }

    // 3. Popolare il Select del Tipo di Pizza
    function popolaTipoPizza() {
        if (!tipoPizzaSelect) {
            console.error("Elemento 'tipo-pizza' non trovato nel DOM.");
            return;
        }

        for (const tipo in ricette) {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = ricette[tipo].nome;
            tipoPizzaSelect.appendChild(option);
        }

        console.log("Select 'tipo-pizza' popolato.");
    }

    // 4. Popolare il Select degli Ingredienti Extra
    function popolaIngredientiSelezione() {
        if (!ingredientiSelezione) {
            console.error("Elemento 'ingredienti-selezione' non trovato nel DOM.");
            return;
        }

        ingredientiDisponibili.forEach(ingrediente => {
            const option = document.createElement('option');
            option.value = ingrediente.nome;
            option.textContent = ingrediente.nome;
            ingredientiSelezione.appendChild(option);
        });

        console.log("Select 'ingredienti-selezione' popolato.");
    }

    // 5. Gestire la Selezione del Tipo di Pizza
    if (tipoPizzaSelect) {
        tipoPizzaSelect.addEventListener('change', () => {
            const tipoSelezionato = tipoPizzaSelect.value;
            console.log("Tipo di pizza selezionato:", tipoSelezionato);
            mostraRicettaBase(tipoSelezionato);
            resetIngredientiAggiunti();
            calcolaValoriNutrizionali();
        });
    } else {
        console.error("Elemento 'tipo-pizza' non trovato nel DOM. Non è possibile aggiungere 'change' event listener.");
    }

    // 6. Mostrare la Ricetta Base dell'Impasto
    function mostraRicettaBase(tipo) {
        if (!ricettaBaseList) {
            console.error("Elemento 'ricetta-base' non trovato nel DOM.");
            return;
        }

        ricettaBaseList.innerHTML = ''; // Pulisce la lista esistente

        const ingredientiBase = ricette[tipo].ingredienti_base;
        for (const ingrediente in ingredientiBase) {
            const li = document.createElement('li');
            li.textContent = `${capitalizza(ingrediente)}: ${ingredientiBase[ingrediente]} g`;
            ricettaBaseList.appendChild(li);
        }

        console.log("Ricetta base visualizzata.");
    }

    // 7. Aggiungere Ingredienti Extra
    if (aggiungiIngredienteButton) {
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
    } else {
        console.error("Elemento 'aggiungi-ingrediente' non trovato nel DOM. Non è possibile aggiungere 'click' event listener.");
    }

    function aggiungiIngrediente(nome, quantita) {
        // Verifica se l'ingrediente è già stato aggiunto
        const indice = ingredientiAggiunti.findIndex(ing => ing.nome === nome);
        if (indice !== -1) {
            // Aggiorna la quantità
            ingredientiAggiunti[indice].quantita += quantita;
            console.log(`Aggiornata quantità di ${nome} a ${ingredientiAggiunti[indice].quantita} g.`);
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
                console.log(`Aggiunto nuovo ingrediente: ${nome} - ${quantita} g.`);
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
        if (!listaIngredienti) {
            console.error("Elemento 'lista-ingredienti' non trovato nel DOM.");
            return;
        }

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

        console.log("Lista degli ingredienti aggiornata.");
    }

    function modificaIngrediente(index) {
        const nuovoPeso = prompt("Inserisci il nuovo peso (g):", ingredientiAggiunti[index].quantita);
        const quantita = parseFloat(nuovoPeso);

        if (isNaN(quantita) || quantita <= 0) {
            alert("Peso non valido. Riprova.");
            return;
        }

        ingredientiAggiunti[index].quantita = quantita;
        console.log(`Modificata quantità di ${ingredientiAggiunti[index].nome} a ${quantita} g.`);
        aggiornaListaIngredienti();
        calcolaValoriNutrizionali();
    }

    function rimuoviIngrediente(index) {
        if (confirm(`Sei sicuro di voler rimuovere "${ingredientiAggiunti[index].nome}"?`)) {
            console.log(`Rimosso ingrediente: ${ingredientiAggiunti[index].nome}`);
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
        if (tipoSelezionato && ricette[tipoSelezionato].valori_nutrizionali_base) {
            const valoriBase = ricette[tipoSelezionato].valori_nutrizionali_base;
            for (const ingrediente in valoriBase) {
                const quantita = ricette[tipoSelezionato].ingredienti_base[ingrediente];
                const nutrienti = valoriBase[ingrediente];
                const fattore = quantita / 100;
                totali.calorie += (nutrienti.calorie || 0) * fattore;
                totali.grassi += (nutrienti.grassi || 0) * fattore;
                totali.carboidrati += (nutrienti.carboidrati || 0) * fattore;
                totali.zuccheri += (nutrienti.zuccheri || 0) * fattore;
                totali.fibre += (nutrienti.fibre || 0) * fattore;
                totali.proteine += (nutrienti.proteine || 0) * fattore;
                totali.sale += (nutrienti.sale || 0) * fattore;
            }
            console.log("Valori nutrizionali base calcolati:", totali);
        } else {
            console.warn("Tipo di pizza selezionato o valori nutrizionali base mancanti.");
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
        if (valoriNutrizionali.calorie) {
            valoriNutrizionali.calorie.textContent = totali.calorie.toFixed(1);
        } else {
            console.warn("Elemento 'calorie-totali' non trovato nel DOM.");
        }

        if (valoriNutrizionali.grassi) {
            valoriNutrizionali.grassi.textContent = totali.grassi.toFixed(1);
        } else {
            console.warn("Elemento 'grassi-totali' non trovato nel DOM.");
        }

        if (valoriNutrizionali.carboidrati) {
            valoriNutrizionali.carboidrati.textContent = totali.carboidrati.toFixed(1);
        } else {
            console.warn("Elemento 'carboidrati-totali' non trovato nel DOM.");
        }

        if (valoriNutrizionali.zuccheri) {
            valoriNutrizionali.zuccheri.textContent = totali.zuccheri.toFixed(1);
        } else {
            console.warn("Elemento 'zuccheri-totali' non trovato nel DOM.");
        }

        if (valoriNutrizionali.fibre) {
            valoriNutrizionali.fibre.textContent = totali.fibre.toFixed(1);
        } else {
            console.warn("Elemento 'fibre-totali' non trovato nel DOM.");
        }

        if (valoriNutrizionali.proteine) {
            valoriNutrizionali.proteine.textContent = totali.proteine.toFixed(1);
        } else {
            console.warn("Elemento 'proteine-totali' non trovato nel DOM.");
        }

        if (valoriNutrizionali.sale) {
            valoriNutrizionali.sale.textContent = totali.sale.toFixed(1);
        } else {
            console.warn("Elemento 'sale-totale' non trovato nel DOM.");
        }

        console.log("Valori nutrizionali totali:", totali);
    }

    // 10. Reset degli Ingredienti Aggiunti Quando Si Cambia Tipo di Pizza
    function resetIngredientiAggiunti() {
        ingredientiAggiunti = [];
        aggiornaListaIngredienti();
        console.log("Ingredienti aggiunti resettati.");
    }

    // 11. Helper per Capitalizzare le Stringhe
    function capitalizza(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Inizializza il Caricamento dei Dati
    caricaDati();
});
