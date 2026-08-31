// procedura-engine.js
// Genera il procedimento dell'impasto in base ai parametri reali (idratazione,
// forza della farina), invece di un testo fisso per tipo di pizza. Funzione
// pura, nessuna dipendenza dal DOM: { idratazioneTotale, forzaFarina } ->
// { passi: string[], avvisi: string[] }.
//
// Le pieghe di rinforzo NON sono una conseguenza automatica dell'idratazione:
// restano una scelta stilistica libera, tranne un'unica piega facoltativa
// oltre l'80%, utile solo a evitare il collasso dell'impasto in massa.

// Soglie di idratazione (percentuale panificatoria sul peso della farina).
const FASCE_IDRATAZIONE = [
    { max: 60, id: 'bassa' },
    { max: 70, id: 'media' },
    { max: 75, id: 'medio_alta' },
    { max: 80, id: 'alta' },
    { max: 85, id: 'molto_alta' },
    { max: Infinity, id: 'estrema' },
];

// W minimo consigliato per sostenere quella fascia di idratazione.
const W_MINIMO_PER_FASCIA = {
    bassa: 180,
    media: 220,
    medio_alta: 260,
    alta: 280,
    molto_alta: 300,
    estrema: 340,
};

function trovaFasciaIdratazione(idratazioneTotale) {
    return FASCE_IDRATAZIONE.find((f) => idratazioneTotale < f.max).id;
}

export function generaProcedura({ idratazioneTotale, forzaFarina }) {
    const fascia = trovaFasciaIdratazione(idratazioneTotale);
    const passi = [];
    const avvisi = [];

    // --- Mixing e incordatura ---
    switch (fascia) {
        case 'bassa':
        case 'media':
            passi.push('Versa l\'acqua nella ciotola, aggiungi la farina gradualmente mescolando, poi il lievito. Impasta fino a ottenere un composto liscio e omogeneo.');
            break;
        case 'medio_alta':
            passi.push('Fai autolisi: mescola farina e circa il 70% dell\'acqua, lascia riposare 20-30 minuti. Aggiungi poi il lievito, l\'acqua restante e il sale.');
            passi.push('Aggiungi il sale solo dopo che l\'impasto ha iniziato a formare una maglia glutinica, non subito insieme agli altri ingredienti.');
            break;
        case 'alta':
            passi.push('Fai autolisi: mescola farina e circa il 70% dell\'acqua, lascia riposare 30-45 minuti prima di aggiungere lievito e sale.');
            passi.push('Aggiungi l\'acqua restante a filo, poco alla volta (bassinage), solo dopo che la parte precedente è ben incordata.');
            passi.push('Lavora l\'impasto fino a incordatura completa: deve risultare liscio, elastico, che si stacca dalle pareti della ciotola.');
            break;
        case 'molto_alta':
            passi.push('Fai autolisi: mescola farina e circa il 65% dell\'acqua, lascia riposare 45-60 minuti prima di aggiungere lievito e sale.');
            passi.push('Aggiungi l\'acqua restante a filo, in più riprese (bassinage), solo dopo che la parte precedente è ben incordata.');
            passi.push('Lavora fino a incordatura completa. Con questa idratazione, una planetaria o impastatrice a spirale rende il lavoro molto più gestibile di un impasto a mano.');
            passi.push('Puoi eseguire un\'unica piega di rinforzo subito dopo l\'incordatura, prima della puntata: aiuta a evitare che l\'impasto collassi in massa. Non è necessario ripeterla.');
            break;
        case 'estrema':
            passi.push('Fai autolisi lunga (60 minuti) con circa il 60% dell\'acqua, poi aggiungi lievito e sale.');
            passi.push('Aggiungi l\'acqua restante in almeno 3 riprese (bassinage), sempre dopo che la parte precedente è ben incordata.');
            passi.push('Un\'impastatrice è praticamente necessaria a questa idratazione: a mano il rischio di non raggiungere una struttura sufficiente è alto.');
            break;
    }

    // --- Temperatura ---
    if (fascia === 'medio_alta') {
        passi.push('Tieni sotto controllo la temperatura dell\'impasto durante mixing e puntata: con questa idratazione un impasto troppo caldo diventa rapidamente appiccicoso e difficile da gestire.');
    } else if (fascia === 'alta') {
        passi.push('Calcola la temperatura dell\'acqua di impasto per ottenere un impasto finale intorno ai 24-26°C, e monitora la temperatura in ogni fase: mixing, puntata e formatura.');
    } else if (fascia === 'molto_alta' || fascia === 'estrema') {
        passi.push('A questa idratazione la temperatura è il fattore più critico di tutti: calcola l\'acqua di impasto per centrare la temperatura target e mantienila sotto controllo in ogni fase, dal mixing alla formatura.');
    }

    if (fascia === 'estrema') {
        avvisi.push('Oltre l\'85% di idratazione i benefici concreti per la pizza (rispetto all\'80%) sono limitati: è una scelta stilistica più che una necessità tecnica.');
    }

    // --- Controllo forza farina ---
    const wMinimo = W_MINIMO_PER_FASCIA[fascia];
    if (forzaFarina && forzaFarina < wMinimo) {
        const scarto = wMinimo - forzaFarina;
        if (scarto <= 30) {
            avvisi.push(`La farina scelta (W ${forzaFarina}) è leggermente sotto il W consigliato (~${wMinimo}) per questa idratazione: l'impasto sarà probabilmente meno estensibile del previsto.`);
        } else if (scarto <= 80) {
            avvisi.push(`La farina scelta (W ${forzaFarina}) è sotto il W consigliato (~${wMinimo}) per questa idratazione. Valuta di scendere di idratazione o di usare una farina più forte.`);
        } else {
            avvisi.push(`La farina scelta (W ${forzaFarina}) è molto sotto il W consigliato (~${wMinimo}) per questa idratazione: il rischio concreto è un impasto sfaldato, non solo "più difficile" da lavorare.`);
        }
    }

    return { passi, avvisi };
}
