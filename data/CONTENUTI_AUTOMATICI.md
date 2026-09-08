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

## Regole per l'agente di ricerca e prevenzione della ripetitività

Lo script `scripts/aggiorna-contenuti.mjs` adotta un'architettura avanzata per garantire varietà e rigore scientifico:

1. **Memoria dell'Archivio (Blacklist dei temi già trattati)**:
   Lo script legge prima `data/scienza.json` e le bozze esistenti, estrae i titoli e gli ID, e impone a Kimi di **non proporre mai argomenti simili o già coperti**.

2. **Ruota dei 5 Cluster Tematici (Rotazione settimanale)**:
   Per evitare che il bot parli sempre delle stesse cose (es. lievito madre e digeribilità), la ricerca ruota in base al numero della settimana dell'anno (`settimana % 5`):
   - **Cluster 1 — Microbiologia e Cinetica Fermentativa**: ceppi non convenzionali, batteri lattici (LAB), acidi organici e composti aromatici (VOC).
   - **Cluster 2 — Reologia e Chimica Fisica della Cottura**: gelatinizzazione termica degli amidi, reazione di Maillard, alveografia (W, P/L), dinamica termica nei forni.
   - **Cluster 3 — Chimica delle Farine e Agronomia del Frumento**: frazioni glutenine/gliadine, ceneri, tasso di abburattamento, grani antichi vs moderni (dati reologici reali).
   - **Cluster 4 — Fisiologia Gastrointestinale e Nutrizione Reale**: risposta glicemica/insulinica, acido fitico e biodisponibilità minerali, FODMAP e fermentazione colica, impatto dei grassi cotti.
   - **Cluster 5 — Debunking Scientifico di Luoghi Comuni**: smontaggio biochimico di miti commerciali e folklore della panificazione.

3. **Protocollo "Avvocato del Diavolo" a Due Fasi (Chain-of-Verification / Red Team)**:
   - **Fase 1 (Il Ricercatore)**: trova uno studio/notizia candidato su fonti autorevoli (CREA, riviste peer-reviewed, università) e ne estrae la tesi.
   - **Fase 2 (Il Revisore Scettico)**: Kimi assume il ruolo di un severo professore di chimica degli alimenti ed esegue una **seconda ricerca web avversariale** per cercare smentite, critiche o miti commerciali.
     - Se la notizia è una semplificazione promozionale o una bufala -> viene **scartata** (`[]`).
     - Se il fenomeno è reale -> viene **riscritta** con il massimo rigore scientifico, integrando i limiti metodologici e smontando eventuali falsi miti.

4. **Controllo Umano**:
   L'agente scrive solo nei file `*_bozza.json`. Non tocca mai `stagionale.json` o `scienza.json` direttamente: la pubblicazione è sempre una scelta umana tramite Pull Request.
