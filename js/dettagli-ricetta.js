// dettagli-ricetta.js

document.addEventListener('DOMContentLoaded', () => {
    const tipoPizza = getQueryParam('tipo') || 'napoletana';
    const metodo = getQueryParam('metodo') || 'diretto';

    const numPizzeInput = document.getElementById('num_pizze');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const ricettaContainer = document.getElementById('ricetta-container');

    btnMinus.addEventListener('click', () => {
        let val = parseInt(numPizzeInput.value, 10);
        if (val > 1) {
            numPizzeInput.value = val - 1;
            aggiornaRicetta();
        }
    });

    btnPlus.addEventListener('click', () => {
        let val = parseInt(numPizzeInput.value, 10);
        numPizzeInput.value = val + 1;
        aggiornaRicetta();
    });

    numPizzeInput.addEventListener('change', aggiornaRicetta);

    // Attendi che le ricette siano caricate da calcolatore_script.js (window.loadedRicette)
    const checkRicette = setInterval(() => {
        if (window.loadedRicette) {
            clearInterval(checkRicette);
            aggiornaRicetta();
        }
    }, 200);

    function aggiornaRicetta() {
        const numPizze = parseInt(numPizzeInput.value, 10);
        const ricettaCalcolata = calcolaRicetta(tipoPizza, metodo, numPizze);
        mostraRicetta(ricettaCalcolata);
    }

    function mostraRicetta(ricetta) {
        if (!ricetta || !ricetta.ingredienti || !ricetta.procedimento) {
            ricettaContainer.innerHTML = "<p>Impossibile caricare la ricetta.</p>";
            return;
        }
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
