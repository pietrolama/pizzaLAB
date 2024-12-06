document.addEventListener('DOMContentLoaded', () => {
    fetch('data/farine.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('farine-container');

            data.forEach(farina => {
                const section = document.createElement('section');
                section.classList.add('farina-section'); // Classe per lo styling
                section.setAttribute('tabindex', '0'); // Rende la sezione focalizzabile

                const dettagliUrl = `dettagli-farina.html?id=${farina.id}`;

                section.innerHTML = `
                    <h2>${farina.titolo}</h2>
                    <img src="${farina.immagine}" alt="${farina.titolo}" class="farina-img">
                    <p>${farina.descrizione}</p>
                    <h3>Caratteristiche</h3>
                    <ul>
                        ${farina.caratteristiche.map(car => `<li>${car}</li>`).join('')}
                    </ul>
                    <p><strong>Contenuto di Glutine:</strong> ${farina.contenuto_glutine}</p>
                    <p><strong>Uso:</strong> ${farina.uso}</p>
                    <p><strong>Procedimento:</strong> ${farina.procedimento}</p>
                `;
                container.appendChild(section);
            });
        })
        .catch(error => console.error('Errore nel caricamento delle farine:', error));
});
