fetch('data/products.json')
    .then(response => response.json())
    .then(products => {
        const productList = document.querySelector('.cards-container');

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'card';

            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.title}" class="homepage-img">
                <h3>${product.title}</h3>
                <p>${product.price}</p>
                <a href="${product.link}" class="btn" target="_blank" rel="noopener noreferrer">Acquista su Amazon</a>
            `;

            productList.appendChild(productCard);
        });
    })
    .catch(error => console.error('Errore nel caricamento dei prodotti:', error));
