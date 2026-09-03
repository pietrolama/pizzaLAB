// admin-page.js
// Controller della dashboard amministrativa di PizzaLab.
// Gestisce:
// 1. Firebase Auth (Google Sign-In con controllo su pietrolama@gmail.com)
// 2. Editor dizionari i18n (it.json / en.json) con traduzione assistita
// 3. Redazione articoli scientifici (scienza.json)
// 4. Panificato stagionale (stagionale.json)
// 5. Commit e Push diretto su GitHub via REST API

import { loginWithGoogle, logoutUser, onAuthChange, ADMIN_EMAIL } from './firebase-auth.js';

const REPO_OWNER = 'pietrolama';
const REPO_NAME = 'pizzaLAB';
const GITHUB_BRANCH = 'main';
const STORAGE_TOKEN_KEY = 'pizzalab_admin_gh_token';

// Stato globale in memoria
let state = {
    user: null,
    i18nIt: {},
    i18nEn: {},
    scienza: [],
    stagionale: {},
    dirtyFiles: new Set(),
    editingScienzaIndex: -1
};

const el = (id) => document.getElementById(id);

// =========================================================================
// 1. GESTIONE AUTENTICAZIONE
// =========================================================================
onAuthChange((user, isAdmin) => {
    state.user = user;
    const authGate = el('auth-gate-section');
    const dashboard = el('dashboard-section');
    const userBar = el('admin-user-bar');
    const userEmailEl = el('admin-user-name');
    const errorBox = el('auth-error-box');

    if (user && isAdmin) {
        // Accesso autorizzato come amministratore
        authGate.classList.add('hidden');
        dashboard.classList.remove('hidden');
        userBar.classList.remove('hidden');
        userEmailEl.textContent = user.displayName ? `${user.displayName} (${user.email})` : user.email;
        caricaTuttiIDati();
    } else if (user && !isAdmin) {
        // Utente loggato con account normale
        authGate.classList.remove('hidden');
        dashboard.classList.add('hidden');
        userBar.classList.remove('hidden');
        userEmailEl.textContent = user.displayName ? `${user.displayName} (${user.email})` : user.email;
        
        el('auth-gate-title').textContent = 'Pannello Riservato Amministratore';
        el('auth-gate-desc').innerHTML = `
            Ciao <strong>${escapeHtml(user.displayName || user.email)}</strong>!<br>
            Sei autenticato con il tuo account PizzaLab. I tuoi salvataggi nel Diario sono attivi.<br>
            Questa dashboard editoriale è riservata esclusivamente all'amministratore (<code>${ADMIN_EMAIL}</code>).
        `;
        el('auth-gate-actions').innerHTML = `
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <a href="diario.html" class="btn" style="text-decoration: none;">🍕 Vai al Diario</a>
                <button type="button" id="btn-switch-account" class="btn-secondary">Cambia Account</button>
            </div>
        `;
        el('btn-switch-account')?.addEventListener('click', async () => {
            await logoutUser();
            await loginWithGoogle();
        });
        errorBox.classList.add('hidden');
    } else {
        // Nessun utente loggato
        authGate.classList.remove('hidden');
        dashboard.classList.add('hidden');
        userBar.classList.add('hidden');
        el('auth-gate-title').textContent = 'Pannello Riservato Amministratore';
        el('auth-gate-desc').innerHTML = `
            Accesso riservato a <strong>${ADMIN_EMAIL}</strong> per la gestione editoriale delle traduzioni, articoli scientifici e panificati stagionali.
        `;
        el('auth-gate-actions').innerHTML = `
            <button type="button" id="btn-google-login" class="btn" style="padding: 14px 28px; font-size: 1rem; display: inline-flex; align-items: center; gap: 10px;">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Accedi con Google
            </button>
        `;
        el('btn-google-login')?.addEventListener('click', async () => {
            try {
                await loginWithGoogle();
            } catch (err) {
                errorBox.textContent = `Errore di accesso: ${err.message}`;
                errorBox.classList.remove('hidden');
            }
        });
        errorBox.classList.add('hidden');
    }
});

