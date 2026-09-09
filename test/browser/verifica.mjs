// test/browser/verifica.mjs
// Carica ogni pagina in un browser vero e fallisce se qualcosa non va.
//
// Copre la classe di difetti che l'analisi statica non vede: moduli che non si
// caricano, contratti disallineati fra file, elementi che sbordano dal
// viewport. In questo progetto ne ha trovati sette, fra cui tre che rendevano
// una pagina intera inutilizzabile.
//
// Si esegue con:  npm run verifica

import { avviaServer, avviaBrowser, ORIGINE } from './avvia.mjs';
import { apriPronta, attendi, problemi } from './cdp.mjs';

const PAGINE = [
    'index.html', 'calcolatore.html', 'tipi-di-pizza.html', 'prefermenti_e_farine.html',
    'assistente.html', 'diario.html', 'simulator.html', 'scienza.html',
    'shop.html', 'contatti.html', 'privacy.html',
];

// Larghezze scelte per coprire i punti dove il layout è già stato rotto:
// 320 e 360 per i telefoni stretti, 1280 per il monitor su cui il selettore
// lingua è finito tagliato, 1151 e 1150 per i due lati del breakpoint.
const LARGHEZZE = [320, 360, 768, 1024, 1150, 1151, 1280, 1600];

let fallimenti = 0;

function esito(ok, etichetta, dettaglio = '') {
    if (!ok) fallimenti++;
    console.log(`  ${ok ? '✓' : '✗'} ${etichetta}${dettaglio ? `  ${dettaglio}` : ''}`);
}

async function verificaErroriRuntime() {
    console.log('\nErrori di runtime su ogni pagina');
    for (const pagina of PAGINE) {
        const { s, valuta } = await apriPronta(`${ORIGINE}/${pagina}`);
        // Dà tempo ai moduli di completare le fetch iniziali.
        await new Promise((r) => setTimeout(r, 1200));
        await valuta('1');
        const { errori, rete } = problemi(s, { origine: ORIGINE });
        esito(errori.length === 0 && rete.length === 0, pagina.padEnd(28),
            [...errori, ...rete].slice(0, 3).join(' | '));
        await s.chiudi();
    }
}

async function verificaLayout() {
    console.log('\nLayout: niente deve sbordare dal viewport');
    const { s, valuta } = await apriPronta(`${ORIGINE}/index.html`);

    for (const larghezza of LARGHEZZE) {
        await s.invia('Emulation.setDeviceMetricsOverride',
            { width: larghezza, height: 800, deviceScaleFactor: 1, mobile: larghezza < 768 });
        await new Promise((r) => setTimeout(r, 450));

        const diagnosi = await valuta(`(function () {
            var contenitore = document.querySelector('.nav-container').getBoundingClientRect();
            var lingua = document.querySelector('.lang-switch-container');
            var guasti = [];

            if (lingua) {
                var l = lingua.getBoundingClientRect();
                if (l.right > contenitore.right + 1) guasti.push('selettore lingua tagliato di ' + Math.round(l.right - contenitore.right) + 'px');
            }
            var marchio = document.querySelector('.nav-brand');
            if (marchio.scrollWidth > Math.ceil(marchio.getBoundingClientRect().width)) {
                guasti.push('il marchio sborda dal proprio box');
            }
            var scorrimento = document.documentElement.scrollWidth - window.innerWidth;
            if (scorrimento > 1) guasti.push('scorrimento orizzontale di ' + scorrimento + 'px');

            return guasti.join(' | ');
        })()`);

        esito(diagnosi === '', `${String(larghezza).padStart(4)}px`, diagnosi);
    }
    await s.chiudi();
}

