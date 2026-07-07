const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

let aktuelleZeichenDaten = [];
var timeline = [];

// Configurable: Anzahl der Runden
const ANZAHL_RUNDEN = 15; 

/**
 * Calculates the exponential drift ratio based on the current round.
 * Rounds 1-5 have 0 drift. After that, it grows exponentially.
 * @param {number} runde - The current round number.
 * @returns {number} The calculated drift ratio.
 */
function berechneDrift(runde) {
    if (runde <= 5) {
        return 0.0;
    }
    const startWert = 0.05; 
    const wachstumsRate = 0.3; 
    
    const drift = startWert * Math.exp(wachstumsRate * (runde - 5));
    return drift;
}

/**
 * Renders a circular ring over the specified image container.
 * @param {string} containerId - The HTML ID of the container.
 * @param {number} originalX - The original X coordinate (center).
 * @param {number} originalY - The original Y coordinate (center).
 * @param {string} elementSize - Size of the element ('groß' or 'klein').
 * @param {number} driftRatio - Ratio determining how far the ring drifts.
 * @param {Object} [zeichenObjekt=null] - Reference to the data object.
 */
function renderRing(containerId, originalX, originalY, elementSize, driftRatio, zeichenObjekt = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let radius = (elementSize === 'groß') ? (19 * 1.6) : (12 * 1.6);
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
        if (zeichenObjekt) {
            zeichenObjekt.hat_ring = false;
        }
    });

    container.appendChild(ringElement);
}

/**
 * Parses the CSV, calculates AI errors, and draws rings.
 * @param {string} csvDateiPfad - Path to CSV.
 * @param {number} aktuelleRunde - The current round to calculate drift and errors.
 */
function ladeTabelleUndZeichneRinge(csvDateiPfad, aktuelleRunde) {
    Papa.parse(csvDateiPfad, {
        download: true,
        header: true,
        dynamicTyping: true, 
        complete: function(results) {
            const zeichenListe = results.data;
            aktuelleZeichenDaten = zeichenListe.filter(z => z.shape);
            
            // 1. Allen Zeichen den perfekten "Ziel-Zustand" zuweisen
            aktuelleZeichenDaten.forEach(z => {
                z.hat_ring = false; // Noch ist kein Ring im HTML
                // Configurable: Was soll die KI eigentlich finden?
                if (z.shape === 'T' && z.color_hex === '#0064FF') {
                    z.soll_ring_haben = true;
                } else {
                    z.soll_ring_haben = false;
                }
            });

            // 2. Fehler generieren, falls wir in Runde 4 oder höher sind
            if (aktuelleRunde > 3) {
                const minErrors = Math.floor(1 + (aktuelleRunde / 2));
                const maxErrors = Math.floor(5 + aktuelleRunde);
                const errorCount = Math.floor(Math.random() * (maxErrors - minErrors + 1)) + minErrors;
                
                console.log(`Runde ${aktuelleRunde}: KI macht absichtlich ${errorCount} Fehler.`);

                // Liste mischen, um zufällige Zeichen auszuwählen
                let gemischteZeichen = [...aktuelleZeichenDaten].sort(() => 0.5 - Math.random());
                
                // Den ersten 'errorCount' Zeichen ihren Zustand umdrehen
                for (let i = 0; i < errorCount; i++) {
                    if (i < gemischteZeichen.length) {
                        gemischteZeichen[i].soll_ring_haben = !gemischteZeichen[i].soll_ring_haben;
                    }
                }
            } else {
                console.log(`Runde ${aktuelleRunde}: KI arbeitet perfekt (0 Fehler).`);
            }

            // 3. Ringe tatsächlich zeichnen
            const aktuellerDrift = berechneDrift(aktuelleRunde);
            
            aktuelleZeichenDaten.forEach(zeichen => {
                if (zeichen.soll_ring_haben) {
                    const x = zeichen.center_x;
                    const y = zeichen.center_y;
                    const groesse = (zeichen.is_small === true || zeichen.is_small === "True") ? 'klein' : 'groß';
                    
                    renderRing('image-wrapper', x, y, groesse, aktuellerDrift, zeichen);
                    zeichen.hat_ring = true;
                }
            });
        },
        error: function(err) {
            console.error("CRITICAL ERROR loading the CSV:", err);
        }
    });
}

// ==========================================
// LOOP: GENERATING EXPERIMENTAL ROUNDS
// ==========================================