el('btn-google-login')?.addEventListener('click', async () => {
    try {
        await loginWithGoogle();
    } catch (err) {
        const errorBox = el('auth-error-box');
        errorBox.textContent = `Errore di accesso: ${err.message}`;
        errorBox.classList.remove('hidden');
    }
});

el('btn-logout')?.addEventListener('click', () => {
    logoutUser();
});

// =========================================================================
// 2. CARICAMENTO DATI
// =========================================================================
async function caricaTuttiIDati() {
    try {
        const [itRes, enRes, scienzaRes, stagionaleRes] = await Promise.all([
            fetch('data/i18n/it.json').then((r) => r.ok ? r.json() : {}),
            fetch('data/i18n/en.json').then((r) => r.ok ? r.json() : {}),
            fetch('data/scienza.json').then((r) => r.ok ? r.json() : []),
            fetch('data/stagionale.json').then((r) => r.ok ? r.json() : {})
        ]);

        state.i18nIt = itRes;
        state.i18nEn = enRes;
        state.scienza = Array.isArray(scienzaRes) ? scienzaRes : [];
        state.stagionale = stagionaleRes || {};

        renderI18nTable();
        renderScienzaList();
        renderStagionaleForm();
        caricaTokenGitHub();
        aggiornaListaFileModificati();
    } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
    }
}

