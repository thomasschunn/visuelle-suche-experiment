/**
 * BERECHNUNG DES DRIFTS
 */
function berechneDrift(runde) {
    if (runde <= RUNDEN_OHNE_DRIFT) return 0.0;
    const startWert = 0.05; 
    const wachstumsRate = 0.1; 
    return startWert * Math.exp(wachstumsRate * (runde - RUNDEN_OHNE_DRIFT));
}

/**
 * ZEICHNEN DER RINGE (inkl. Skalierung und Versatz für den Drift)
 */
function renderRing(containerId, originalX, originalY, elementSize, driftRatio, zeichenObjekt = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Skalierungsfaktor des aktuellen Bildschirms berechnen
    const rect = container.getBoundingClientRect();
    const scale = rect.width ? (rect.width / ORIGINAL_BILD_BREITE) : 1;

    // 2. Originalgrößen berechnen
    const originalRadius = (elementSize === 'groß') ? (19 * 1.6 * 2) : (12 * 1.6 * 2);
    const originalDiameter = originalRadius * 2;
    const driftAngle = Math.PI / 4; 
    const originalOffset = originalRadius * driftRatio; 
    
    // 3. Position mit Drift im Original berechnen
    const originX_withDrift = originalX + (Math.cos(driftAngle) * originalOffset);
    const originY_withDrift = originalY + (Math.sin(driftAngle) * originalOffset);

    // 4. Alles für die finale Bildschirmdarstellung skalieren
    const currentX = originX_withDrift * scale;
    const currentY = originY_withDrift * scale;
    const currentDiameter = originalDiameter * scale;

    const ringElement = document.createElement('div');
    ringElement.classList.add('ki-ring'); 
    ringElement.style.position = 'absolute'; // Wichtig für Skalierung
    ringElement.style.width = currentDiameter + 'px';
    ringElement.style.height = currentDiameter + 'px';
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
 * LADEN DER CSV UND ZUWEISEN DER LOGIK
 */
function ladeTabelleUndBereiteVor(csvDateiPfad, aktuelleRunde, isTraining, callback) {
    Papa.parse(csvDateiPfad, {
        download: true,
        header: true,
        dynamicTyping: true, 
        complete: function(results) {
            aktuelleZeichenDaten = results.data.filter(z => z.shape);
            
            // HILFSFUNKTION: JS liest das Wort "False" aus Excel oft als Text. Text = immer wahr!
            // Diese Funktion macht aus dem Text echte Wahrheitswerte.
            const isTrue = (val) => val === true || val === "True" || val === "true" || val === 1;

            aktuelleZeichenDaten.forEach(z => {
                // 1. Variablen bereinigen! 
                z.is_small = isTrue(z.is_small);
                z.bg_dark = isTrue(z.bg_dark);

                z.hat_ring = false; 
                z.wird_verschoben = false; 
                
                const isBlueL = (z.shape === 'L' && z.color_hex === '#0064FF');
                const isOrangeO = (z.shape === 'O' && z.color_hex === '#FF8C00');
                z.ist_ziel = (isBlueL || isOrangeO);
                
                // 2. Auslesen der Spalte "bekommt_kreis" von deinem Kollegen
                let markiert = z.ist_ziel; // Fallback, falls die Spalte mal fehlt
                if (z.bekommt_kreis !== undefined) {
                    markiert = isTrue(z.bekommt_kreis);
                }
                
                z.ki_setzt_ring = isTraining ? false : markiert; 
            });

            if (!isTraining) {
                const aktuellerDrift = berechneDrift(aktuelleRunde);
                let ausgewaehlteDrifter = [];
                
                if (aktuellerDrift > 0) {
                    let kandidaten = aktuelleZeichenDaten.filter(z => z.ki_setzt_ring && z.is_small);
                    ausgewaehlteDrifter = kandidaten.sort(() => 0.5 - Math.random()).slice(0, ANZAHL_DRIFT_RINGE);
                    ausgewaehlteDrifter.forEach(z => z.wird_verschoben = true);
                }

                aktuelleZeichenDaten.forEach(z => {
                    if (ausgewaehlteDrifter.includes(z)) {
                        z.render_gruppe = 5; // Drifter IMMER im letzten Schritt
                    } else if (z.ki_setzt_ring) {
                        
                        // DYNAMISCHE PRÜFUNG: Gehe die Probanden-Logik von 1 bis 4 durch
                        let zugewiesen = false;
                        for (let i = 0; i < probandenConfig.length; i++) {
                            const conf = probandenConfig[i];
                            let isMatch = false;
                            
                            if (conf.category === 'bg') {
                                isMatch = (conf.value === 'dark' && z.bg_dark) || (conf.value === 'light' && !z.bg_dark);
                            } else if (conf.category === 'color') {
                                isMatch = (conf.value === 'orange' && z.color_hex === '#FF8C00') || (conf.value === 'blue' && z.color_hex === '#0064FF');
                            } else if (conf.category === 'shape') {
                                isMatch = (conf.value === 'round' && (z.shape === 'O' || z.shape === 'Q')) || (conf.value === 'angular' && (z.shape === 'L' || z.shape === 'T'));
                            } else if (conf.category === 'size') {
                                isMatch = (conf.value === 'small' && z.is_small) || (conf.value === 'large' && !z.is_small);
                            }

                            if (isMatch) {
                                z.render_gruppe = i + 1; 
                                zugewiesen = true;
                                break; 
                            }
                        }
                        
                        // Wenn der Ring zu GAR KEINER Auswahl passt (forced Error), kommt er in den Final Anomaly Scan
                        if (!zugewiesen) {
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