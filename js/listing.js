import { getSavedLocale, t } from './i18n-engine.js';

export function renderListing({ containerSelector, jsonPath, renderItem, onRender }) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // La lingua arriva dall'evento di cambio lingua quando disponibile: leggerla
    // ogni volta da localStorage renderebbe la lista insensibile al selettore
    // nei contesti in cui la memoria del browser è bloccata (navigazione privata).
    async function loadAndRender(localeRichiesta) {
        try {
            const locale = localeRichiesta || getSavedLocale() || document.documentElement.lang || 'it';
            let targetPath = jsonPath;
            if (locale && locale !== 'it') {
                const localizedPath = jsonPath.replace(/\.json$/, `.${locale}.json`);
                try {
                    const testRes = await fetch(localizedPath);
                    if (testRes.ok) {
                        const items = await testRes.json();
                        renderItems(items, locale);
                        return;
                    }
                } catch (e) {}
            }

            const res = await fetch(targetPath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const items = await res.json();
            renderItems(items, locale);
        } catch (err) {
            console.error(`Errore nel caricamento di ${jsonPath}:`, err);
            const p = document.createElement('p');
            p.className = 'listing-error';
            p.textContent = t('listing.error', {}, 'Contenuto non disponibile al momento.');
            container.replaceChildren(p);
            onRender?.({ vuoto: true, errore: true });
        }
    }

    function renderItems(items, locale) {
        container.innerHTML = items.map((item, index) => {
            const html = renderItem(item, locale);
            return html.replace(/class="([^"]*listing-card[^"]*)"/, `class="$1 reveal is-visible" style="animation-delay: ${index * 60}ms"`);
        }).join('');
        // Notifica a chi usa la lista che il rendering è concluso: permette di
        // reagire allo stato "nessun contenuto" senza ricorrere a un timer.
        onRender?.({ vuoto: items.length === 0, errore: false });
    }

    loadAndRender();

    // Re-render quando l'utente cambia lingua dall'interfaccia
    window.addEventListener('pizzalab:locale-changed', (e) => {
        loadAndRender(e.detail?.locale);
    });
}


