// Fetch the product data
fetch('products.json')
    .then(response => response.json())
    .then(products => {
        const productList = document.getElementById('product-list');

        products.forEach(product => {
            // Create product card
            const productCard = document.createElement('div');
            productCard.className = 'product';

            // Add image
            const productImage = document.createElement('img');
            productImage.src = product.image;
            productImage.alt = product.title;
            productCard.appendChild(productImage);

            // Add title
            const productTitle = document.createElement('h3');
            productTitle.textContent = product.title;
            productCard.appendChild(productTitle);

            // Add price
            const productPrice = document.createElement('p');
            productPrice.textContent = product.price;
            productCard.appendChild(productPrice);

            // Add link
            const productLink = document.createElement('a');
            productLink.href = product.link;
            productLink.target = '_blank';
            productLink.textContent = 'View on Amazon';
            productCard.appendChild(productLink);

            // Append card to product list
            productList.appendChild(productCard);
        });
    })
    .catch(error => console.error('Error loading products:', error));
