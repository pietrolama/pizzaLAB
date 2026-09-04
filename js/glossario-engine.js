// glossario-engine.js
// Motore per glossario scientifico della panificazione con tooltip e cassetto interattivo.
import { getSavedLocale } from './i18n-engine.js';

let glossarioCache = null;

export async function caricaGlossarioData() {
    if (glossarioCache) return glossarioCache;
    try {
        const res = await fetch('data/glossario.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        glossarioCache = await res.json();
        return glossarioCache;
    } catch (err) {
        console.error('Errore caricamento glossario.json:', err);
        return [];
    }
}

export function initGlossaryTooltips() {
    caricaGlossarioData().then((terms) => {
        if (!terms || terms.length === 0) return;

        // Crea il popover globale se non esiste
        let popover = document.getElementById('glossary-popover');
        if (!popover) {
            popover = document.createElement('div');
            popover.id = 'glossary-popover';
            popover.className = 'glossary-popover hidden';
            document.body.appendChild(popover);
        }

        // Ascolta hover/click su elementi con classe .glossary-term o data-glossary
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-glossary]');
            if (!target) return;
            const termKey = target.getAttribute('data-glossary');
            const found = terms.find((t) => t.termine.toLowerCase() === termKey.toLowerCase() || (t.termine_en && t.termine_en.toLowerCase() === termKey.toLowerCase()));
            if (!found) return;

            const isEn = getSavedLocale() === 'en';
            const title = isEn ? (found.termine_en || found.termine) : found.termine;
            const brief = isEn ? (found.definizione_breve_en || found.definizione_breve) : found.definizione_breve;
            const sci = isEn ? (found.spiegazione_scientifica_en || found.spiegazione_scientifica) : found.spiegazione_scientifica;

            popover.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <span style="font-size:1.3rem;">${found.icona || '🔬'}</span>
                    <strong style="color:var(--primary-color); font-size:0.95rem;">${title}</strong>
                </div>
                <p style="font-size:0.85rem; margin:0 0 6px 0; color:#fff;">${brief}</p>
                <p style="font-size:0.78rem; margin:0; color:var(--text-muted); line-height:1.4;">${sci}</p>
            `;

            const rect = target.getBoundingClientRect();
            popover.style.left = `${Math.min(window.innerWidth - 300, Math.max(10, rect.left + window.scrollX - 50))}px`;
            popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
            popover.classList.remove('hidden');
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('[data-glossary]')) {
                popover.classList.add('hidden');
            }
        });
    });
}

export function renderGlossarioDrawer(containerEl) {
    if (!containerEl) return;
    const isEn = getSavedLocale() === 'en';

    caricaGlossarioData().then((terms) => {
        containerEl.innerHTML = terms.map((t) => {
            const title = isEn ? (t.termine_en || t.termine) : t.termine;
            const brief = isEn ? (t.definizione_breve_en || t.definizione_breve) : t.definizione_breve;
            const sci = isEn ? (t.spiegazione_scientifica_en || t.spiegazione_scientifica) : t.spiegazione_scientifica;

            return `
                <div class="glossary-card">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                        <span style="font-size:1.4rem;">${t.icona || '🔬'}</span>
                        <h4 style="margin:0; font-size:1.1rem; color:var(--primary-color);">${title}</h4>
                    </div>
                    <p style="font-size:0.92rem; color:var(--text-main); font-weight:600; margin:0 0 6px 0;">${brief}</p>
                    <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5; margin:0;">${sci}</p>
                </div>
            `;
        }).join('');
    });
}

// Inizializza automaticamente i tooltip
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initGlossaryTooltips());
    } else {
        initGlossaryTooltips();
    }
}
