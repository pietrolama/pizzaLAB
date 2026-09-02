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

export function generaProcedura({ tipoPizza, tipoImpasto, idratazioneTotale, forzaFarina, dati = {} }) {
    const fascia = trovaFasciaIdratazione(idratazioneTotale);
    const passi = [];
    const avvisi = [];

    const numPanetti = dati.numPanetti || 4;
    const pesoPanetto = dati.pesoPanetto || 250;
    const massa = dati.massa;
    const apretto = dati.apretto;
    const oreFrigo = dati.tempoLievitazioneEffettivo && dati.massa ? (parseFloat(dati.massa) + parseFloat(dati.apretto) < parseFloat(dati.tempoLievitazioneEffettivo) ? 0 : 0) : 0;

    // --- 1. PREFERMENTO (se presente) ---
    if (tipoImpasto === 'biga') {
        passi.push(`Prepara la biga: mescola ${dati.pesoFarinaBiga} g di farina, ${dati.pesoAcquaBiga} g di acqua e ${dati.pesoLievitoBiga} g di lievito fresco. Impasta brevemente fino a ottenere un composto grezzo/sbriciolato (non compatto). Copri e lascia maturare per 16-20 ore a circa 16-18°C.`);
    } else if (tipoImpasto === 'poolish') {
        passi.push(`Prepara il poolish: mescola ${dati.pesoFarinaPoolish} g di farina, ${dati.pesoAcquaPoolish} g di acqua e ${dati.pesoLievitoPoolish} g di lievito fino a formare una pastella liquida e omogenea. Copri e lascia fermentare per 10-12 ore a temperatura ambiente.`);
    } else if (tipoImpasto === 'lievito_madre') {
        passi.push(`Rinfresca il lievito madre con ${dati.farinaRinfresco2 || (dati.pesoPastaMadreFinale * 0.4).toFixed(0)} g di farina e ${dati.acquaRinfresco2 || (dati.pesoPastaMadreFinale * 0.2).toFixed(0)} g di acqua, lasciandolo lievitare fino al triplicamento del volume prima dell'impasto.`);
    } else if (tipoImpasto === 'biga_poolish') {
        passi.push(`Prepara la biga: mescola ${dati.pesoFarinaBiga} g di farina, ${dati.pesoAcquaBiga} g di acqua e ${dati.pesoLievitoBiga} g di lievito. Lascia maturare 16-20 ore a 16-18°C.`);
        passi.push(`Prepara il poolish: mescola ${dati.pesoFarinaPoolish} g di farina, ${dati.pesoAcquaPoolish} g di acqua e ${dati.pesoLievitoPoolish} g di lievito. Lascia fermentare 10-12 ore a temperatura ambiente.`);
    }

    // --- 2. MIXING E INCORDATURA ---
    if (tipoImpasto === 'biga' || tipoImpasto === 'poolish' || tipoImpasto === 'biga_poolish' || tipoImpasto === 'lievito_madre') {
        passi.push('Spezzetta il prefermento nella ciotola (o planetaria) con una prima parte dell\'acqua principale per scioglierlo.');
        passi.push('Aggiungi gradualmente la farina restante, lo zucchero (se previsto) e l\'olio, iniziando a impastare.');
        passi.push('Aggiungi il sale verso fine impasto e versa l\'acqua restante a filo poco alla volta, lavorando fino a completa incordatura.');
    } else {
        // Metodo Diretto in base a idratazione
        switch (fascia) {
            case 'bassa':
            case 'media':
                passi.push('Sciogli il lievito nell\'acqua (tenendone da parte un 10%). Aggiungi gradualmente la farina mescolando, poi unisci il sale, l\'olio e l\'eventuale zucchero.');
                passi.push('Lavora l\'impasto energicamente per 10-15 minuti fino a ottenere una massa liscia, elastica e omogenea.');
                break;
            case 'medio_alta':
                passi.push('Fai autolisi: mescola tutta la farina con circa il 70% dell\'acqua e lascia riposare per 20-30 minuti coperto.');
                passi.push('Aggiungi il lievito sbriciolato e impasta. Una volta formata la struttura iniziale, unisci il sale, l\'olio e l\'acqua restante poco alla volta.');
                break;
            case 'alta':
                passi.push('Fai autolisi: mescola tutta la farina con il 70% dell\'acqua e lascia riposare 30-45 minuti coperto.');
                passi.push('Aggiungi il lievito e inizia a incordare. Versa l\'acqua rimanente a filo molto lentamente (bassinage) solo quando la precedente è ben assorbita, infine incorpora sale e olio.');
                passi.push('Lavora fino a incordatura perfetta: l\'impasto deve risultare liscio, lucido e staccarsi completamente dalle pareti della ciotola.');
                break;
            case 'molto_alta':
            case 'estrema':
                passi.push('Fai autolisi: mescola la farina con il 60-65% dell\'acqua e lascia riposare 45-60 minuti.');
                passi.push('Aggiungi il lievito e incorda ad alta velocità (consigliata planetaria/spirale). Aggiungi l\'acqua restante a filo in 3-4 riprese, seguita da sale e olio a fine impasto.');
                passi.push('Esegui una o due serie di pieghe di rinforzo (slap & fold o in ciotola) a intervalli di 15-20 minuti per dare struttura alla maglia glutinica.');
                break;
        }
    }

    // --- CONTROLLO TEMPERATURA ---
    if (fascia === 'alta' || fascia === 'molto_alta' || fascia === 'estrema') {
        passi.push('Fai attenzione alla temperatura finale dell\'impasto (ideale 23-25°C): con alte idratazioni usa acqua fredda di frigorifero se necessario.');
    }

    // --- 3. PRIMA LIEVITAZIONE (PUNTATA / MASSA) ---
    if (massa && parseFloat(massa) > 0) {
        passi.push(`Forma una palla liscia, trasferiscila in un contenitore leggermente unto e copri bene: lascia riposare l'impasto in massa per circa ${massa} ora/e.`);
    } else {
        passi.push('Forma una palla liscia, copri a campana e lascia riposare la massa coperta per circa 45-60 minuti a temperatura ambiente (puntata).');
    }

    // --- 4. STAGLIO E APPRETTO (FORMATURA E SECONDA LIEVITAZIONE) ---
    if (tipoPizza === 'pala') {
        passi.push(`Staglio: rovescia l'impasto sul banco, dividilo in ${numPanetti} porzione/i da ${pesoPanetto} g e forma dei filoncini allungati chiudendo delicatamente i lembi.`);
    } else if (tipoPizza === 'teglia') {
        passi.push(`Staglio: dividi l'impasto in ${numPanetti} panetto/i da ${pesoPanetto} g, fai una piega a tre e arrotonda delicatamente.`);
    } else if (tipoPizza === 'padellino') {
        passi.push(`Staglio: dividi in ${numPanetti} panetto/i da ${pesoPanetto} g, forma delle palline ben tese e posizionale direttamente nei padellini generosamente unti d'olio.`);
    } else {
        passi.push(`Staglio: dividi l'impasto in ${numPanetti} panetti da ${pesoPanetto} g ciascuno, pirlando delicatamente ogni pallina per chiudere bene il fondo.`);
    }

    if (apretto && parseFloat(apretto) > 0) {
        passi.push(`Appretto: riponi i panetti nell'apposita cassetta per pizza (o contenitori ermetici) e lascia lievitare per circa ${apretto} ora/e fino al raddoppio.`);
    } else {
        passi.push('Appretto: riponi i panetti coperti in un luogo riparato a temperatura ambiente fino al raddoppio del volume (circa 4-6 ore a seconda della temperatura).');
    }

    // --- 5. STESURA E COTTURA SPECIFICA PER TIPOLOGIA ---
    switch (tipoPizza) {
        case 'napoletana':
            passi.push('Stesura: stendi delicatamente su semola rimacinata spingendo i gas dal centro verso il cornicione esterno con i polpastrelli, senza mai schiacciare il bordo.');
            passi.push('Cottura: inforna nel fornetto per pizza a 450-480°C per 60-90 secondi, oppure in forno domestico statico alla massima temperatura (250-300°C) su pietra refrattaria preriscaldata nella parte più alta per 4-6 minuti.');
            break;
        case 'contemporanea':
            passi.push('Stesura: allarga il panetto su abbondante semola preservando un cornicione pronunciato (2-3 cm) senza toccarlo.');
            passi.push('Cottura: cuoci a 400-430°C per circa 90-120 secondi per ottenere un cornicione alveolato e leggero, oppure in forno domestico al massimo su pietra refrattaria per 5-7 minuti.');
            break;
        case 'romana':
            passi.push('Stesura: stendi il panetto molto sottile fino al bordo (puoi aiutarti con il mattarello per la tipica pizza tonda romana scrocchiarella).');
            passi.push('Cottura: inforna a 250-300°C per 6-8 minuti fino a quando la base non è dorata, asciutta e marcatamente croccante.');
            break;
        case 'pala':
            passi.push('Stesura: stendi il filoncino spolverato di semola allungandolo delicatamente con le dita e trasferiscilo sulla pala da infornare.');
            passi.push('Cottura: inforna direttamente su pietra refrattaria a 280-300°C per 7-10 minuti fino a renderla croccante fuori e morbida dentro.');
            break;
        case 'teglia':
            passi.push('Stesura: stendi l\'impasto su piano spolverato di semola, allargalo uniformemente fino alle dimensioni della teglia e trasferiscilo nella teglia unta con un filo d\'olio.');
            passi.push('Cottura: inforna nella parte bassa del forno a 250°C per 10-12 minuti con solo pomodoro/base, poi sposta al centro/alto per altri 4-6 minuti dopo aver aggiunto la mozzarella.');
            break;
        case 'padellino':
            passi.push('Stesura: allarga l\'impasto con la punta delle dita direttamente all\'interno del padellino fino a coprire tutta la superficie.');
            passi.push('Cottura: inforna a 230-250°C per 10-14 minuti fino a ottenere una base croccante e fritta nell\'olio con interno soffice e alto.');
            break;
        default:
            passi.push('Stesura: stendi i panetti delicatamente secondo la preferenza.');
            passi.push('Cottura: cuoci in forno ben preriscaldato alla massima temperatura disponibile.');
            break;
    }

    // --- 6. AVVISI TECNICI ---
    if (fascia === 'estrema') {
        avvisi.push('Oltre l\'85% di idratazione i benefici concreti per la pizza (rispetto all\'80%) sono limitati: è una scelta tecnica impegnativa che richiede manualità esperta.');
    }

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
