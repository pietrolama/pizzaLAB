# Contenuti auto-aggiornati: schema e flusso di revisione

Due sezioni del sito sono alimentate da una **GitHub Action pianificata**
(`.github/workflows/contenuti-automatici.yml`, ogni lunedì alle 06:00 UTC,
oppure lanciabile a mano da Actions → "Aggiorna contenuti automatici (Kimi)"
→ Run workflow) che esegue `scripts/aggiorna-contenuti.mjs`. Lo script
interroga il modello **Kimi** (Moonshot AI), che ha una funzione di ricerca
web integrata (`$web_search`), e scrive le proposte nei file `*_bozza.json`.
Il flusso è sempre lo stesso:

```
GitHub Action (cron) → script chiama Kimi → Kimi cerca sul web (fonti affidabili)
                                                          |
                                          scrive in data/*_bozza.json
                                                          |
                                    la Action apre una Pull Request di revisione
                                                          |
                                    Pietro rilegge, verifica le fonti, decide
                                                          |
                                  copia le voci approvate nel file pubblicato
                                              (stagionale.json / scienza.json)
                                                          |
                                                sito legge il file pubblicato
```

I file `*_bozza.json` non sono mai letti dal sito: servono solo come area di
lavoro dell'automazione, in attesa di approvazione. Lo script NON scrive mai
direttamente nei file pubblicati.

**Setup richiesto (una tantum):** aggiungere un secret `KIMI_API_KEY` nel
repo GitHub (Settings → Secrets and variables → Actions → New repository
secret) con la chiave API Kimi/Moonshot. Senza questo secret la Action fallisce
subito con un errore esplicito, non scrive nulla di sbagliato.

## stagionale.json / stagionale_bozza.json

Array di oggetti. Il sito mostra un banner in home solo per gli oggetti la
cui finestra `inizio`/`fine` (formato `MM-DD`) include la data odierna.

```json
{
  "id": "pasqua-2027",
  "nome": "Casatiello",
  "eyebrow": "Il lievitato del momento — Pasqua",
  "descrizione": "...",
  "immagine": "img/farine.jpg",
  "link": "prefermenti_e_farine.html",
  "inizio": "03-15",
  "fine": "04-15",
  "fonti": [
    { "titolo": "Nome fonte", "url": "https://..." }
  ]
}
```

## scienza.json / scienza_bozza.json

Array di oggetti, ogni voce è un approfondimento scientifico con fonte
citata (obbligatoria — niente affermazioni senza link verificabile).

```json
{
  "id": "fermentazione-lenta-2026-08",
  "titolo": "...",
  "sintesi": "...",
  "corpo": "...",
  "data_pubblicazione": "2026-08-31",
  "fonti": [
    { "titolo": "Nome fonte", "url": "https://..." }
  ]
}
```

## Regole per l'agente di ricerca

- Solo fonti affidabili: enti di ricerca, riviste peer-reviewed, istituzioni
  scientifiche ed universitarie. Niente blog non verificati, testate generaliste
  o comunicati acritici di uffici stampa.
- Ogni voce deve avere almeno una fonte con URL verificabile in `fonti`.
- **Protocollo Avvocato del Diavolo (Debunking dei Miti)**:
  L'agente non deve accettare passivamente il marketing o il folklore della pizza.
  Prima di formulare una proposta deve provare a "smontarla":
  - Verificare se l'affermazione regge al confronto con la biochimica e fisiologia
    umana reale (es. gelatinizzazione degli amidi in cottura, pepsina gastrica vs
    proteasi della farina, inattivazione termica del lievito a 55-60°C).
  - Se la notizia contiene slogan commerciali diffusi (es. "tempi lunghi predigeriscono
    il glutine"), deve smontare il mito nel testo spiegando la realtà scientifica,
    oppure scartare la notizia.
- L'agente scrive solo nei file `*_bozza.json`. Non deve mai toccare
  `stagionale.json` o `scienza.json` direttamente: la pubblicazione è una
  scelta umana.
