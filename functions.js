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

function ladeTabelleUndBereiteVor(csvDateiPfad, aktuelleRunde, isTraining, callback) {
    Papa.parse(csvDateiPfad, {
        download: true,
        header: true,
        dynamicTyping: true, 
        complete: function(results) {
            aktuelleZeichenDaten = results.data.filter(z => z.shape);
            
            aktuelleZeichenDaten.forEach(z => {
                z.hat_ring = false; 
                z.wird_verschoben = false; 
                
                const isBlueL = (z.shape === 'L' && z.color_hex === '#0064FF');
                const isOrangeO = (z.shape === 'O' && z.color_hex === '#FF8C00');
                z.ist_ziel = (isBlueL || isOrangeO);
                
                // NEU: Hier lesen wir jetzt "bekommt_kreis" aus der Tabelle deines Kollegen!
                z.ki_setzt_ring = isTraining ? false : (z.bekommt_kreis !== undefined ? z.bekommt_kreis : z.ist_ziel); 
            });

            if (!isTraining) {
                const aktuellerDrift = berechneDrift(aktuelleRunde);
                let ausgewaehlteDrifter = [];
                
                if (aktuellerDrift > 0) {
                    let kandidaten = aktuelleZeichenDaten.filter(z => z.ki_setzt_ring && (z.is_small === true || z.is_small === "True"));
                    ausgewaehlteDrifter = kandidaten.sort(() => 0.5 - Math.random()).slice(0, ANZAHL_DRIFT_RINGE);
                    ausgewaehlteDrifter.forEach(z => z.wird_verschoben = true);
                }

                aktuelleZeichenDaten.forEach(z => {
                    if (ausgewaehlteDrifter.includes(z)) {
                        z.render_gruppe = 5; 
                    } else if (z.ki_setzt_ring) {
                        
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
                                isMatch = (conf.value === 'small' && (z.is_small === true || z.is_small === "True")) || (conf.value === 'large' && (z.is_small === false || z.is_small === "False"));
                            }

                            if (isMatch) {
                                z.render_gruppe = i + 1; 
                                zugewiesen = true;
                                break; 
                            }
                        }
                        
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