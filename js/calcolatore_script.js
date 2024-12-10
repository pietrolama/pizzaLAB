// Funzione per calcolare il piano di lavoro per qualsiasi metodo di impasto
function generaPianoGenerico() {
    const infornataElement = document.getElementById('infornata');
    const tipoImpastoElement = document.getElementById('tipo_impasto');

    if (!infornataElement || !tipoImpastoElement) {
        console.error('Gli elementi infornata o tipo_impasto non esistono nel DOM.');
        alert('Errore: campi mancanti nel modulo!');
        return;
    }

    const infornataTimeInput = infornataElement.value;
    const tipoImpasto = tipoImpastoElement.value;

    if (!infornataTimeInput) {
        alert('Inserisci un orario di infornata!');
        return;
    }

    // Converti l'orario di infornata in un oggetto Date
    const today = new Date();
    const [hours, minutes] = infornataTimeInput.split(':').map(Number);
    const infornataTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

    let plan;
    switch (tipoImpasto) {
        case 'diretto':
            const totalLievitazione = parseFloat(document.getElementById(`tempoLievTotale_${tipoImpasto}`).value);
            const tempoFrigo = parseFloat(document.getElementById(`tempoFrigo_${tipoImpasto}`).value) || 0;
            if (isNaN(totalLievitazione) || totalLievitazione <= 0) {
                alert('Inserisci un tempo di lievitazione valido!');
                return;
            }
            plan = calculatePlanDiretto(infornataTime, totalLievitazione, tempoFrigo);
            break;
        case 'biga':
            const percentualeBiga = parseFloat(document.getElementById('percentuale_biga').value);
            if (isNaN(percentualeBiga) || percentualeBiga <= 0) {
                alert('Inserisci una percentuale di biga valida!');
                return;
            }
            plan = calculatePlanBiga(infornataTime, percentualeBiga);
            break;
        case 'poolish':
            const percentualePoolish = parseFloat(document.getElementById('percentuale_poolish').value);
            if (isNaN(percentualePoolish) || percentualePoolish <= 0) {
                alert('Inserisci una percentuale di poolish valida!');
                return;
            }
            plan = calculatePlanPoolish(infornataTime, percentualePoolish);
            break;
        case 'lievito_madre':
            const percentualeLievitoMadre = parseFloat(document.getElementById('percentuale_lievito').value);
            if (isNaN(percentualeLievitoMadre) || percentualeLievitoMadre <= 0) {
                alert('Inserisci una percentuale di lievito madre valida!');
                return;
            }
            plan = calculatePlanLievitoMadre(infornataTime, percentualeLievitoMadre);
            break;
        case 'biga_poolish':
            const percentualeBigaBp = parseFloat(document.getElementById('percentuale_biga_bp').value);
            const percentualePoolishBp = parseFloat(document.getElementById('percentuale_poolish_bp').value);
            if (isNaN(percentualeBigaBp) || isNaN(percentualePoolishBp) || percentualeBigaBp <= 0 || percentualePoolishBp <= 0) {
                alert('Inserisci percentuali valide per biga e poolish!');
                return;
            }
            plan = calculatePlanBigaPoolish(infornataTime, percentualeBigaBp, percentualePoolishBp);
            break;
        default:
            alert('Metodo di impasto non riconosciuto!');
            return;
    }

    if (!plan) {
        alert('Errore nella generazione del piano di lavoro!');
        return;
    }

    // Aggiorna il DOM
    const planBox = document.getElementById('plan-box');
    const planList = document.getElementById('plan-list');
    planList.innerHTML = '';

    plan.forEach(step => {
        const li = document.createElement('li');
        li.textContent = `${step.time}: ${step.action}`;
        planList.appendChild(li);
    });

    // Rimuovi la classe hidden e aggiungi active
    planBox.classList.remove('hidden');
    setTimeout(() => planBox.classList.add('active'), 10); // Ritardo per triggerare l'animazione
}

