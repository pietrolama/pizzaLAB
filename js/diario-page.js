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
    const isEn = document.documentElement.lang === 'en';
    return d.toLocaleDateString(isEn ? 'en-US' : 'it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

// Campi ammessi in una scheda del diario, con il tipo atteso.
const CAMPI_FERMENTAZIONE = {
    nome: 'stringa', data: 'stringa', note: 'stringa',
    tipo_pizza: 'stringa', tipo_impasto: 'stringa',
    idratazione: 'numero', lievito: 'numero', farina_w: 'numero',
    tempo: 'numero', tempo_lievitazione: 'numero', tempo_frigo: 'numero',
    num_panetti: 'numero', peso_panetto: 'numero',
    percentuale_biga: 'numero', percentuale_poolish: 'numero',
    percentuale_lievito_madre: 'numero',
};

const CAMPI_BLEND = {
    possibile: 'booleano',
    pesoForte: 'numero', percentualeForte: 'numero',
    pesoDebole: 'numero', percentualeDebole: 'numero',
};

function copiaCampiAmmessi(origine, schema) {
    const out = {};
    for (const [campo, tipo] of Object.entries(schema)) {
        const v = origine[campo];
        if (v === undefined || v === null) continue;
        if (tipo === 'numero') {
            const n = Number(v);
            if (Number.isFinite(n)) out[campo] = n;
        } else if (tipo === 'booleano') {
            out[campo] = Boolean(v);
        } else {
            out[campo] = String(v).slice(0, 2000);
        }
    }
    return out;
}

/**
 * Riduce una voce di backup ai soli campi previsti. Restituisce null se la
 * voce non è un oggetto utilizzabile.
 */
function normalizzaFermentazione(voce) {
    if (!voce || typeof voce !== 'object' || Array.isArray(voce)) return null;

    const pulita = copiaCampiAmmessi(voce, CAMPI_FERMENTAZIONE);
    if (!pulita.nome) return null;

    if (voce.blend && typeof voce.blend === 'object' && !Array.isArray(voce.blend)) {
        pulita.blend = copiaCampiAmmessi(voce.blend, CAMPI_BLEND);
    }
    return pulita;
}

function renderLista() {
    const lista = leggiFermentazioni();
    const container = document.getElementById('fermentazioni-list');
    const vuoto = document.getElementById('fermentazioni-vuoto');
    const isEn = document.documentElement.lang === 'en';

    vuoto.classList.toggle('hidden', lista.length > 0);
    container.innerHTML = lista.map((f, i) => {
        // Ogni valore che finisce nell'HTML passa da escapeHtml, comprese le
        // voci del blend e le ore di frigo: le schede possono arrivare da un
        // file di backup importato, quindi sono a tutti gli effetti input
        // esterno e non contenuto di cui fidarsi.
        const idroLabel = isEn
            ? `${escapeHtml(f.idratazione)}% hydration · ${escapeHtml(f.tempo || f.tempo_lievitazione || 8)}h fermentation${f.tempo_frigo ? ` (${escapeHtml(f.tempo_frigo)}h fridge)` : ''}`
            : `${escapeHtml(f.idratazione)}% idratazione · ${escapeHtml(f.tempo || f.tempo_lievitazione || 8)}h lievitazione${f.tempo_frigo ? ` (${escapeHtml(f.tempo_frigo)}h frigo)` : ''}`;
        const yeastLabel = isEn ? 'Yeast:' : 'Lievito:';
        const flourLabel = isEn ? 'Flour:' : 'Farina:';
        const blendLabel = isEn
            ? `🌾 Blend: ${escapeHtml(f.blend?.pesoForte)}g Strong (${escapeHtml(f.blend?.percentualeForte)}%) + ${escapeHtml(f.blend?.pesoDebole)}g Weak (${escapeHtml(f.blend?.percentualeDebole)}%)`
            : `🌾 Blend: ${escapeHtml(f.blend?.pesoForte)}g Forte (${escapeHtml(f.blend?.percentualeForte)}%) + ${escapeHtml(f.blend?.pesoDebole)}g Debole (${escapeHtml(f.blend?.percentualeDebole)}%)`;
        const reopenBtn = isEn ? '🔄 Reopen in Calculator' : '🔄 Riapri nel Calcolatore';
        const deleteBtn = isEn ? 'Delete' : 'Elimina';

        return `
        <article class="listing-card">
            <div class="listing-card__body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <h3>${escapeHtml(f.nome)}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(formattaData(f.data))}</span>
                </div>
                <p class="listing-card__meta">${idroLabel}</p>
                <p>${yeastLabel} <strong>${escapeHtml(f.lievito)}</strong>${f.farina_w ? ` · ${flourLabel} <strong>${escapeHtml(f.farina_w)} W</strong>` : ''}</p>
                ${f.blend && f.blend.possibile ? `
                <p style="font-size: 0.85rem; color: var(--primary-color);">${blendLabel}</p>
                ` : ''}
                ${f.note ? `<p style="color: var(--text-dim); margin-top: 6px;">${escapeHtml(f.note)}</p>` : ''}
                <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button data-index="${i}" class="btn-chip riapri-calcolatore" style="font-size: 0.82rem; padding: 6px 12px;">${reopenBtn}</button>
                    <button data-index="${i}" class="btn-secondary elimina-fermentazione" style="font-size: 0.82rem; padding: 6px 12px;">${deleteBtn}</button>
                </div>
            </div>
        </article>
        `;
    }).join('');

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
    const isEn = document.documentElement.lang === 'en';
    const lista = leggiFermentazioni();
    if (lista.length === 0) {
        alert(isEn ? 'No dough entries recorded to export.' : 'Nessun impasto registrato da esportare.');
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

    const isEn = document.documentElement.lang === 'en';
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data)) {
                throw new Error(isEn ? 'The backup file does not contain a valid list.' : 'Il file di backup non contiene una lista valida.');
            }

            // Il backup è un file scelto dall'utente, non necessariamente
            // prodotto da questo sito: si tengono solo i campi previsti, con i
            // tipi previsti. Così una voce malformata non entra nel diario e
            // nessuna chiave inattesa raggiunge il rendering.
            const voci = data.map(normalizzaFermentazione).filter(Boolean);
            if (voci.length === 0) {
                throw new Error(isEn
                    ? 'No readable dough entries were found in this file.'
                    : 'Nel file non è stato trovato nessun impasto leggibile.');
            }

            const attuali = leggiFermentazioni();
            // Unione intelligente o sostituzione confermata
            if (confirm(isEn ? `Found ${voci.length} dough entries in backup. Do you want to merge them into your current diary?` : `Trovati ${voci.length} impasti nel backup. Vuoi aggiungerli al tuo diario attuale?`)) {
                const uniti = [...voci, ...attuali];
                salvaFermentazioni(uniti);
                renderLista();
                alert(isEn ? 'Backup restored successfully!' : 'Backup ripristinato con successo!');
            }
        } catch (err) {
            alert((isEn ? 'Error reading backup file: ' : 'Errore nella lettura del file di backup: ') + err.message);
        }
        e.target.value = ''; // reset input
    };
    reader.readAsText(file);
});

// Aggiornamento dinamico al cambio lingua
window.addEventListener('pizzalab:locale-changed', () => {
    renderLista();
});

// Inizializza data odierna e render
document.getElementById('data').value = new Date().toISOString().split('T')[0];
renderLista();
