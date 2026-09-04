// print-engine.js
// Gestione della stampa professionale in formato A4 / Scheda da banco per cucina.
import { getSavedLocale } from './i18n-engine.js';

export function stampaSchedaRicetta(datiRicetta) {
    if (!datiRicetta) {
        alert('Calcola prima una ricetta per poterla stampare.');
        return;
    }

    const isEn = getSavedLocale() === 'en';

    // Raccoglie i dati formattati
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
        window.print();
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html lang="${isEn ? 'en' : 'it'}">
        <head>
            <meta charset="UTF-8">
            <title>PizzaLab — ${datiRicetta.titolo || 'Scheda Impasto'}</title>
            <style>
                @page { size: A4 portrait; margin: 15mm; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    color: #111;
                    background: #fff;
                    margin: 0;
                    padding: 20px;
                    line-height: 1.4;
                    font-size: 13pt;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #ff5226;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                }
                .logo { font-size: 22pt; font-weight: 800; color: #ff5226; letter-spacing: -0.5px; }
                .subtitle { font-size: 11pt; color: #666; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .box { border: 1px solid #ddd; border-radius: 8px; padding: 14px; background: #fafafa; }
                .box h3 { margin: 0 0 10px 0; font-size: 13pt; color: #ff5226; border-bottom: 1px solid #eee; padding-bottom: 4px; }
                table { width: 100%; border-collapse: collapse; font-size: 12pt; }
                table td, table th { padding: 6px 8px; border-bottom: 1px solid #eee; }
                table th { text-align: left; color: #555; }
                .steps { margin-top: 15px; }
                .steps ol { padding-left: 20px; margin: 8px 0; }
                .steps li { margin-bottom: 8px; }
                .footer { margin-top: 30px; font-size: 9pt; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">🍕 PizzaLab</div>
                    <div class="subtitle">${isEn ? 'Scientific Dough Sheet & Baking Guide' : 'Scheda Tecnica Impasto & Guida alla Cottura'}</div>
                </div>
                <div style="text-align: right; font-size: 10pt; color: #555;">
                    <div>${new Date().toLocaleDateString(isEn ? 'en-US' : 'it-IT')}</div>
                    <strong>pizzalab.pizza</strong>
                </div>
            </div>

            <h2 style="margin: 0 0 15px 0; font-size: 18pt;">${datiRicetta.titolo}</h2>

            <div class="grid-2">
                <div class="box">
                    <h3>⚖️ ${isEn ? 'Ingredients (Accurate Doses)' : 'Dosi e Ingredienti'}</h3>
                    <table>
                        <tbody>
                            ${(datiRicetta.ingredienti || []).map((ing) => `
                                <tr>
                                    <td><strong>${ing.nome}</strong></td>
                                    <td style="text-align: right; font-weight: 700; color: #ff5226;">${ing.quantita}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="box">
                    <h3>🌡️ ${isEn ? 'Key Parameters' : 'Parametri di Lavoro'}</h3>
                    <table>
                        <tbody>
                            <tr><td>${isEn ? 'Total Hydration' : 'Idratazione Totale'}</td><td style="text-align:right; font-weight:700;">${datiRicetta.idratazione || '65%'}</td></tr>
                            <tr><td>${isEn ? 'Dough Balls' : 'Numero Panetti'}</td><td style="text-align:right; font-weight:700;">${datiRicetta.panetti || '4'} × ${datiRicetta.peso || '250g'}</td></tr>
                            <tr><td>${isEn ? 'Total Time' : 'Tempo Totale'}</td><td style="text-align:right; font-weight:700;">${datiRicetta.tempo || '24h'}</td></tr>
                            <tr><td>${isEn ? 'Suggested Flour W' : 'Forza Farina'}</td><td style="text-align:right; font-weight:700;">${datiRicetta.forza || 'W 270'}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            ${datiRicetta.passi ? `
                <div class="box steps">
                    <h3>👨‍🍳 ${isEn ? 'Step-by-Step Procedure' : 'Procedura di Lavorazione'}</h3>
                    <ol>
                        ${datiRicetta.passi.map((p) => `<li>${p}</li>`).join('')}
                    </ol>
                </div>
            ` : ''}

            <div class="footer">
                Generato da PizzaLab — Il laboratorio digitale della pizza perfetta (https://pizzalab.pizza)
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}
