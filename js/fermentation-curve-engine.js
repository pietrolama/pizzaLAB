// fermentation-curve-engine.js
// Generatore di curve di fermentazione e sviluppo gas SVG interattive.
import { getSavedLocale } from './i18n-engine.js';

export function generaCurvaFermentazioneSVG({ oreTotali, oreFrigo, tempAmbiente, idratazione, metodo }) {
    const isEn = getSavedLocale() === 'en';
    const totalHours = Math.max(2, oreTotali || 24);
    const fridgeHours = Math.min(totalHours - 1, oreFrigo || 0);
    const roomHours = Math.max(1, totalHours - fridgeHours);

    // Dimensioni canvas SVG
    const width = 760;
    const height = 240;
    const padX = 50;
    const padY = 35;
    const graphW = width - padX * 2;
    const graphH = height - padY * 2;

    // Calcolo punti temporali (passo orario)
    const pointsCount = 40;
    const points = [];

    // Tasso di fermentazione relativo (il frigo rallenta di circa 7x l'attività enzimatica)
    const rateRoom = Math.pow(1.08, (tempAmbiente - 18));
    const rateFridge = 0.15;

    let cumulativeGas = 0;
    const roomBulkHours = fridgeHours > 0 ? 2 : roomHours * 0.4;
    const finalProofHours = fridgeHours > 0 ? Math.max(2, roomHours - roomBulkHours) : roomHours * 0.6;

    for (let i = 0; i <= pointsCount; i++) {
        const t = (i / pointsCount) * totalHours;
        let rate = rateRoom;

        if (fridgeHours > 0) {
            if (t > roomBulkHours && t <= (roomBulkHours + fridgeHours)) {
                rate = rateFridge;
            } else {
                rate = rateRoom;
            }
        }

        // Incremento gas logistico / sigmoide
        const timeStep = totalHours / pointsCount;
        cumulativeGas += rate * timeStep * 1.8;
        
        // Curva normalizzata 0-100% con picco ottimale verso la fine
        const normalizedVolume = Math.min(100, Math.pow(cumulativeGas / (totalHours * 1.1), 0.85) * 100);
        points.push({ t, volume: normalizedVolume });
    }

    // Costruzione stringa path SVG
    const dPath = points.map((p, i) => {
        const x = padX + (p.t / totalHours) * graphW;
        const y = height - padY - (p.volume / 100) * graphH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

    const fillPath = `${dPath} L ${(padX + graphW).toFixed(1)} ${(height - padY).toFixed(1)} L ${padX} ${(height - padY).toFixed(1)} Z`;

    // Finestra ottimale di infornata (85% - 98% dello sviluppo)
    const peakStart = totalHours * 0.88;
    const peakEnd = totalHours * 1.0;
    const peakStartX = padX + (peakStart / totalHours) * graphW;
    const peakEndX = padX + (peakEnd / totalHours) * graphW;

    return `
        <div class="fermentation-chart-card">
            <div class="fermentation-chart-header">
                <div>
                    <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-main);">📈 ${isEn ? 'Dynamic Fermentation & Gas Curve' : 'Curva Dinamica di Fermentazione & Gas'}</h4>
                    <p style="margin: 2px 0 0; font-size: 0.82rem; color: var(--text-muted);">${isEn ? 'Visual model of enzymatic activity and dough maturation over time' : 'Modello visuale dell’attività enzimatica e maturazione dell’impasto nel tempo'}</p>
                </div>
                <span class="blend-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">
                    ${isEn ? 'Peak Window at ~' + totalHours + 'h' : 'Finestra di infornata a ~' + totalHours + 'h'}
                </span>
            </div>

            <div style="overflow-x: auto; margin-top: 12px;">
                <svg viewBox="0 0 ${width} ${height}" class="fermentation-svg" style="width: 100%; min-width: 540px; height: auto;" role="img" aria-label="Grafico Fermentazione">
                    <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#ff5226" stop-opacity="0.45"/>
                            <stop offset="100%" stop-color="#ff5226" stop-opacity="0.0"/>
                        </linearGradient>
                    </defs>

                    <!-- Griglia e assi -->
                    <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                    <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

                    <!-- Finestra picco ottimale -->
                    <rect x="${peakStartX}" y="${padY}" width="${peakEndX - peakStartX}" height="${graphH}" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="3,3"/>
                    <text x="${(peakStartX + peakEndX) / 2}" y="${padY + 18}" fill="#34d399" font-size="11" font-weight="700" text-anchor="middle">
                        ${isEn ? '⭐ Optimal Baking Window' : '⭐ Finestra di Infornata Ideale'}
                    </text>

                    <!-- Zona frigo se presente -->
                    ${fridgeHours > 0 ? `
                        <rect x="${padX + (roomBulkHours / totalHours) * graphW}" y="${padY + 30}" width="${(fridgeHours / totalHours) * graphW}" height="${graphH - 30}" fill="rgba(59, 130, 246, 0.08)" stroke="rgba(59, 130, 246, 0.25)"/>
                        <text x="${padX + ((roomBulkHours + fridgeHours / 2) / totalHours) * graphW}" y="${padY + 48}" fill="#60a5fa" font-size="10" font-weight="600" text-anchor="middle">
                            ❄️ ${isEn ? 'Cold Retard (4°C)' : 'Maturazione Frigo (4°C)'}
                        </text>
                    ` : ''}

                    <!-- Area e Linea Curva -->
                    <path d="${fillPath}" fill="url(#curveGradient)" />
                    <path d="${dPath}" fill="none" stroke="#ff5226" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

                    <!-- Etichette Asse X -->
                    <text x="${padX}" y="${height - 12}" fill="var(--text-muted)" font-size="10" text-anchor="middle">0h (${isEn ? 'Start' : 'Impasto'})</text>
                    <text x="${padX + graphW / 2}" y="${height - 12}" fill="var(--text-muted)" font-size="10" text-anchor="middle">${(totalHours / 2).toFixed(0)}h</text>
                    <text x="${padX + graphW}" y="${height - 12}" fill="#ff5226" font-size="10" font-weight="700" text-anchor="middle">${totalHours}h (${isEn ? 'Bake' : 'Cottura'})</text>

                    <!-- Etichette Asse Y -->
                    <text x="${padX - 8}" y="${padY + 8}" fill="var(--text-muted)" font-size="9" text-anchor="end">${isEn ? 'Max Vol' : 'Max Vol'}</text>
                    <text x="${padX - 8}" y="${height - padY}" fill="var(--text-muted)" font-size="9" text-anchor="end">0</text>
                </svg>
            </div>
        </div>
    `;
}
