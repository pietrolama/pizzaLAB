// i18n-engine.js
// Client runtime per l'internazionalizzazione (i18n) di PizzaLab.
// Supporta:
// 1. Traduzione automatica di elementi DOM con data-i18n="chiave"
// 2. Traduzione di attributi con data-i18n-<attr>="chiave" (placeholder, title, alt, aria-label)
// 3. Funzione t('chiave', params) per stringhe generate programmaticamente in JS
// 4. Persistenza preferenza utente in localStorage e fallback a 'it'

const STORAGE_KEY = 'pizzalab_locale';
const SUPPORTED_LOCALES = ['it', 'en'];
const DEFAULT_LOCALE = 'it';

let currentLocale = DEFAULT_LOCALE;
let translations = {};
const loadedLocales = new Map();

/**
 * Ottiene la lingua preferita memorizzata o dal browser.
 */
export function getSavedLocale() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LOCALES.includes(saved)) {
            return saved;
        }
        const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
        if (SUPPORTED_LOCALES.includes(browserLang)) {
            return browserLang;
        }
    } catch (e) {
        // Fallback sicuro se localStorage è bloccato
    }
    return DEFAULT_LOCALE;
}

/**
 * Carica il dizionario JSON per la lingua specificata.
 */
export async function loadLocaleData(locale) {
    if (loadedLocales.has(locale)) {
        return loadedLocales.get(locale);
    }

    try {
        const res = await fetch(`data/i18n/${locale}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        loadedLocales.set(locale, data);
        return data;
    } catch (err) {
        console.warn(`[i18n] Impossibile caricare data/i18n/${locale}.json:`, err.message);
        return {};
    }
}

/**
 * Traduce una singola chiave con eventuale sostituzione di parametri.
 * Esempio: t('timer.ready', { step: 2 }) -> "Passo 2 completato!"
 */
export function t(key, params = {}, fallback = '') {
    let text = translations[key] ?? fallback ?? key;
    if (typeof text !== 'string') return text;

    for (const [paramKey, val] of Object.entries(params)) {
        text = text.replaceAll(`{${paramKey}}`, String(val));
    }
    return text;
}

/**
 * Attraversa il DOM e applica le traduzioni a testi ed attributi marcati.
 */
export function applyTranslations(root = document) {
    if (!root) return;

    // 1. Traduzione del testo degli elementi con data-i18n
    const textNodes = root.querySelectorAll('[data-i18n], [data-i18n-html]');
    textNodes.forEach((el) => {
        const isHtml = el.hasAttribute('data-i18n-html');
        const key = isHtml ? el.getAttribute('data-i18n-html') : el.getAttribute('data-i18n');
        if (key && translations[key] !== undefined) {
            const val = translations[key];
            if (isHtml || /<[a-z][\s\S]*>/i.test(val)) {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        }
    });

    // 2. Traduzione degli attributi con data-i18n-<attr> (es. placeholder, title, alt, aria-label)
    const allElements = root.querySelectorAll('*');
    allElements.forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith('data-i18n-')) {
                const targetAttr = attr.name.slice('data-i18n-'.length);
                const key = attr.value;
                if (key && translations[key] !== undefined) {
                    el.setAttribute(targetAttr, translations[key]);
                }
            }
        }
    });
}

/**
 * Imposta la lingua attiva, carica il dizionario e aggiorna l'UI.
 */
export async function setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
        locale = DEFAULT_LOCALE;
    }

    currentLocale = locale;
    try {
        localStorage.setItem(STORAGE_KEY, locale);
    } catch (e) { }

    document.documentElement.lang = locale;

    if (locale === 'it') {
        // Lingua sorgente: per elementi statici l'HTML contiene già il testo IT,
        // ma carichiamo il dizionario se presente per coerenza JS
        translations = await loadLocaleData('it');
    } else {
        translations = await loadLocaleData(locale);
    }

    applyTranslations();

    // Notifica l'applicazione del cambio lingua (utile per ri-renderizzare grafici o card)
    window.dispatchEvent(new CustomEvent('pizzalab:locale-changed', {
        detail: { locale, translations }
    }));

    aggiornaStatoSelettoreUI(locale);
}

/**
 * Aggiorna i pulsanti o classi del selettore lingua nell'interfaccia.
 */
function aggiornaStatoSelettoreUI(locale) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
        const btnLocale = btn.dataset.lang;
        const isActive = btnLocale === locale;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

/**
 * Inizializzazione al caricamento della pagina.
 */
export async function initI18n() {
    const locale = getSavedLocale();
    await setLocale(locale);

    // Collega i click sui pulsanti selettore lingua presenti nel DOM
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-btn');
        if (btn && btn.dataset.lang) {
            e.preventDefault();
            setLocale(btn.dataset.lang);
        }
    });
}

// Inizializza automaticamente se caricato come modulo nel browser
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initI18n());
    } else {
        initI18n();
    }
}
