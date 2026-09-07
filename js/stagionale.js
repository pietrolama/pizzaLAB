// stagionale.js
// Mostra in home il lievitato "del momento" (es. casatiello a Pasqua,
// panettone a Natale) leggendo data/stagionale.json o data/stagionale.en.json.
(function () {
    const container = document.getElementById('stagionale-banner');
    if (!container) return;

    function nelPeriodo(oggi, inizio, fine) {
        if (!inizio || !fine) return false;
        const [oM, oD] = [oggi.getMonth() + 1, oggi.getDate()];
        const oggiNum = oM * 100 + oD;
        const [iM, iD] = inizio.split('-').map(Number);
        const [fM, fD] = fine.split('-').map(Number);
        const inizioNum = iM * 100 + iD;
        const fineNum = fM * 100 + fD;
        if (inizioNum <= fineNum) {
            return oggiNum >= inizioNum && oggiNum <= fineNum;
        }
        // finestra a cavallo di fine anno (es. 12-20 -> 01-10)
        return oggiNum >= inizioNum || oggiNum <= fineNum;
    }

    function renderStagionale(locale) {
        const activeLocale = locale || localStorage.getItem('pizzalab_locale') || (navigator.language || '').slice(0, 2);
        const jsonPath = (activeLocale === 'en') ? 'data/stagionale.en.json' : 'data/stagionale.json';

        fetch(jsonPath)
            .then((res) => (res.ok ? res.json() : fetch('data/stagionale.json').then((r) => r.json())))
            .then((voci) => {
                if (!Array.isArray(voci) || voci.length === 0) {
                    container.hidden = true;
                    return;
                }
                const oggi = new Date();
                const attuale = voci.find((v) => nelPeriodo(oggi, v.inizio, v.fine)) || voci[0];
                if (!attuale || !attuale.nome) {
                    container.hidden = true;
                    return;
                }

                const ctaText = activeLocale === 'en' ? 'Discover more' : 'Scopri di più';
                container.innerHTML = `
                    <div class="stagionale-banner__media">
                        <img src="${attuale.immagine}" alt="${attuale.nome}">
                    </div>
                    <div class="stagionale-banner__body">
                        <p class="lab-section__eyebrow">${attuale.eyebrow || ''}</p>
                        <h2>${attuale.nome}</h2>
                        <p>${attuale.descrizione || ''}</p>
                        <a href="${attuale.link || 'calcolatore.html'}" class="btn-ghost">${ctaText}</a>
                    </div>
                `;
                container.hidden = false;
            })
            .catch((err) => {
                console.warn('Errore nel caricamento di stagionale:', err);
                container.hidden = true;
            });
    }

    renderStagionale();
    window.addEventListener('pizzalab:locale-changed', (e) => {
        renderStagionale(e.detail?.locale);
    });
})();
