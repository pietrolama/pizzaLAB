#!/usr/bin/env node
// aggiorna-contenuti.mjs
// Gira dentro una GitHub Action pianificata (vedi .github/workflows/contenuti-automatici.yml).
// Interroga il modello Kimi (Moonshot AI), che ha una funzione di ricerca web
// integrata ($web_search), per proporre aggiornamenti alle sezioni
// "stagionale" e "scienza" del sito. Scrive SOLO nei file *_bozza.json: la
// pubblicazione (copia nei file letti dal sito) resta una scelta umana, via
// revisione della Pull Request che la action apre.
//
// Richiede la variabile d'ambiente KIMI_API_KEY (secret del repo).

import { readFile, writeFile } from 'node:fs/promises';

const API_BASE = process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1';
const MODEL = process.env.KIMI_MODEL || 'kimi-k2.6';
const API_KEY = process.env.KIMI_API_KEY;

if (!API_KEY) {
    console.error('Manca KIMI_API_KEY (secret del repo GitHub).');
    process.exit(1);
}

const oggi = new Date().toISOString().slice(0, 10);

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
                    // La ricerca viene eseguita lato Moonshot: si limita a
                    // restituire gli stessi argomenti come risultato del tool.
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

const promptScienza = `Usa la ricerca web per trovare UNA notizia o studio scientifico (preferibilmente recente) legato a chimica degli impasti, microbiologia della fermentazione, lieviti, reologia delle farine o nutrizione della pizza/pane. Cerca solo su fonti affidabili: enti di ricerca, università, riviste scientifiche peer-reviewed o istituzioni alimentari serie. Evita blog non verificati, testate generaliste o comunicati acritici di uffici stampa.

PROTOCOLLO DI VERIFICA CRITICA E DEBUNKING ("AVVOCATO DEL DIAVOLO"):
Prima di redigere l'articolo, metti alla prova le informazioni raccolte cercando attivamente di smontarle:
1. Distingui il marketing e il folklore delle pizzerie dalla fisiologia e biochimica reale. Non accettare miti comuni, quali:
   - "Le lunghe lievitazioni predigeriscono il glutine al posto dello stomaco" (falso: la pepsina e l'HCl gastrico sono milioni di volte più efficaci delle proteasi vegetali della farina a freddo, che scindono solo l'1-2% dei legami).
   - "Il lievito continua a fermentare nello stomaco" (falso: a 55-60°C il lievito muore istantaneamente).
   - "La digeribilità degli amidi dipende dalle ore di lievitazione" (falso: l'amido diventa digeribile tramite la gelatinizzazione termica in cottura a >80°C, non durante il riposo a crudo).
2. Se la notizia o la fonte contiene affermazioni semplificate o slogan promozionali, applica il fact-checking: spiega cosa dice davvero la biochimica, smonta il mito nel corpo del testo chiarendo il vero meccanismo (es. il ruolo della cottura, del sale, dell'idratazione o dell'acidificazione con pasta madre).
3. Se la notizia non regge alla verifica critica o è una bufala commerciale indifendibile, scartala e cercane un'altra, oppure restituisci un array vuoto [].

Rispondi SOLO con un JSON (array con un oggetto, o array vuoto se non trovi nulla di scientificamente solido e verificato) con questo schema esatto:

[
  {
    "id": "slug-breve-univoco",
    "titolo": "Titolo dell'approfondimento",
    "sintesi": "1-2 frasi di sintesi chiara ed esatta",
    "corpo": "3-6 frasi che spiegano il contenuto con rigore scientifico e divulgativo, smontando eventuali falsi miti correlati",
    "data_pubblicazione": "${oggi}",
    "fonti": [{ "titolo": "Nome fonte", "url": "https://..." }]
  }
]

Ogni voce DEVE avere almeno una fonte con URL reale e verificabile trovato dalla ricerca. Non inventare fonti. Non includere testo fuori dal JSON.`;

async function generaBozza(prompt, pathBozza) {
    const risposta = await chiamaKimi([
        { role: 'system', content: 'Sei un assistente di ricerca che risponde sempre e solo con JSON valido, nel formato richiesto, basandoti su risultati di ricerca web reali.' },
        { role: 'user', content: prompt },
    ]);

    let voci;
    try {
        voci = estraiJson(risposta);
    } catch (err) {
        console.error(`Risposta non interpretabile come JSON per ${pathBozza}:\n${risposta}`);
        throw err;
    }
    if (!Array.isArray(voci)) voci = [voci];

    await writeFile(pathBozza, JSON.stringify(voci, null, 4) + '\n', 'utf8');
    console.log(`Scritte ${voci.length} voci in ${pathBozza}`);
    return voci.length;
}

const nStagionale = await generaBozza(promptStagionale, 'data/stagionale_bozza.json');
const nScienza = await generaBozza(promptScienza, 'data/scienza_bozza.json');

// Segnala all'action se c'è davvero qualcosa da proporre in revisione.
const totale = nStagionale + nScienza;
process.stdout.write(`\nHA_NOVITA=${totale > 0 ? 'true' : 'false'}\n`);
