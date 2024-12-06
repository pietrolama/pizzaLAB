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

    // Inizializza AOS (se utilizzato)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000, // Durata dell'animazione in millisecondi
            once: true, // L'animazione viene eseguita una sola volta
        });
    }
});
