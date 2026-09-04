// grains-engine.js
// Motore di calcolo e raccomandazione per cereali, grani antichi e farine speciali.
import { getSavedLocale } from './i18n-engine.js';

let cerealiCache = null;

export async function caricaCerealiData() {
    if (cerealiCache) return cerealiCache;
    try {
        const res = await fetch('data/cereali.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        cerealiCache = await res.json();
        return cerealiCache;
    } catch (err) {
        console.error('Errore caricamento cereali.json:', err);
        return [];
    }
}

export function renderCerealiCards(items, containerEl) {
    if (!containerEl) return;
    const isEn = getSavedLocale() === 'en';

    containerEl.innerHTML = items.map((c) => {
        const name = isEn ? (c.nome_en || c.nome) : c.nome;
        const cat = isEn ? (c.categoria_en || c.categoria) : c.categoria;
        const maxPerc = isEn ? (c.perc_max_consigliata_en || c.perc_max_consigliata) : c.perc_max_consigliata;
        const delta = isEn ? (c.assorbimento_acqua_delta_en || c.assorbimento_acqua_delta) : c.assorbimento_acqua_delta;
        const gluten = isEn ? (c.caratteristiche_glutine_en || c.caratteristiche_glutine) : c.caratteristiche_glutine;
        const notes = isEn ? (c.note_tecniche_en || c.note_tecniche) : c.note_tecniche;

        return `
            <div class="grain-card" id="grain-${c.id}">
                <div class="grain-header">
                    <span class="grain-icon">🌾</span>
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${name}</h4>
                        <span style="font-size: 0.8rem; color: var(--primary-color); font-weight: 600;">${cat}</span>
                    </div>
                </div>

                <div class="grain-stats-grid">
                    <div class="grain-stat">
                        <span class="stat-label">${isEn ? 'Max Recommended %' : '% Max Consigliata'}</span>
                        <strong class="stat-val" style="color: #10b981;">${maxPerc}</strong>
                    </div>
                    <div class="grain-stat">
                        <span class="stat-label">${isEn ? 'Water Absorption Delta' : 'Variazione Idratazione'}</span>
                        <strong class="stat-val" style="color: #3b82f6;">${delta}</strong>
                    </div>
                </div>

                <div style="margin-top: 12px; font-size: 0.88rem; line-height: 1.5;">
                    <p style="margin: 0 0 6px 0;"><strong>${isEn ? 'Gluten Behavior:' : 'Comportamento Glutine:'}</strong> <span style="color: var(--text-muted);">${gluten}</span></p>
                    <p style="margin: 0;"><strong>${isEn ? 'Technical Notes:' : 'Note di Panificazione:'}</strong> <span style="color: var(--text-muted);">${notes}</span></p>
                </div>
            </div>
        `;
    }).join('');
}
