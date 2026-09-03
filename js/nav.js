// nav.js
// Toggle del menu mobile (hamburger) + Navbar dinamica con scroll blur + Reveal globale
document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('toggle');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('toggle');
            });
        });
    }

    // --- Dynamic Nav on Scroll ---
    const nav = document.querySelector('.site-nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }
        }, { passive: true });
    }

    // --- Global Scroll Reveal (per pagine interne che non hanno home.js) ---
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced && 'IntersectionObserver' in window) {
        const revealElements = document.querySelectorAll('.page-header, .calculator-card, .listing-card, .diary-form, .info-section, .contact-card');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach((el) => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
            }
            observer.observe(el);
        });
    }

    // --- Language Switcher Integration (sempre visibile sia desktop che mobile) ---
    const navContainer = document.querySelector('.nav-container');
    if (navContainer && !document.querySelector('.lang-switch-container')) {
        const langContainer = document.createElement('div');
        langContainer.className = 'lang-switch-container';
        langContainer.setAttribute('role', 'group');
        langContainer.setAttribute('aria-label', 'Selezione lingua');
        langContainer.innerHTML = `
            <button type="button" class="lang-btn active" data-lang="it" aria-pressed="true">IT</button>
            <button type="button" class="lang-btn" data-lang="en" aria-pressed="false">EN</button>
        `;

        if (hamburger) {
            navContainer.insertBefore(langContainer, hamburger);
        } else {
            navContainer.appendChild(langContainer);
        }
    }

    // Carica il runtime di internazionalizzazione
    import('./i18n-engine.js').catch((err) => {
        console.warn('i18n engine initialization error:', err);
    });

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('PizzaLab ServiceWorker attivo con scope:', registration.scope);
                })
                .catch((error) => {
                    console.warn('Registrazione ServiceWorker non riuscita:', error);
                });
        });
    }
});
