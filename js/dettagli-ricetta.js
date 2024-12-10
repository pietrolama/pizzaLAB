document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tipoPizza = urlParams.get('tipo'); // ad esempio "napoletana"

    if (!tipoPizza) {
        alert("Tipo di pizza non specificato!");
        return;
    }

    // Carichiamo il file ricette.json
    let ricette;
    try {
        const response = await fetch('data/ricette.json');
        ricette = await response.json();
    } catch (error) {
        console.error("Errore nel caricamento delle ricette:", error);
        return;
    }

    // Supponiamo che usiamo sempre il metodo "diretto" o uno predefinito
    // In realtà potresti aggiungere un selettore del metodo
    const metodo = "diretto";
    const pizzaData = ricette[tipoPizza] && ricette[tipoPizza][metodo];

    if (!pizzaData) {
        alert(`Ricetta per "${tipoPizza}" non disponibile.`);
        return;
    }

    const generaBtn = document.getElementById('genera-ricetta');
    const risultato = document.getElementById('risultato-ricetta');

    generaBtn.addEventListener('click', () => {
        const numPizze = parseInt(document.getElementById('num_pizze').value) || 1;

        // Adatta la ricetta al numero di pizze
        // Qui puoi inserire un calcolo semplificato, ad esempio se la ricetta base è per un tot di pizze,
        // oppure se devi ancora definire una formula. 
        // Per ora, supponiamo che la ricetta base sia per 2 pizze e moltiplichiamo in proporzione.
        
        const fattore = numPizze / 2; // se la ricetta di base è per 2 pizze, adatta di conseguenza
        
        // Sostituisci i segnaposto con valori inventati (ad esempio 100g farina per 2 pizze, ecc.)
        // In uno scenario reale, dovresti avere una funzione di calcolo come nel calcolatore.
        
        const ingredienti = pizzaData.ingredienti.map(ing => {
            // Supponiamo che <pesoFarina> corrisponda a 200 per 2 pizze.
            // Qui potresti usare la stessa logica del calcolatore, per semplicità moltiplichiamo.
            let quantita = ing.quantita;
            quantita = quantita.replace("<pesoFarina>", (200 * fattore).toFixed(2));
            quantita = quantita.replace("<pesoAcqua>", (130 * fattore).toFixed(2));
            quantita = quantita.replace("<pesoLievito>", (2 * fattore).toFixed(2));
            quantita = quantita.replace("<pesoSale>", (4 * fattore).toFixed(2));
            quantita = quantita.replace("<pesoZucchero>", (3 * fattore).toFixed(2));
            quantita = quantita.replace("<pesoOlio>", (5 * fattore).toFixed(2));
            quantita = quantita.replace("<numPanetti>", numPizze);
            quantita = quantita.replace("<pesoPanetto>", (200 * fattore).toFixed(2));
            quantita = quantita.replace("<massa>", (1 * fattore).toFixed(2));
            quantita = quantita.replace("<apretto>", (3 * fattore).toFixed(2));

            return `<li>${ing.nome}: ${quantita} g</li>`;
        }).join('');

        const procedimento = pizzaData.procedimento.map(step => {
            let stepTesto = step;
            stepTesto = stepTesto.replace("<massa>", (1 * fattore).toFixed(2));
            stepTesto = stepTesto.replace("<numPanetti>", numPizze);
            stepTesto = stepTesto.replace("<pesoPanetto>", (200 * fattore).toFixed(2));
            stepTesto = stepTesto.replace("<apretto>", (3 * fattore).toFixed(2));
            return `<p>${stepTesto}</p>`;
        }).join('');

        risultato.innerHTML = `
            <h2>${pizzaData.nome}</h2>
            <h4>Ingredienti:</h4>
            <ul>${ingredienti}</ul>
            <h4>Procedura:</h4>
            ${procedimento}
        `;
        risultato.classList.remove('hidden');
    });
});
