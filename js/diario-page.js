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
    document.getElementById('fermentazione-form').reset();
    document.getElementById('data').value = new Date().toISOString().split('T')[0];
    renderLista();
});

// --- Backup Export ---
document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    const lista = leggiFermentazioni();
    if (lista.length === 0) {
        alert('Nessun impasto registrato da esportare.');
        return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(lista, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pizzalab-diario-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// --- Backup Import ---
document.getElementById('input-import-backup')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data)) {
                throw new Error('Il file di backup non contiene una lista valida.');
            }
            const attuali = leggiFermentazioni();
            // Unione intelligente o sostituzione confermata
            if (confirm(`Trovati ${data.length} impasti nel backup. Vuoi aggiungerli al tuo diario attuale?`)) {
                const uniti = [...data, ...attuali];
                salvaFermentazioni(uniti);
                renderLista();
                alert('Backup ripristinato con successo!');
            }
        } catch (err) {
            alert('Errore nella lettura del file di backup: ' + err.message);
        }
        e.target.value = ''; // reset input
    };
    reader.readAsText(file);
});

// Inizializza data odierna e render
document.getElementById('data').value = new Date().toISOString().split('T')[0];
renderLista();
