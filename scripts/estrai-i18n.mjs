#!/usr/bin/env node
// estrai-i18n.mjs
// Scansiona tutte le pagine HTML del sito e ricostruisce
// data/i18n/it.json: il dizionario "chiave -> testo italiano" usato come
// sorgente per la traduzione automatica (vedi traduci-contenuti.mjs).
//
// Convenzione attesa nell'HTML (da allineare con chi genera l'interfaccia
// di cambio lingua):
//   - testo:     <tag data-i18n="chiave">Testo in italiano</tag>
//   - attributi: <tag data-i18n-placeholder="chiave" placeholder="Testo">
//                (funziona per qualunque attributo: data-i18n-<attr>="chiave"
//                 + <attr>="valore" sullo stesso tag, es. title, alt, aria-label)
//
// Le chiavi non più presenti nell'HTML vengono rimosse dal dizionario: è
// rigenerato da zero ad ogni esecuzione, l'HTML resta l'unica fonte di
// verità per il testo italiano.

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';

const RADICE = new URL('..', import.meta.url).pathname;
const DEST = 'data/i18n/it.json';

async function elencaPagineHtml() {
    const voci = await readdir(RADICE, { withFileTypes: true });
    return voci
        .filter((v) => v.isFile() && v.name.endsWith('.html'))
        .map((v) => v.name);
}

function decodificaEntitaBase(testo) {
    return testo
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

function estraiTesti(html, pagina, dizionario, conflitti) {
    // <tag ... data-i18n="chiave" ...>testo</tag>
    // Assume che l'elemento marcato non contenga a sua volta un altro
    // elemento con lo stesso nome di tag annidato (limite accettabile per
    // testo semplice: titoli, paragrafi, label, bottoni, voci di menu).
    const re = /<([a-zA-Z][\w-]*)\b([^>]*)\bdata-i18n(?:-html)?="([\w.-]+)"([^>]*)>([\s\S]*?)<\/\1>/g;
    let m;
    while ((m = re.exec(html))) {
        const [, , , chiave, , contenutoRaw] = m;
        const hasInlineTags = /<(?:em|strong|br|b|i|span)\b[^>]*>/i.test(contenutoRaw);
        const testo = hasInlineTags
            ? decodificaEntitaBase(contenutoRaw.trim().replace(/\r?\n\s*/g, ''))
            : decodificaEntitaBase(contenutoRaw.replace(/<[^>]+>/g, '').trim());
        if (!testo) continue;
        if (dizionario[chiave] && dizionario[chiave] !== testo) {
            conflitti.push(`"${chiave}" ha testi diversi tra pagine (es. in ${pagina}: "${testo}" vs "${dizionario[chiave]}")`);
        }
        dizionario[chiave] = testo;
    }
}

function estraiAttributi(html, pagina, dizionario, conflitti) {
    // <tag ... data-i18n-<attr>="chiave" ... <attr>="valore" ...>
    const tagRe = /<[a-zA-Z][\w-]*\b[^>]*>/g;
    let tagMatch;
    while ((tagMatch = tagRe.exec(html))) {
        const tag = tagMatch[0];
        const marcaRe = /data-i18n-([\w-]+)="([\w.-]+)"/g;
        let marcaMatch;
        while ((marcaMatch = marcaRe.exec(tag))) {
            const [, attr, chiave] = marcaMatch;
            // Il prefisso deve essere inizio-tag o spazio, non un trattino:
            // altrimenti "data-i18n-placeholder=" matcherebbe se stesso
            // quando attr="placeholder" (dopo "-" scatta comunque un \b).
            const valoreRe = new RegExp(`(?:^|\\s)${attr}="([^"]*)"`);
            const valoreMatch = tag.match(valoreRe);
            if (!valoreMatch) continue;
            const testo = decodificaEntitaBase(valoreMatch[1].trim());
            if (!testo) continue;
            if (dizionario[chiave] && dizionario[chiave] !== testo) {
                conflitti.push(`"${chiave}" ha testi diversi tra pagine (es. in ${pagina}: "${testo}" vs "${dizionario[chiave]}")`);
            }
            dizionario[chiave] = testo;
        }
    }
}

const pagine = await elencaPagineHtml();
const dizionario = {};
const conflitti = [];

for (const pagina of pagine) {
    const html = await readFile(new URL(pagina, `file://${RADICE}`), 'utf8');
    estraiTesti(html, pagina, dizionario, conflitti);
    estraiAttributi(html, pagina, dizionario, conflitti);
}

if (conflitti.length > 0) {
    console.warn('Attenzione: chiavi data-i18n con testo diverso in pagine diverse (vince l\'ultima trovata):');
    for (const c of conflitti) console.warn(`  - ${c}`);
}

await mkdir('data/i18n', { recursive: true });
const chiaviOrdinate = Object.keys(dizionario).sort();
const dizionarioOrdinato = Object.fromEntries(chiaviOrdinate.map((k) => [k, dizionario[k]]));

await writeFile(DEST, JSON.stringify(dizionarioOrdinato, null, 4) + '\n', 'utf8');
console.log(`${DEST}: ${chiaviOrdinate.length} chiavi estratte da ${pagine.length} pagine.`);