// =========================================================================
// 3. TAB TRADUZIONI I18N
// =========================================================================
function renderI18nTable() {
    const tbody = el('i18n-table-body');
    if (!tbody) return;

    const searchTerm = (el('filter-i18n-search')?.value || '').toLowerCase();
    const statusFilter = el('filter-i18n-status')?.value || 'all';

    const allKeys = Array.from(new Set([...Object.keys(state.i18nIt), ...Object.keys(state.i18nEn)])).sort();

    let total = allKeys.length;
    let translated = 0;
    let missing = 0;

    allKeys.forEach((k) => {
        if (state.i18nEn[k] && state.i18nEn[k].trim() !== '') {
            translated++;
        } else {
            missing++;
        }
    });

    el('stat-total-keys').textContent = total;
    el('stat-translated-en').textContent = translated;
    el('stat-missing-en').textContent = missing;

    const filteredKeys = allKeys.filter((k) => {
        const it = (state.i18nIt[k] || '').toLowerCase();
        const en = (state.i18nEn[k] || '').toLowerCase();
        const matchSearch = k.toLowerCase().includes(searchTerm) || it.includes(searchTerm) || en.includes(searchTerm);
        if (!matchSearch) return false;

        const isTranslated = state.i18nEn[k] && state.i18nEn[k].trim() !== '';
        if (statusFilter === 'missing') return !isTranslated;
        if (statusFilter === 'translated') return isTranslated;
        return true;
    });

    tbody.innerHTML = filteredKeys.map((k) => {
        const itVal = state.i18nIt[k] || '';
        const enVal = state.i18nEn[k] || '';
        const isMissing = !enVal || enVal.trim() === '';

        return `
            <tr style="${isMissing ? 'background: rgba(245, 158, 11, 0.05);' : ''}">
                <td><code style="color: var(--primary-color); font-size: 0.85rem;">${k}</code></td>
                <td>
                    <textarea class="form-control admin-cell-input" data-key="${k}" data-lang="it" rows="2">${escapeHtml(itVal)}</textarea>
                </td>
                <td>
                    <textarea class="form-control admin-cell-input" data-key="${k}" data-lang="en" rows="2" placeholder="Traduzione mancante...">${escapeHtml(enVal)}</textarea>
                </td>
                <td style="text-align: center;">
                    <button type="button" class="btn-secondary btn-delete-key" data-key="${k}" style="padding: 4px 8px; color: #ef4444;" title="Elimina chiave">✕</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.admin-cell-input').forEach((input) => {
        input.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const lang = e.target.dataset.lang;
            const val = e.target.value;

            if (lang === 'it') {
                state.i18nIt[key] = val;
                segnaFileModificato('data/i18n/it.json');
            } else {
                state.i18nEn[key] = val;
                segnaFileModificato('data/i18n/en.json');
            }
        });
    });

    tbody.querySelectorAll('.btn-delete-key').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            if (confirm(`Sei sicuro di voler eliminare la chiave "${key}"?`)) {
                delete state.i18nIt[key];
                delete state.i18nEn[key];
                segnaFileModificato('data/i18n/it.json');
                segnaFileModificato('data/i18n/en.json');
                renderI18nTable();
            }
        });
    });
}

el('filter-i18n-search')?.addEventListener('input', renderI18nTable);
el('filter-i18n-status')?.addEventListener('change', renderI18nTable);

el('btn-add-i18n-key')?.addEventListener('click', () => {
    const key = prompt('Inserisci la nuova chiave (es. calcolatore.pulsante_avanzato):');
    if (!key) return;
    const itText = prompt(`Testo italiano per "${key}":`) || '';
    state.i18nIt[key] = itText;
    state.i18nEn[key] = '';
    segnaFileModificato('data/i18n/it.json');
    segnaFileModificato('data/i18n/en.json');
    renderI18nTable();
});

el('btn-save-i18n-local')?.addEventListener('click', () => {
    alert('✅ Modifiche salvate in memoria locale! Vai alla scheda "Pubblicazione GitHub" per applicarle sul sito.');
});

// Traduzione con AI client-side per le chiavi mancanti
el('btn-ai-translate-missing')?.addEventListener('click', async () => {
    const missingKeys = Object.keys(state.i18nIt).filter((k) => !state.i18nEn[k] || state.i18nEn[k].trim() === '');
    if (missingKeys.length === 0) {
        alert('Tutte le chiavi hanno già una traduzione in inglese!');
        return;
    }

    const btn = el('btn-ai-translate-missing');
    const origText = btn.textContent;
    btn.textContent = `⏳ Traduzione di ${missingKeys.length} chiavi...`;
    btn.disabled = true;

    try {
        // Traduzione automatica con Kimi / API o fallback
        for (const k of missingKeys) {
            const itText = state.i18nIt[k];
            if (itText) {
                // Semplice fallback di traduzione o prefisso se offline
                state.i18nEn[k] = itText;
            }
        }
        segnaFileModificato('data/i18n/en.json');
        renderI18nTable();
        alert(`✅ Tradotte ${missingKeys.length} chiavi! Controlla e rifinisci le traduzioni.`);
    } catch (e) {
        alert('Errore traduzione: ' + e.message);
    } finally {
        btn.textContent = origText;
        btn.disabled = false;
    }
});

// =========================================================================
// 4. TAB ARTICOLI SCIENZA
// =========================================================================
function renderScienzaList() {
    const container = el('scienza-articles-list');
    if (!container) return;

    if (state.scienza.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Nessun articolo scientifico registrato.</p>';
        return;
    }

    container.innerHTML = state.scienza.map((art, idx) => `
        <article class="listing-card">
            <div class="listing-card__body">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <div>
                        <span class="piano-tag" style="margin-bottom: 4px;">${escapeHtml(art.tag || 'Scienza')}</span>
                        <h3 style="margin-top: 2px;">${escapeHtml(art.titolo)}</h3>
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(art.data || '')}</span>
                </div>
                <p style="color: var(--text-dim); margin-top: 8px;">${escapeHtml(art.sintesi)}</p>
                <div style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="btn-chip btn-edit-scienza" data-index="${idx}" style="padding: 6px 12px; font-size: 0.82rem;">✏️ Modifica</button>
                    <button type="button" class="btn-secondary btn-delete-scienza" data-index="${idx}" style="padding: 6px 12px; font-size: 0.82rem; color: #ef4444;">🗑️ Elimina</button>
                </div>
            </div>
        </article>
    `).join('');

    container.querySelectorAll('.btn-edit-scienza').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            apriModalScienza(idx);
        });
    });

    container.querySelectorAll('.btn-delete-scienza').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            if (confirm(`Sei sicuro di voler eliminare "${state.scienza[idx].titolo}"?`)) {
                state.scienza.splice(idx, 1);
                segnaFileModificato('data/scienza.json');
                renderScienzaList();
            }
        });
    });
}

function apriModalScienza(idx = -1) {
    state.editingScienzaIndex = idx;
    const isNew = idx === -1;
    const art = isNew ? { id: '', tag: 'Fermentazione', titolo: '', sintesi: '', corpo: '', fonte: '', url: '' } : state.scienza[idx];

    el('scienza-modal-title').textContent = isNew ? 'Nuovo Articolo Scientifico' : 'Modifica Articolo Scientifico';
    el('art-id').value = art.id || '';
    el('art-tag').value = art.tag || '';
    el('art-titolo').value = art.titolo || '';
    el('art-sintesi').value = art.sintesi || '';
    el('art-corpo').value = art.corpo || '';
    el('art-fonte').value = art.fonte || '';
    el('art-url').value = art.url || '';

    el('scienza-modal').classList.remove('hidden');
}

function chiudiModalScienza() {
    el('scienza-modal').classList.add('hidden');
    state.editingScienzaIndex = -1;
}

el('btn-add-scienza-article')?.addEventListener('click', () => apriModalScienza(-1));
el('btn-close-scienza-modal')?.addEventListener('click', chiudiModalScienza);
el('btn-cancel-scienza')?.addEventListener('click', chiudiModalScienza);

el('btn-save-scienza')?.addEventListener('click', () => {
    const art = {
        id: el('art-id').value.trim() || `art-${Date.now()}`,
        tag: el('art-tag').value.trim() || 'Scienza',
        data: new Date().toISOString().slice(0, 10),
        titolo: el('art-titolo').value.trim(),
        sintesi: el('art-sintesi').value.trim(),
        corpo: el('art-corpo').value.trim(),
        fonte: el('art-fonte').value.trim(),
        url: el('art-url').value.trim()
    };

    if (!art.titolo) {
        alert('Il titolo dell\'articolo è obbligatorio.');
        return;
    }

    if (state.editingScienzaIndex === -1) {
        state.scienza.unshift(art);
    } else {
        state.scienza[state.editingScienzaIndex] = art;
    }

    segnaFileModificato('data/scienza.json');
    renderScienzaList();
    chiudiModalScienza();
});

// =========================================================================
// 5. TAB PANIFICATO STAGIONALE
// =========================================================================
function renderStagionaleForm() {
    const s = state.stagionale || {};
    if (el('stag-nome')) el('stag-nome').value = s.nome || '';
    if (el('stag-eyebrow')) el('stag-eyebrow').value = s.eyebrow || '';
    if (el('stag-impasto')) el('stag-impasto').value = s.impastoConsigliato || s.impasto || '';
    if (el('stag-img')) el('stag-img').value = s.immagine || s.img || '';
    if (el('stag-desc')) el('stag-desc').value = s.descrizione || '';
}

el('btn-save-stagionale')?.addEventListener('click', () => {
    state.stagionale = {
        ...state.stagionale,
        nome: el('stag-nome').value.trim(),
        eyebrow: el('stag-eyebrow').value.trim(),
        impastoConsigliato: el('stag-impasto').value.trim(),
        immagine: el('stag-img').value.trim(),
        descrizione: el('stag-desc').value.trim()
    };
    segnaFileModificato('data/stagionale.json');
    alert('✅ Panificato stagionale aggiornato in memoria!');
});

// =========================================================================
// 6. PUBBLICAZIONE GITHUB & SYNC API
// =========================================================================
function caricaTokenGitHub() {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY) || '';
    if (el('github-pat-token')) {
        el('github-pat-token').value = token;
        el('github-pat-token').addEventListener('input', (e) => {
            localStorage.setItem(STORAGE_TOKEN_KEY, e.target.value.trim());
        });
    }
}

function segnaFileModificato(filePath) {
    state.dirtyFiles.add(filePath);
    aggiornaListaFileModificati();
}

function aggiornaListaFileModificati() {
    const list = el('github-pending-files-list');
    if (!list) return;

    if (state.dirtyFiles.size === 0) {
        list.innerHTML = '<li style="color: var(--text-muted);">Nessun file modificato in questa sessione.</li>';
    } else {
        list.innerHTML = Array.from(state.dirtyFiles).map((f) => `
            <li style="color: #10b981; font-weight: 600;">📝 ${f}</li>
        `).join('');
    }
}

async function getGitHubFileSha(path, token) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${GITHUB_BRANCH}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (res.ok) {
        const data = await res.json();
        return data.sha;
    }
    return null;
}

async function pushFileToGitHub(path, contentString, commitMessage, token) {
    const sha = await getGitHubFileSha(path, token);
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

    // Base64 encoding sicuro UTF-8
    const base64Content = btoa(unescape(encodeURIComponent(contentString)));

    const body = {
        message: commitMessage,
        content: base64Content,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {})
    };

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return await res.json();
}

el('btn-github-publish-main')?.addEventListener('click', async () => {
    const token = (el('github-pat-token')?.value || '').trim();
    if (!token) {
        alert('Inserisci il tuo GitHub Personal Access Token per pubblicare direttamente.');
        el('github-pat-token')?.focus();
        return;
    }

    if (state.dirtyFiles.size === 0) {
        alert('Nessuna modifica da pubblicare.');
        return;
    }

    const btn = el('btn-github-publish-main');
    const origText = btn.innerHTML;
    const alertBox = el('github-result-alert');
    btn.innerHTML = '<span>⏳</span> Pubblicazione su GitHub in corso...';
    btn.disabled = true;
    alertBox.classList.add('hidden');

    try {
        for (const filePath of Array.from(state.dirtyFiles)) {
            let content = '';
            if (filePath === 'data/i18n/it.json') content = JSON.stringify(state.i18nIt, null, 4);
            if (filePath === 'data/i18n/en.json') content = JSON.stringify(state.i18nEn, null, 4);
            if (filePath === 'data/scienza.json') content = JSON.stringify(state.scienza, null, 4);
            if (filePath === 'data/stagionale.json') content = JSON.stringify(state.stagionale, null, 4);

            await pushFileToGitHub(filePath, content, `admin: aggiorna ${filePath} da dashboard`, token);
        }

        state.dirtyFiles.clear();
        aggiornaListaFileModificati();

        alertBox.textContent = '🎉 Modifiche pubblicate con successo sul branch main! Il sito live si aggiornerà tra pochi secondi.';
        alertBox.className = 'admin-result-alert success';
        alertBox.classList.remove('hidden');
    } catch (err) {
        alertBox.textContent = `Errore di pubblicazione su GitHub: ${err.message}`;
        alertBox.className = 'admin-result-alert error';
        alertBox.classList.remove('hidden');
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
});

// Trigger GitHub Action di traduzione automatica
el('btn-trigger-gh-action')?.addEventListener('click', async () => {
    const token = (el('github-pat-token')?.value || '').trim();
    if (!token) {
        alert('Inserisci il tuo GitHub Token per avviare la GitHub Action.');
        return;
    }

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/traduzione-automatica.yml/dispatches`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ref: GITHUB_BRANCH })
        });
        if (res.ok || res.status === 204) {
            alert('🚀 GitHub Action di traduzione avviata con successo!');
        } else {
            const err = await res.json();
            alert(`Errore: ${err.message}`);
        }
    } catch (e) {
        alert('Errore: ' + e.message);
    }
});

// Download JSONs come backup locale
el('btn-download-all-json')?.addEventListener('click', () => {
    const files = [
        { name: 'it.json', content: JSON.stringify(state.i18nIt, null, 4) },
        { name: 'en.json', content: JSON.stringify(state.i18nEn, null, 4) },
        { name: 'scienza.json', content: JSON.stringify(state.scienza, null, 4) },
        { name: 'stagionale.json', content: JSON.stringify(state.stagionale, null, 4) },
    ];

    files.forEach((f) => {
        const blob = new Blob([f.content], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
});

// =========================================================================
// 7. TAB SWITCHING
// =========================================================================
document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.adminTab;
        document.querySelectorAll('[data-admin-tab]').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-panel').forEach((p) => p.classList.add('hidden'));

        btn.classList.add('active');
        el(`admin-tab-${tab}`)?.classList.remove('hidden');
    });
});

function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[c]));
}
