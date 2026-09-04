import { getSavedLocale } from './i18n-engine.js';

export async function renderListing({ containerSelector, jsonPath, renderItem }) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const locale = getSavedLocale();
        let targetPath = jsonPath;
        if (locale && locale !== 'it') {
            const localizedPath = jsonPath.replace(/\.json$/, `.${locale}.json`);
            try {
                const checkRes = await fetch(localizedPath, { method: 'HEAD' });
                if (checkRes.ok) {
                    targetPath = localizedPath;
                }
            } catch (e) {}
        }

        const res = await fetch(targetPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        container.innerHTML = items.map((item, index) => {
            const html = renderItem(item);
            // Inietta lo stile di ritardo progressivo sulla prima card
            return html.replace(/class="([^"]*listing-card[^"]*)"/, `class="$1 reveal is-visible" style="animation-delay: ${index * 60}ms"`);
        }).join('');
    } catch (err) {
        console.error(`Errore nel caricamento di ${jsonPath}:`, err);
        container.innerHTML = '<p class="listing-error">Contenuto non disponibile al momento.</p>';
    }
}
