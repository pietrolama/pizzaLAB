// home.js
// Effetti a scorrimento della home "Laboratorio": reveal di sezioni/foto,
// parallax leggero sulle immagini, rail di progresso laterale. Tecniche
// semplici e collaudate (IntersectionObserver + un listener di scroll con
// requestAnimationFrame), nessuna libreria esterna.
(function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Reveal al scroll ---
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !prefersReduced) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
        revealEls.forEach((el) => revealObserver.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    // --- Parallax leggero sulle immagini ---
    const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
    let ticking = false;
    function aggiornaParallax() {
        const centroViewport = window.innerHeight / 2;
        parallaxEls.forEach((img) => {
            const rect = img.parentElement.getBoundingClientRect();
            const centroEl = rect.top + rect.height / 2;
            const distanza = (centroEl - centroViewport) / window.innerHeight;
            const offset = distanza * 40; // ampiezza dello spostamento in px
            img.style.transform = `translateY(${offset}px)`;
        });
        ticking = false;
    }
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(aggiornaParallax);
            ticking = true;
        }
    }
    if (parallaxEls.length && !prefersReduced) {
        window.addEventListener('scroll', onScroll, { passive: true });
        aggiornaParallax();
    }

    // --- Rail di progresso ---
    const railButtons = Array.from(document.querySelectorAll('.progress-rail button'));
    const sezioni = railButtons
        .map((btn) => document.getElementById(btn.dataset.target))
        .filter(Boolean);

    railButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        });
    });

    if ('IntersectionObserver' in window && sezioni.length) {
        const railObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = sezioni.indexOf(entry.target);
                    railButtons.forEach((btn, i) => btn.classList.toggle('is-active', i === index));
                }
            });
        }, { threshold: 0.5 });
        sezioni.forEach((sec) => railObserver.observe(sec));
    }
})();
