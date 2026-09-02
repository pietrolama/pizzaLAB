// tools-engine.js
// Modulo logico puro per PizzaLab:
// 1. Calcolatore Condimenti / Topping (densità superficiale per pizza tonda o teglia)
// 2. Calcolo Temperatura Acqua FDT (Fattore Temperatura Finale Desiderata)
// 3. Guida e Parametri di Setup Forni

/**
 * Calcola i grammi esatti di condimento in base alla superficie e al tipo di farcitura.
 * 
 * @param {Object} params
 * @param {'tonda'|'teglia'} params.forma - Forma della pizza
 * @param {number} [params.diametro=30] - Diametro in cm per tonda
 * @param {number} [params.base=40] - Base in cm per teglia
 * @param {number} [params.altezza=60] - Altezza in cm per teglia
 * @param {'margherita'|'marinara'|'quattro_formaggi'|'focaccia'|'capricciosa'} [params.farcitura='margherita']
 * 
 * @returns {{ areaCm2: number, condimenti: Array<{ nome: string, quantitaG: number, unita: string, note: string }> }}
 */
export function calcolaCondimenti({
    forma = 'tonda',
    diametro = 30,
    base = 40,
    altezza = 60,
    farcitura = 'margherita'
}) {
    let areaCm2 = 0;
    if (forma === 'tonda') {
        const raggio = (Number(diametro) || 30) / 2;
        areaCm2 = Math.PI * raggio * raggio;
    } else {
        areaCm2 = (Number(base) || 40) * (Number(altezza) || 60);
    }

    // Densità superficiali standard (g/cm2)
    // Riferimento tonda standard 30cm (area ~706 cm2): ~85g salsa, ~95g mozzarella
    const condensita = {
        margherita: [
            { nome: 'Salsa di Pomodoro', densita: 0.12, note: 'Polpa fine o pelati schiacciati a mano' },
            { nome: 'Fiordilatte / Mozzarella', densita: 0.135, note: 'Tagliata a listarelle e ben scolata' },
            { nome: 'Olio EVO', densita: 0.008, note: 'Un filo a spirale in uscita' },
            { nome: 'Parmigiano / Pecorino', densita: 0.007, note: 'Grattugiato fine' },
            { nome: 'Basilico fresco', densita: 0, fisso: '3-5 foglie', note: 'In cottura o a crudo' }
        ],
        marinara: [
            { nome: 'Salsa di Pomodoro', densita: 0.14, note: 'Leggermente più generosa rispetto alla Margherita' },
            { nome: 'Aglio a lamelle', densita: 0, fisso: '1-2 spicchi', note: 'Tagliato molto sottile' },
            { nome: 'Origano essiccato', densita: 0.002, note: 'Origano di montagna' },
            { nome: 'Olio EVO', densita: 0.012, note: 'Giro generoso prima di infornare' }
        ],
        quattro_formaggi: [
            { nome: 'Mozzarella base', densita: 0.09, note: 'Base protettiva' },
            { nome: 'Gorgonzola / Blu', densita: 0.045, note: 'A tocchetti ben distribuiti' },
            { nome: 'Fontina / Provola', densita: 0.04, note: 'A cubetti' },
            { nome: 'Parmigiano Reggiano', densita: 0.015, note: 'Grattugiato' }
        ],
        focaccia: [
            { nome: 'Salamoia (Acqua + Olio EVO)', densita: 0.045, note: 'Emulsione 50% acqua e 50% olio' },
            { nome: 'Sale grosso / Maldon', densita: 0.004, note: 'In superficie prima di infornare' },
            { nome: 'Rosmarino fresco', densita: 0, fisso: 'q.b.', note: 'Aghi freschi' }
        ],
        capricciosa: [
            { nome: 'Salsa di Pomodoro', densita: 0.11, note: 'Base classica' },
            { nome: 'Mozzarella / Fiordilatte', densita: 0.11, note: 'Ben asciutta' },
            { nome: 'Prosciutto cotto', densita: 0.06, note: 'A listarelle' },
            { nome: 'Funghi champignon', densita: 0.05, note: 'Affettati sottili' },
            { nome: 'Carciofini sott\'olio', densita: 0.04, note: 'A spicchi ben sgocciolati' },
            { nome: 'Olive nere', densita: 0.03, note: 'Denocciolate' }
        ]
    };

    const lista = condensita[farcitura] || condensita.margherita;

    const condimenti = lista.map((c) => {
        if (c.fisso) {
            return { nome: c.nome, quantita: c.fisso, note: c.note };
        }
        const grammi = Math.round(areaCm2 * c.densita);
        return {
            nome: c.nome,
            quantita: `${grammi} g`,
            quantitaG: grammi,
            note: c.note
        };
    });

    return {
        areaCm2: Math.round(areaCm2),
        farcitura,
        condimenti
    };
}

/**
 * Calcola la temperatura ideale dell'acqua di impasto (FDT).
 * Formula: T_acqua = (3 * T_target) - (T_ambiente + T_farina + T_frizione)
 * 
 * @param {Object} params
 * @param {number} [params.tempTarget=24] - Temperatura finale desiderata dell'impasto (°C, tipico 23-25°C)
 * @param {number} [params.tempAmbiente=22] - Temperatura della stanza (°C)
 * @param {number} [params.tempFarina] - Temperatura della farina (°C, default tempAmbiente - 1)
 * @param {'mani'|'planetaria'|'spirale_1v'|'spirale_2v'|'bimby'} [params.tipoImpastatrice='mani']
 * 
 * @returns {{ tempAcqua: number, consiglio: string, tipoAcqua: string }}
 */
