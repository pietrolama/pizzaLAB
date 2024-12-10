// js/prefermenti.js
document.addEventListener('DOMContentLoaded', () => {
    fetch('/data/prefermenti.json') // Percorso assoluto
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('prefermenti-container');
            data.forEach(prefermento => {
                const section = document.createElement('section');
                section.classList.add('prefermenti-section'); // Classe per lo styling
                section.setAttribute('tabindex', '0'); // Rende la sezione focalizzabile

                // URL per i dettagli, se necessario
                const dettagliUrl = `dettagli.html?id=${prefermento.id}`;

                section.innerHTML = `
                    <img src="${prefermento.immagine}" alt="${prefermento.titolo}" class="prefermenti-img">
                    <div class="item-content">
                        <h2>${prefermento.titolo}</h2>
                        <p>${prefermento.descrizione}</p>
                        <h3>Caratteristiche</h3>
                        <ul>
                            ${prefermento.caratteristiche.map(car => `<li>${car}</li>`).join('')}
                        </ul>
                        <p><strong>Inventore:</strong> ${prefermento.inventore}</p>
                        <p><strong>Idratazione:</strong> ${prefermento.idratazione}</p>
                        <p><strong>Temperatura di Fermentazione:</strong> ${prefermento.temperatura_fermentazione}</p>
                        <p><strong>Ingredienti:</strong> ${prefermento.ingredienti.join(', ')}</p>
                        <p><strong>Procedimento:</strong> ${prefermento.procedimento}</p>
                    </div>
                `;

                container.appendChild(section);
            });
        })
        .catch(error => console.error('Errore nel caricamento dei prefermenti:', error));
});
