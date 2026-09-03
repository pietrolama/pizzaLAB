// diario-page.js
// Diario di fermentazione salvato in localStorage + sincronizzazione opzionale su Firebase Firestore.
import { onAuthChange, salvaDiarioCloud, caricaDiarioCloud, eliminaDiarioCloud } from './firebase-auth.js';

const CHIAVE_STORAGE = 'diarioFermentazioni';
let currentUser = null;

onAuthChange(async (user) => {
    currentUser = user;
    if (user) {
        try {
            const cloudEntries = await caricaDiarioCloud();
            if (cloudEntries && cloudEntries.length > 0) {
                const locali = leggiFermentazioni();
                // Unisci per ID evitando duplicati
                const idMap = new Map();
                cloudEntries.forEach((e) => idMap.set(e.id || `${e.nome}_${e.data}`, e));
                locali.forEach((e) => idMap.set(e.id || `${e.nome}_${e.data}`, e));
                const uniti = Array.from(idMap.values());
                salvaFermentazioni(uniti);
                renderLista();
            }
        } catch (e) {
            console.warn('Errore sync diario cloud:', e);
        }
    }
});

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
        btn.addEventListener('click', async () => {
            const lista2 = leggiFermentazioni();
            const idx = parseInt(btn.dataset.index, 10);
            const item = lista2[idx];
            if (item && item.id) {
                try {
                    await eliminaDiarioCloud(item.id);
                } catch (e) {
                    console.warn('Errore eliminazione cloud:', e);
                }
            }
            lista2.splice(idx, 1);
            salvaFermentazioni(lista2);
            renderLista();
        });
    });
}

document.getElementById('fermentazione-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const lista = leggiFermentazioni();
    const nuovaEntry = {
        id: `ferm_${Date.now()}`,
        nome: document.getElementById('nome').value,
        data: document.getElementById('data').value,
        idratazione: document.getElementById('idratazione').value,
        lievito: document.getElementById('lievito').value,
        tempo: document.getElementById('tempo').value,
        note: document.getElementById('note').value,
    };
    lista.unshift(nuovaEntry);
    salvaFermentazioni(lista);
    
    if (currentUser) {
        try {
            await salvaDiarioCloud(nuovaEntry);
        } catch (err) {
            console.warn('Errore salvataggio cloud:', err);
        }
    }

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
