// calendar-export.js
// Genera ed esporta file .ics (iCalendar) per Google Calendar, Apple Calendar e Outlook.

export function formatICSDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

export function generaTestoICS(timelineEvents, recipeTitle = 'PizzaLab Impasto') {
    if (!timelineEvents || timelineEvents.length === 0) {
        return '';
    }

    const titleStr = typeof recipeTitle === 'object' 
        ? `${recipeTitle.tipoPizza || 'Pizza'} (${recipeTitle.tipoImpasto || 'Diretto'})` 
        : String(recipeTitle);

    const nowStr = formatICSDate(new Date());
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PizzaLab//Tabella di Marcia Impasto//IT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    timelineEvents.forEach((ev, idx) => {
        const start = ev.time instanceof Date ? ev.time : (ev.dateObj instanceof Date ? ev.dateObj : new Date());
        const end = new Date(start.getTime() + (ev.durationMinutes || 30) * 60000);
        const actionTitle = ev.action || ev.title || 'Passaggio impasto';
        const uid = `pizzalab-${Date.now()}-${idx}@pizzalab.pizza`;

        icsContent.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${nowStr}`,
            `DTSTART:${formatICSDate(start)}`,
            `DTEND:${formatICSDate(end)}`,
            `SUMMARY:🍕 PizzaLab [${titleStr}]: ${actionTitle}`,
            `DESCRIPTION:${(actionTitle || '').replace(/\n/g, '\\n')}\\n\\nRicetta: ${titleStr}\\nCalcolato su https://pizzalab.pizza`,
            'STATUS:CONFIRMED',
            // Allarme notifica 10 minuti prima
            'BEGIN:VALARM',
            'TRIGGER:-PT10M',
            'ACTION:DISPLAY',
            `DESCRIPTION:Promemoria PizzaLab: ${actionTitle}`,
            'END:VALARM',
            'END:VEVENT'
        );
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
}

export function esportaCalendarioICS(timelineEvents, recipeTitle = 'PizzaLab Impasto') {
    const icsString = generaTestoICS(timelineEvents, recipeTitle);
    if (!icsString) {
        alert('Nessun evento disponibile nella tabella di marcia.');
        return;
    }

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pizzalab-programma-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
