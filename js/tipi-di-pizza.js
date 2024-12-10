// js/tipi-di-pizza.js

fetch('data/pizze.json')
    .then(response => response.json())
    .then(data => {
        const container = document.querySelector('.pizza-container');
        data.forEach(pizza => {
            const section = document.createElement('section');
            section.innerHTML = `
                <img src="${pizza.immagine}" alt="${pizza.nome}" class="pizza-img">
                <div class="pizza-content">
                    <h2>${pizza.nome}</h2>
                    <p>${pizza.descrizione}</p>
                    <ul>
                        ${pizza.caratteristiche.map(car => `<li>${car}</li>`).join('')}
                    </ul>
                    <a href="dettagli-ricetta.html?tipo=${pizza.tipo}" class="btn">Visualizza Ricetta</a>
                </div>
            `;
            container.appendChild(section);
        });
    })
    .catch(error => console.error('Errore nel caricamento dei dati:', error));
