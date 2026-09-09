// scripts/genera-faq-jsonld.mjs
// Riscrive il blocco FAQPage dei dati strutturati a partire dalle FAQ
// realmente visibili nella pagina.
//
// Perché serve. Lo stesso testo viveva in quattro copie — JSON-LD, HTML
// visibile e i due dizionari — e stava già divergendo: in calcolatore.html i
// dati strutturati dichiaravano una domanda sull'idratazione che sulla pagina
// non esisteva, e ne omettevano una sulla teglia che invece c'era; in
// prefermenti_e_farine.html tutte e tre le FAQ dichiarate erano invisibili.
//
// Google chiede che il contenuto delle FAQ sia visibile sulla pagina: dati
// strutturati che non corrispondono possono far perdere il risultato
// arricchito e, nei casi peggiori, portare a un'azione manuale.
//
// Qui la fonte di verità è ciò che il visitatore legge davvero: si raccolgono
// gli attributi data-i18n delle domande e risposte presenti nel markup, si
// risolvono sul dizionario italiano e si riscrive il JSON-LD di conseguenza.
//
// Si esegue con:  npm run genera-faq
// Il test test/coerenza-testi.test.mjs fallisce se qualcuno modifica una FAQ
// senza rilanciarlo.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RADICE = fileURLToPath(new URL('../', import.meta.url));
const PAGINE = ['calcolatore.html', 'prefermenti_e_farine.html'];

const dizionario = JSON.parse(
    fs.readFileSync(path.join(RADICE, 'data/i18n/it.json'), 'utf8'),
);

/**
 * Estrae le coppie domanda/risposta dal markup visibile.
 * Cerca gli elementi con data-i18n="<prefisso>faqN_q" e la risposta con lo
 * stesso indice, così l'ordine e il numero seguono quelli della pagina.
 */
export function faqVisibili(html) {
    const chiaviDomande = [...html.matchAll(/data-i18n="([\w.]*faq(\d+)_q)"/g)];

    return chiaviDomande.map(([, chiaveDomanda, indice]) => {
        const chiaveRisposta = chiaveDomanda.replace(/_q$/, '_a');
        const domanda = dizionario[chiaveDomanda];
        const risposta = dizionario[chiaveRisposta];

        if (!domanda || !risposta) {
            throw new Error(
                `FAQ ${indice}: manca ${!domanda ? chiaveDomanda : chiaveRisposta} nel dizionario italiano`,
            );
        }
        return { domanda, risposta };
    });
}

function bloccoFAQPage(voci) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: voci.map(({ domanda, risposta }) => ({
            '@type': 'Question',
            name: domanda,
            acceptedAnswer: { '@type': 'Answer', text: risposta },
        })),
    };
}

/** Riscrive i dati strutturati delle pagine indicate. */
export function generaTutto() {
    let modificate = 0;

    for (const nomePagina of PAGINE) {
        const percorso = path.join(RADICE, nomePagina);
        const html = fs.readFileSync(percorso, 'utf8');

        const blocco = html.match(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/);
        if (!blocco) {
            console.log(`  ${nomePagina}: nessun blocco di dati strutturati, saltata`);
            continue;
        }

        const voci = faqVisibili(html);
        if (voci.length === 0) {
            console.log(`  ${nomePagina}: nessuna FAQ visibile, saltata`);
            continue;
        }

        const dati = JSON.parse(blocco[2]);
        const elenco = Array.isArray(dati) ? dati : [dati];
        const indiceFaq = elenco.findIndex((x) => x['@type'] === 'FAQPage');

        const nuovoFaq = bloccoFAQPage(voci);
        if (indiceFaq >= 0) elenco[indiceFaq] = nuovoFaq;
        else elenco.push(nuovoFaq);

        const risultato = Array.isArray(dati) ? elenco : elenco[0];
        const serializzato = `\n    ${JSON.stringify(risultato, null, 2).split('\n').join('\n    ')}\n    `;

        const nuovoHtml = html.replace(blocco[0], `${blocco[1]}${serializzato}${blocco[3]}`);
        if (nuovoHtml !== html) {
            fs.writeFileSync(percorso, nuovoHtml);
            modificate++;
        }
        console.log(`  ${nomePagina}: ${voci.length} FAQ allineate ai contenuti visibili`);
    }

    console.log(modificate === 0
        ? '\nNessuna modifica: i dati strutturati erano gia allineati.'
        : `\n${modificate} pagine aggiornate.`);
    return modificate;
}

// Il modulo esporta faqVisibili perche' il test la riusa: la scrittura dei file
// deve avvenire solo quando lo script e' lanciato direttamente, altrimenti
// importarlo da un test rigenererebbe l'HTML e il test non potrebbe fallire.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    generaTutto();
}
