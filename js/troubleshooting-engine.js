// troubleshooting-engine.js
// Motore di diagnosi e risoluzione problemi per impasti (Pronto Soccorso Impasti).
import { getSavedLocale } from './i18n-engine.js';

let troubleshootingCache = null;

export async function caricaTroubleshootingData() {
    if (troubleshootingCache) return troubleshootingCache;
    try {
        const res = await fetch('data/troubleshooting.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        troubleshootingCache = await res.json();
        return troubleshootingCache;
    } catch (err) {
        console.error('Errore caricamento troubleshooting.json:', err);
        return [];
    }
}

export function renderTroubleshootingList(items, containerEl, filterCat = 'all', searchQuery = '') {
    if (!containerEl) return;
    const locale = getSavedLocale();
    const isEn = locale === 'en';

    const filtered = items.filter((item) => {
        const matchCat = filterCat === 'all' || item.categoria === filterCat;
        const textToSearch = `${item.titolo} ${item.titolo_en || ''} ${item.sintomi.join(' ')} ${item.causa_scientifica}`.toLowerCase();
        const matchSearch = !searchQuery || textToSearch.includes(searchQuery.toLowerCase().trim());
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        containerEl.innerHTML = `
            <div style="text-align: center; padding: 32px; color: var(--text-muted);">
                <p>${isEn ? 'No troubleshooting cases found for your search.' : 'Nessun problema trovato per i criteri selezionati.'}</p>
            </div>
        `;
        return;
    }

    containerEl.innerHTML = filtered.map((item) => {
        const title = isEn ? (item.titolo_en || item.titolo) : item.titolo;
        const cause = isEn ? (item.causa_scientifica_en || item.causa_scientifica) : item.causa_scientifica;
        const remedy = isEn ? (item.rimedio_immediato_en || item.rimedio_immediato) : item.rimedio_immediato;
        const prev = isEn ? (item.prevenzione_en || item.prevenzione) : item.prevenzione;
        const symptoms = isEn ? (item.sintomi_en || item.sintomi) : item.sintomi;

        return `
            <article class="troubleshoot-card" id="sos-${item.id}">
                <div class="troubleshoot-header">
                    <span class="troubleshoot-icon">${item.icona || '🆘'}</span>
                    <div>
                        <h4 class="troubleshoot-title">${title}</h4>
                        <span class="troubleshoot-badge">${item.categoria.toUpperCase()}</span>
                    </div>
                </div>

                <div class="troubleshoot-symptoms">
                    <strong>${isEn ? 'Symptoms:' : 'Sintomi visibili:'}</strong>
                    <ul>
                        ${symptoms.map((s) => `<li>• ${s}</li>`).join('')}
                    </ul>
                </div>

                <div class="troubleshoot-box cause">
                    <span class="box-tag cause-tag">🔬 ${isEn ? 'Scientific Cause' : 'Causa Scientifica'}</span>
                    <p>${cause}</p>
                </div>

                <div class="troubleshoot-box remedy">
                    <span class="box-tag remedy-tag">🚑 ${isEn ? 'Immediate Rescue Action' : 'Rimedio Immediato'}</span>
                    <p>${remedy}</p>
                </div>

                <div class="troubleshoot-box prev">
                    <span class="box-tag prev-tag">🛡️ ${isEn ? 'How to Prevent Next Time' : 'Come Prevenire'}</span>
                    <p>${prev}</p>
                </div>
            </article>
        `;
    }).join('');
}
