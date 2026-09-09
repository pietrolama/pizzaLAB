// nav.js
// Toggle del menu mobile (hamburger) + Navbar dinamica con scroll blur + Reveal globale
document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        // aria-expanded dice ai lettori di schermo se il menu è aperto: senza,
        // il pulsante annuncia solo il proprio nome e mai il proprio stato.
        const impostaMenu = (aperto) => {
            navLinks.classList.toggle('active', aperto);
            hamburger.classList.toggle('toggle', aperto);
            hamburger.setAttribute('aria-expanded', aperto ? 'true' : 'false');
        };

        hamburger.addEventListener('click', () => {
            impostaMenu(!navLinks.classList.contains('active'));
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => impostaMenu(false));
        });

        // Escape chiude il menu e riporta il fuoco sul pulsante, altrimenti
        // resterebbe su un link ormai nascosto e il Tab ripartirebbe dal nulla.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                impostaMenu(false);
                hamburger.focus();
            }
        });

        // Un clic fuori dal menu aperto lo chiude: comportamento atteso e
        // utile anche a chi usa il touch.
        document.addEventListener('click', (e) => {
            if (!navLinks.classList.contains('active')) return;
            if (hamburger.contains(e.target) || navLinks.contains(e.target)) return;
            impostaMenu(false);
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
        
        let isEn = false;
        try {
            const saved = localStorage.getItem('pizzalab_locale');
            if (saved === 'en') {
                isEn = true;
            } else if (!saved) {
                const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
                if (browserLang === 'en') isEn = true;
            }
        } catch (e) {}

        langContainer.innerHTML = `
            <button type="button" class="lang-btn ${!isEn ? 'active' : ''}" data-lang="it" aria-pressed="${!isEn}">IT</button>
            <button type="button" class="lang-btn ${isEn ? 'active' : ''}" data-lang="en" aria-pressed="${isEn}">EN</button>
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

    // --- Firebase Auth & User Bar Integration in Navbar ---
    // Firebase arriva da gstatic.com: senza rete, o con il dominio bloccato da
    // un ad blocker o da una rete aziendale, l'import fallisce. Va intercettato,
    // altrimenti resta una promise rifiutata non gestita a ogni caricamento —
    // cosa che offline accade sempre, proprio dove la PWA dovrebbe funzionare.
    import('./firebase-auth.js').then(({ onAuthChange, loginWithGoogle, logoutUser }) => {
        const navLinksList = document.querySelector('.nav-links');
        const langContainer = document.querySelector('.lang-switch-container');

        // Crea container utente nella navbar se non presente
        let userContainer = document.querySelector('.nav-user-slot');
        if (!userContainer && navContainer) {
            userContainer = document.createElement('div');
            userContainer.className = 'nav-user-slot';
            if (langContainer) {
                navContainer.insertBefore(userContainer, langContainer);
            } else if (hamburger) {
                navContainer.insertBefore(userContainer, hamburger);
            } else {
                navContainer.appendChild(userContainer);
            }
        }

        onAuthChange((user, isAdmin) => {
            // Gestione link admin nel menu
            const existingAdminLink = document.getElementById('nav-admin-link');
            if (isAdmin && navLinksList && !existingAdminLink) {
                const li = document.createElement('li');
                li.id = 'nav-admin-link';
                li.innerHTML = '<a href="admin.html" style="color: var(--primary-color); font-weight: 700;">⚙️ Redazione</a>';
                navLinksList.appendChild(li);
            } else if (!isAdmin && existingAdminLink) {
                existingAdminLink.remove();
            }

            // Gestione pulsante profilo / login
            if (userContainer) {
                if (user) {
                    const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
                    userContainer.innerHTML = `
                        <div class="nav-user-badge" title="${user.displayName || user.email}">
                            <span class="nav-user-avatar">${initial}</span>
                            <button type="button" class="nav-user-logout-btn" title="Disconnetti">✕</button>
                        </div>
                    `;
                    userContainer.querySelector('.nav-user-logout-btn')?.addEventListener('click', () => logoutUser());
                } else {
                    userContainer.innerHTML = `
                        <button type="button" class="btn-chip btn-nav-login" style="padding: 4px 10px; font-size: 0.78rem;">Accedi</button>
                    `;
                    userContainer.querySelector('.btn-nav-login')?.addEventListener('click', () => loginWithGoogle());
                }
            }
        });
    }).catch((err) => {
        console.warn('Firebase Auth integration error in nav:', err);
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
