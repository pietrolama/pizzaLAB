import { getSavedLocale } from './i18n-engine.js';

export function renderListing({ containerSelector, jsonPath, renderItem }) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    async function loadAndRender() {
        try {
            const locale = document.documentElement.lang || getSavedLocale() || 'it';
            let targetPath = jsonPath;
            if (locale && locale !== 'it') {
                const localizedPath = jsonPath.replace(/\.json$/, `.${locale}.json`);
                try {
                    const testRes = await fetch(localizedPath);
                    if (testRes.ok) {
                        const items = await testRes.json();
                        renderItems(items);
                        return;
                    }
                } catch (e) {}
            }

            const res = await fetch(targetPath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const items = await res.json();
            renderItems(items);
        } catch (err) {
            console.error(`Errore nel caricamento di ${jsonPath}:`, err);
            container.innerHTML = '<p class="listing-error">Contenuto non disponibile al momento.</p>';
        }
    }

    function renderItems(items) {
        container.innerHTML = items.map((item, index) => {
            const html = renderItem(item);
            return html.replace(/class="([^"]*listing-card[^"]*)"/, `class="$1 reveal is-visible" style="animation-delay: ${index * 60}ms"`);
        }).join('');
    }

    loadAndRender();

    // Re-render quando l'utente cambia lingua dall'interfaccia
    window.addEventListener('pizzalab:locale-changed', () => {
        loadAndRender();
    });
}

