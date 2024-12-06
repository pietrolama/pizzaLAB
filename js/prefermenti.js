document.addEventListener('DOMContentLoaded', () => {
    fetch('data/prefermenti.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('prefermenti-container');
            data.forEach(prefermento => {
                const section = document.createElement('section');
                section.classList.add('prefermento-section'); // Aggiungiamo una classe specifica per lo styling
                section.setAttribute('tabindex', '0'); // Rende la sezione focalizzabile

                const dettagliUrl = `dettagli.html?id=${prefermento.id}`;

                section.innerHTML = `
                    <h2>${prefermento.titolo}</h2>
                    <img src="${prefermento.immagine}" alt="${prefermento.titolo}" class="prefermento-img">
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
                `;

                container.appendChild(section);
            });
        })
        .catch(error => console.error('Errore nel caricamento dei prefermenti:', error));
});