export function calcolaTempAcquaFDT({
    tempTarget = 24,
    tempAmbiente = 22,
    tempFarina = null,
    tipoImpastatrice = 'mani'
}) {
    const tTarget = Number(tempTarget) || 24;
    const tAmb = Number(tempAmbiente) || 22;
    const tFar = tempFarina !== null && !isNaN(tempFarina) ? Number(tempFarina) : tAmb - 1;

    const frizioneImpasto = {
        mani: 1,
        planetaria: 3,
        spirale_1v: 4,
        spirale_2v: 7,
        bimby: 9
    };

    const tFriz = frizioneImpasto[tipoImpastatrice] ?? 2;
    const tAcqua = Math.round((3 * tTarget) - (tAmb + tFar + tFriz));

    let tipoAcqua = 'Rubinetto / Ambiente';
    let consiglio = '';

    if (tAcqua <= 4) {
        tipoAcqua = '🧊 Acqua di Frigorifero + Ghiaccio';
        consiglio = `L'ambiente e l'impastatrice scaldano molto. Usa acqua a 4°C da frigo e, se necessario, sostituisci una parte dell'acqua (${Math.abs(tAcqua * 5)}g) con ghiaccio tritato fino.`;
    } else if (tAcqua <= 10) {
        tipoAcqua = '❄️ Acqua molto fredda di Frigo (4-8°C)';
        consiglio = 'Metti la bottiglia d\'acqua in frigorifero per 2 ore prima di iniziare l\'impasto per non oltrepassare i 24°C finali.';
    } else if (tAcqua <= 18) {
        tipoAcqua = '💧 Acqua fresca di rubinetto (12-16°C)';
        consiglio = 'È sufficiente l\'acqua fredda del rubinetto lasciata scorrere qualche secondo.';
    } else if (tAcqua <= 26) {
        tipoAcqua = '🌡️ Acqua a temperatura ambiente (20-24°C)';
        consiglio = 'Usa acqua a temperatura ambiente per favorire una corretta e rapida attivazione dei lieviti.';
    } else {
        tipoAcqua = '♨️ Acqua tiepida (28-32°C)';
        consiglio = 'Ambiente freddo: usa acqua leggermente tiepida (non bollente per non uccidere il lievito) per aiutare la partenza fermentativa.';
    }

    return {
        tempAcqua: tAcqua,
        tempFarina: tFar,
        tempAmbiente: tAmb,
        tempTarget: tTarget,
        frizione: tFriz,
        tipoAcqua,
        consiglio
    };
}

/**
 * Database e linee guida di setup termico per diverse tipologie di forno.
 */
export const GUIDA_FORNI = [
    {
        id: 'domestico',
        nome: 'Forno Domestico Standard (250°C - 300°C)',
        icona: '🏠',
        tempMax: '250-300°C',
        setup: [
            'Posiziona una pietra refrattaria (o biscotto/leccarda capovolta) sul ripiano più alto, vicino alla resistenza del grill.',
            'Preriscalda alla massima temperatura in modalità statica per almeno 45-60 minuti.',
            'Accendi il grill alla massima potenza 5 minuti prima di infornare.',
            'Tecnica "Doppia Cottura" per la Napoletana: cuoci prima la base 2 minuti in padella sul fornello fino a doratura del fondo, poi trasferisci sotto al grill per 2-3 minuti.',
            'Consiglio impasto: aggiungi il 2-3% di olio EVO o strutto e lo 0.5-1% di malto per favorire la colorazione e non far seccare la pizza.'
        ],
        tempiCottura: '4-7 minuti'
    },
    {
        id: 'elettrico_alta',
        nome: 'Fornetto Elettrico ad Alta Temperatura (Effeuno, Ooni Volt, Spice 450-500°C)',
        icona: '⚡',
        tempMax: '450-500°C',
        setup: [
            'Dotazione ideale: piano in pietra refrattaria cordierite (per teglia/romana) o pietra Biscotto di Casapulla/Sorrento (per Napoletana ad altissima temperatura).',
            'Preriscaldamento: 30-40 minuti con termostato cielo e platea impostati al target.',
            'Impostazione cielo/platea: per Napoletana Contemporanea imposta Cielo a 450-480°C e Platea a 380-400°C (il biscotto evita bruciature sotto).',
            'Ruota la pizza di 180° a metà cottura (dopo circa 45 secondi) con un palino girapizza.',
            'Consiglio impasto: zero zuccheri e zero grassi per evitare macchie nere premature.'
        ],
        tempiCottura: '60-90 secondi (Napoletana) / 3-4 min (Teglia)'
    },
    {
        id: 'gas_legna',
        nome: 'Forno a Gas o Legna Esterno (Ooni Koda/Karu, Roccbox, Alfa Forni)',
        icona: '🔥',
        tempMax: '450-500°C',
        setup: [
            'Preriscalda la pietra fino a misurare con pirometro laser almeno 420-440°C al centro della pietra.',
            'Regola della fiamma a gas: appena infornata la pizza, abbassa la manopola del gas al MINIMO (tecnica "low flame") per permettere al fondo di cuocere senza bruciare il cornicione.',
            'Alza di nuovo la fiamma negli ultimi 15 secondi per una doratura e maculatura (leopardatura) perfetta.',
            'Gira la pizza ogni 20-25 secondi per una cottura uniforme rispetto alla sorgente di calore posteriore/laterale.',
            'Impasto consigliato: farina di media-forte tenuta ($W 280-320$), solo acqua, farina, lievito e sale.'
        ],
        tempiCottura: '60-80 secondi'
    }
];
