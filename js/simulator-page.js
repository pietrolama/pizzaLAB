// simulator-page.js
// Calcola calorie e macronutrienti a partire dai grammi generati dal
// Calcolatore (salvati in localStorage sotto 'datiNutrizionali'), con
// farciture opzionali prese da data/ingredienti.json.
import { getSavedLocale, loadLocaleData } from './i18n-engine.js';

const NOMI_BASE = ['acqua', 'farina', 'lievito', 'zucchero', 'sale', "olio d'oliva"];
const CHIAVI_NUTRIENTI = ['calorie', 'grassi', 'carboidrati', 'zuccheri', 'fibre', 'proteine', 'sale'];

const ETICHETTE = {
    it: {
        calorie: 'kcal',
        grassi: 'g grassi',
        carboidrati: 'g carboidrati',
        zuccheri: 'g zuccheri',
        fibre: 'g fibre',
        proteine: 'g proteine',
        sale: 'g sale',
    },
    en: {
        calorie: 'kcal',
        grassi: 'g fat',
        carboidrati: 'g carbs',
        zuccheri: 'g sugars',
        fibre: 'g fiber',
        proteine: 'g protein',
        sale: 'g salt',
    }
};

function getCurrentLocale() {
    try {
        return getSavedLocale() || localStorage.getItem('pizzalab_locale') || document.documentElement.lang || 'it';
    } catch (e) {
        return document.documentElement.lang || 'it';
    }
}

function capitalizza(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function calcolaNutrientiSuGrammi(nomeIngrediente, grammi, listaIngredienti) {
    const ref = listaIngredienti.find((i) => 
        i.nome.toLowerCase() === nomeIngrediente.toLowerCase() ||
        (i.nome_en && i.nome_en.toLowerCase() === nomeIngrediente.toLowerCase())
    );
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

function renderGrid(container, nutrienti, locale = 'it') {
    const labels = ETICHETTE[locale] || ETICHETTE.it;
    container.innerHTML = CHIAVI_NUTRIENTI.map((k) => `
        <div><strong>${Math.round(nutrienti[k] * 10) / 10}</strong><span>${labels[k]}</span></div>
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

    let currentLocale = getCurrentLocale();
    let translations = {};
    try {
        translations = await loadLocaleData(currentLocale);
    } catch (e) {}

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

    function renderTitolo(locale) {
        const defaultNome = ricette?.[datiImpasto.tipoPizza]?.[datiImpasto.tipoImpasto]?.nome
            || `${capitalizza(datiImpasto.tipoPizza)} - ${capitalizza(datiImpasto.tipoImpasto.replace('_', ' '))}`;

        if (locale === 'en') {
            const pizzaKey = `pizza.${datiImpasto.tipoPizza}`;
            const methodKey = `method.${datiImpasto.tipoImpasto}`;
            const pizzaTrans = translations?.[pizzaKey];
            const methodTrans = translations?.[methodKey];
            if (pizzaTrans && methodTrans) {
                titoloImpasto.textContent = `${pizzaTrans} - ${methodTrans}`;
            } else if (pizzaTrans) {
                titoloImpasto.textContent = `${pizzaTrans} - ${capitalizza(datiImpasto.tipoImpasto.replace('_', ' '))}`;
            } else {
                titoloImpasto.textContent = defaultNome;
            }
            sottotitoloImpasto.textContent = `${datiImpasto.numPanetti} dough ball${datiImpasto.numPanetti > 1 ? 's' : ''} (${datiImpasto.pesoPanetto} g each)`;
        } else {
            titoloImpasto.textContent = defaultNome;
            sottotitoloImpasto.textContent = `${datiImpasto.numPanetti} panetti da ${datiImpasto.pesoPanetto} g`;
        }
        pesoPanettoLabel.textContent = `${datiImpasto.pesoPanetto} g`;
    }

    function popolaSelectToppings(locale) {
        const currentVal = toppingSelect.value;
        const defaultPrompt = locale === 'en' ? 'Select...' : 'Seleziona...';
        toppingSelect.innerHTML = `<option value="" data-i18n="simulator.select_ingredient">${defaultPrompt}</option>`;

        ingredientiDisponibili
            .filter((ing) => !NOMI_BASE.includes(ing.nome.toLowerCase()))
            .forEach((ing) => {
                const opt = document.createElement('option');
                opt.value = ing.nome;
                opt.textContent = (locale === 'en' && ing.nome_en) ? ing.nome_en : ing.nome;
                if (opt.value === currentVal) opt.selected = true;
                toppingSelect.appendChild(opt);
            });
    }

    function aggiornaTotali(locale) {
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

        renderGrid(porzioneGrid, nutrientiPorzione, locale);
        renderGrid(totaliGrid, nutrientiTotali, locale);
    }

    function renderFarciture(locale) {
        toppingsList.innerHTML = farciture.map((f, i) => {
            const ingRef = ingredientiDisponibili.find((ing) => ing.nome === f.nome);
            const displayName = (locale === 'en' && ingRef?.nome_en) ? ingRef.nome_en : f.nome;
            const removeTitle = locale === 'en' ? 'Remove' : 'Rimuovi';
            return `
            <li style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 14px;">
                <span>${displayName} — ${f.quantita} g</span>
                <button data-index="${i}" class="rimuovi-topping" style="background:none; border:none; color: var(--text-dim); cursor:pointer; font-size:1.1rem;" title="${removeTitle}">&times;</button>
            </li>
            `;
        }).join('');

        toppingsList.querySelectorAll('.rimuovi-topping').forEach((btn) => {
            btn.addEventListener('click', () => {
                farciture.splice(parseInt(btn.dataset.index, 10), 1);
                renderFarciture(currentLocale);
                aggiornaTotali(currentLocale);
            });
        });
    }

    addToppingBtn.addEventListener('click', () => {
        const nome = toppingSelect.value;
        const quantita = parseFloat(toppingQty.value);
        if (!nome || !quantita || quantita <= 0) return;
        farciture.push({ nome, quantita });
        renderFarciture(currentLocale);
        aggiornaTotali(currentLocale);
    });

    // Render iniziale
    renderTitolo(currentLocale);
    popolaSelectToppings(currentLocale);
    aggiornaTotali(currentLocale);

    // Ascolta cambi lingua reattivi
    window.addEventListener('pizzalab:locale-changed', async (e) => {
        currentLocale = e.detail?.locale || getCurrentLocale();
        if (e.detail?.translations) {
            translations = e.detail.translations;
        } else {
            translations = await loadLocaleData(currentLocale);
        }
        renderTitolo(currentLocale);
        popolaSelectToppings(currentLocale);
        renderFarciture(currentLocale);
        aggiornaTotali(currentLocale);
    });
}

main();
