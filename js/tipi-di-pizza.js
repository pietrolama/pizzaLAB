fetch('data/pizze.json')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('pizze-container');
        data.forEach(pizza => {
            const section = document.createElement('section');
            section.innerHTML = `
                <h2>${pizza.nome}</h2>
                <img src="${pizza.immagine}" alt="${pizza.nome}" class="pizza-img">
                <p>${pizza.descrizione}</p>
                <ul>
                    ${pizza.caratteristiche.map(car => `<li>${car}</li>`).join('')}
                </ul>
            `;
            container.appendChild(section);
        });
    })
    .catch(error => console.error('Errore nel caricamento dei dati:', error));
