// pizza-card-engine.js
// Genera su Canvas HTML5 un'immagine grafica ad alta risoluzione (1080x1080)
// pronta per essere scaricata o condivisa su WhatsApp, Instagram e social.

export async function generaPizzaCardBlob({
    tipoPizza = 'Napoletana',
    tipoImpasto = 'Diretto',
    idratazione = 65,
    numPanetti = 4,
    pesoPanetto = 250,
    totali = {},
    forzaFarina = 260,
    blend = null,
    tempAmbiente = 22,
    oreTotali = 24,
    oreFrigo = 18,
}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 1. Sfondo scuro con gradiente moderno
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#0c0e14');
    bgGrad.addColorStop(0.5, '#121422');
    bgGrad.addColorStop(1, '#08090c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Glow arancione in alto a destra
    const glowGrad = ctx.createRadialGradient(900, 150, 10, 900, 150, 450);
    glowGrad.addColorStop(0, 'rgba(255, 82, 38, 0.25)');
    glowGrad.addColorStop(1, 'rgba(255, 82, 38, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Glow blu in basso a sinistra
    const glowBlue = ctx.createRadialGradient(150, 900, 10, 150, 900, 400);
    glowBlue.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
    glowBlue.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = glowBlue;
    ctx.fillRect(0, 0, 1080, 1080);

    // Bordo decorativo card
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1000, 1000);

    // 2. Header: Logo & Brand
    ctx.fillStyle = '#ff5226';
    ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PIZZALAB', 80, 110);

    ctx.fillStyle = '#9aa0ad';
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SCHEDA TECNICA IMPASTO', 80, 140);

    // Data in alto a destra
    const dataStr = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    ctx.textAlign = 'right';
    ctx.fillText(dataStr, 1000, 110);
    ctx.textAlign = 'left';

    // Linea divisoria
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(80, 170);
    ctx.lineTo(1000, 170);
    ctx.stroke();

    // 3. Titolo Pizza & Badge Metodo
    ctx.fillStyle = '#f5f6f8';
    ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const titoloFormattato = tipoPizza.toUpperCase();
    ctx.fillText(titoloFormattato, 80, 245);

    // Badge Metodo
    const badgeText = `${tipoImpasto.toUpperCase()} · ${numPanetti}x ${pesoPanetto}g`;
    ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 30;
    ctx.fillStyle = 'rgba(255, 82, 38, 0.15)';
    ctx.strokeStyle = 'rgba(255, 82, 38, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 270, badgeWidth, 38, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff7a50';
    ctx.fillText(badgeText, 95, 296);

    // 4. Hero Highlight: Idratazione & Parametri Chiave (Box Grande)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(80, 340, 920, 170, 16);
    ctx.fill();
    ctx.stroke();

    // Idratazione Stat
    ctx.fillStyle = '#9aa0ad';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('IDRATAZIONE', 120, 390);

    ctx.fillStyle = '#ff5226';
    ctx.font = '900 68px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${idratazione}%`, 120, 465);

    // Ore Lievitazione Stat
    ctx.fillStyle = '#9aa0ad';
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('TEMPO TOTALE', 450, 390);

    ctx.fillStyle = '#f5f6f8';
    ctx.font = '900 60px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${oreTotali}h`, 450, 465);

    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9aa0ad';
    ctx.fillText(`(${oreFrigo}h frigo · ${tempAmbiente}°C TA)`, 560, 460);

    // 5. Griglia Ingredienti (4 Box)
    const ingredienti = [
        { label: 'FARINA TOTALE', val: `${Math.round(totali.farina || 0)} g`, sub: `Forza: W ${forzaFarina}` },
        { label: 'ACQUA', val: `${Math.round(totali.acqua || 0)} g`, sub: `${idratazione}% sul peso farina` },
        { label: 'SALE', val: `${Math.round(totali.sale || 0)} g`, sub: `${((totali.sale / totali.farina) * 100 || 2.8).toFixed(1)}%` },
        { label: 'LIEVITO', val: `${(totali.lievito || 0).toFixed(2)} g`, sub: 'Fresco di birra' },
    ];

    const boxW = 445;
    const boxH = 110;
    const coords = [
        [80, 540],
        [555, 540],
        [80, 670],
        [555, 670],
    ];

    ingredienti.forEach((ing, i) => {
        const [x, y] = coords[i];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#9aa0ad';
        ctx.font = '700 15px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(ing.label, x + 25, y + 38);

        ctx.fillStyle = '#f5f6f8';
        ctx.font = '900 32px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(ing.val, x + 25, y + 80);

        ctx.fillStyle = '#676d7a';
        ctx.font = '600 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(ing.sub, x + boxW - 25, y + 80);
        ctx.textAlign = 'left';
    });

    // 6. Sezione Blend Farine (se presente) o Note Tecniche
    if (blend && blend.possibile && blend.pesoForte > 0 && blend.pesoDebole > 0) {
        ctx.fillStyle = 'rgba(255, 82, 38, 0.06)';
        ctx.strokeStyle = 'rgba(255, 82, 38, 0.3)';
        ctx.beginPath();
        ctx.roundRect(80, 810, 920, 115, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff7a50';
        ctx.font = '800 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`🌾 TAGLIO FARINE (${blend.wEffettivo} W — ~${blend.proteineEffettive}% proteine)`, 110, 845);

        ctx.fillStyle = '#f5f6f8';
        ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(`🔴 Farina Forte (${blend.dettagli?.wForte || 350}W): ${blend.pesoForte}g (${blend.percentualeForte}%)`, 110, 888);
        ctx.fillText(`🔵 Farina Debole (${blend.dettagli?.wDebole || 180}W): ${blend.pesoDebole}g (${blend.percentualeDebole}%)`, 540, 888);
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(80, 810, 920, 115, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#9aa0ad';
        ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('CONSIGLI DI LAVORAZIONE', 110, 848);

        ctx.fillStyle = '#f5f6f8';
        ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Chiusura impasto consigliata a 23-25°C · Maturazione controllata a 4°C', 110, 888);
    }

    // 7. Footer Brand & URL
    ctx.fillStyle = '#676d7a';
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Generato su pizzalab.pizza — Il Laboratorio della Pizza Perfetta', 80, 985);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}
