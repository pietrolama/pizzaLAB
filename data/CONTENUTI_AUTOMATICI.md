# Contenuti auto-aggiornati: schema e flusso di revisione

Due sezioni del sito sono alimentate da un agente pianificato che fa ricerca
periodica e propone aggiornamenti. Il flusso è sempre lo stesso:

```
agente pianificato → ricerca (fonti affidabili) → scrive nel file *_bozza.json
                                                          |
                                                   notifica a Pietro
                                                          |
                                          revisione + eventuale copia manuale
                                                          |
                                              file pubblicato (senza _bozza)
                                                          |
                                                sito legge il file pubblicato
```

I file `*_bozza.json` non sono mai letti dal sito: servono solo come area di
lavoro dell'agente, in attesa di approvazione.

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
  (es. CREA, università, riviste scientifiche di settore). Niente blog non
  verificati o contenuti generati da altre IA senza fonte primaria.
- Ogni voce deve avere almeno una fonte con URL verificabile in `fonti`.
- L'agente scrive solo nei file `*_bozza.json`. Non deve mai toccare
  `stagionale.json` o `scienza.json` direttamente: la pubblicazione è una
  scelta umana.
