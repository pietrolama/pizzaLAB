#!/usr/bin/env node
// aggiorna-contenuti.mjs
// Gira dentro una GitHub Action pianificata (vedi .github/workflows/contenuti-automatici.yml).
// Interroga il modello Kimi (Moonshot AI), che ha una funzione di ricerca web
// integrata ($web_search), per proporre aggiornamenti alle sezioni
// "stagionale" e "scienza" del sito.
//
// CARATTERISTICHE PRINCIPALI:
// 1. Anti-ripetitività: legge l'archivio esistente (data/scienza.json) e vieta
//    di riproporre temi già trattati.
// 2. Ruota dei Cluster: ruota settimanalmente su 5 macro-aree scientifiche
//    (microbiologia, reologia/cottura, cereali/farine, nutrizione, debunking).
// 3. Pipeline di Verifica a Due Fasi (Avvocato del Diavolo / Red Team):
//    - Fase 1: Kimi trova una notizia o studio candidato.
//    - Fase 2: Kimi agisce da revisore scettico, fa una seconda ricerca per
//      cercare contro-prove o miti commerciali. Se la notizia non regge,
//      viene scartata ([]); se regge, viene scritta con rigore critico.
//
// Scrive SOLO nei file *_bozza.json: la pubblicazione resta una scelta umana.

import { readFile, writeFile } from 'node:fs/promises';

const API_BASE = process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1';
const MODEL = process.env.KIMI_MODEL || 'kimi-k2.6';
const API_KEY = process.env.KIMI_API_KEY;

if (!API_KEY) {
    console.error('Manca KIMI_API_KEY (secret del repo GitHub).');
    process.exit(1);
}

const oggi = new Date().toISOString().slice(0, 10);

// Calcolo settimana dell'anno (ISO 8601) per la rotazione tematica
function getSettimanaDellAnno(d = new Date()) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

const CLUSTER_TEMATICI = [
    {
        id: 'microbiologia',
        nome: 'Microbiologia e Cinetica Fermentativa',
        focus: 'Ceppi di lievito non convenzionali, batteri lattici (LAB omo ed etero-fermentanti), acidi organici volatili, composti aromatici (VOC), cinetica enzimatica e competizione ecologica nella pasta madre.'
    },
    {
        id: 'reologia_chimica',
        nome: 'Reologia e Chimica Fisica della Cottura',
        focus: 'Comportamento degli amidi (gelatinizzazione termica a caldo, retrogradazione a freddo), reazione di Maillard e melanoidine, reologia alveografica di Chopin (P/L, W, tenacia vs estensibilità), dinamica termica e trasmissione del calore nei forni.'
    },
    {
        id: 'agronomia_cereali',
        nome: 'Chimica delle Farine e Agronomia del Frumento',
        focus: 'Composizione delle ceneri e tasso di abburattamento, frazioni monomeriche delle gliadine e polimeriche delle glutenine, grani antichi vs moderni (dati reologici e agronomici reali, non miti commerciali), enzimi endogeni (fitasi e amilasi).'
    },
    {
        id: 'fisiologia_nutrizione',
        nome: 'Fisiologia Gastrointestinale e Nutrizione Reale',
        focus: 'Indice glicemico e risposta insulinica post-prandiale, acido fitico e biodisponibilità dei minerali, fermentazione colica dei FODMAP, impatto reale dei condimenti e dei grassi cotti sullo svuotamento gastrico.'
    },
    {
        id: 'debunking_miti',
        nome: 'Debunking Scientifico di Luoghi Comuni',
        focus: 'Miti commerciali dell\'arte bianca smontati con la biochimica (es. "farine raffinate come veleno bianco", "il lievito che continua a fermentare nello stomaco", "impasti con acqua di mare", "farine che non fanno ingrassare", "idratazioni estreme miracolose").'
    }
];

