// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('toggle');
    });

    // Chiudi il menu quando clicchi su un link (opzionale)
    const navItems = document.querySelectorAll('.nav-links li a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('toggle');
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const parallaxSection = document.querySelector('.parallax-section');

    // Controlla se .parallax-section esiste
    if (parallaxSection) {
        document.addEventListener("scroll", function () {
            if (window.scrollY > 50) {
                parallaxSection.classList.add("scroll");
            } else {
                parallaxSection.classList.remove("scroll");
            }
        });
    } else {
        console.log("Nessuna sezione parallax presente in questa pagina.");
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        // Trova il link all'interno della card
        const link = card.querySelector('.btn');
        if (link) {
            const url = link.getAttribute('href');

            // Aggiungi l'event listener alla card
            card.addEventListener('click', (event) => {
                // Se il click non è sul link stesso, reindirizza
                if (!event.target.closest('.btn')) {
                    window.location.href = url;
                }
            });
        }
    });
});
