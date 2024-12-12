// simulator.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementi del DOM
    const tipoPizzaSelect = document.getElementById('tipo-pizza');
    const ricettaBaseList = document.getElementById('ricetta-base');
    const procedimentoList = document.getElementById('procedimento');
    const ingredientiSelezione = document.getElementById('ingredienti-selezione');
    const quantitaIngredienteInput = document.getElementById('quantita-ingrediente');
    const aggiungiIngredienteButton = document.getElementById('aggiungi-ingrediente');
    const listaIngredienti = document.getElementById('lista-ingredienti');

    const valoriNutrizionaliBase = {
        calorie: document.getElementById('calorie-base'),
        grassi: document.getElementById('grassi-base'),
        carboidrati: document.getElementById('carboidrati-base'),
        zuccheri: document.getElementById('zuccheri-base'),
        fibre: document.getElementById('fibre-base'),
        proteine: document.getElementById('proteine-base'),
        sale: document.getElementById('sale-base'),
    };

    const valoriNutrizionaliTotali = {
        calorie: document.getElementById('calorie-totali'),
        grassi: document.getElementById('grassi-totali'),
        carboidrati: document.getElementById('carboidrati-totali'),
        zuccheri: document.getElementById('zuccheri-totali'),
        fibre: document.getElementById('fibre-totali'),
        proteine: document.getElementById('proteine-totali'),
        sale: document.getElementById('sale-totale'),
    };

    const parametriPlaceholderSection = document.getElementById('parametri-placeholder');
    const massaInput = document.getElementById('massa');
    const numPanettiInput = document.getElementById('numPanetti');
    const pesoPanettoInput = document.getElementById('pesoPanetto');
    const aprettoInput = document.getElementById('apretto');
    const applicaParametriButton = document.getElementById('applica-parametri');

    let ricette = {};
    let ingredientiDisponibili = [];
    let ingredientiAggiunti = [];
    let ricettaCorrente = null;
    let parametri = {
        massa: 2,
        numPanetti: 4,
        pesoPanetto: 250,
        apretto: 2,
    };

    // 2. Caricamento dei Dati JSON
    async function caricaDati() {
        try {
            const [responseRicette, responseIngredienti] = await Promise.all([
                fetch('data/ricette.json'),
                fetch('data/ingredienti.json')
            ]);

            if (!responseRicette.ok) {
                throw new Error(`Errore nel caricamento di ricette.json: ${responseRicette.status}`);
            }
            ricette = await responseRicette.json();
            console.log("Ricette caricate:", ricette);

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

        // Pulisce le opzioni esistenti (tranne la prima)
        tipoPizzaSelect.innerHTML = '<option value="" disabled selected>Seleziona un tipo di pizza...</option>';

        for (const tipo in ricette) {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = capitalizza(ricette[tipo].nome);
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

        // Pulisce le opzioni esistenti (tranne la prima)
        ingredientiSelezione.innerHTML = '<option value="" disabled selected>Seleziona un ingrediente...</option>';

        ingredientiDisponibili.forEach(ingrediente => {
            const option = document.createElement('option');
            option.value = ingrediente.nome;
            option.textContent = capitalizza(ingrediente.nome);
            ingredientiSelezione.appendChild(option);
        });

        console.log("Select 'ingredienti-selezione' popolato.");
    }

    // 5. Gestire la Selezione del Tipo di Pizza
    if (tipoPizzaSelect) {
        tipoPizzaSelect.addEventListener('change', () => {
            const tipoSelezionato = tipoPizzaSelect.value;
            console.log("Tipo di pizza selezionato:", tipoSelezionato);
            mostraRicetta(tipoSelezionato);
            parametriPlaceholderSection.classList.remove('hidden-element');
            resetIngredientiAggiunti();
            calcolaValoriNutrizionaliBase();
            resetValoriNutrizionaliTotali();
        });
    } else {
        console.error("Elemento 'tipo-pizza' non trovato nel DOM. Non è possibile aggiungere 'change' event listener.");
    }

    // 6. Applicare i Parametri per i Placeholder
    if (applicaParametriButton) {
        applicaParametriButton.addEventListener('click', () => {
            const massa = parseFloat(massaInput.value);
            const numPanetti = parseInt(numPanettiInput.value);
            const pesoPanetto = parseFloat(pesoPanettoInput.value);
            const apretto = parseFloat(aprettoInput.value);

            if (isNaN(massa) || massa <= 0) {
                alert("Inserisci un tempo di riposo valido (ore).");
                return;
            }
            if (isNaN(numPanetti) || numPanetti <= 0) {
                alert("Inserisci un numero di panetti valido.");
                return;
            }
            if (isNaN(pesoPanetto) || pesoPanetto <= 0) {
                alert("Inserisci un peso di panetto valido (g).");
                return;
            }
            if (isNaN(apretto) || apretto <= 0) {
                alert("Inserisci un tempo di lievitazione valido (ore).");
                return;
            }

            parametri = { massa, numPanetti, pesoPanetto, apretto };
            console.log("Parametri aggiornati:", parametri);
            mostraProcedimento();
            calcolaValoriNutrizionaliBase();
            calcolaValoriNutrizionaliTotali();
        });
    } else {
        console.error("Elemento 'applica-parametri' non trovato nel DOM.");
    }

    // 7. Mostrare la Ricetta Base dell'Impasto
    function mostraRicetta(tipo) {
        if (!ricettaBaseList) {
            console.error("Elemento 'ricetta-base' non trovato nel DOM.");
            return;
        }
        if (!procedimentoList) {
            console.error("Elemento 'procedimento' non trovato nel DOM.");
            return;
        }

        ricettaBaseList.innerHTML = ''; // Pulisce la lista esistente
        procedimentoList.innerHTML = ''; // Pulisce la lista esistente

        ricettaCorrente = ricette[tipo];

        // Verifica se la ricetta corrente ha ingredienti_base
        if (!ricettaCorrente.ingredienti_base) {
            console.error(`Ricetta per ${tipo} non ha la proprietà 'ingredienti_base'.`);
            return;
        }

        // Mostra gli ingredienti base
        for (const [ingrediente, quantita] of Object.entries(ricettaCorrente.ingredienti_base)) {
            const li = document.createElement('li');
            li.textContent = `${capitalizza(ingrediente)}: ${quantita} g`;
            ricettaBaseList.appendChild(li);
        }

        console.log("Ricetta base visualizzata.");
    }

    // 8. Mostrare il Procedimento con Sostituzione dei Placeholder
    function mostraProcedimento() {
        if (!procedimentoList) {
            console.error("Elemento 'procedimento' non trovato nel DOM.");
            return;
        }

        procedimentoList.innerHTML = ''; // Pulisce la lista esistente

        if (!ricettaCorrente) {
            console.warn("Ricetta corrente non definita.");
            return;
        }

        if (!ricettaCorrente.procedimento) {
            console.error(`Ricetta per ${ricettaCorrente.nome} non ha la proprietà 'procedimento'.`);
            return;
        }

        ricettaCorrente.procedimento.forEach(passo => {
            const passoSostituito = sostituisciPlaceholder(passo, parametri);
            const li = document.createElement('li');
            li.textContent = passoSostituito;
            procedimentoList.appendChild(li);
        });

        console.log("Procedimento visualizzato con i parametri applicati.");
    }

    // 9. Sostituzione dei Placeholder nel Procedimento
    function sostituisciPlaceholder(passo, parametri) {
        return passo.replace(/<(\w+)>/g, (match, p1) => {
            return parametri[p1] !== undefined ? parametri[p1] : match;
        });
    }

    // 10. Aggiungere Ingredienti Extra
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
        const indice = ingredientiAggiunti.findIndex(ing => ing.nome.toLowerCase() === nome.toLowerCase());
        if (indice !== -1) {
            // Aggiorna la quantità
            ingredientiAggiunti[indice].quantita += quantita;
            console.log(`Aggiornata quantità di ${nome} a ${ingredientiAggiunti[indice].quantita} g.`);
        } else {
            // Aggiungi un nuovo ingrediente
            const ingrediente = ingredientiDisponibili.find(ing => ing.nome.toLowerCase() === nome.toLowerCase());
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
        calcolaValoriNutrizionaliTotali();
    }

    // 11. Aggiornare la Lista degli Ingredienti Aggiunti
    function aggiornaListaIngredienti() {
        if (!listaIngredienti) {
            console.error("Elemento 'lista-ingredienti' non trovato nel DOM.");
            return;
        }

        listaIngredienti.innerHTML = ''; // Pulisce la lista esistente

        ingredientiAggiunti.forEach((ingrediente, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${capitalizza(ingrediente.nome)} - ${ingrediente.quantita} g
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
        calcolaValoriNutrizionaliTotali();
    }

    function rimuoviIngrediente(index) {
        if (confirm(`Sei sicuro di voler rimuovere "${ingredientiAggiunti[index].nome}"?`)) {
            console.log(`Rimosso ingrediente: ${ingredientiAggiunti[index].nome}`);
            ingredientiAggiunti.splice(index, 1);
            aggiornaListaIngredienti();
            calcolaValoriNutrizionaliTotali();
        }
    }

    // 12. Calcolare i Valori Nutrizionali Base
    function calcolaValoriNutrizionaliBase() {
        if (!ricettaCorrente) {
            console.warn("Ricetta corrente non definita.");
            return;
        }

        let totali = {
            calorie: 0,
            grassi: 0,
            carboidrati: 0,
            zuccheri: 0,
            fibre: 0,
            proteine: 0,
            sale: 0,
        };

        for (const [ingrediente, quantita] of Object.entries(ricettaCorrente.ingredienti_base)) {
            const nutrienti = ingredientiDisponibili.find(ing => ing.nome.toLowerCase() === ingrediente.toLowerCase());
            if (nutrienti) {
                const fattore = quantita / 100;
                totali.calorie += (nutrienti.calorie || 0) * fattore;
                totali.grassi += (nutrienti.grassi || 0) * fattore;
                totali.carboidrati += (nutrienti.carboidrati || 0) * fattore;
                totali.zuccheri += (nutrienti.zuccheri || 0) * fattore;
                totali.fibre += (nutrienti.fibre || 0) * fattore;
                totali.proteine += (nutrienti.proteine || 0) * fattore;
                totali.sale += (nutrienti.sale || 0) * fattore;
            } else {
                console.warn(`Nutrienti per l'ingrediente "${ingrediente}" non trovati.`);
            }
        }

        // Aggiorna i valori nutrizionali base nel DOM
        aggiornaValoriNutrizionali(valoriNutrizionaliBase, totali);

        console.log("Valori nutrizionali base calcolati:", totali);
    }

    // 13. Calcolare i Valori Nutrizionali Totali (Base + Extra)
    function calcolaValoriNutrizionaliTotali() {
        let totali = {
            calorie: 0,
            grassi: 0,
            carboidrati: 0,
            zuccheri: 0,
            fibre: 0,
            proteine: 0,
            sale: 0,
        };

        // Calcoli per i valori nutrizionali base
        if (ricettaCorrente) {
            for (const [ingrediente, quantita] of Object.entries(ricettaCorrente.ingredienti_base)) {
                const nutrienti = ingredientiDisponibili.find(ing => ing.nome.toLowerCase() === ingrediente.toLowerCase());
                if (nutrienti) {
                    const fattore = quantita / 100;
                    totali.calorie += (nutrienti.calorie || 0) * fattore;
                    totali.grassi += (nutrienti.grassi || 0) * fattore;
                    totali.carboidrati += (nutrienti.carboidrati || 0) * fattore;
                    totali.zuccheri += (nutrienti.zuccheri || 0) * fattore;
                    totali.fibre += (nutrienti.fibre || 0) * fattore;
                    totali.proteine += (nutrienti.proteine || 0) * fattore;
                    totali.sale += (nutrienti.sale || 0) * fattore;
                }
            }
        }

        // Calcoli per gli ingredienti aggiunti
        ingredientiAggiunti.forEach(ingrediente => {
            const nutrienti = ingredientiDisponibili.find(ing => ing.nome.toLowerCase() === ingrediente.nome.toLowerCase());
            if (nutrienti) {
                const fattore = ingrediente.quantita / 100;
                totali.calorie += (nutrienti.calorie || 0) * fattore;
                totali.grassi += (nutrienti.grassi || 0) * fattore;
                totali.carboidrati += (nutrienti.carboidrati || 0) * fattore;
                totali.zuccheri += (nutrienti.zuccheri || 0) * fattore;
                totali.fibre += (nutrienti.fibre || 0) * fattore;
                totali.proteine += (nutrienti.proteine || 0) * fattore;
                totali.sale += (nutrienti.sale || 0) * fattore;
            }
        });

        // Aggiorna i valori nutrizionali totali nel DOM
        aggiornaValoriNutrizionali(valoriNutrizionaliTotali, totali);

        console.log("Valori nutrizionali totali calcolati:", totali);
    }

    // 14. Reset dei Valori Nutrizionali Totali
    function resetValoriNutrizionaliTotali() {
        if (valoriNutrizionaliTotali.calorie) {
            valoriNutrizionaliTotali.calorie.textContent = "0";
        }
        if (valoriNutrizionaliTotali.grassi) {
            valoriNutrizionaliTotali.grassi.textContent = "0";
        }
        if (valoriNutrizionaliTotali.carboidrati) {
            valoriNutrizionaliTotali.carboidrati.textContent = "0";
        }
        if (valoriNutrizionaliTotali.zuccheri) {
            valoriNutrizionaliTotali.zuccheri.textContent = "0";
        }
        if (valoriNutrizionaliTotali.fibre) {
            valoriNutrizionaliTotali.fibre.textContent = "0";
        }
        if (valoriNutrizionaliTotali.proteine) {
            valoriNutrizionaliTotali.proteine.textContent = "0";
        }
        if (valoriNutrizionaliTotali.sale) {
            valoriNutrizionaliTotali.sale.textContent = "0";
        }
    }

    // 15. Reset della Ricetta
    function resetRicetta() {
        if (ricettaBaseList) {
            ricettaBaseList.innerHTML = '';
        }
        if (procedimentoList) {
            procedimentoList.innerHTML = '';
        }
    }

    // 16. Reset degli Ingredienti Aggiunti
    function resetIngredientiAggiunti() {
        ingredientiAggiunti = [];
        aggiornaListaIngredienti();
        console.log("Ingredienti aggiunti resettati.");
    }

    // 17. Helper per Capitalizzare le Stringhe
    function capitalizza(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // 18. Funzione per Aggiornare i Valori Nutrizionali nel DOM
    function aggiornaValoriNutrizionali(valoriNutrizionali, totali) {
        if (valoriNutrizionali.calorie) {
            valoriNutrizionali.calorie.textContent = totali.calorie.toFixed(1);
        }
        if (valoriNutrizionali.grassi) {
            valoriNutrizionali.grassi.textContent = totali.grassi.toFixed(1);
        }
        if (valoriNutrizionali.carboidrati) {
            valoriNutrizionali.carboidrati.textContent = totali.carboidrati.toFixed(1);
        }
        if (valoriNutrizionali.zuccheri) {
            valoriNutrizionali.zuccheri.textContent = totali.zuccheri.toFixed(1);
        }
        if (valoriNutrizionali.fibre) {
            valoriNutrizionali.fibre.textContent = totali.fibre.toFixed(1);
        }
        if (valoriNutrizionali.proteine) {
            valoriNutrizionali.proteine.textContent = totali.proteine.toFixed(1);
        }
        if (valoriNutrizionali.sale) {
            valoriNutrizionali.sale.textContent = totali.sale.toFixed(1);
        }
    }

    // Inizializza il Caricamento dei Dati
    caricaDati();
});