async function chiamaKimi(messages) {
    const tools = [{ type: 'builtin_function', function: { name: '$web_search' } }];
    let storia = [...messages];

    for (let iter = 0; iter < 6; iter++) {
        const res = await fetch(`${API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: storia,
                tools,
            }),
        });
        if (!res.ok) {
            throw new Error(`Kimi API ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        const scelta = data.choices[0];
        const msg = scelta.message;
        storia.push(msg);

        if (scelta.finish_reason === 'tool_calls' && msg.tool_calls) {
            for (const call of msg.tool_calls) {
                if (call.function.name === '$web_search') {
                    storia.push({
                        role: 'tool',
                        tool_call_id: call.id,
                        name: '$web_search',
                        content: call.function.arguments,
                    });
                }
            }
            continue;
        }
        return msg.content;
    }
    throw new Error('Troppe iterazioni di tool-calling senza risposta finale.');
}

function estraiJson(testo) {
    const match = testo.match(/```json\s*([\s\S]*?)```/) || testo.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    const raw = match ? match[1] : testo;
    return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// 1. BANNER STAGIONALE
// ---------------------------------------------------------------------------
const promptStagionale = `Oggi è il ${oggi}. Usa la ricerca web per verificare se nei prossimi 30 giorni cade una festività o ricorrenza italiana con un lievitato/prodotto da forno tradizionale associato (es. casatiello a Pasqua, panettone/pandoro a Natale, colomba, ecc.). Cerca solo su fonti affidabili (enti/istituzioni, testate gastronomiche riconosciute, enciclopedie di cucina consolidate — evita blog non verificati).

Se trovi una ricorrenza pertinente, rispondi SOLO con un JSON (array con un oggetto, o array vuoto se non c'è nulla di pertinente nei prossimi 30 giorni) con questo schema esatto:

[
  {
    "id": "slug-breve-univoco",
    "nome": "Nome del lievitato",
    "eyebrow": "Il lievitato del momento — Nome festività",
    "descrizione": "2-4 frasi, tono da laboratorio scientifico della pizza, coerente con un sito che parla di impasti e fermentazione",
    "immagine": "img/farine.jpg",
    "link": "prefermenti_e_farine.html",
    "inizio": "MM-DD",
    "fine": "MM-DD",
    "fonti": [{ "titolo": "Nome fonte", "url": "https://..." }]
  }
]

Il campo "immagine" deve essere uno tra: img/farine.jpg, img/lievito-madre.jpg, img/pala.jpg, img/biga.jpg, img/poolish.jpg, img/napoletana.jpg (scegli il più coerente). Il campo "link" deve essere una pagina esistente del sito tra: prefermenti_e_farine.html, tipi-di-pizza.html, calcolatore.html. Non includere testo fuori dal JSON.`;

// ---------------------------------------------------------------------------
// 2. SEZIONE SCIENZA: PIPELINE AD ALTO RIGORE CON AVVOCATO DEL DIAVOLO
// ---------------------------------------------------------------------------
async function generaArticoloScienzaConVerifica() {
    // 1. Leggi archivio esistente per evitare ripetizioni
    let archivio = [];
    try {
        const rawPub = await readFile('data/scienza.json', 'utf8');
        archivio = JSON.parse(rawPub);
    } catch (e) {}

    let bozzeVecchie = [];
    try {
        const rawBozze = await readFile('data/scienza_bozza.json', 'utf8');
        bozzeVecchie = JSON.parse(rawBozze);
    } catch (e) {}

    const totaleArticoli = [...archivio, ...bozzeVecchie];
    const titoliEsistenti = totaleArticoli.map(a => `- "${a.titolo}" (ID: ${a.id})`).join('\n') || 'Nessun articolo precedente.';

    // 2. Calcola il cluster tematico della settimana
    const numSettimana = getSettimanaDellAnno();
    const clusterIndex = numSettimana % CLUSTER_TEMATICI.length;
    const cluster = CLUSTER_TEMATICI[clusterIndex];

    console.log(`[Scienza] Settimana ${numSettimana} -> Cluster: "${cluster.nome}"`);

    // 3. FASE 1: RICERCA E CANDIDATURA (Il Ricercatore)
    const promptFase1 = `Sei un ricercatore scientifico specializzato in chimica dei cereali e scienze degli alimenti per PizzaLab.
Oggi è il ${oggi}. Il tuo obiettivo è trovare UNO studio o notizia scientifica sul seguente tema:
CLUSTER TEMATICO: "${cluster.nome}"
FOCUS SPECIFICO: ${cluster.focus}

ELENCO DEGLI ARGOMENTI GIÀ TRATTATI (NON RIPETERE CONCETTI SIMILI):
${titoliEsistenti}

REGOLE PER LA RICERCA:
1. Cerca SOLO su fonti autorevoli: riviste peer-reviewed (es. Journal of Cereal Science, Food Chemistry), università, enti pubblici di ricerca (es. CREA, INRAE, EFSA). Niente blog amatoriali o siti commerciali di pizzerie.
2. Escludi rigorosamente temi già presenti nell'archivio sopra.
3. Formula una proposta candidata che spieghi la tesi scientifica.

Rispondi SOLO con un JSON con questo schema:
{
  "candidato_valido": true,
  "id": "slug-univoco",
  "titolo": "Titolo provvisorio dello studio/scoperta",
  "tesi_principale": "Qual è la conclusione dello studio in 1 frase chiara",
  "sintesi": "Sintesi di 2 frasi",
  "corpo_bozza": "Testo descrittivo preliminare di 4-5 frasi",
  "fonti": [{ "titolo": "Nome ente/rivista", "url": "https://..." }]
}
Se non trovi nulla di autenticamente rilevante che non sia già stato trattato, rispondi con {"candidato_valido": false}. Non includere testo fuori dal JSON.`;

    console.log('[Scienza] Avvio Fase 1: Ricerca candidato...');
    const rispFase1 = await chiamaKimi([
        { role: 'system', content: 'Sei un ricercatore scientifico specializzato in chimica dei cereali e biochimica.' },
        { role: 'user', content: promptFase1 }
    ]);

    let bozzaFase1;
    try {
        bozzaFase1 = estraiJson(rispFase1);
    } catch (err) {
        console.error('Errore estrazione JSON Fase 1:', rispFase1);
        return [];
    }

    if (!bozzaFase1 || !bozzaFase1.candidato_valido || !bozzaFase1.titolo) {
        console.log('[Scienza] Nessun candidato valido trovato in Fase 1.');
        return [];
    }

    console.log(`[Scienza] Candidato Fase 1 trovato: "${bozzaFase1.titolo}". Avvio Fase 2 (Avvocato del Diavolo)...`);

    // 4. FASE 2: VERIFICA CRITICA E SMONTAGGIO (Il Revisore Scettico / Peer Reviewer)
    const promptFase2 = `Ora cambia completamente ruolo: sei il Chief Science Editor di PizzaLab, un severo e inflessibile docente di Chimica degli Alimenti e Fisiologia della Nutrizione.
Il tuo team di ricerca ti ha appena sottoposto questa proposta di articolo:

TITOLO PROPOSTO: "${bozzaFase1.titolo}"
TESI: "${bozzaFase1.tesi_principale}"
SINTESI: "${bozzaFase1.sintesi}"
BOZZA CORPO: "${bozzaFase1.corpo_bozza}"
FONTI: ${JSON.stringify(bozzaFase1.fonti)}

LA TUA MISSIONE ORA È TENTARE ATTIVAMENTE DI SMONTARE QUESTA NOTIZIA E METTERLA ALLA PROVA:
1. Esegui una ricerca web mirata ($web_search) cercando contro-evidenze, critiche o smentite (es. cerca "${bozzaFase1.id} myth", "controversia ${bozzaFase1.titolo}", o studi contrari).
2. Valuta con rigore:
   - È una trappola promozionale o un comunicato stampa che spaccia un piccolo effetto in provetta (in vitro) per una rivoluzione salutistica sull'uomo?
   - Confonde la reologia/lavorabilità dell'impasto con la digestione nel corpo umano?
   - Contraddice principi consolidati della fisiologia (es. gelatinizzazione degli amidi ad alta temperatura, pH gastrico e pepsina umana, termolabilità dei lieviti a 55-60°C)?
3. Decisione:
   - SCARTA ([] array vuoto): se la notizia è scientificamente debole, sensazionalistica, basata su correlazioni deboli o è marketing travestito da scienza. Meglio non pubblicare nulla piuttosto che pubblicare una baggianata su PizzaLab.
   - APPROVA E PERFEZIONA ([ {...} ] array con 1 oggetto): se il fenomeno è reale e verificato. In questo caso RISCRIVI il testo finale con massimo rigore, integrando nel corpo i limiti metodologici emersi e smontando preventivamente eventuali fraintendimenti popolari.

Schema JSON di risposta obbligatorio se approvato:
[
  {
    "id": "${bozzaFase1.id}",
    "tag": "${cluster.nome}",
    "titolo": "Titolo definitivo scientificamente esatto e accattivante",
    "sintesi": "1-2 frasi esatte e verificabili",
    "corpo": "3-6 frasi che spiegano il fenomeno in modo divulgativo ma impeccabile, smontando i miti correlati",
    "data_pubblicazione": "${oggi}",
    "fonti": [{ "titolo": "Nome fonte accademica/istituzionale", "url": "https://..." }]
  }
]
Se scarti, rispondi ESCLUSIVAMENTE con []. Non includere testo fuori dal JSON.`;

    const rispFase2 = await chiamaKimi([
        { role: 'system', content: 'Sei un severo revisore accademico (peer reviewer) di chimica degli alimenti e fisiologia umana.' },
        { role: 'user', content: promptFase2 }
    ]);

    let esitoFinale;
    try {
        esitoFinale = estraiJson(rispFase2);
    } catch (err) {
        console.error('Errore estrazione JSON Fase 2:', rispFase2);
        return [];
    }

    if (!Array.isArray(esitoFinale)) esitoFinale = [esitoFinale];
    return esitoFinale.filter(item => item && item.titolo && item.corpo);
}

// ---------------------------------------------------------------------------
// ESECUZIONE
// ---------------------------------------------------------------------------
async function generaBozzaStagionale() {
    const risposta = await chiamaKimi([
        { role: 'system', content: 'Sei un assistente di ricerca che risponde sempre e solo con JSON valido, nel formato richiesto, basandoti su risultati di ricerca web reali.' },
        { role: 'user', content: promptStagionale },
    ]);
    let voci;
    try {
        voci = estraiJson(risposta);
    } catch (err) {
        console.error('Risposta non interpretabile come JSON per stagionale:', risposta);
        return [];
    }
    if (!Array.isArray(voci)) voci = [voci];
    return voci;
}

console.log('--- Avvio generazione contenuti automatici PizzaLab ---');

const vociStagionale = await generaBozzaStagionale();
await writeFile('data/stagionale_bozza.json', JSON.stringify(vociStagionale, null, 4) + '\n', 'utf8');
console.log(`[Stagionale] Scritte ${vociStagionale.length} proposte in data/stagionale_bozza.json`);

const vociScienza = await generaArticoloScienzaConVerifica();
await writeFile('data/scienza_bozza.json', JSON.stringify(vociScienza, null, 4) + '\n', 'utf8');
console.log(`[Scienza] Scritte ${vociScienza.length} proposte verificate in data/scienza_bozza.json`);

const totale = vociStagionale.length + vociScienza.length;
process.stdout.write(`\nHA_NOVITA=${totale > 0 ? 'true' : 'false'}\n`);
