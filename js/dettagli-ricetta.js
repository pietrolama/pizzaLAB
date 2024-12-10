// Funzione per leggere un parametro dalla query string
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Funzione per mostrare la ricetta nel DOM
function mostraRicetta(ricetta) {
    const container = document.getElementById('ricetta-container');
    if (!container) return;

    // Lista ingredienti
    const ingredientiHTML = ricetta.ingredienti.map(ingrediente => {
        return `<li>${ingrediente.nome}: ${ingrediente.quantita}</li>`;
    }).join('');

    // Procedura
    const proceduraHTML = ricetta.procedimento.map(passo => `<p>${passo}</p>`).join('');

    container.innerHTML = `
        <h2>${ricetta.nome}</h2>
        <h4>Ingredienti:</h4>
        <ul>${ingredientiHTML}</ul>
        <h4>Procedura:</h4>
        ${proceduraHTML}
    `;
}

// Caricamento delle ricette e visualizzazione di quella selezionata
document.addEventListener('DOMContentLoaded', () => {
    const tipo = getQueryParam('tipo');
    if (!tipo) {
        console.error("Nessun tipo di pizza specificato nell'URL.");
        return;
    }

    // Imposta il metodo di impasto di default (puoi cambiarlo o ottenerlo da query string)
    const metodo = 'diretto'; // ad esempio, oppure puoi usare un altro metodo se preferisci
    
    fetch('data/ricette.json')
        .then(response => response.json())
        .then(ricette => {
            if (!ricette[tipo]) {
                console.error(`Ricetta per "${tipo}" non trovata nel file JSON.`);
                return;
            }

            if (!ricette[tipo][metodo]) {
                console.error(`Metodo "${metodo}" non disponibile per "${tipo}".`);
                return;
            }

            const ricetta = ricette[tipo][metodo];
            mostraRicetta(ricetta);
        })
        .catch(error => console.error('Errore nel caricamento delle ricette:', error));
});
