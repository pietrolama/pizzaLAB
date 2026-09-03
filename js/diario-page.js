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

function escapeHtml(valore) {
    return String(valore ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[c]));
}

function renderLista() {
    const lista = leggiFermentazioni();
    const container = document.getElementById('fermentazioni-list');
    const vuoto = document.getElementById('fermentazioni-vuoto');

    vuoto.classList.toggle('hidden', lista.length > 0);
    container.innerHTML = lista.map((f, i) => `
        <article class="listing-card">
            <div class="listing-card__body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <h3>${escapeHtml(f.nome)}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(formattaData(f.data))}</span>
                </div>
                <p class="listing-card__meta">${escapeHtml(f.idratazione)}% idratazione · ${escapeHtml(f.tempo || f.tempo_lievitazione || 8)}h lievitazione${f.tempo_frigo ? ` (${f.tempo_frigo}h frigo)` : ''}</p>
                <p>Lievito: <strong>${escapeHtml(f.lievito)}</strong>${f.farina_w ? ` · Farina: <strong>${escapeHtml(f.farina_w)} W</strong>` : ''}</p>
                ${f.blend && f.blend.possibile ? `
                <p style="font-size: 0.85rem; color: var(--primary-color);">🌾 Blend: ${f.blend.pesoForte}g Forte (${f.blend.percentualeForte}%) + ${f.blend.pesoDebole}g Debole (${f.blend.percentualeDebole}%)</p>
                ` : ''}
                ${f.note ? `<p style="color: var(--text-dim); margin-top: 6px;">${escapeHtml(f.note)}</p>` : ''}
                <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button data-index="${i}" class="btn-chip riapri-calcolatore" style="font-size: 0.82rem; padding: 6px 12px;">🔄 Riapri nel Calcolatore</button>
                    <button data-index="${i}" class="btn-secondary elimina-fermentazione" style="font-size: 0.82rem; padding: 6px 12px;">Elimina</button>
                </div>
            </div>
        </article>
    `).join('');

    container.querySelectorAll('.riapri-calcolatore').forEach((btn) => {
        btn.addEventListener('click', () => {
            const lista2 = leggiFermentazioni();
            const f = lista2[parseInt(btn.dataset.index, 10)];
            if (!f) return;

            const config = {
                tipo_pizza: f.tipo_pizza || 'napoletana',
                tipo_impasto: f.tipo_impasto || 'diretto',
                idratazione: Number(f.idratazione) || 65,
                num_panetti: Number(f.num_panetti) || 4,
                peso_panetto: Number(f.peso_panetto) || 250,
                tempo_lievitazione: Number(f.tempo_lievitazione || f.tempo) || 8,
                tempo_frigo: Number(f.tempo_frigo) || 0,
                percentuale_biga: Number(f.percentuale_biga) || 30,
                percentuale_poolish: Number(f.percentuale_poolish) || 20,
                percentuale_lievito_madre: Number(f.percentuale_lievito_madre) || 20
            };

            localStorage.setItem('configurazioneImpasto', JSON.stringify(config));
            window.location.href = 'calcolatore.html';
        });
    });

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
