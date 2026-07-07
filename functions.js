/**
 * Berechnet den exponentiellen Drift für eine gegebene Runde.
 * @param {number} runde - Die aktuelle Runden-Nummer.
 * @returns {number} Der berechnete Drift-Faktor (0.0 in Runden ohne Drift).
 */
function berechneDrift(runde) {
    if (runde <= RUNDEN_OHNE_DRIFT) return 0.0;
    
    const startWert = 0.05; 
    const wachstumsRate = 0.1; 
    return startWert * Math.exp(wachstumsRate * (runde - RUNDEN_OHNE_DRIFT));
}

/**
 * Zeichnet einen Ring über das Bild.
 * @param {string} containerId - HTML-ID des Bild-Containers.
 * @param {number} originalX - X-Koordinate des Zeichens.
 * @param {number} originalY - Y-Koordinate des Zeichens.
 * @param {string} elementSize - 'groß' oder 'klein'.
 * @param {number} driftRatio - Stärke des Versatzes (0.0 = zentriert).
 * @param {Object} [zeichenObjekt=null] - Referenz auf das Datenobjekt im Array.
 */
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
 * Lädt die CSV-Daten, berechnet KI-Fehler/Drift und zeichnet die finalen Ringe.
 * @param {string} csvDateiPfad - Pfad zur CSV-Datei der aktuellen Runde.
 * @param {number} aktuelleRunde - Die Runden-Nummer.
 */
function ladeTabelleUndZeichneRinge(csvDateiPfad, aktuelleRunde) {
    Papa.parse(csvDateiPfad, {
        download: true,
        header: true,
        dynamicTyping: true, 
        complete: function(results) {
            aktuelleZeichenDaten = results.data.filter(z => z.shape);
            
            // Grundwahrheit festlegen
            aktuelleZeichenDaten.forEach(z => {
                z.hat_ring = false; 
                z.wird_verschoben = false; 
                
                const isBlueL = (z.shape === 'L' && z.color_hex === '#0064FF');
                const isOrangeO = (z.shape === 'O' && z.color_hex === '#FF8C00');
                
                z.ist_ziel = (isBlueL || isOrangeO);
                z.ki_setzt_ring = z.ist_ziel; 
            });

            // Exakt 8 KI-Fehler generieren (4 False Negatives, 4 False Positives)
            let targets = aktuelleZeichenDaten.filter(z => z.ist_ziel).sort(() => 0.5 - Math.random());
            for (let i = 0; i < 4 && i < targets.length; i++) targets[i].ki_setzt_ring = false; 

            let nonTargets = aktuelleZeichenDaten.filter(z => !z.ist_ziel).sort(() => 0.5 - Math.random());
            for (let i = 0; i < 4 && i < nonTargets.length; i++) nonTargets[i].ki_setzt_ring = true; 

            // Drift-Elemente bestimmen
            const aktuellerDrift = berechneDrift(aktuelleRunde);
            if (aktuellerDrift > 0) {
                let kandidaten = aktuelleZeichenDaten.filter(z => z.ki_setzt_ring && (z.is_small === true || z.is_small === "True"));
                kandidaten.sort(() => 0.5 - Math.random()).slice(0, ANZAHL_DRIFT_RINGE).forEach(z => z.wird_verschoben = true);
            }

            // Ringe rendern
            aktuelleZeichenDaten.forEach(zeichen => {
                if (zeichen.ki_setzt_ring) {
                    const groesse = (zeichen.is_small === true || zeichen.is_small === "True") ? 'klein' : 'groß';
                    const ringDrift = zeichen.wird_verschoben ? aktuellerDrift : 0.0;
                    renderRing('image-wrapper', zeichen.center_x, zeichen.center_y, groesse, ringDrift, zeichen);
                    zeichen.hat_ring = true;
                }
            });
        },
        error: function(err) {
            console.error("Fehler beim Laden der CSV:", err);
        }
    });
}