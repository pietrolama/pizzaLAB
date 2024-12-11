// Simulatore Nutrienti JS
const impastiPresets = {/* JSON degli impasti */};
const ingredientiPresets = [/* JSON degli ingredienti */];

// Popola menu a tendina per impasti
const impastoSelezione = document.getElementById('impasto-selezione');
Object.keys(impastiPresets).forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    impastoSelezione.appendChild(option);
});

// Popola menu a tendina per ingredienti
const ingredientiSelezione = document.getElementById('ingredienti-selezione');
ingredientiPresets.forEach(ingrediente => {
    const option = document.createElement('option');
    option.value = ingrediente.nome;
    option.textContent = ingrediente.nome;
    ingredientiSelezione.appendChild(option);
});

// Lista degli ingredienti aggiunti
const listaIngredienti = document.getElementById('lista-ingredienti');
let ingredientiAggiunti = [];

// Aggiungi ingrediente alla lista
document.getElementById('aggiungi-ingrediente').addEventListener('click', () => {
    const ingredienteSelezionato = ingredientiPresets.find(ingrediente => ingrediente.nome === ingredientiSelezione.value);
    if (ingredienteSelezionato) {
        ingredientiAggiunti.push(ingredienteSelezionato);
        const li = document.createElement('li');
        li.textContent = `${ingredienteSelezionato.nome} (${JSON.stringify(ingredienteSelezionato)})`;
        listaIngredienti.appendChild(li);
    }
});

// Calcola valori nutrizionali totali
document.getElementById('calcola-valori').addEventListener('click', () => {
    let totali = {
        calorie: 0,
        grassi: 0,
        carboidrati: 0,
        zuccheri: 0,
        fibre: 0,
        proteine: 0,
        sale: 0
    };

    ingredientiAggiunti.forEach(ingrediente => {
        Object.keys(totali).forEach(key => {
            totali[key] += ingrediente[key] || 0;
        });
    });

    // Aggiorna la tabella
    document.getElementById('calorie-totali').textContent = totali.calorie.toFixed(2);
    document.getElementById('grassi-totali').textContent = totali.grassi.toFixed(2);
    document.getElementById('carboidrati-totali').textContent = totali.carboidrati.toFixed(2);
    document.getElementById('zuccheri-totali').textContent = totali.zuccheri.toFixed(2);
    document.getElementById('fibre-totali').textContent = totali.fibre.toFixed(2);
    document.getElementById('proteine-totali').textContent = totali.proteine.toFixed(2);
    document.getElementById('sale-totale').textContent = totali.sale.toFixed(2);
});
