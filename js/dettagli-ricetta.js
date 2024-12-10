// dettagli-ricetta.js

document.addEventListener('DOMContentLoaded', () => {
    const tipoPizza = getQueryParam('tipo') || 'napoletana'; 
    // Se vuoi leggere anche il metodo, fallo così:
    // const metodo = getQueryParam('metodo') || 'diretto';
    // Per semplicità qui fisseremo il metodo a "diretto"
    const metodo = 'diretto';

    const numPizzeSelect = document.getElementById('num_pizze');
    const ricettaContainer = document.getElementById('ricetta-container');

    function aggiornaRicetta() {
        const numPizze = parseInt(numPizzeSelect.value, 10);
        
        // calcolaRicetta è definita in calcolatore_script.js
        const ricettaCalcolata = calcolaRicetta(tipoPizza, metodo, numPizze); 

        mostraRicetta(ricettaCalcolata);
    }

    numPizzeSelect.addEventListener('change', aggiornaRicetta);

    // Caricamento iniziale
    aggiornaRicetta();

    function mostraRicetta(ricetta) {
        const ingredientiHTML = ricetta.ingredienti.map(ing => `<li>${ing.nome}: ${ing.quantita} g</li>`).join('');
        const proceduraHTML = ricetta.procedimento.map(step => `<p>${step}</p>`).join('');

        ricettaContainer.innerHTML = `
            <h2>${ricetta.nome}</h2>
            <h4>Ingredienti:</h4>
            <ul>${ingredientiHTML}</ul>
            <h4>Procedura:</h4>
            ${proceduraHTML}
        `;
    }

    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
});
