// procedura-engine.js
// Genera il procedimento dell'impasto in base ai parametri reali (idratazione,
// forza della farina), invece di un testo fisso per tipo di pizza.
// Supporta generazione bilingue (IT / EN).

const FASCE_IDRATAZIONE = [
    { max: 60, id: 'bassa' },
    { max: 70, id: 'media' },
    { max: 75, id: 'medio_alta' },
    { max: 80, id: 'alta' },
    { max: 85, id: 'molto_alta' },
    { max: Infinity, id: 'estrema' },
];

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

export function generaProcedura({ tipoPizza, tipoImpasto, idratazioneTotale, forzaFarina, dati = {}, blend = null, locale = 'it' }) {
    const isEn = locale === 'en';
    const fascia = trovaFasciaIdratazione(idratazioneTotale);
    const passi = [];
    const avvisi = [];

    // --- 0. PREPARAZIONE MISCELA FARINE (se attiva) ---
    if (blend && blend.possibile && blend.pesoForte > 0 && blend.pesoDebole > 0) {
        const wF = blend.dettagli?.wForte || blend.wForte || 350;
        const wD = blend.dettagli?.wDebole || blend.wDebole || 180;
        if (isEn) {
            passi.push(`Flour blend preparation: weigh and sift together ${blend.pesoForte} g of Strong Flour (${wF} W) and ${blend.pesoDebole} g of Weak Flour (${wD} W) to achieve a uniform base at ${blend.wEffettivo} W.`);
        } else {
            passi.push(`Preparazione miscela farine: unisci e setaccia insieme ${blend.pesoForte} g di Farina Forte (${wF} W) e ${blend.pesoDebole} g di Farina Debole (${wD} W) per ottenere una base perfettamente omogenea a ${blend.wEffettivo} W.`);
        }
    }

    const numPanetti = dati.numPanetti || 4;
    const pesoPanetto = dati.pesoPanetto || 250;
    const massa = dati.massa;
    const apretto = dati.apretto;

    // --- 1. PREFERMENTO (se presente) ---
    if (tipoImpasto === 'biga') {
        if (isEn) {
            passi.push(`Prepare the biga: mix ${dati.pesoFarinaBiga} g of strong flour, ${dati.pesoAcquaBiga} g of water, and ${dati.pesoLievitoBiga} g of fresh yeast. Knead briefly until rough and crumbly (do not form a smooth dough). Cover and ferment for 16-20 hours at 16-18°C (61-64°F).`);
        } else {
            passi.push(`Prepara la biga: mescola ${dati.pesoFarinaBiga} g di farina, ${dati.pesoAcquaBiga} g di acqua e ${dati.pesoLievitoBiga} g di lievito fresco. Impasta brevemente fino a ottenere un composto grezzo/sbriciolato (non compatto). Copri e lascia maturare per 16-20 ore a circa 16-18°C.`);
        }
    } else if (tipoImpasto === 'poolish') {
        if (isEn) {
            passi.push(`Prepare the poolish: mix ${dati.pesoFarinaPoolish} g of flour, ${dati.pesoAcquaPoolish} g of water, and ${dati.pesoLievitoPoolish} g of yeast until a smooth liquid batter forms. Cover and ferment for 10-12 hours at room temperature.`);
        } else {
            passi.push(`Prepara il poolish: mescola ${dati.pesoFarinaPoolish} g di farina, ${dati.pesoAcquaPoolish} g di acqua e ${dati.pesoLievitoPoolish} g di lievito fino a formare una pastella liquida e omogenea. Copri e lascia fermentare per 10-12 ore a temperatura ambiente.`);
        }
    } else if (tipoImpasto === 'lievito_madre') {
        if (isEn) {
            passi.push(`Refresh your sourdough starter with ${dati.farinaRinfresco2 || (dati.pesoPastaMadreFinale * 0.4).toFixed(0)} g flour and ${dati.acquaRinfresco2 || (dati.pesoPastaMadreFinale * 0.2).toFixed(0)} g water, letting it ferment until tripled in volume before mixing.`);
        } else {
            passi.push(`Rinfresca il lievito madre con ${dati.farinaRinfresco2 || (dati.pesoPastaMadreFinale * 0.4).toFixed(0)} g di farina e ${dati.acquaRinfresco2 || (dati.pesoPastaMadreFinale * 0.2).toFixed(0)} g di acqua, lasciandolo lievitare fino al triplicamento del volume prima dell'impasto.`);
        }
    } else if (tipoImpasto === 'biga_poolish') {
        if (isEn) {
            passi.push(`Prepare the biga: mix ${dati.pesoFarinaBiga} g flour, ${dati.pesoAcquaBiga} g water, and ${dati.pesoLievitoBiga} g yeast. Ferment 16-20h at 16-18°C.`);
            passi.push(`Prepare the poolish: mix ${dati.pesoFarinaPoolish} g flour, ${dati.pesoAcquaPoolish} g water, and ${dati.pesoLievitoPoolish} g yeast. Ferment 10-12h at room temperature.`);
        } else {
            passi.push(`Prepara la biga: mescola ${dati.pesoFarinaBiga} g di farina, ${dati.pesoAcquaBiga} g di acqua e ${dati.pesoLievitoBiga} g di lievito. Lascia maturare 16-20 ore a 16-18°C.`);
            passi.push(`Prepara il poolish: mescola ${dati.pesoFarinaPoolish} g di farina, ${dati.pesoAcquaPoolish} g di acqua e ${dati.pesoLievitoPoolish} g di lievito. Lascia fermentare 10-12 ore a temperatura ambiente.`);
        }
    }

    // --- 2. MIXING E INCORDATURA ---
    if (tipoImpasto === 'biga' || tipoImpasto === 'poolish' || tipoImpasto === 'biga_poolish' || tipoImpasto === 'lievito_madre') {
        if (isEn) {
            passi.push('Break up the preferment into the bowl (or mixer) with a portion of the main water to loosen it.');
            passi.push('Gradually add the remaining flour, sugar (if used), and oil, starting to knead.');
            passi.push('Add salt towards the end and drizzle remaining water slowly (bassinage) until full gluten development.');
        } else {
            passi.push('Spezzetta il prefermento nella ciotola (o planetaria) con una prima parte dell\'acqua principale per scioglierlo.');
            passi.push('Aggiungi gradualmente la farina restante, lo zucchero (se previsto) e l\'olio, iniziando a impastare.');
            passi.push('Aggiungi il sale verso fine impasto e versa l\'acqua restante a filo poco alla volta, lavorando fino a completa incordatura.');
        }
    } else {
        // Metodo Diretto in base a idratazione
        switch (fascia) {
            case 'bassa':
            case 'media':
                if (isEn) {
                    passi.push('Dissolve yeast in water (reserving 10%). Gradually add flour while mixing, then incorporate salt, oil, and sugar.');
                    passi.push('Knead vigorously for 10-15 minutes until smooth, elastic, and homogeneous.');
                } else {
                    passi.push('Sciogli il lievito nell\'acqua (tenendone da parte un 10%). Aggiungi gradualmente la farina mescolando, poi unisci il sale, l\'olio e l\'eventuale zucchero.');
                    passi.push('Lavora l\'impasto energicamente per 10-15 minuti fino a ottenere una massa liscia, elastica e omogenea.');
                }
                break;
            case 'medio_alta':
                if (isEn) {
                    passi.push('Autolyse: mix all flour with ~70% of the water and rest covered for 20-30 minutes.');
                    passi.push('Add crumbled yeast and knead. Once structure forms, add salt, oil, and remaining water slowly.');
                } else {
                    passi.push('Fai autolisi: mescola tutta la farina con circa il 70% dell\'acqua e lascia riposare per 20-30 minuti coperto.');
                    passi.push('Aggiungi il lievito sbriciolato e impasta. Una volta formata la struttura iniziale, unisci il sale, l\'olio e l\'acqua restante poco alla volta.');
                }
                break;
            case 'alta':
                if (isEn) {
                    passi.push('Autolyse: mix all flour with 70% water and rest covered for 30-45 minutes.');
                    passi.push('Add yeast and begin kneading. Slowly drizzle remaining water (bassinage) only when previous water is absorbed, then add salt and oil.');
                    passi.push('Knead until full gluten development: dough should be shiny, elastic, and clean the bowl sides.');
                } else {
                    passi.push('Fai autolisi: mescola tutta la farina con il 70% dell\'acqua e lascia riposare 30-45 minuti coperto.');
                    passi.push('Aggiungi il lievito e inizia a incordare. Versa l\'acqua rimanente a filo molto lentamente (bassinage) solo quando la precedente è ben assorbita, infine incorpora sale e olio.');
                    passi.push('Lavora fino a incordatura perfetta: l\'impasto deve risultare liscio, lucido e staccarsi completamente dalle pareti della ciotola.');
                }
                break;
            case 'molto_alta':
            case 'estrema':
                if (isEn) {
                    passi.push('Autolyse: mix flour with 60-65% water and rest 45-60 minutes.');
                    passi.push('Add yeast and knead at higher speed (stand mixer/spiral recommended). Drizzle remaining water in 3-4 additions, followed by salt and oil.');
                    passi.push('Perform 1-2 sets of coil / slap & fold stretches at 15-20 min intervals to structure the gluten mesh.');
                } else {
                    passi.push('Fai autolisi: mescola la farina con il 60-65% dell\'acqua e lascia riposare 45-60 minuti.');
                    passi.push('Aggiungi il lievito e incorda ad alta velocità (consigliata planetaria/spirale). Aggiungi l\'acqua restante a filo in 3-4 riprese, seguita da sale e olio a fine impasto.');
                    passi.push('Esegui una o due serie di pieghe di rinforzo (slap & fold o in ciotola) a intervalli di 15-20 minuti per dare struttura alla maglia glutinica.');
                }
                break;
        }
    }

    // --- CONTROLLO TEMPERATURA ---
    if (fascia === 'alta' || fascia === 'molto_alta' || fascia === 'estrema') {
        if (isEn) {
            passi.push('Monitor final dough temperature (ideal 23-25°C / 73-77°F): use chilled fridge water if working with high hydration.');
        } else {
            passi.push('Fai attenzione alla temperatura finale dell\'impasto (ideale 23-25°C): con alte idratazioni usa acqua fredda di frigorifero se necessario.');
        }
    }

    // --- 3. PRIMA LIEVITAZIONE (PUNTATA / MASSA) ---
    if (massa && parseFloat(massa) > 0) {
        if (isEn) {
            passi.push(`Shape into a smooth ball, transfer to a lightly oiled container and cover tightly: rest bulk fermentation for ~${massa} hour(s).`);
        } else {
            passi.push(`Forma una palla liscia, trasferiscila in un contenitore leggermente unto e copri bene: lascia riposare l'impasto in massa per circa ${massa} ora/e.`);
        }
    } else {
        if (isEn) {
            passi.push('Shape into a smooth ball, cover with a bowl and rest bulk fermentation for 45-60 minutes at room temperature (puntata).');
        } else {
            passi.push('Forma una palla liscia, copri a campana e lascia riposare la massa coperta per circa 45-60 minuti a temperatura ambiente (puntata).');
        }
    }

    // --- 4. STAGLIO E APPRETTO (FORMATURA E SECONDA LIEVITAZIONE) ---
    if (tipoPizza === 'pala') {
        if (isEn) {
            passi.push(`Dough dividing (Staglio): divide into ${numPanetti} portion(s) of ${pesoPanetto} g and shape into elongated logs, gently tucking edges.`);
        } else {
            passi.push(`Staglio: rovescia l'impasto sul banco, dividilo in ${numPanetti} porzione/i da ${pesoPanetto} g e forma dei filoncini allungati chiudendo delicatamente i lembi.`);
        }
    } else if (tipoPizza === 'teglia') {
        if (isEn) {
            passi.push(`Dough dividing: divide into ${numPanetti} dough ball(s) of ${pesoPanetto} g, perform a 3-fold letter fold and round gently.`);
        } else {
            passi.push(`Staglio: dividi l'impasto in ${numPanetti} panetto/i da ${pesoPanetto} g, fai una piega a tre e arrotonda delicatamente.`);
        }
    } else if (tipoPizza === 'padellino') {
        if (isEn) {
            passi.push(`Dough dividing: divide into ${numPanetti} ball(s) of ${pesoPanetto} g, roll tight balls and place directly into generously oiled round pans.`);
        } else {
            passi.push(`Staglio: dividi in ${numPanetti} panetto/i da ${pesoPanetto} g, forma delle palline ben tese e posizionale direttamente nei padellini generosamente unti d'olio.`);
        }
    } else {
        if (isEn) {
            passi.push(`Dough dividing: divide into ${numPanetti} balls of ${pesoPanetto} g each, gently rounding (pirlatura) to seal bottom seam.`);
        } else {
            passi.push(`Staglio: dividi l'impasto in ${numPanetti} panetti da ${pesoPanetto} g ciascuno, pirlando delicatamente ogni pallina per chiudere bene il fondo.`);
        }
    }

    if (apretto && parseFloat(apretto) > 0) {
        if (isEn) {
            passi.push(`Final Proof (Appretto): place dough balls in proofing box (or airtight containers) and let rise for ~${apretto} hour(s) until doubled.`);
        } else {
            passi.push(`Appretto: riponi i panetti nell'apposita cassetta per pizza (o contenitori ermetici) e lascia lievitare per circa ${apretto} ora/e fino al raddoppio.`);
        }
    } else {
        if (isEn) {
            passi.push('Final Proof: keep covered in a draft-free spot at room temperature until doubled in volume (approx. 4-6 hours depending on ambient temperature).');
        } else {
            passi.push('Appretto: riponi i panetti coperti in un luogo riparato a temperatura ambiente fino al raddoppio del volume (circa 4-6 ore a seconda della temperatura).');
        }
    }

    // --- 5. STESURA E COTTURA SPECIFICA PER TIPOLOGIA ---
    switch (tipoPizza) {
        case 'napoletana':
            if (isEn) {
                passi.push('Stretching: stretch gently on semolina flour, pushing gases from center outwards to the rim with fingertips, never flattening the edge.');
                passi.push('Baking: bake in high-heat pizza oven at 450-480°C (850-900°F) for 60-90 seconds, or in domestic oven at max (250-300°C) on preheated pizza stone for 4-6 minutes.');
            } else {
                passi.push('Stesura: stendi delicatamente su semola rimacinata spingendo i gas dal centro verso il cornicione esterno con i polpastrelli, senza mai schiacciare il bordo.');
                passi.push('Cottura: inforna nel fornetto per pizza a 450-480°C per 60-90 secondi, oppure in forno domestico statico alla massima temperatura (250-300°C) su pietra refrattaria preriscaldata nella parte più alta per 4-6 minuti.');
            }
            break;
        case 'contemporanea':
            if (isEn) {
                passi.push('Stretching: open dough ball on ample semolina while preserving a pronounced, puffy 2-3 cm cornicione without pressing it.');
                passi.push('Baking: bake at 400-430°C (750-800°F) for 90-120 seconds to achieve an airy honeycomb cornicione, or home oven max on stone for 5-7 minutes.');
            } else {
                passi.push('Stesura: allarga il panetto su abbondante semola preservando un cornicione pronunciato (2-3 cm) senza toccarlo.');
                passi.push('Cottura: cuoci a 400-430°C per circa 90-120 secondi per ottenere un cornicione alveolato e leggero, oppure in forno domestico al massimo su pietra refrattaria per 5-7 minuti.');
            }
            break;
        case 'romana':
            if (isEn) {
                passi.push('Stretching: stretch dough very thin right to the edge (a rolling pin can be used for classic Roman scrocchiarella crunch).');
                passi.push('Baking: bake at 250-300°C for 6-8 minutes until crust is golden, dry, and distinctly crispy.');
            } else {
                passi.push('Stesura: stendi il panetto molto sottile fino al bordo (puoi aiutarti con il mattarello per la tipica pizza tonda romana scrocchiarella).');
                passi.push('Cottura: inforna a 250-300°C per 6-8 minuti fino a quando la base non è dorata, asciutta e marcatamente croccante.');
            }
            break;
        case 'pala':
            if (isEn) {
                passi.push('Stretching: stretch elongated log on semolina dusted surface with gentle finger dimpling and transfer onto peel.');
                passi.push('Baking: bake directly on refractory stone at 280-300°C for 7-10 minutes until crispy outside and tender inside.');
            } else {
                passi.push('Stesura: stendi il filoncino spolverato di semola allungandolo delicatamente con le dita e trasferiscilo sulla pala da infornare.');
                passi.push('Cottura: inforna direttamente su pietra refrattaria a 280-300°C per 7-10 minuti fino a renderla croccante fuori e morbida dentro.');
            }
            break;
        case 'teglia':
            if (isEn) {
                passi.push('Stretching: open dough on semolina dusted bench, stretch evenly to pan size, and lay into lightly oiled sheet pan.');
                passi.push('Baking: bake at bottom oven rack at 250°C for 10-12 minutes with sauce base, then move to upper rack for 4-6 minutes after adding mozzarella.');
            } else {
                passi.push('Stesura: stendi l\'impasto su piano spolverato di semola, allargalo uniformemente fino alle dimensioni della teglia e trasferiscilo nella teglia unta con un filo d\'olio.');
                passi.push('Cottura: inforna nella parte bassa del forno a 250°C per 10-12 minuti con solo pomodoro/base, poi sposta al centro/alto per altri 4-6 minuti dopo aver aggiunto la mozzarella.');
            }
            break;
        case 'padellino':
            if (isEn) {
                passi.push('Stretching: gently spread dough with fingertips directly inside the round pan until it covers the bottom evenly.');
                passi.push('Baking: bake at 230-250°C for 10-14 minutes for a crispy fried crust with a tall, fluffy interior crumb.');
            } else {
                passi.push('Stesura: allarga l\'impasto con la punta delle dita direttamente all\'interno del padellino fino a coprire tutta la superficie.');
                passi.push('Cottura: inforna a 230-250°C per 10-14 minuti fino a ottenere una base croccante e fritta nell\'olio con interno soffice e alto.');
            }
            break;
        default:
            if (isEn) {
                passi.push('Stretching: stretch dough balls gently according to your preferred style.');
                passi.push('Baking: bake in well preheated oven at maximum available temperature.');
            } else {
                passi.push('Stesura: stendi i panetti delicatamente secondo la preferenza.');
                passi.push('Cottura: cuoci in forno ben preriscaldato alla massima temperatura disponibile.');
            }
            break;
    }

    // --- 6. AVVISI TECNICI ---
    if (fascia === 'estrema') {
        if (isEn) {
            avvisi.push('Above 85% hydration, actual pizza benefits (vs 80%) are marginal: it is an advanced technical challenge requiring experienced dough handling.');
        } else {
            avvisi.push('Oltre l\'85% di idratazione i benefici concreti per la pizza (rispetto all\'80%) sono limitati: è una scelta tecnica impegnativa che richiede manualità esperta.');
        }
    }

    const wMinimo = W_MINIMO_PER_FASCIA[fascia];
    if (forzaFarina && forzaFarina < wMinimo) {
        const scarto = wMinimo - forzaFarina;
        if (isEn) {
            if (scarto <= 30) {
                avvisi.push(`Selected flour (W ${forzaFarina}) is slightly below recommended strength (~${wMinimo} W) for this hydration: dough may be less extensible.`);
            } else if (scarto <= 80) {
                avvisi.push(`Selected flour (W ${forzaFarina}) is below recommended strength (~${wMinimo} W) for this hydration. Consider reducing hydration or using stronger flour.`);
            } else {
                avvisi.push(`Selected flour (W ${forzaFarina}) is significantly below recommended strength (~${wMinimo} W): risk of dough breakdown during proofing.`);
            }
        } else {
            if (scarto <= 30) {
                avvisi.push(`La farina scelta (W ${forzaFarina}) è leggermente sotto il W consigliato (~${wMinimo}) per questa idratazione: l'impasto sarà probabilmente meno estensibile del previsto.`);
            } else if (scarto <= 80) {
                avvisi.push(`La farina scelta (W ${forzaFarina}) è sotto il W consigliato (~${wMinimo}) per questa idratazione. Valuta di scendere di idratazione o di usare una farina più forte.`);
            } else {
                avvisi.push(`La farina scelta (W ${forzaFarina}) è molto sotto il W consigliato (~${wMinimo}) per questa idratazione: il rischio concreto è un impasto sfaldato, non solo "più difficile" da lavorare.`);
            }
        }
    }

    return { passi, avvisi };
}