// Funzioni per calcolare i piani di lavoro specifici
function calculatePlanDiretto(infornataTime, totalLievitazione, tempoFrigo) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    // Aggiungi l'azione "Inforna adesso"
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    // Seconda lievitazione (30% del tempo totale)
    const secondLievitazioneMs = (totalLievitazione * 0.3) * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - secondLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizio della seconda lievitazione."
    });

    // Prima lievitazione (70% del tempo totale)
    const firstLievitazioneMs = (totalLievitazione * 0.7) * 60 * 60 * 1000;
    if (tempoFrigo > 0) {
        const tempoFrigoMs = tempoFrigo * 60 * 60 * 1000;
        currentTime = new Date(currentTime.getTime() - tempoFrigoMs);
        plan.push({
            time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: "Togli l'impasto dal frigorifero e lascia riposare a temperatura ambiente."
        });

        const remainingLievitazioneMs = firstLievitazioneMs - tempoFrigoMs;
        currentTime = new Date(currentTime.getTime() - remainingLievitazioneMs);
        plan.push({
            time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: "Metti l'impasto in frigorifero."
        });
    } else {
        currentTime = new Date(currentTime.getTime() - firstLievitazioneMs);
        plan.push({
            time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: "Inizio della prima lievitazione."
        });
    }

    // Preparazione dell'impasto
    const prepTimeMs = 30 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - prepTimeMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Prepara l'impasto."
    });

    return plan.reverse();
}

function calculatePlanBiga(infornataTime, percentualeBiga) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    let raddoppioHours;
    if (percentualeBiga <= 30) {
        raddoppioHours = 6;
    } else if (percentualeBiga >= 70) {
        raddoppioHours = 3;
    } else {
        raddoppioHours = 4.5;
    }

    const raddoppioMs = raddoppioHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - raddoppioMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Attendi il raddoppio dell'impasto."
    });

    const bigaLievitazioneHours = 16;
    const bigaLievitazioneMs = bigaLievitazioneHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - bigaLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione della biga."
    });

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Prepara l'impasto con la biga."
    });

    return plan.reverse();
}

function calculatePlanPoolish(infornataTime, percentualePoolish) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    let raddoppioHours;
    if (percentualePoolish <= 30) {
        raddoppioHours = 6;
    } else if (percentualePoolish >= 70) {
        raddoppioHours = 3;
    } else {
        raddoppioHours = 4.5;
    }

    const raddoppioMs = raddoppioHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - raddoppioMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Attendi il raddoppio dell'impasto."
    });

    const poolishLievitazioneHours = 12;
    const poolishLievitazioneMs = poolishLievitazioneHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - poolishLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione del poolish."
    });

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Prepara l'impasto con il poolish."
    });

    return plan.reverse();
}

function calculatePlanLievitoMadre(infornataTime, percentualeLievitoMadre) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    let raddoppioHours;
    if (percentualeLievitoMadre <= 30) {
        raddoppioHours = 7;
    } else if (percentualeLievitoMadre >= 70) {
        raddoppioHours = 4;
    } else {
        raddoppioHours = 5.5;
    }

    const raddoppioMs = raddoppioHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - raddoppioMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Attendi il raddoppio dell'impasto."
    });

    const lievitoMadreLievitazioneHours = 8;
    const lievitoMadreLievitazioneMs = lievitoMadreLievitazioneHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - lievitoMadreLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione del lievito madre."
    });

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Prepara l'impasto con il lievito madre."
    });

    return plan.reverse();
}

function calculatePlanBigaPoolish(infornataTime, percentualeBiga, percentualePoolish) {
    const plan = [];
    let currentTime = new Date(infornataTime);

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inforna adesso."
    });

    let raddoppioHours;
    const percentualeMedia = (percentualeBiga + percentualePoolish) / 2;
    if (percentualeMedia <= 30) {
        raddoppioHours = 6;
    } else if (percentualeMedia >= 70) {
        raddoppioHours = 3;
    } else {
        raddoppioHours = 4.5;
    }

    const raddoppioMs = raddoppioHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - raddoppioMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Attendi il raddoppio dell'impasto."
    });

    const combinedLievitazioneHours = 10;
    const combinedLievitazioneMs = combinedLievitazioneHours * 60 * 60 * 1000;
    currentTime = new Date(currentTime.getTime() - combinedLievitazioneMs);
    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Inizia la lievitazione combinata di biga e poolish."
    });

    plan.push({
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Prepara l'impasto con biga e poolish."
    });

    return plan.reverse();
}
