// stagionale.js
// Mostra in home il lievitato "del momento" (es. casatiello a Pasqua,
// panettone a Natale) leggendo data/stagionale.json. Il contenuto è
// popolato da un agente di ricerca pianificato, non da questo script:
// qui ci si limita a scegliere, tra le voci pubblicate, quella la cui
// finestra inizio/fine copre la data odierna.
(function () {
    const container = document.getElementById('stagionale-banner');
    if (!container) return;

    function nelPeriodo(oggi, inizio, fine) {
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

    fetch('data/stagionale.json')
        .then((res) => (res.ok ? res.json() : []))
        .then((voci) => {
            const oggi = new Date();
            const attuale = voci.find((v) => nelPeriodo(oggi, v.inizio, v.fine));
            if (!attuale) return;

            container.innerHTML = `
                <div class="stagionale-banner__media">
                    <img src="${attuale.immagine}" alt="${attuale.nome}">
                </div>
                <div class="stagionale-banner__body">
                    <p class="lab-section__eyebrow">${attuale.eyebrow}</p>
                    <h2>${attuale.nome}</h2>
                    <p>${attuale.descrizione}</p>
                    <a href="${attuale.link}" class="btn-ghost">Scopri di più</a>
                </div>
            `;
            container.hidden = false;
        })
        .catch((err) => console.error('Errore nel caricamento di stagionale.json:', err));
})();
