let impastiPresets = {};
let ingredientiPresets = [];

// Carica i dati degli impasti
fetch('data/ricette.json')
    .then(response => response.json())
    .then(data => {
        impastiPresets = data;
        const impastoSelezione = document.getElementById('impasto-selezione');
        Object.keys(impastiPresets).forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            impastoSelezione.appendChild(option);
        });
    })
    .catch(error => console.error('Errore nel caricamento delle ricette:', error));

// Carica i dati degli ingredienti
fetch('data/ingredienti.json')
    .then(response => response.json())
    .then(data => {
        ingredientiPresets = data;
        const ingredientiSelezione = document.getElementById('ingredienti-selezione');
        ingredientiPresets.forEach(ingrediente => {
            const option = document.createElement('option');
            option.value = ingrediente.nome;
            option.textContent = ingrediente.nome;
            ingredientiSelezione.appendChild(option);
        });
    })
    .catch(error => console.error('Errore nel caricamento degli ingredienti:', error));
