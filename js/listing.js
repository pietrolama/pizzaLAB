// listing.js
// Renderer generico per liste caricate da JSON (Tipi di Pizza, Prefermenti,
// Farine, Shop): stesso pattern in ogni pagina, cambia solo il contenuto.
export async function renderListing({ containerSelector, jsonPath, renderItem }) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        container.innerHTML = items.map(renderItem).join('');
    } catch (err) {
        console.error(`Errore nel caricamento di ${jsonPath}:`, err);
        container.innerHTML = '<p class="listing-error">Contenuto non disponibile al momento.</p>';
    }
}
