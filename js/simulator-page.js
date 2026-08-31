// simulator-page.js
// Calcola calorie e macronutrienti a partire dai grammi generati dal
// Calcolatore (salvati in localStorage sotto 'datiNutrizionali'), con
// farciture opzionali prese da data/ingredienti.json.
const NOMI_BASE = ['acqua', 'farina', 'lievito', 'zucchero', 'sale', "olio d'oliva"];
const CHIAVI_NUTRIENTI = ['calorie', 'grassi', 'carboidrati', 'zuccheri', 'fibre', 'proteine', 'sale'];
const ETICHETTE = {
    calorie: 'kcal',
    grassi: 'g grassi',
    carboidrati: 'g carboidrati',
    zuccheri: 'g zuccheri',
    fibre: 'g fibre',
    proteine: 'g proteine',
    sale: 'g sale',
};

function capitalizza(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function calcolaNutrientiSuGrammi(nomeIngrediente, grammi, listaIngredienti) {
    const ref = listaIngredienti.find((i) => i.nome.toLowerCase() === nomeIngrediente.toLowerCase());
    if (!ref) return null;
    const fattore = grammi / 100;
    const risultato = {};
    CHIAVI_NUTRIENTI.forEach((k) => { risultato[k] = (ref[k] || 0) * fattore; });
    return risultato;
}

function sommaNutrienti(a, b) {
    const risultato = { ...a };
    CHIAVI_NUTRIENTI.forEach((k) => { risultato[k] = (risultato[k] || 0) + (b[k] || 0); });
    return risultato;
}

function renderGrid(container, nutrienti) {
    container.innerHTML = CHIAVI_NUTRIENTI.map((k) => `
        <div><strong>${Math.round(nutrienti[k] * 10) / 10}</strong><span>${ETICHETTE[k]}</span></div>
    `).join('');
}

async function main() {
    const noDataSection = document.getElementById('no-data-section');
    const dataSection = document.getElementById('data-section');
    const titoloImpasto = document.getElementById('titolo-impasto');
    const sottotitoloImpasto = document.getElementById('sottotitolo-impasto');
    const pesoPanettoLabel = document.getElementById('peso-panetto-label');
    const toppingSelect = document.getElementById('topping-select');
    const toppingQty = document.getElementById('topping-qty');
    const addToppingBtn = document.getElementById('add-topping');
    const toppingsList = document.getElementById('toppings-list');
    const porzioneGrid = document.getElementById('nutrienti-porzione-grid');
    const totaliGrid = document.getElementById('nutrienti-totali-grid');

    const raw = localStorage.getItem('datiNutrizionali');
    if (!raw) {
        noDataSection.classList.remove('hidden');
        return;
    }

    let datiImpasto;
    try {
        datiImpasto = JSON.parse(raw);
    } catch (e) {
        noDataSection.classList.remove('hidden');
        return;
    }

    let ingredientiDisponibili = [];
    try {
        const res = await fetch('data/ingredienti.json');
        ingredientiDisponibili = await res.json();
    } catch (e) {
        console.error('Errore nel caricamento di ingredienti.json:', e);
        noDataSection.classList.remove('hidden');
        return;
    }

    let ricette = {};
    try {
        const res = await fetch('data/ricette.json');
        if (res.ok) ricette = await res.json();
    } catch (e) {
        console.warn('Ricette non caricate:', e);
    }

    dataSection.classList.remove('hidden');

    const nomeRicetta = ricette?.[datiImpasto.tipoPizza]?.[datiImpasto.tipoImpasto]?.nome
        || `${capitalizza(datiImpasto.tipoPizza)} - ${capitalizza(datiImpasto.tipoImpasto.replace('_', ' '))}`;
    titoloImpasto.textContent = nomeRicetta;
    sottotitoloImpasto.textContent = `${datiImpasto.numPanetti} panetti da ${datiImpasto.pesoPanetto} g`;
    pesoPanettoLabel.textContent = `${datiImpasto.pesoPanetto} g`;

    ingredientiDisponibili
        .filter((ing) => !NOMI_BASE.includes(ing.nome.toLowerCase()))
        .forEach((ing) => {
            const opt = document.createElement('option');
            opt.value = ing.nome;
            opt.textContent = ing.nome;
            toppingSelect.appendChild(opt);
        });

    let farciture = []; // { nome, quantita } in grammi per singola pizza

    // Le chiavi restituite dal motore di calcolo (calcolatore-engine.js) sono
    // nomi brevi in italiano; qui vanno mappate ai nomi esatti in
    // ingredienti.json, che non sempre coincidono (es. "olio" -> "Olio d'oliva").
    const NOME_INGREDIENTE_BASE = {
        farina: 'Farina',
        acqua: 'Acqua',
        sale: 'Sale',
        zucchero: 'Zucchero',
        olio: "Olio d'oliva",
        lievito: 'Lievito',
    };

    function aggiornaTotali() {
        // Nutrienti dell'impasto base, distribuiti sull'intero batch.
        let totaleImpasto = Object.fromEntries(CHIAVI_NUTRIENTI.map((k) => [k, 0]));
        Object.entries(datiImpasto.ingredientiBase).forEach(([chiave, grammi]) => {
            const nome = NOME_INGREDIENTE_BASE[chiave] || chiave;
            const n = calcolaNutrientiSuGrammi(nome, grammi, ingredientiDisponibili);
            if (n) totaleImpasto = sommaNutrienti(totaleImpasto, n);
        });

        const numPanetti = datiImpasto.numPanetti || 1;
        let nutrientiPorzione = Object.fromEntries(CHIAVI_NUTRIENTI.map((k) => [k, totaleImpasto[k] / numPanetti]));

        // Le farciture sono per singola pizza: si sommano solo alla porzione,
        // poi si moltiplicano per il numero di panetti nel totale.
        let nutrientiFarciture = Object.fromEntries(CHIAVI_NUTRIENTI.map((k) => [k, 0]));
        farciture.forEach((f) => {
            const n = calcolaNutrientiSuGrammi(f.nome, f.quantita, ingredientiDisponibili);
            if (n) nutrientiFarciture = sommaNutrienti(nutrientiFarciture, n);
        });

        nutrientiPorzione = sommaNutrienti(nutrientiPorzione, nutrientiFarciture);
        const nutrientiTotali = sommaNutrienti(
            totaleImpasto,
            Object.fromEntries(CHIAVI_NUTRIENTI.map((k) => [k, nutrientiFarciture[k] * numPanetti])),
        );

        renderGrid(porzioneGrid, nutrientiPorzione);
        renderGrid(totaliGrid, nutrientiTotali);
    }

    function renderFarciture() {
        toppingsList.innerHTML = farciture.map((f, i) => `
            <li style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 14px;">
                <span>${f.nome} — ${f.quantita} g</span>
                <button data-index="${i}" class="rimuovi-topping" style="background:none; border:none; color: var(--text-dim); cursor:pointer; font-size:1.1rem;">&times;</button>
            </li>
        `).join('');
        toppingsList.querySelectorAll('.rimuovi-topping').forEach((btn) => {
            btn.addEventListener('click', () => {
                farciture.splice(parseInt(btn.dataset.index, 10), 1);
                renderFarciture();
                aggiornaTotali();
            });
        });
    }

    addToppingBtn.addEventListener('click', () => {
        const nome = toppingSelect.value;
        const quantita = parseFloat(toppingQty.value);
        if (!nome || !quantita || quantita <= 0) return;
        farciture.push({ nome, quantita });
        renderFarciture();
        aggiornaTotali();
    });

    aggiornaTotali();
}

main();
