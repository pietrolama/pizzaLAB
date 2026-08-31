// diario-page.js
// Diario di fermentazione salvato in localStorage (nessun backend/login in
// questa fase): funziona subito, resta legato al browser/dispositivo.
const CHIAVE_STORAGE = 'diarioFermentazioni';

function leggiFermentazioni() {
    try {
        return JSON.parse(localStorage.getItem(CHIAVE_STORAGE)) || [];
    } catch (e) {
        return [];
    }
}

function salvaFermentazioni(lista) {
    localStorage.setItem(CHIAVE_STORAGE, JSON.stringify(lista));
}

function formattaData(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function renderLista() {
    const lista = leggiFermentazioni();
    const container = document.getElementById('fermentazioni-list');
    const vuoto = document.getElementById('fermentazioni-vuoto');

    vuoto.classList.toggle('hidden', lista.length > 0);
    container.innerHTML = lista.map((f, i) => `
        <article class="listing-card">
            <div class="listing-card__body">
                <h3>${f.nome}</h3>
                <p class="listing-card__meta">${formattaData(f.data)} · ${f.idratazione}% idratazione · ${f.tempo}h</p>
                <p>Lievito: ${f.lievito}</p>
                ${f.note ? `<p style="color: var(--text-dim);">${f.note}</p>` : ''}
                <button data-index="${i}" class="btn-secondary elimina-fermentazione" style="margin-top: 8px;">Elimina</button>
            </div>
        </article>
    `).join('');

    container.querySelectorAll('.elimina-fermentazione').forEach((btn) => {
        btn.addEventListener('click', () => {
            const lista2 = leggiFermentazioni();
            lista2.splice(parseInt(btn.dataset.index, 10), 1);
            salvaFermentazioni(lista2);
            renderLista();
        });
    });
}

document.getElementById('fermentazione-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const lista = leggiFermentazioni();
    lista.unshift({
        nome: document.getElementById('nome').value,
        data: document.getElementById('data').value,
        idratazione: document.getElementById('idratazione').value,
        lievito: document.getElementById('lievito').value,
        tempo: document.getElementById('tempo').value,
        note: document.getElementById('note').value,
    });
    salvaFermentazioni(lista);
    e.target.reset();
    renderLista();
});

renderLista();
