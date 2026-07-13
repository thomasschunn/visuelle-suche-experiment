function berechneDrift(runde) {
    if (runde <= RUNDEN_OHNE_DRIFT) return 0.0;
    const startWert = 0.05; 
    const wachstumsRate = 0.1; 
    return startWert * Math.exp(wachstumsRate * (runde - RUNDEN_OHNE_DRIFT));
}

function renderRing(containerId, originalX, originalY, elementSize, driftRatio, zeichenObjekt = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const radius = (elementSize === 'groß') ? (19 * 1.6) : (12 * 1.6);
    const diameter = radius * 2;
    const driftAngle = Math.PI / 4; 
    const offsetPixels = radius * driftRatio; 
    
    const currentX = originalX + (Math.cos(driftAngle) * offsetPixels);
    const currentY = originalY + (Math.sin(driftAngle) * offsetPixels);

    const ringElement = document.createElement('div');
    ringElement.classList.add('ki-ring'); 
    ringElement.style.width = diameter + 'px';
    ringElement.style.height = diameter + 'px';
    ringElement.style.left = currentX + 'px';
    ringElement.style.top = currentY + 'px';

    ringElement.addEventListener('click', function(e) {
        e.stopPropagation(); 
        ringElement.remove();
        if (zeichenObjekt) zeichenObjekt.hat_ring = false;
    });

    container.appendChild(ringElement);
}

/**
 * Bereitet die Daten vor. Nutzt jetzt feste Fehler aus der CSV und die User-Config.
 */
function ladeTabelleUndBereiteVor(csvDateiPfad, aktuelleRunde, isTraining, callback) {
    Papa.parse(csvDateiPfad, {
        download: true,
        header: true,
        dynamicTyping: true, 
        complete: function(results) {
            aktuelleZeichenDaten = results.data.filter(z => z.shape);
            
            // 1. Grundzustand & feste Fehler aus der CSV übernehmen
            aktuelleZeichenDaten.forEach(z => {
                z.hat_ring = false; 
                z.wird_verschoben = false; 
                
                const isBlueL = (z.shape === 'L' && z.color_hex === '#0064FF');
                const isOrangeO = (z.shape === 'O' && z.color_hex === '#FF8C00');
                z.ist_ziel = (isBlueL || isOrangeO);
                
                // Im Training: Nichts markiert. In der Hauptrunde: Exakt das, was die CSV sagt!
                // Wenn die Spalte 'ki_markiert' fehlt, fällt er auf z.ist_ziel zurück (für alte CSVs)
                z.ki_setzt_ring = isTraining ? false : (z.ki_markiert !== undefined ? z.ki_markiert : z.ist_ziel); 
            });

            // 2. Logik anwenden (Nur für Hauptrunden)
            if (!isTraining) {
                const aktuellerDrift = berechneDrift(aktuelleRunde);
                let ausgewaehlteDrifter = [];
                
                // Drift-Elemente bestimmen (aus kleinen Ringen)
                if (aktuellerDrift > 0) {
                    let kandidaten = aktuelleZeichenDaten.filter(z => z.ki_setzt_ring && (z.is_small === true || z.is_small === "True"));
                    ausgewaehlteDrifter = kandidaten.sort(() => 0.5 - Math.random()).slice(0, ANZAHL_DRIFT_RINGE);
                    ausgewaehlteDrifter.forEach(z => z.wird_verschoben = true);
                }

                // Einordnung in Render-Gruppen (1-5) basierend auf der Probanden-Config
                aktuelleZeichenDaten.forEach(z => {
                    if (ausgewaehlteDrifter.includes(z)) {
                        z.render_gruppe = 5; // Drifter IMMER im letzten Schritt!
                    } else if (z.ki_setzt_ring) {
                        // Die Kaskaden-Logik für die Illusion:
                        const isBgMatch = (probandenConfig.bg === 'dark' && z.bg_dark) || (probandenConfig.bg === 'light' && !z.bg_dark);
                        const isColorMatch = (probandenConfig.color === 'orange' && z.color_hex === '#FF8C00') || (probandenConfig.color === 'blue' && z.color_hex === '#0064FF');
                        const isShapeMatch = (probandenConfig.shape === 'round' && (z.shape === 'O' || z.shape === 'Q')) || (probandenConfig.shape === 'angular' && (z.shape === 'L' || z.shape === 'T'));
                        const isSizeMatch = (probandenConfig.size === 'small' && (z.is_small === true || z.is_small === "True")) || (probandenConfig.size === 'large' && (z.is_small === false || z.is_small === "False"));

                        if (isBgMatch) {
                            z.render_gruppe = 1;
                        } else if (isColorMatch) {
                            z.render_gruppe = 2;
                        } else if (isShapeMatch) {
                            z.render_gruppe = 3;
                        } else if (isSizeMatch) {
                            z.render_gruppe = 4;
                        } else {
                            // Wenn gar nichts passt -> Sammelbecken
                            z.render_gruppe = 5; 
                        }
                    }
                });
            }

            if (callback) callback();
        },
        error: function(err) { console.error("Fehler beim Laden:", err); }
    });
}