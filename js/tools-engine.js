// tools-engine.js
// Modulo logico puro per PizzaLab:
// 1. Calcolatore Condimenti / Topping (densità superficiale per pizza tonda o teglia)
// 2. Calcolo Temperatura Acqua FDT (Fattore Temperatura Finale Desiderata)
// 3. Guida e Parametri di Setup Forni

// `Number(x) || default` tratta lo zero come valore mancante: 0 °C in un locale
// freddo è un input legittimo e veniva silenziosamente sostituito col default.
// Questo helper ripiega solo quando il valore è davvero assente o non numerico.
// Attenzione a null e stringa vuota: Number() li converte entrambi in 0, quindi
// vanno esclusi prima della conversione.
function numero(valore, predefinito) {
    if (valore === null || valore === undefined || valore === '') return predefinito;
    const n = Number(valore);
    return Number.isFinite(n) ? n : predefinito;
}

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
    farcitura = 'margherita',
    locale = 'it'
}) {
    let areaCm2 = 0;
    if (forma === 'tonda') {
        const raggio = numero(diametro, 30) / 2;
        areaCm2 = Math.PI * raggio * raggio;
    } else {
        areaCm2 = numero(base, 40) * numero(altezza, 60);
    }

    const isEn = locale === 'en';

    // Densità superficiali standard (g/cm2)
    const condensita = {
        margherita: [
            { nome: 'Salsa di Pomodoro', nome_en: 'Tomato Sauce', densita: 0.12, note: 'Polpa fine o pelati schiacciati a mano', note_en: 'Crushed San Marzano or plum tomatoes' },
            { nome: 'Fiordilatte / Mozzarella', nome_en: 'Fiordilatte / Mozzarella', densita: 0.135, note: 'Tagliata a listarelle e ben scolata', note_en: 'Shredded and well-drained' },
            { nome: 'Olio EVO', nome_en: 'EVO Olive Oil', densita: 0.008, note: 'Un filo a spirale in uscita', note_en: 'A spiral drizzle after baking' },
            { nome: 'Parmigiano / Pecorino', nome_en: 'Parmesan / Pecorino', densita: 0.007, note: 'Grattugiato fine', note_en: 'Finely grated' },
            { nome: 'Basilico fresco', nome_en: 'Fresh Basil', densita: 0, fisso: '3-5 foglie', fisso_en: '3-5 leaves', note: 'In cottura o a crudo', note_en: 'Baked or fresh on top' }
        ],
        marinara: [
            { nome: 'Salsa di Pomodoro', nome_en: 'Tomato Sauce', densita: 0.14, note: 'Leggermente più generosa rispetto alla Margherita', note_en: 'Slightly more generous than Margherita' },
            { nome: 'Aglio a lamelle', nome_en: 'Sliced Garlic', densita: 0, fisso: '1-2 spicchi', fisso_en: '1-2 cloves', note: 'Tagliato molto sottile', note_en: 'Thinly shaved' },
            { nome: 'Origano essiccato', nome_en: 'Dried Oregano', densita: 0.002, note: 'Origano di montagna', note_en: 'Wild Mediterranean oregano' },
            { nome: 'Olio EVO', nome_en: 'EVO Olive Oil', densita: 0.012, note: 'Giro generoso prima di infornare', note_en: 'Generous spiral drizzle before baking' }
        ],
        quattro_formaggi: [
            { nome: 'Mozzarella base', nome_en: 'Mozzarella base', densita: 0.09, note: 'Base protettiva', note_en: 'Protective cheese base' },
            { nome: 'Gorgonzola / Blu', nome_en: 'Gorgonzola / Blue Cheese', densita: 0.045, note: 'A tocchetti ben distribuiti', note_en: 'Evenly distributed pieces' },
            { nome: 'Fontina / Provola', nome_en: 'Fontina / Smoked Provola', densita: 0.04, note: 'A cubetti', note_en: 'Cubed' },
            { nome: 'Parmigiano Reggiano', nome_en: 'Parmigiano Reggiano', densita: 0.015, note: 'Grattugiato', note_en: 'Grated' }
        ],
        focaccia: [
            { nome: 'Salamoia (Acqua + Olio EVO)', nome_en: 'Brine (Water + EVO Oil)', densita: 0.045, note: 'Emulsione 50% acqua e 50% olio', note_en: '50/50 water and olive oil emulsion' },
            { nome: 'Sale grosso / Maldon', nome_en: 'Coarse / Flaky Salt', densita: 0.004, note: 'In superficie prima di infornare', note_en: 'Sprinkled over surface before baking' },
            { nome: 'Rosmarino fresco', nome_en: 'Fresh Rosemary', densita: 0, fisso: 'q.b.', fisso_en: 'to taste', note: 'Aghi freschi', note_en: 'Fresh needles' }
        ],
        capricciosa: [
            { nome: 'Salsa di Pomodoro', nome_en: 'Tomato Sauce', densita: 0.11, note: 'Base classica', note_en: 'Classic tomato base' },
            { nome: 'Mozzarella / Fiordilatte', nome_en: 'Mozzarella / Fiordilatte', densita: 0.11, note: 'Ben asciutta', note_en: 'Well-drained' },
            { nome: 'Prosciutto cotto', nome_en: 'Cooked Ham (Prosciutto)', densita: 0.06, note: 'A listarelle', note_en: 'Shredded / sliced' },
            { nome: 'Funghi champignon', nome_en: 'Mushrooms', densita: 0.05, note: 'Affettati sottili', note_en: 'Thinly sliced' },
            { nome: 'Carciofini sott\'olio', nome_en: 'Artichoke Hearts in Oil', densita: 0.04, note: 'A spicchi ben sgocciolati', note_en: 'Quartered and well-drained' },
            { nome: 'Olive nere', nome_en: 'Black Olives', densita: 0.03, note: 'Denocciolate', note_en: 'Pitted' }
        ]
    };

    const lista = condensita[farcitura] || condensita.margherita;

    const condimenti = lista.map((c) => {
        const itemNome = isEn && c.nome_en ? c.nome_en : c.nome;
        const itemNote = isEn && c.note_en ? c.note_en : c.note;
        if (c.fisso) {
            const itemFisso = isEn && c.fisso_en ? c.fisso_en : c.fisso;
            return { nome: itemNome, quantita: itemFisso, note: itemNote };
        }
        const grammi = Math.round(areaCm2 * c.densita);
        return {
            nome: itemNome,
            quantita: `${grammi} g`,
            quantitaG: grammi,
            note: itemNote
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
 */
export function calcolaTempAcquaFDT({
    tempTarget = 24,
    tempAmbiente = 22,
    tempFarina = null,
    tipoImpastatrice = 'mani',
    locale = 'it'
}) {
    const tTarget = numero(tempTarget, 24);
    const tAmb = numero(tempAmbiente, 22);
    // Se la farina non è stata misurata si assume un grado sotto l'ambiente.
    const tFar = numero(tempFarina, tAmb - 1);

    const frizioneImpasto = {
        mani: 1,
        planetaria: 3,
        spirale_1v: 4,
        spirale_2v: 7,
        bimby: 9
    };

    const tFriz = frizioneImpasto[tipoImpastatrice] ?? 2;
    const tAcqua = Math.round((3 * tTarget) - (tAmb + tFar + tFriz));

    const isEn = locale === 'en';
    let tipoAcqua = isEn ? 'Tap / Ambient' : 'Rubinetto / Ambiente';
    let consiglio = '';

    if (tAcqua <= 4) {
        tipoAcqua = isEn ? '🧊 Fridge Water + Ice' : '🧊 Acqua di Frigorifero + Ghiaccio';
        consiglio = isEn
            ? `The room and mixer generate high friction heat. Use 4°C chilled fridge water and, if needed, replace part of the water (${Math.abs(tAcqua * 5)}g) with finely crushed ice.`
            : `L'ambiente e l'impastatrice scaldano molto. Usa acqua a 4°C da frigo e, se necessario, sostituisci una parte dell'acqua (${Math.abs(tAcqua * 5)}g) con ghiaccio tritato fino.`;
    } else if (tAcqua <= 10) {
        tipoAcqua = isEn ? '❄️ Very Cold Fridge Water (4-8°C)' : '❄️ Acqua molto fredda di Frigo (4-8°C)';
        consiglio = isEn
            ? 'Place your water bottle in the refrigerator for 2 hours before mixing to keep the final dough temperature below 24°C.'
            : 'Metti la bottiglia d\'acqua in frigorifero per 2 ore prima di iniziare l\'impasto per non oltrepassare i 24°C finali.';
    } else if (tAcqua <= 18) {
        tipoAcqua = isEn ? '💧 Cool Tap Water (12-16°C)' : '💧 Acqua fresca di rubinetto (12-16°C)';
        consiglio = isEn
            ? 'Cold tap water run for a few seconds is completely sufficient.'
            : 'È sufficiente l\'acqua fredda del rubinetto lasciata scorrere qualche secondo.';
    } else if (tAcqua <= 26) {
        tipoAcqua = isEn ? '🌡️ Room Temperature Water (20-24°C)' : '🌡️ Acqua a temperatura ambiente (20-24°C)';
        consiglio = isEn
            ? 'Use room temperature water to promote optimal and timely yeast activation.'
            : 'Usa acqua a temperatura ambiente per favorire una corretta e rapida attivazione dei lieviti.';
    } else if (tAcqua <= 40) {
        tipoAcqua = isEn ? '♨️ Lukewarm Water (28-32°C)' : '♨️ Acqua tiepida (28-32°C)';
        consiglio = isEn
            ? 'Cold environment: use slightly lukewarm water (never hot, to protect yeast) to kickstart fermentation.'
            : 'Ambiente freddo: usa acqua leggermente tiepida (non bollente per non uccidere il lievito) per aiutare la partenza fermentativa.';
    } else {
        // Sopra i 40 °C circa il lievito inizia a soffrire e oltre i 50 °C muore:
        // la temperatura richiesta dalla formula non è utilizzabile e va detto,
        // invece di etichettarla come "acqua tiepida".
        tipoAcqua = isEn ? '⚠️ Target not reachable with water alone' : '⚠️ Obiettivo non raggiungibile con la sola acqua';
        consiglio = isEn
            ? `Reaching ${tTarget}°C from a ${tAmb}°C room would require water at about ${tAcqua}°C, hot enough to kill the yeast. Warm the room or the flour first, or accept a lower final dough temperature and lengthen the fermentation.`
            : `Per arrivare a ${tTarget}°C partendo da un ambiente a ${tAmb}°C servirebbe acqua a circa ${tAcqua}°C, abbastanza calda da uccidere il lievito. Scalda prima l'ambiente o la farina, oppure accetta una temperatura finale più bassa e allunga la lievitazione.`;
    }

    return {
        tempAcqua: tAcqua,
        tempFarina: tFar,
        tempAmbiente: tAmb,
        tempTarget: tTarget,
        frizione: tFriz,
        tipoAcqua,
        consiglio,
        // Segnala che il valore è teorico e non applicabile in pratica.
        raggiungibile: tAcqua <= 40,
    };
}

/**
 * Database e linee guida di setup termico per diverse tipologie di forno.
 */
export const GUIDA_FORNI = [
    {
        id: 'domestico',
        nome: 'Forno Domestico Standard (250°C - 300°C)',
        nome_en: 'Standard Home Oven (250°C - 300°C / 480-570°F)',
        icona: '🏠',
        tempMax: '250-300°C',
        setup: [
            'Posiziona una pietra refrattaria (o biscotto/leccarda capovolta) sul ripiano più alto, vicino alla resistenza del grill.',
            'Preriscalda alla massima temperatura in modalità statica per almeno 45-60 minuti.',
            'Accendi il grill alla massima potenza 5 minuti prima di infornare.',
            'Tecnica "Doppia Cottura" per la Napoletana: cuoci prima la base 2 minuti in padella sul fornello fino a doratura del fondo, poi trasferisci sotto al grill per 2-3 minuti.',
            'Consiglio impasto: aggiungi il 2-3% di olio EVO o strutto e lo 0.5-1% di malto per favorire la colorazione e non far seccare la pizza.'
        ],
        setup_en: [
            'Place a baking stone or steel (or inverted heavy baking tray) on the highest rack, directly beneath the top broiler element.',
            'Preheat at maximum static temperature for at least 45-60 minutes.',
            'Turn on the top broiler at maximum power 5 minutes before loading the pizza.',
            'Skillet-Broiler Double Bake Technique for Neapolitan: cook the base for 2 minutes in a screaming hot stovetop skillet until the bottom is spotted, then transfer directly under the broiler for 2-3 minutes.',
            'Dough advice: add 2-3% extra virgin olive oil and 0.5-1% diastatic malt to boost crust coloration and retain tenderness.'
        ],
        tempiCottura: '4-7 minuti',
        tempiCottura_en: '4-7 minutes'
    },
    {
        id: 'elettrico_alta',
        nome: 'Fornetto Elettrico ad Alta Temperatura (Effeuno, Ooni Volt, Spice 450-500°C)',
        nome_en: 'High-Temperature Electric Pizza Oven (Effeuno, Ooni Volt 450-500°C / 850-930°F)',
        icona: '⚡',
        tempMax: '450-500°C',
        setup: [
            'Dotazione ideale: piano in pietra refrattaria cordierite (per teglia/romana) o pietra Biscotto di Casapulla/Sorrento (per Napoletana ad altissima temperatura).',
            'Preriscaldamento: 30-40 minuti con termostato cielo e platea impostati al target.',
            'Impostazione cielo/platea: per Napoletana Contemporanea imposta Cielo a 450-480°C e Platea a 380-400°C (il biscotto evita bruciature sotto).',
            'Ruota la pizza di 180° a metà cottura (dopo circa 45 secondi) con un palino girapizza.',
            'Consiglio impasto: zero zuccheri e zero grassi per evitare macchie nere premature.'
        ],
        setup_en: [
            'Ideal floor: cordierite refractory stone (for pan/roman style) or artisanal clay Biscotto (Casapulla/Sorrento) for high-heat Neapolitan.',
            'Preheating: 30-40 minutes with top and deck thermostats set to target bake temperature.',
            'Thermostat balance: for Contemporary Neapolitan set Top to 450-480°C (840-900°F) and Deck to 380-400°C (715-750°F) to prevent bottom charring.',
            'Rotate the pizza 180° halfway through baking (~45 seconds) using a small turning peel.',
            'Dough advice: zero sugar and zero added fats to avoid premature acrid char spots.'
        ],
        tempiCottura: '60-90 secondi (Napoletana) / 3-4 min (Teglia)',
        tempiCottura_en: '60-90 seconds (Neapolitan) / 3-4 min (Pan pizza)'
    },
    {
        id: 'gas_legna',
        nome: 'Forno a Gas o Legna Esterno (Ooni Koda/Karu, Roccbox, Alfa Forni)',
        nome_en: 'Outdoor Gas or Wood-Fired Oven (Ooni Koda/Karu, Roccbox, Gozney)',
        icona: '🔥',
        tempMax: '450-500°C',
        setup: [
            'Preriscalda la pietra fino a misurare con pirometro laser almeno 420-440°C al centro della pietra.',
            'Regola della fiamma a gas: appena infornata la pizza, abbassa la manopola del gas al MINIMO (tecnica "low flame") per permettere al fondo di cuocere senza bruciare il cornicione.',
            'Alza di nuovo la fiamma negli ultimi 15 secondi per una doratura e maculatura (leopardatura) perfetta.',
            'Gira la pizza ogni 20-25 secondi per una cottura uniforme rispetto alla sorgente di calore posteriore/laterale.',
            'Impasto consigliato: farina di media-forte tenuta ($W 280-320$), solo acqua, farina, lievito e sale.'
        ],
        setup_en: [
            'Preheat the stone until an infrared laser thermometer reads at least 420-440°C (790-825°F) at dead center.',
            'Flame management (Low Flame Technique): immediately after launching the pizza, dial the gas flame to ultra-low to allow the bottom crust to set without incinerating the top cornicione.',
            'Turn the flame back up for the final 15 seconds to achieve textbook leopard spotting.',
            'Turn the pizza every 20-25 seconds for even exposure against the rear/side heat source.',
            'Dough advice: medium-strong flour (W 280-320), pure four ingredients (flour, water, yeast, salt).'
        ],
        tempiCottura: '60-80 secondi',
        tempiCottura_en: '60-80 seconds'
    }
];

