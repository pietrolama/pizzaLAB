// calendar-export.js
// Genera ed esporta file .ics (iCalendar) per Google Calendar, Apple Calendar e Outlook.
import { getSavedLocale } from './i18n-engine.js';

export function formatICSDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

/**
 * Applica l'escaping richiesto da RFC 5545 ai valori di tipo TEXT.
 * Senza questo, una virgola o un punto e virgola nel testo di un passaggio
 * viene interpretata come separatore di valori e il client tronca il campo
 * (i passaggi della procedura ne contengono spesso).
 * L'ordine conta: la barra rovesciata va sostituita per prima.
 */
export function escapeICSText(valore) {
    return String(valore ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Ripiega una riga oltre i 75 ottetti come prescritto da RFC 5545: CRLF seguito
 * da uno spazio. Il conteggio è in byte UTF-8, non in caratteri, e il taglio non
 * deve cadere in mezzo a una sequenza multi-byte (le emoji ne occupano quattro).
 */
export function foldICSLine(riga) {
    const LIMITE = 75;
    if (new TextEncoder().encode(riga).length <= LIMITE) return riga;

    const parti = [];
    let corrente = '';
    let ottetti = 0;
    // Itera per punti di codice: [...stringa] non spezza le coppie surrogate.
    for (const carattere of riga) {
        const dim = new TextEncoder().encode(carattere).length;
        // Dalla seconda riga in poi lo spazio iniziale occupa un ottetto.
        const massimo = parti.length === 0 ? LIMITE : LIMITE - 1;
        if (ottetti + dim > massimo) {
            parti.push(corrente);
            corrente = '';
            ottetti = 0;
        }
        corrente += carattere;
        ottetti += dim;
    }
    if (corrente) parti.push(corrente);

    return parti.join('\r\n ');
}

export function generaTestoICS(timelineEvents, recipeTitle = 'PizzaLab Impasto') {
    if (!timelineEvents || timelineEvents.length === 0) {
        return '';
    }

    const isEn = getSavedLocale() === 'en';
    const titleStr = typeof recipeTitle === 'object' 
        ? `${recipeTitle.tipoPizza || 'Pizza'} (${recipeTitle.tipoImpasto || 'Diretto'})` 
        : String(recipeTitle);

    const nowStr = formatICSDate(new Date());
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:-//PizzaLab//${isEn ? 'Dough Schedule' : 'Tabella di Marcia Impasto'}//${isEn ? 'EN' : 'IT'}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    timelineEvents.forEach((ev, idx) => {
        const start = ev.time instanceof Date ? ev.time : (ev.dateObj instanceof Date ? ev.dateObj : new Date());
        const end = new Date(start.getTime() + (ev.durationMinutes || 30) * 60000);
        const actionTitle = ev.action || ev.title || (isEn ? 'Dough step' : 'Passaggio impasto');
        const uid = `pizzalab-${Date.now()}-${idx}@pizzalab.pizza`;

        const titoloEsc = escapeICSText(titleStr);
        const azioneEsc = escapeICSText(actionTitle);
        const descrizione = [
            azioneEsc,
            '',
            `${isEn ? 'Recipe' : 'Ricetta'}: ${titoloEsc}`,
            `${isEn ? 'Calculated on' : 'Calcolato su'} https://pizzalab.pizza`,
        ].join('\\n');

        icsContent.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${nowStr}`,
            `DTSTART:${formatICSDate(start)}`,
            `DTEND:${formatICSDate(end)}`,
            `SUMMARY:🍕 PizzaLab [${titoloEsc}]: ${azioneEsc}`,
            `DESCRIPTION:${descrizione}`,
            'STATUS:CONFIRMED',
            // Allarme notifica 10 minuti prima
            'BEGIN:VALARM',
            'TRIGGER:-PT10M',
            'ACTION:DISPLAY',
            `DESCRIPTION:${escapeICSText(isEn ? 'PizzaLab Reminder' : 'Promemoria PizzaLab')}: ${azioneEsc}`,
            'END:VALARM',
            'END:VEVENT'
        );
    });

    icsContent.push('END:VCALENDAR');
    // Il folding va applicato per ultimo, sulle righe già complete.
    return icsContent.map(foldICSLine).join('\r\n');
}

export function esportaCalendarioICS(timelineEvents, recipeTitle = 'PizzaLab Impasto') {
    const isEn = getSavedLocale() === 'en';
    const icsString = generaTestoICS(timelineEvents, recipeTitle);
    if (!icsString) {
        alert(isEn ? 'No schedule events available to export.' : 'Nessun evento disponibile nella tabella di marcia.');
        return;
    }

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pizzalab-${isEn ? 'schedule' : 'programma'}-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