for (let runde = 1; runde <= ANZAHL_RUNDEN; runde++) {
    
    const formatierteNummer = String(runde).padStart(3, '0');
    const bildPfad = `bilder/stimulus_${formatierteNummer}.jpg`;
    const csvPfad = `tabellen/stimulus_${formatierteNummer}.csv`;

    const trial_html = `
    <div class="experiment-container">
        <div id="image-wrapper" class="image-container">
            <img src="${bildPfad}" alt="Prüfbild" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
        </div>
        
        <div class="right-column">
            <div class="ki-panel">
                <h3>KI ASSISTANT <span style="float:right; font-size:10px; color:#32b5a1;" id="scan-status">STANDBY</span></h3>
                <p>Search start points (Round ${runde}):</p>
                <ul id="ki-list">
                    <li><span class="ki-number">1</span> <span id="ki-val-loc">dark spots</span></li>
                    <li><span class="ki-number">2</span> <span id="ki-val-col" class="text-orange">orange</span></li>
                    <li><span class="ki-number">3</span> <span id="ki-val-shp">round (O; Q)</span></li>
                    <li><span class="ki-number">4</span> <span id="ki-val-size">large elements</span></li>
                    <li><span class="ki-number">5</span> <span id="ki-val-rot">0° rotation</span></li>
                </ul>
            </div>
            
            <div class="button-container">
                <button id="custom-bestaetigen-btn" class="action-btn btn-start">Bestätigen</button>
                <button id="custom-verwerfen-btn" class="action-btn btn-reset">Verwerfen</button>
            </div>
        </div>
    </div>
    `;

    const runden_trial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: trial_html,
        choices: [],
        
        on_load: function() {
            const bestaetigenBtn = document.getElementById('custom-bestaetigen-btn');
            const verwerfenBtn = document.getElementById('custom-verwerfen-btn');
            const listItems = document.querySelectorAll('#ki-list li');
            const statusText = document.getElementById('scan-status');
            const imageWrapper = document.getElementById('image-wrapper'); 
            
            let isScanFinished = false;

            bestaetigenBtn.disabled = true;
            verwerfenBtn.disabled = true;

            const locSpan = document.getElementById('ki-val-loc');
            const colSpan = document.getElementById('ki-val-col');
            const shpSpan = document.getElementById('ki-val-shp');
            const szSpan = document.getElementById('ki-val-size');
            const rotSpan = document.getElementById('ki-val-rot');

            const locations = ["dark spots", "light spots"];
            const colors = ["orange", "blue"];
            const shapes = ["round (O; Q)", "angular (L; T)"];
            const sizes = ["large elements", "small elements"];
            const rotations = ["0° rotation", "90° rotation", "180° rotation", "270° rotation"];
            
            let combinations = [];
            for(let loc of locations) {
                for(let col of colors) {
                    for(let shp of shapes) {
                        for(let sz of sizes) {
                            for(let rot of rotations) {
                                combinations.push({loc: loc, col: col, shp: shp, sz: sz, rot: rot});
                            }
                        }
                    }
                }
            }

            statusText.innerText = "SCANNING...";
            statusText.style.color = "#f08e16"; 
            listItems.forEach(li => li.classList.add('scanning-active'));

            let currentStep = 0;
            const scanDelayMS = 150; 

            let scanInterval = setInterval(() => {
                if (currentStep >= combinations.length) {
                    clearInterval(scanInterval);
                    listItems.forEach(li => li.classList.remove('scanning-active'));
                    statusText.innerText = "CONFIG SET";
                    statusText.style.color = "#32b5a1";
                    
                    ladeTabelleUndZeichneRinge(csvPfad, runde);
                    
                    locSpan.innerText = "dark spots";
                    colSpan.innerText = "orange";
                    colSpan.className = "text-orange";
                    shpSpan.innerText = "round (O; Q)";
                    szSpan.innerText = "large elements";
                    rotSpan.innerText = "0° rotation";
                    
                    isScanFinished = true;
                    bestaetigenBtn.disabled = false;
                    verwerfenBtn.disabled = false;
                    
                    return;
                }
                
                locSpan.innerText = combinations[currentStep].loc;
                colSpan.innerText = combinations[currentStep].col;
                colSpan.className = (combinations[currentStep].col === "orange") ? "text-orange" : "text-blue";
                shpSpan.innerText = combinations[currentStep].shp;
                szSpan.innerText = combinations[currentStep].sz;
                rotSpan.innerText = combinations[currentStep].rot; 
                currentStep++;
            }, scanDelayMS); 

            bestaetigenBtn.addEventListener('click', function() {
                jsPsych.finishTrial({ choice: 'bestaetigen', runde: runde });
            });

            verwerfenBtn.addEventListener('click', function() {
                console.log("Discard clicked. Aborting experiment.");
                jsPsych.endExperiment("Das Experiment wurde abgebrochen, da Sie auf 'Verwerfen' geklickt haben.");
            });

            imageWrapper.addEventListener('click', function(e) {
                if (!isScanFinished) return;
                if (aktuelleZeichenDaten.length === 0) return;

                const rect = imageWrapper.getBoundingClientRect();
                const klickX = e.clientX - rect.left;
                const klickY = e.clientY - rect.top;

                let naechstesZeichen = null;
                let minimaleDistanz = Infinity;
                const maxSnapDistanz = 40;

                aktuelleZeichenDaten.forEach(zeichen => {
                    const dx = klickX - zeichen.center_x;
                    const dy = klickY - zeichen.center_y;
                    const distanz = Math.sqrt(dx * dx + dy * dy);

                    if (distanz < minimaleDistanz) {
                        minimaleDistanz = distanz;
                        naechstesZeichen = zeichen;
                    }
                });

                if (naechstesZeichen && minimaleDistanz <= maxSnapDistanz) {
                    if (naechstesZeichen.hat_ring) return; 

                    const snapX = naechstesZeichen.center_x;
                    const snapY = naechstesZeichen.center_y;
                    const groesse = (naechstesZeichen.is_small === true || naechstesZeichen.is_small === "True") ? 'klein' : 'groß';
                    
                    renderRing('image-wrapper', snapX, snapY, groesse, 0.0, naechstesZeichen);
                    naechstesZeichen.hat_ring = true;
                }
            });
        }
    };

    timeline.push(runden_trial);
}

jsPsych.run(timeline);