async function verificaCalcolatore() {
    console.log('\nCalcolatore: il flusso principale produce una ricetta corretta');
    const { s, valuta } = await apriPronta(`${ORIGINE}/calcolatore.html`);
    await attendi(valuta, "document.querySelector('#troubleshoot-cards-container').children.length>0",
        { etichetta: 'inizializzazione degli strumenti' });

    await valuta(`(function () {
        document.getElementById('peso_panetto_diretto').value = 250;
        document.getElementById('num_panetti_diretto').value = 4;
        document.getElementById('idratazione_totale_diretto').value = 65;
        document.getElementById('calcola-button').click();
    })()`);
    await new Promise((r) => setTimeout(r, 900));

    const somma = await valuta(`(function () {
        function g(n) { var e = document.getElementById('res-' + n); return e ? parseFloat(e.textContent) || 0 : 0; }
        return g('farina') + g('acqua') + g('sale') + g('zucchero') + g('olio');
    })()`);
    esito(Math.abs(somma - 1000) <= 2, 'bilancio di massa', `${somma} g su 1000 richiesti`);

    const sporco = await valuta("/NaN|Infinity|undefined/.test(document.getElementById('risultato').textContent)");
    esito(sporco === false, 'nessun NaN o Infinity a schermo');

    // Un input impossibile deve bloccare, non produrre numeri negativi.
    await valuta(`(function () {
        var m = document.getElementById('tipo_pizza'); m.value = 'contemporanea'; m.dispatchEvent(new Event('change'));
    })()`);
    await new Promise((r) => setTimeout(r, 400));
    await valuta(`(function () {
        var m = document.getElementById('tipo_impasto'); m.value = 'poolish'; m.dispatchEvent(new Event('change'));
    })()`);
    await new Promise((r) => setTimeout(r, 500));
    await valuta(`(function () {
        document.getElementById('idratazione_totale_poolish').value = 60;
        document.getElementById('percentuale_poolish').value = 80;
        document.getElementById('calcola-button').click();
    })()`);
    await new Promise((r) => setTimeout(r, 700));
    const bloccato = await valuta("!document.getElementById('validazione-messaggi').hidden");
    esito(bloccato === true, 'input impossibile bloccato', 'poolish 80% con idratazione 60%');

    await s.chiudi();
}

async function verificaTastiera() {
    console.log('\nTastiera: il menu deve essere utilizzabile senza mouse');
    const { s, valuta } = await apriPronta(`${ORIGINE}/index.html`);
    await s.invia('Emulation.setFocusEmulationEnabled', { enabled: true });
    await s.invia('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 600));

    const premi = async (key, code, vk, text) => {
        await s.invia('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text, unmodifiedText: text });
        await s.invia('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
        await new Promise((r) => setTimeout(r, 300));
    };

    esito(await valuta("document.querySelector('.hamburger').tagName") === 'BUTTON',
        'l\'hamburger è un <button>');

    await valuta("document.querySelector('.hamburger').focus()");
    await premi('Enter', 'Enter', 13, '\r');
    esito(await valuta("document.querySelector('.nav-links').classList.contains('active')") === true,
        'Invio apre il menu');
    esito(await valuta("document.querySelector('.hamburger').getAttribute('aria-expanded')") === 'true',
        'aria-expanded riflette lo stato');

    await premi('Escape', 'Escape', 27);
    esito(await valuta("document.querySelector('.nav-links').classList.contains('active')") === false,
        'Escape chiude il menu');
    esito(await valuta("document.activeElement.classList.contains('hamburger')") === true,
        'il fuoco torna sul pulsante');

    await s.chiudi();
}

const server = await avviaServer();
const { processo, eseguibile } = await avviaBrowser();
console.log(`Browser: ${eseguibile}\nServer:  ${ORIGINE}`);

try {
    await verificaErroriRuntime();
    await verificaLayout();
    await verificaCalcolatore();
    await verificaTastiera();
} catch (e) {
    console.error(`\n✗ la verifica si è interrotta: ${e.message}`);
    fallimenti++;
} finally {
    processo.kill('SIGKILL');
    server.close();
}

console.log(fallimenti === 0
    ? '\nTutti i controlli superati.'
    : `\n${fallimenti} controlli falliti.`);
process.exit(fallimenti === 0 ? 0 : 1);
